import { describe, it, expect, beforeAll } from 'bun:test';
import { getDb, schema } from '../worker/db';
import { seedDatabase } from '../worker/db/seed';
import { eq } from 'drizzle-orm';
import { toTimestampMs, toEpochSeconds } from '../worker/routes/common';

describe('Database Roundtrip & Schema Integrity Test', () => {
  let db: ReturnType<typeof getDb>;

  beforeAll(async () => {
    // Seed default SQLite fallback database
    await seedDatabase({ verbose: false, autoMigrateLocal: true });
    db = getDb();
  });

  it('should query seeded tenant and users successfully', async () => {
    const tenants = await db.select().from(schema.tenants).limit(5);
    expect(tenants.length).toBeGreaterThan(0);
    const tenant = tenants[0];
    expect(tenant.slug).toBeDefined();

    const users = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenant.id));
    expect(users.length).toBeGreaterThan(0);
  });

  it('should roundtrip financial transactions with epoch seconds/ms conversions', async () => {
    const tenants = await db.select().from(schema.tenants).limit(1);
    const tenant = tenants[0];

    const testTxId = `test-tx-${Date.now()}`;
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    // Insert
    await db.insert(schema.transactions).values({
      id: testTxId,
      tenantId: tenant.id,
      date: nowSec,
      type: 'income',
      category: 'infaq_jumat',
      amount: 500000,
      description: 'Test Infaq Roundtrip',
      createdBy: 'test-admin',
      createdAt: nowSec,
    });

    // Query back
    const fetched = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, testTxId))
      .limit(1);

    expect(fetched.length).toBe(1);
    expect(fetched[0].amount).toBe(500000);
    expect(fetched[0].description).toBe('Test Infaq Roundtrip');

    // Verify defensive timestamp mapper
    const timestampMs = toTimestampMs(fetched[0].date);
    expect(timestampMs).toBeGreaterThan(1e12); // Epoch ms check (> year 2001)

    // Clean up
    await db.delete(schema.transactions).where(eq(schema.transactions.id, testTxId));
  });

  it('should roundtrip ZIS transactions and Mustahik records', async () => {
    const tenants = await db.select().from(schema.tenants).limit(1);
    const tenant = tenants[0];

    const mustahikId = `mustahik-test-${Date.now()}`;
    const nowSec = Math.floor(Date.now() / 1000);

    // Insert Mustahik
    await db.insert(schema.mustahiks).values({
      id: mustahikId,
      tenantId: tenant.id,
      name: 'Fulan Test',
      category: 'fakir',
      status: 'active',
      familyMembers: 3,
      registrationDate: nowSec,
      createdAt: nowSec,
    });

    const queriedMustahik = await db
      .select()
      .from(schema.mustahiks)
      .where(eq(schema.mustahiks.id, mustahikId))
      .limit(1);
    expect(queriedMustahik.length).toBe(1);
    expect(queriedMustahik[0].name).toBe('Fulan Test');

    // Insert ZIS Outflow
    const zisTxId = `zis-test-${Date.now()}`;
    await db.insert(schema.zisTransactions).values({
      id: zisTxId,
      tenantId: tenant.id,
      date: nowSec,
      type: 'zakat_fitrah',
      flow: 'out',
      amount: 150000,
      mustahikId,
      description: 'Penyaluran Zakat Test',
      createdAt: nowSec,
    });

    const queriedZis = await db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.id, zisTxId))
      .limit(1);
    expect(queriedZis.length).toBe(1);
    expect(queriedZis[0].amount).toBe(150000);
    expect(queriedZis[0].mustahikId).toBe(mustahikId);

    // Clean up
    await db.delete(schema.zisTransactions).where(eq(schema.zisTransactions.id, zisTxId));
    await db.delete(schema.mustahiks).where(eq(schema.mustahiks.id, mustahikId));
  });

  it('should roundtrip Inventory items and Events', async () => {
    const tenants = await db.select().from(schema.tenants).limit(1);
    const tenant = tenants[0];

    const invId = `inv-test-${Date.now()}`;
    const nowSec = Math.floor(Date.now() / 1000);

    // Inventory
    await db.insert(schema.inventoryItems).values({
      id: invId,
      tenantId: tenant.id,
      name: 'Wireless Mic Shure Test',
      category: 'elektronik',
      quantity: 2,
      condition: 'good',
      location: 'Ruang Sound System',
      createdAt: nowSec,
    });

    const queriedInv = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.id, invId))
      .limit(1);
    expect(queriedInv.length).toBe(1);
    expect(queriedInv[0].name).toBe('Wireless Mic Shure Test');
    expect(queriedInv[0].quantity).toBe(2);

    // Event
    const eventId = `ev-test-${Date.now()}`;
    await db.insert(schema.events).values({
      id: eventId,
      tenantId: tenant.id,
      title: 'Kajian Subuh Akbar Test',
      description: 'Kajian rutin subuh sabtu',
      location: 'Ruang Utama',
      date: nowSec,
      capacity: 100,
      createdAt: nowSec,
    });

    const queriedEv = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1);
    expect(queriedEv.length).toBe(1);
    expect(queriedEv[0].title).toBe('Kajian Subuh Akbar Test');

    // Clean up
    await db.delete(schema.inventoryItems).where(eq(schema.inventoryItems.id, invId));
    await db.delete(schema.events).where(eq(schema.events.id, eventId));
  });
});
