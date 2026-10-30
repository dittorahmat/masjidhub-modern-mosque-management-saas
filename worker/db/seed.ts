import { getDb, schema } from './index';
import {
  MOCK_TENANTS,
  MOCK_USERS,
  MOCK_TRANSACTIONS,
  MOCK_MUSTAHIKS,
  MOCK_ZIS_TRANSACTIONS,
  MOCK_INVENTORY_ITEMS,
  MOCK_EVENTS,
  MOCK_MONTHLY_PRAYER_SCHEDULES,
} from '../../shared/mock-data';
import fs from 'node:fs';
import path from 'node:path';

export interface SeedOptions {
  envOrD1?: any;
  sqlitePath?: string;
  verbose?: boolean;
  autoMigrateLocal?: boolean;
}

/**
 * Finds the local Wrangler miniflare D1 sqlite file if it exists.
 */
export function findLocalD1SqlitePath(): string | null {
  const d1Dir = path.resolve(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
  if (!fs.existsSync(d1Dir)) return null;
  const files = fs.readdirSync(d1Dir);
  const sqliteFile = files.find((f) => f.endsWith('.sqlite'));
  return sqliteFile ? path.join(d1Dir, sqliteFile) : null;
}

/**
 * Seeds initial database data from `shared/mock-data.ts`.
 * Compatible with both Cloudflare D1 and local SQLite (better-sqlite3).
 */
export async function seedDatabase(options: SeedOptions = {}) {
  const { verbose = true, autoMigrateLocal = true } = options;
  const db = getDb(options.envOrD1, options.sqlitePath ? { sqlitePath: options.sqlitePath } : undefined);

  // If running locally on SQLite and autoMigrateLocal is enabled, ensure migrations are applied
  const isD1 = options.envOrD1?.DB || (options.envOrD1 && typeof options.envOrD1.prepare === 'function');
  if (!isD1 && autoMigrateLocal) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const getModule = new Function('name', 'return import(name)'); const { migrate } = await getModule('drizzle-orm/better-sqlite3/migrator');
      const migrationsFolder = path.resolve(process.cwd(), 'drizzle', 'migrations');
      migrate(db, { migrationsFolder });
      if (verbose) console.log('✓ Local SQLite migrations checked/applied');
    } catch (migErr) {
      if (verbose) console.warn('Notice: Migration check warning:', (migErr as any)?.message);
    }
  }

  if (verbose) {
    console.log('🌱 Starting database seeding...');
  }

  // 1. Tenants
  for (const t of MOCK_TENANTS) {
    await db.insert(schema.tenants).values({
      id: t.id,
      name: t.name,
      slug: t.slug,
      ownerId: t.ownerId,
      address: t.address,
      city: t.city,
      latitude: t.latitude,
      longitude: t.longitude,
      timezone: t.timezone || 'Asia/Jakarta',
      logoUrl: t.logoUrl,
      qrisImageUrl: t.qrisImageUrl || '/qris-masjid.jpeg',
      bannerUrl: t.bannerUrl,
      runningText: t.runningText,
      bankInfo: t.bankInfo,
      bankAccounts: t.bankAccounts,
      bio: t.bio,
      status: t.status,
      aiEnabled: t.aiEnabled,
      selectedPersona: t.selectedPersona,
      kioskRunningText: t.kioskRunningText,
      kioskPrayerMode: t.kioskPrayerMode,
      sholatDuration: t.sholatDuration,
      iqomahMinutes: t.iqomahMinutes,
      createdAt: Math.floor(t.createdAt / 1000),
      updatedAt: Math.floor(t.createdAt / 1000),
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_TENANTS.length} tenant(s)`);

  // 2. Users
  for (const u of MOCK_USERS) {
    await db.insert(schema.users).values({
      id: u.id,
      tenantId: u.tenantIds?.[0] || 't1',
      tenantIds: u.tenantIds,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: true,
      isBanned: u.isBanned || false,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_USERS.length} user(s)`);

  // 3. Transactions
  for (const tx of MOCK_TRANSACTIONS) {
    await db.insert(schema.transactions).values({
      id: tx.id,
      tenantId: tx.tenantId,
      date: Math.floor(tx.date / 1000),
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      description: tx.description,
      createdBy: tx.createdBy,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_TRANSACTIONS.length} transaction(s)`);

  // 4. Mustahiks
  for (const m of MOCK_MUSTAHIKS) {
    await db.insert(schema.mustahiks).values({
      id: m.id,
      tenantId: m.tenantId,
      name: m.name,
      nik: m.nik,
      category: m.category,
      address: m.address,
      phone: m.phone,
      familyMembers: m.familyMembers,
      status: m.status,
      assistanceReceived: m.assistanceReceived,
      lastAssistanceDate: m.lastAssistanceDate ? Math.floor(m.lastAssistanceDate / 1000) : null,
      registrationDate: m.registrationDate ? Math.floor(m.registrationDate / 1000) : Math.floor(Date.now() / 1000),
      notes: m.notes,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_MUSTAHIKS.length} mustahik(s)`);

  // 5. ZIS Transactions
  for (const z of MOCK_ZIS_TRANSACTIONS) {
    await db.insert(schema.zisTransactions).values({
      id: z.id,
      tenantId: z.tenantId,
      date: Math.floor(z.date / 1000),
      type: z.type,
      flow: z.flow,
      amount: z.amount,
      muzakkiName: z.muzakki_name,
      muzakkiEmail: z.muzakki_email,
      muzakkiPhone: z.muzakki_phone,
      mustahikId: z.mustahik_id,
      description: z.description,
      paymentMethod: z.payment_method,
      paymentStatus: z.payment_status,
      paymentReference: z.payment_reference,
      paymentGateway: z.payment_gateway,
      paymentDate: z.payment_date ? Math.floor(z.payment_date / 1000) : null,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_ZIS_TRANSACTIONS.length} ZIS transaction(s)`);

  // 6. Inventory Items
  for (const inv of MOCK_INVENTORY_ITEMS) {
    await db.insert(schema.inventoryItems).values({
      id: inv.id,
      tenantId: inv.tenantId,
      name: inv.name,
      quantity: inv.quantity,
      condition: inv.condition,
      location: inv.location,
      lastMaintenance: inv.lastMaintenance ? Math.floor(inv.lastMaintenance / 1000) : null,
      maintenanceIntervalDays: inv.maintenanceIntervalDays,
      nextMaintenanceDate: inv.nextMaintenanceDate ? Math.floor(inv.nextMaintenanceDate / 1000) : null,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_INVENTORY_ITEMS.length} inventory item(s)`);

  // 7. Events
  for (const ev of MOCK_EVENTS) {
    await db.insert(schema.events).values({
      id: ev.id,
      tenantId: ev.tenantId,
      title: ev.title,
      description: ev.description,
      speaker: ev.speaker,
      date: Math.floor(ev.date / 1000),
      location: ev.location,
      capacity: ev.capacity,
      maxCapacity: ev.capacity,
      currentRegistrations: ev.currentRegistrations,
      registeredCount: ev.currentRegistrations,
      imageUrl: ev.imageUrl,
      bannerUrl: ev.imageUrl,
      isFundraising: ev.isFundraising,
      targetAmount: ev.targetAmount,
      collectedAmount: ev.collectedAmount,
      isRegistrationOpen: true,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_EVENTS.length} event(s)`);

  // 8. Monthly Prayer Schedules
  for (const ps of MOCK_MONTHLY_PRAYER_SCHEDULES) {
    await db.insert(schema.monthlyPrayerSchedules).values({
      id: ps.id,
      tenantId: ps.tenantId,
      year: ps.year,
      month: ps.month,
      days: ps.days,
    }).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${MOCK_MONTHLY_PRAYER_SCHEDULES.length} monthly prayer schedule(s)`);

  // 9. Kajian Videos
  const defaultKajianVideos = [
    {
      id: 'kv-1',
      tenantId: 't1',
      title: 'Tafsir Surat Al-Fatihah & Makna Shalat Khusyu',
      ustadzName: 'Ustadz Adi Hidayat, Lc., M.A.',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ',
      description: 'Penjelasan mendalam tentang tafsir surat Al-Fatihah dan rahasia meraih kekhusyuan dalam shalat berjamaah.',
      duration: '45:20',
      category: 'kajian_rutin',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      publishedAt: Math.floor(Date.now() / 1000) - 86400 * 3,
    },
    {
      id: 'kv-2',
      tenantId: 't1',
      title: 'Fiqih Muamalah: Adab Berdagang & Menghindari Riba',
      ustadzName: 'Ustadz Dr. Erwandi Tarmizi, M.A.',
      youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      youtubeVideoId: 'kJQP7kiw5Fk',
      description: 'Panduan fiqih muamalah kontemporer bagi para pelaku usaha muslim dan jamaah masjid.',
      duration: '1 jam 12 mnt',
      category: 'fiqih',
      thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      publishedAt: Math.floor(Date.now() / 1000) - 86400 * 7,
    }
  ];

  for (const kv of defaultKajianVideos) {
    await db.insert(schema.kajianVideos).values(kv).onConflictDoNothing();
  }
  if (verbose) console.log(`✓ Seeded ${defaultKajianVideos.length} kajian video(s)`);

  if (verbose) {
    console.log('✅ Seeding completed successfully!');
  }
}

// Auto-run if executed directly via CLI (bun / node)
const isMain = typeof process !== 'undefined' &&
  Boolean(process.argv?.[1] && (
    process.argv[1].endsWith('seed.ts') ||
    process.argv[1].endsWith('seed.js')
  ));

if (isMain) {
  // If target flag --d1 is passed or target is d1, seed into local D1 miniflare state
  const targetD1 = process.argv.includes('--d1') || process.argv.includes('--local-d1');
  const sqlitePath = targetD1 ? (findLocalD1SqlitePath() || undefined) : undefined;

  if (targetD1 && !sqlitePath) {
    console.error('❌ Could not find local D1 SQLite file in .wrangler/state/v3/d1/miniflare-D1DatabaseObject. Ensure wrangler d1 migrations apply --local has been run.');
    process.exit(1);
  }

  seedDatabase({ sqlitePath, autoMigrateLocal: !targetD1 })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
