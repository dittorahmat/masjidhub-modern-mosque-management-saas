import { eq, and, desc, sql } from 'drizzle-orm';
import type { AppDb } from '../db';
import { schema } from '../db';
import type { ZisTransaction, Mustahik } from '@shared/types';
import { mapZisTransactionRow, mapMustahikRow, toTimestampMs } from '../routes/common';

export interface RecordZisInput {
  id?: string;
  type: 'zakat_fitrah' | 'zakat_maal' | 'fidyah' | 'infaq_shadaqah';
  flow: 'in' | 'out';
  amount: number;
  muzakkiName?: string;
  muzakkiEmail?: string;
  muzakkiPhone?: string;
  mustahikId?: string;
  description?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'mobile_payment' | 'credit_card';
  notes?: string;
  date?: number | string | Date;
}

export interface ZisOverviewResult {
  totalInflow: number;
  totalOutflow: number;
  netZisBalance: number;
  byType: Record<string, number>;
  activeMustahikCount: number;
}

export class ZisRepository {
  constructor(private db: AppDb) {}

  async listTransactions(tenantId: string, limit = 100): Promise<ZisTransaction[]> {
    const rows = await this.db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenantId))
      .orderBy(desc(schema.zisTransactions.date))
      .limit(limit);

    return rows.map(mapZisTransactionRow);
  }

  async createTransaction(tenantId: string, input: RecordZisInput): Promise<ZisTransaction> {
    const id = input.id || crypto.randomUUID();
    const dateMs = toTimestampMs(input.date ?? Date.now());

    await this.db.insert(schema.zisTransactions).values({
      id,
      tenantId,
      date: dateMs,
      type: input.type,
      flow: input.flow,
      amount: Number(input.amount),
      muzakkiName: input.muzakkiName ?? null,
      muzakkiEmail: input.muzakkiEmail ?? null,
      muzakkiPhone: input.muzakkiPhone ?? null,
      mustahikId: input.mustahikId ?? null,
      description: input.description ?? '',
      paymentMethod: input.paymentMethod ?? 'cash',
      distributionStatus: input.flow === 'out' ? 'distributed' : null,
      notes: input.notes ?? null,
      createdAt: Date.now(),
    });

    const inserted = await this.db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenantId)))
      .limit(1);

    return mapZisTransactionRow(inserted[0]);
  }

  /**
   * Distribute ZIS assistance.
   */
  async distributeZis(tenantId: string, params: {
    mustahikId: string;
    amount: number;
    type: 'zakat_fitrah' | 'zakat_maal' | 'fidyah' | 'infaq_shadaqah';
    notes?: string;
  }): Promise<{ transaction: ZisTransaction; mustahik: Mustahik | null }> {
    const transaction = await this.createTransaction(tenantId, {
      type: params.type,
      flow: 'out',
      amount: params.amount,
      mustahikId: params.mustahikId,
      description: `Penyaluran ZIS kepada Mustahik`,
      notes: params.notes,
    });

    // Update Mustahik assistance history
    const existingMustahik = await this.db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, params.mustahikId), eq(schema.mustahiks.tenantId, tenantId)))
      .limit(1);

    let updatedMustahik: Mustahik | null = null;
    if (existingMustahik.length > 0) {
      const currentReceived = existingMustahik[0].assistanceReceived || 0;
      await this.db
        .update(schema.mustahiks)
        .set({
          assistanceReceived: currentReceived + params.amount,
          lastAssistanceDate: Date.now(),
        })
        .where(eq(schema.mustahiks.id, params.mustahikId));

      const refreshed = await this.db
        .select()
        .from(schema.mustahiks)
        .where(eq(schema.mustahiks.id, params.mustahikId))
        .limit(1);
      updatedMustahik = mapMustahikRow(refreshed[0]);
    }

    return { transaction, mustahik: updatedMustahik };
  }

  /**
   * Deep SQL Aggregation for ZIS overview
   */
  async getOverview(tenantId: string): Promise<ZisOverviewResult> {
    const totalsQuery = await this.db
      .select({
        totalInflow: sql<number>`coalesce(sum(case when ${schema.zisTransactions.flow} = 'in' then ${schema.zisTransactions.amount} else 0 end), 0)`,
        totalOutflow: sql<number>`coalesce(sum(case when ${schema.zisTransactions.flow} = 'out' then ${schema.zisTransactions.amount} else 0 end), 0)`,
      })
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenantId));

    const totalInflow = Number(totalsQuery[0]?.totalInflow ?? 0);
    const totalOutflow = Number(totalsQuery[0]?.totalOutflow ?? 0);

    const typeRows = await this.db
      .select({
        type: schema.zisTransactions.type,
        total: sql<number>`sum(${schema.zisTransactions.amount})`,
      })
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenantId))
      .groupBy(schema.zisTransactions.type);

    const byType: Record<string, number> = {};
    for (const row of typeRows) {
      byType[row.type] = Number(row.total);
    }

    const mustahikCountQuery = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.tenantId, tenantId), eq(schema.mustahiks.status, 'active')));

    return {
      totalInflow,
      totalOutflow,
      netZisBalance: totalInflow - totalOutflow,
      byType,
      activeMustahikCount: Number(mustahikCountQuery[0]?.count ?? 0),
    };
  }
}
