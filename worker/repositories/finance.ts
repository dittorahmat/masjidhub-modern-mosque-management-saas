import { eq, and, desc, sql } from 'drizzle-orm';
import type { AppDb } from '../db';
import { schema } from '../db';
import type { Transaction } from '@shared/types';
import { mapTransactionRow, toTimestampMs } from '../routes/common';

export interface CreateTransactionInput {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date?: number | string | Date;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  createdBy?: string;
}

export interface FinanceOverviewResult {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  byCategory: Record<string, number>;
  monthlyTrends: Array<{ month: string; income: number; expense: number }>;
}

export class FinanceRepository {
  constructor(private db: AppDb) {}

  async listTransactions(tenantId: string, limit = 100): Promise<Transaction[]> {
    const rows = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenantId))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);

    return rows.map(mapTransactionRow);
  }

  async createTransaction(tenantId: string, input: CreateTransactionInput): Promise<Transaction> {
    const id = input.id || crypto.randomUUID();
    const dateMs = toTimestampMs(input.date ?? Date.now());

    await this.db.insert(schema.transactions).values({
      id,
      tenantId,
      type: input.type,
      amount: Number(input.amount),
      category: input.category,
      description: input.description || '',
      date: dateMs,
      paymentMethod: input.paymentMethod ?? null,
      referenceNumber: input.referenceNumber ?? null,
      receiptUrl: input.receiptUrl ?? null,
      createdBy: input.createdBy || 'admin',
      createdAt: Date.now(),
    });

    const inserted = await this.db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenantId)))
      .limit(1);

    return mapTransactionRow(inserted[0]);
  }

  /**
   * Deep SQL Aggregation: Computes totals and breakdown directly in the database engine
   * rather than loading thousands of rows into Worker memory.
   */
  async getOverview(tenantId: string): Promise<FinanceOverviewResult> {
    // 1. Overall Income and Expense Aggregation
    const totalsQuery = await this.db
      .select({
        totalIncome: sql<number>`coalesce(sum(case when ${schema.transactions.type} = 'income' then ${schema.transactions.amount} else 0 end), 0)`,
        totalExpense: sql<number>`coalesce(sum(case when ${schema.transactions.type} = 'expense' then ${schema.transactions.amount} else 0 end), 0)`,
      })
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenantId));

    const totalIncome = Number(totalsQuery[0]?.totalIncome ?? 0);
    const totalExpense = Number(totalsQuery[0]?.totalExpense ?? 0);

    // 2. Category Breakdown Aggregation
    const categoryRows = await this.db
      .select({
        category: schema.transactions.category,
        total: sql<number>`sum(${schema.transactions.amount})`,
      })
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenantId))
      .groupBy(schema.transactions.category);

    const byCategory: Record<string, number> = {};
    for (const row of categoryRows) {
      byCategory[row.category] = Number(row.total);
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      byCategory,
      monthlyTrends: [],
    };
  }
}
