import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import type { ZisTransaction } from "@shared/types";
import { ok, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapZisTransactionRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "../common";

// Mock payment processing function
async function processZisPayment(transaction: any, paymentMethod: string, amount: number) {
  console.log(`Processing payment for transaction ${transaction.id} using ${paymentMethod}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  const success = Math.random() > 0.1;
  return {
    status: success ? 'completed' : 'failed',
    reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    gateway: paymentMethod
  };
}

export function registerZisTransactionRoutes(app: Hono<any>) {
  // 10. ZIS Transactions List (supports both /zis and /zis/transactions)
  const getZisTransactionsHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenant.id))
      .orderBy(desc(schema.zisTransactions.date));

    return ok(c, rows.map(mapZisTransactionRow));
  };
  app.get('/api/:slug/zis', getZisTransactionsHandler);
  app.get('/api/:slug/zis/transactions', getZisTransactionsHandler);

  // 11. ZIS Transaction Create (supports both /zis and /zis/transactions)
  const createZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = body.id || crypto.randomUUID();
    const dateVal = toEpochSeconds(body.date ?? Date.now());
    const nowSec = Math.floor(Date.now() / 1000);

    const rawPaymentDate = body.payment_date ?? body.paymentDate;
    const paymentDateVal = rawPaymentDate ? toEpochSeconds(rawPaymentDate) : null;

    await db.insert(schema.zisTransactions).values({
      id,
      tenantId: tenant.id,
      date: dateVal,
      type: body.type,
      flow: body.flow || 'in',
      amount: Number(body.amount),
      muzakkiName: body.muzakki_name ?? body.muzakkiName ?? null,
      muzakkiEmail: body.muzakki_email ?? body.muzakkiEmail ?? null,
      muzakkiPhone: body.muzakki_phone ?? body.muzakkiPhone ?? null,
      mustahikId: body.mustahik_id ?? body.mustahikId ?? null,
      description: body.description ?? '',
      paymentMethod: body.payment_method ?? body.paymentMethod ?? null,
      paymentStatus: body.payment_status ?? body.paymentStatus ?? 'pending',
      paymentReference: body.payment_reference ?? body.paymentReference ?? null,
      paymentGateway: body.payment_gateway ?? body.paymentGateway ?? null,
      paymentDate: paymentDateVal,
      distributionStatus: body.distribution_status ?? body.distributionStatus ?? null,
      distributedTo: body.distributed_to ?? body.distributedTo ?? null,
      distributedAmount: body.distributed_amount !== undefined ? Number(body.distributed_amount) : null,
      notes: body.notes ?? null,
      receiptUrl: body.receipt_url ?? body.receiptUrl ?? null,
      createdAt: nowSec,
    });

    const inserted = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(inserted[0]));
  };
  app.post('/api/:slug/zis', createZisTransactionHandler);
  app.post('/api/:slug/zis/transactions', createZisTransactionHandler);

  // 12. ZIS Transaction Update (PUT)
  const updateZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS Transaction not found');

    const updateData: Partial<typeof schema.zisTransactions.$inferInsert> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.flow !== undefined) updateData.flow = body.flow;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.muzakki_name !== undefined || body.muzakkiName !== undefined) {
      updateData.muzakkiName = body.muzakki_name ?? body.muzakkiName;
    }
    if (body.muzakki_email !== undefined || body.muzakkiEmail !== undefined) {
      updateData.muzakkiEmail = body.muzakki_email ?? body.muzakkiEmail;
    }
    if (body.muzakki_phone !== undefined || body.muzakkiPhone !== undefined) {
      updateData.muzakkiPhone = body.muzakki_phone ?? body.muzakkiPhone;
    }
    if (body.mustahik_id !== undefined || body.mustahikId !== undefined) {
      updateData.mustahikId = body.mustahik_id ?? body.mustahikId;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) {
      updateData.date = toEpochSeconds(body.date);
    }
    if (body.payment_method !== undefined || body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.payment_method ?? body.paymentMethod;
    }
    if (body.payment_status !== undefined || body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.payment_status ?? body.paymentStatus;
    }
    if (body.payment_reference !== undefined || body.paymentReference !== undefined) {
      updateData.paymentReference = body.payment_reference ?? body.paymentReference;
    }
    if (body.payment_gateway !== undefined || body.paymentGateway !== undefined) {
      updateData.paymentGateway = body.payment_gateway ?? body.paymentGateway;
    }
    if (body.payment_date !== undefined || body.paymentDate !== undefined) {
      const pDate = body.payment_date ?? body.paymentDate;
      updateData.paymentDate = pDate ? toEpochSeconds(pDate) : null;
    }
    if (body.distribution_status !== undefined || body.distributionStatus !== undefined) {
      updateData.distributionStatus = body.distribution_status ?? body.distributionStatus;
    }
    if (body.distributed_to !== undefined || body.distributedTo !== undefined) {
      updateData.distributedTo = body.distributed_to ?? body.distributedTo;
    }
    if (body.distributed_amount !== undefined || body.distributedAmount !== undefined) {
      const dAmount = body.distributed_amount ?? body.distributedAmount;
      updateData.distributedAmount = dAmount !== null && dAmount !== undefined ? Number(dAmount) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.receipt_url !== undefined || body.receiptUrl !== undefined) {
      updateData.receiptUrl = body.receipt_url ?? body.receiptUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.zisTransactions)
        .set(updateData)
        .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(updated[0]));
  };
  app.put('/api/:slug/zis/transactions/:id', updateZisTransactionHandler);
  app.put('/api/:slug/zis/:id', updateZisTransactionHandler);

  // 13. ZIS Transaction Delete (DELETE)
  const deleteZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS Transaction not found');

    await db
      .delete(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));

    return ok(c, { success: true });
  };
  app.delete('/api/:slug/zis/transactions/:id', deleteZisTransactionHandler);
  app.delete('/api/:slug/zis/:id', deleteZisTransactionHandler);

  // 14. ZIS Report Endpoint
  app.get('/api/:slug/zis/report', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenant.id));

    const zisTransactions = rows.map(mapZisTransactionRow);

    const totals = {
      zakat_fitrah: 0,
      zakat_maal: 0,
      fidyah: 0,
      infaq_shadaqah: 0,
    };

    const byType: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    zisTransactions.forEach(tx => {
      const type = tx.type;
      if (totals[type as keyof typeof totals] !== undefined) {
        totals[type as keyof typeof totals] += tx.amount;
      }
      byType[type] = (byType[type] || 0) + tx.amount;

      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + tx.amount;
    });

    const totalAmount = zisTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return ok(c, {
      totals,
      byType,
      byMonth,
      totalAmount,
      totalTransactions: zisTransactions.length,
    });
  });

  // 15. ZIS Overview Endpoint
  app.get('/api/:slug/zis/overview', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const [zisRows, mustahikRows] = await Promise.all([
      db.select().from(schema.zisTransactions).where(eq(schema.zisTransactions.tenantId, tenant.id)),
      db.select().from(schema.mustahiks).where(eq(schema.mustahiks.tenantId, tenant.id)),
    ]);

    let totalIn = 0;
    let totalOut = 0;
    const inByType: Record<string, number> = {};

    for (const tx of zisRows) {
      if (tx.flow === 'in' && (tx.paymentStatus === 'completed' || !tx.paymentStatus)) {
        totalIn += tx.amount;
        inByType[tx.type] = (inByType[tx.type] || 0) + tx.amount;
      } else if (tx.flow === 'out') {
        totalOut += tx.amount;
      }
    }

    return ok(c, {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      inByType,
      totalMustahik: mustahikRows.length,
      activeMustahik: mustahikRows.filter(m => m.status === 'active').length,
    });
  });

  // 16. ZIS Distribute (POST /api/:slug/zis/distribute)
  app.post('/api/:slug/zis/distribute', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const dateVal = toEpochSeconds(body.date ?? Date.now());
    const amount = Number(body.amount);

    await db.insert(schema.zisTransactions).values({
      id,
      tenantId: tenant.id,
      date: dateVal,
      type: body.type || 'infaq_shadaqah',
      flow: 'out',
      amount,
      mustahikId: body.mustahik_id ?? body.mustahikId ?? null,
      description: body.description || `Penyaluran ZIS kepada ${body.distributed_to || 'Mustahik'}`,
      distributionStatus: 'distributed',
      distributedTo: body.distributed_to ?? body.distributedTo ?? null,
      distributedAmount: amount,
      paymentStatus: 'completed',
      paymentDate: nowSec,
      createdAt: nowSec,
    });

    if (body.mustahik_id || body.mustahikId) {
      const mId = body.mustahik_id || body.mustahikId;
      const targetMustahik = await db
        .select()
        .from(schema.mustahiks)
        .where(and(eq(schema.mustahiks.id, mId), eq(schema.mustahiks.tenantId, tenant.id)))
        .limit(1);

      if (targetMustahik.length > 0) {
        const currentAssistance = targetMustahik[0].assistanceReceived ?? 0;
        await db
          .update(schema.mustahiks)
          .set({
            assistanceReceived: currentAssistance + amount,
            lastAssistanceDate: nowSec,
          })
          .where(and(eq(schema.mustahiks.id, mId), eq(schema.mustahiks.tenantId, tenant.id)));
      }
    }

    const inserted = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(inserted[0]));
  });

  // 17. ZIS Payment Processing
  app.post('/api/:slug/zis/:id/process-payment', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS transaction not found');

    const tx = mapZisTransactionRow(existing[0]);
    const body = await c.req.json();
    const result = await processZisPayment(tx, body.payment_method, body.amount || tx.amount);

    const nowSec = Math.floor(Date.now() / 1000);
    await db
      .update(schema.zisTransactions)
      .set({
        paymentMethod: body.payment_method,
        paymentStatus: result.status as any,
        paymentReference: result.reference,
        paymentGateway: result.gateway,
        paymentDate: nowSec,
      })
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));

    const updated = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(updated[0]));
  });
}
