import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { ok, bad, notFound } from "../core-utils";
import { FinanceRepository, type CreateTransactionInput } from "../repositories/finance";
import { resolveTenantContext } from "../middleware/tenant";
import {
  ensureDbInitialized,
  mapTransactionRow,
  mapStatementLogRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "./common";
import { parseBankStatement } from "../ai-logic";
import { generateShadowId, calculateFileHash } from "../crypto-utils";
import { generateFinanceInfographicUrl } from "../cloudinary";

const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function registerFinanceRoutes(app: Hono<any>) {
  // 1. Transactions List (supports both /finance and /finance/transactions)
  const getTransactionsHandler = async (c: any) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');
    const repo = new FinanceRepository(ctx.db);
    const transactions = await repo.listTransactions(ctx.tenant.id);
    return ok(c, transactions);
  };
  app.get('/api/:slug/finance', getTransactionsHandler);
  app.get('/api/:slug/finance/transactions', getTransactionsHandler);

  // 2. Transaction Create (supports both /finance and /finance/transactions)
  const createTransactionHandler = async (c: any) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');
    let body: CreateTransactionInput;
    try {
      body = await c.req.json();
    } catch {
      return bad(c, 'Invalid JSON payload');
    }
    const repo = new FinanceRepository(ctx.db);
    const created = await repo.createTransaction(ctx.tenant.id, body);
    return ok(c, created);
  };
  app.post('/api/:slug/finance', createTransactionHandler);
  app.post('/api/:slug/finance/transactions', createTransactionHandler);

  // 3. Transaction Bulk Create
  app.post('/api/:slug/finance/transactions/bulk', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { transactions } = await c.req.json();
    if (!Array.isArray(transactions)) return bad(c, 'transactions array required');

    const createdIds: string[] = [];
    for (const tx of transactions) {
      const id = tx.id || crypto.randomUUID();
      const dateVal = toEpochSeconds(tx.date ?? Date.now());
      await db.insert(schema.transactions).values({
        id,
        tenantId: tenant.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category || tx.suggestedCategory || 'Umum',
        description: tx.description || '',
        date: dateVal,
        paymentMethod: tx.paymentMethod ?? null,
        referenceNumber: tx.referenceNumber ?? null,
        receiptUrl: tx.receiptUrl ?? null,
        createdBy: tx.createdBy || 'bulk_import',
        createdAt: Math.floor(Date.now() / 1000),
      });
      createdIds.push(id);
    }
    return ok(c, { count: createdIds.length, ids: createdIds });
  });

  // 4. Transaction Update (PUT)
  const updateTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Transaction not found');

    const updateData: Partial<typeof schema.transactions.$inferInsert> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) {
      updateData.date = toEpochSeconds(body.date);
    }
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.referenceNumber !== undefined) updateData.referenceNumber = body.referenceNumber;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.transactions)
        .set(updateData)
        .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    return ok(c, mapTransactionRow(updated[0]));
  };
  app.put('/api/:slug/finance/transactions/:id', updateTransactionHandler);
  app.put('/api/:slug/finance/:id', updateTransactionHandler);

  // 5. Transaction Delete (DELETE)
  const deleteTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Transaction not found');

    await db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)));
    return ok(c, { success: true });
  };
  app.delete('/api/:slug/finance/transactions/:id', deleteTransactionHandler);
  app.delete('/api/:slug/finance/:id', deleteTransactionHandler);

  // 6. Finance Overview / Summary / Insights
  app.get('/api/:slug/finance/overview', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');
    const repo = new FinanceRepository(ctx.db);
    const overview = await repo.getOverview(ctx.tenant.id);
    const idleCashWarning = overview.netBalance > 10000000;

    return ok(c, {
      totalIncome: overview.totalIncome,
      totalExpense: overview.totalExpense,
      balance: overview.netBalance,
      byCategory: overview.byCategory,
      idleCashWarning,
      insights: idleCashWarning
        ? 'Saldo kas melebihi Rp 10.000.000. Pertimbangkan untuk menyalurkan ke program mustahik atau pembangunan agar dana lebih produktif.'
        : 'Arus kas terpantau stabil.',
    });
  });

  // 7. Statement Logs list
  app.get('/api/:slug/finance/statement-logs', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const logs = await db
      .select()
      .from(schema.statementLogs)
      .where(eq(schema.statementLogs.tenantId, tenant.id))
      .orderBy(desc(schema.statementLogs.processedAt));
    return ok(c, logs.map(mapStatementLogRow));
  });

  // 8. Bank statement OCR parsing
  app.post('/api/:slug/finance/parse-statement', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    if (!file) {
      return bad(c, 'No file uploaded');
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return bad(c, 'AI configuration missing (GEMINI_API_KEY)');
    }

    try {
      const buffer = await file.arrayBuffer();
      const fileHash = await calculateFileHash(buffer);
      const existingLogs = await db
        .select()
        .from(schema.statementLogs)
        .where(and(eq(schema.statementLogs.fileHash, fileHash), eq(schema.statementLogs.tenantId, tenant.id)))
        .limit(1);

      if (existingLogs.length > 0) {
        return bad(c, 'File sudah pernah diproses.');
      }

      const transactions = await parseBankStatement(apiKey, buffer, file.type, tenant.name);

      const existingTxs = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.tenantId, tenant.id));

      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
      
      const enhancedTxs = await Promise.all(transactions.map(async (tx) => {
        const fingerprint = await generateShadowId(secret, `${tx.date}:${tx.amount}:${normalizeText(tx.description)}`);
        const isDuplicate = existingTxs.some(etx => etx.amount === tx.amount && normalizeText(etx.description).includes(normalizeText(tx.description).substring(0, 15)));
        return { ...tx, fingerprint, isDuplicate };
      }));

      const signature = await generateShadowId(secret, JSON.stringify(enhancedTxs) + fileHash);
      return ok(c, { fileHash, transactions: enhancedTxs, signature });
    } catch (e: any) { 
      return bad(c, `Gagal parsing: ${e?.message || 'Unknown error'}`); 
    }
  });

  // 9. Bulk Save Statement
  app.post('/api/:slug/finance/bulk-save', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const { transactions, fileHash, fileName, signature } = await c.req.json();
    const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
    const expectedSignature = await generateShadowId(secret, JSON.stringify(transactions) + fileHash);
    if (signature !== expectedSignature) return bad(c, 'Data integrity check failed.');

    const impact: Record<string, number> = {};
    transactions.filter((tx: any) => !tx.isDuplicate).forEach((tx: any) => {
      impact[tx.suggestedCategory] = (impact[tx.suggestedCategory] || 0) + tx.amount;
    });

    const nowSec = Math.floor(Date.now() / 1000);
    for (const tx of transactions) {
      if (tx.isDuplicate) continue;
      await db.insert(schema.transactions).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.suggestedCategory,
        description: tx.description,
        date: nowSec,
        createdBy: 'ai_importer',
        createdAt: nowSec,
      });
    }

    await db.insert(schema.statementLogs).values({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      fileHash,
      fileName,
      processedAt: nowSec,
      transactionCount: transactions.length,
    });

    return ok(c, { count: transactions.length, impact });
  });

  // 10. Finance Report Card
  app.get('/api/:slug/finance/report-card', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const txs = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenant.id));
    const balance = txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const imageUrl = generateFinanceInfographicUrl(c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub', tenant.name, balance, new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    return ok(c, { imageUrl, balance });
  });
}
