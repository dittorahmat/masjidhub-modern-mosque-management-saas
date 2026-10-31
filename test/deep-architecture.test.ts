import { describe, it, expect, beforeAll } from 'bun:test';
import { getDb, schema } from '../worker/db';
import { seedDatabase } from '../worker/db/seed';
import { FinanceRepository } from '../worker/repositories/finance';
import { ZisRepository } from '../worker/repositories/zis';
import { MockAIAdapter } from '../worker/ai/provider';
import { uploadAsset } from '../worker/storage/asset-manager';

describe('Deep Architecture Repositories & Modules', () => {
  let db: any;
  let tenantId: string;
  const uniqueSuffix = Date.now().toString();

  beforeAll(async () => {
    // Seed test database schema & fallback
    await seedDatabase({ verbose: false, autoMigrateLocal: true });
    db = getDb();

    // Create an isolated tenant for deep test execution
    tenantId = `isolated-tenant-${uniqueSuffix}`;
    await db.insert(schema.tenants).values({
      id: tenantId,
      name: 'Isolated Mosque',
      slug: `isolated-${uniqueSuffix}`,
      ownerId: 'test-owner-id',
      status: 'active',
      createdAt: Date.now(),
    });
  });

  it('FinanceRepository creates transactions and computes aggregated totals accurately', async () => {
    const repo = new FinanceRepository(db);

    await repo.createTransaction(tenantId, {
      type: 'income',
      amount: 1500000,
      category: 'Infaq Jumat Khusus',
      description: 'Kotak Infaq Jumat Khusus',
    });

    await repo.createTransaction(tenantId, {
      type: 'expense',
      amount: 300000,
      category: 'Operasional Listrik',
      description: 'Listrik & Air Khusus',
    });

    const overview = await repo.getOverview(tenantId);
    expect(overview.totalIncome).toBe(1500000);
    expect(overview.totalExpense).toBe(300000);
    expect(overview.netBalance).toBe(1200000);
    expect(overview.byCategory['Infaq Jumat Khusus']).toBe(1500000);
    expect(overview.byCategory['Operasional Listrik']).toBe(300000);
  });

  it('ZisRepository creates ZIS transactions and calculates net balance via SQL aggregation', async () => {
    const repo = new ZisRepository(db);

    await repo.createTransaction(tenantId, {
      type: 'zakat_fitrah',
      flow: 'in',
      amount: 450000,
      muzakkiName: 'Ahmad Test',
    });

    await repo.createTransaction(tenantId, {
      type: 'infaq',
      flow: 'in',
      amount: 200000,
      muzakkiName: 'Hasan Test',
    });

    const overview = await repo.getOverview(tenantId);
    expect(overview.totalInflow).toBe(650000);
    expect(overview.totalOutflow).toBe(0);
    expect(overview.netZisBalance).toBe(650000);
    expect(overview.byType['zakat_fitrah']).toBe(450000);
    expect(overview.byType['infaq']).toBe(200000);
  });

  it('MockAIAdapter generates deterministic responses without network or API key', async () => {
    const mockAI = new MockAIAdapter({
      'extract statement': { transactions: [{ amount: 50000, description: 'Transfer Masuk' }] },
    });

    const result = await mockAI.extractJson('Please extract statement from this text');
    expect(result.transactions[0].amount).toBe(50000);
  });

  it('uploadAsset validates mime types and encapsulates metadata', async () => {
    const fakeFile = {
      data: new Uint8Array([1, 2, 3, 4]),
      name: 'receipt.png',
      type: 'image/png',
    };

    const uploaded = await uploadAsset({}, fakeFile, { category: 'receipts' });
    expect(uploaded.filename).toBe('receipt.png');
    expect(uploaded.contentType).toBe('image/png');
    expect(uploaded.key.startsWith('uploads/receipts/')).toBe(true);
    expect(uploaded.url.includes(uploaded.key)).toBe(true);
  });
});
