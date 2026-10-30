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

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generateSeedSql(): string {
  const statements: string[] = [];

  // 1. Tenants
  for (const t of MOCK_TENANTS) {
    const cols = [
      'id', 'name', 'slug', 'owner_id', 'address', 'city', 'latitude', 'longitude',
      'timezone', 'logo_url', 'banner_url', 'running_text', 'bank_info', 'bank_accounts',
      'bio', 'status', 'ai_enabled', 'selected_persona', 'kiosk_running_text',
      'kiosk_prayer_mode', 'sholat_duration', 'iqomah_minutes', 'created_at', 'updated_at'
    ];
    const vals = [
      escapeSql(t.id),
      escapeSql(t.name),
      escapeSql(t.slug),
      escapeSql(t.ownerId),
      escapeSql(t.address),
      escapeSql(t.city),
      escapeSql(t.latitude),
      escapeSql(t.longitude),
      escapeSql(t.timezone || 'Asia/Jakarta'),
      escapeSql(t.logoUrl),
      escapeSql(t.bannerUrl),
      escapeSql(t.runningText),
      escapeSql(t.bankInfo),
      escapeSql(t.bankAccounts),
      escapeSql(t.bio),
      escapeSql(t.status),
      escapeSql(t.aiEnabled),
      escapeSql(t.selectedPersona),
      escapeSql(t.kioskRunningText),
      escapeSql(t.kioskPrayerMode),
      escapeSql(t.sholatDuration),
      escapeSql(t.iqomahMinutes),
      escapeSql(Math.floor(t.createdAt / 1000)),
      escapeSql(Math.floor(t.createdAt / 1000)),
    ];
    statements.push(`INSERT OR IGNORE INTO tenants (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 2. Users
  for (const u of MOCK_USERS) {
    const cols = ['id', 'tenant_id', 'tenant_ids', 'email', 'name', 'role', 'is_active', 'is_banned'];
    const vals = [
      escapeSql(u.id),
      escapeSql(u.tenantIds?.[0] || 't1'),
      escapeSql(u.tenantIds),
      escapeSql(u.email),
      escapeSql(u.name),
      escapeSql(u.role),
      escapeSql(true),
      escapeSql(u.isBanned || false),
    ];
    statements.push(`INSERT OR IGNORE INTO users (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 3. Transactions
  for (const tx of MOCK_TRANSACTIONS) {
    const cols = ['id', 'tenant_id', 'date', 'type', 'category', 'amount', 'description', 'created_by'];
    const vals = [
      escapeSql(tx.id),
      escapeSql(tx.tenantId),
      escapeSql(Math.floor(tx.date / 1000)),
      escapeSql(tx.type),
      escapeSql(tx.category),
      escapeSql(tx.amount),
      escapeSql(tx.description),
      escapeSql(tx.createdBy),
    ];
    statements.push(`INSERT OR IGNORE INTO transactions (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 4. Mustahiks
  for (const m of MOCK_MUSTAHIKS) {
    const cols = [
      'id', 'tenant_id', 'name', 'nik', 'category', 'address', 'phone', 'family_members',
      'status', 'assistance_received', 'last_assistance_date', 'registration_date', 'notes'
    ];
    const vals = [
      escapeSql(m.id),
      escapeSql(m.tenantId),
      escapeSql(m.name),
      escapeSql(m.nik),
      escapeSql(m.category),
      escapeSql(m.address),
      escapeSql(m.phone),
      escapeSql(m.familyMembers),
      escapeSql(m.status),
      escapeSql(m.assistanceReceived),
      escapeSql(m.lastAssistanceDate ? Math.floor(m.lastAssistanceDate / 1000) : null),
      escapeSql(m.registrationDate ? Math.floor(m.registrationDate / 1000) : Math.floor(Date.now() / 1000)),
      escapeSql(m.notes),
    ];
    statements.push(`INSERT OR IGNORE INTO mustahiks (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 5. ZIS Transactions
  for (const z of MOCK_ZIS_TRANSACTIONS) {
    const cols = [
      'id', 'tenant_id', 'date', 'type', 'flow', 'amount', 'muzakki_name', 'muzakki_email',
      'muzakki_phone', 'mustahik_id', 'description', 'payment_method', 'payment_status',
      'payment_reference', 'payment_gateway', 'payment_date'
    ];
    const vals = [
      escapeSql(z.id),
      escapeSql(z.tenantId),
      escapeSql(Math.floor(z.date / 1000)),
      escapeSql(z.type),
      escapeSql(z.flow),
      escapeSql(z.amount),
      escapeSql(z.muzakki_name),
      escapeSql(z.muzakki_email),
      escapeSql(z.muzakki_phone),
      escapeSql(z.mustahik_id),
      escapeSql(z.description),
      escapeSql(z.payment_method),
      escapeSql(z.payment_status),
      escapeSql(z.payment_reference),
      escapeSql(z.payment_gateway),
      escapeSql(z.payment_date ? Math.floor(z.payment_date / 1000) : null),
    ];
    statements.push(`INSERT OR IGNORE INTO zis_transactions (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 6. Inventory Items
  for (const inv of MOCK_INVENTORY_ITEMS) {
    const cols = [
      'id', 'tenant_id', 'name', 'quantity', 'condition', 'location',
      'last_maintenance', 'maintenance_interval_days', 'next_maintenance_date'
    ];
    const vals = [
      escapeSql(inv.id),
      escapeSql(inv.tenantId),
      escapeSql(inv.name),
      escapeSql(inv.quantity),
      escapeSql(inv.condition),
      escapeSql(inv.location),
      escapeSql(inv.lastMaintenance ? Math.floor(inv.lastMaintenance / 1000) : null),
      escapeSql(inv.maintenanceIntervalDays),
      escapeSql(inv.nextMaintenanceDate ? Math.floor(inv.nextMaintenanceDate / 1000) : null),
    ];
    statements.push(`INSERT OR IGNORE INTO inventory_items (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 7. Events
  for (const ev of MOCK_EVENTS) {
    const cols = [
      'id', 'tenant_id', 'title', 'description', 'speaker', 'date', 'location',
      'capacity', 'max_capacity', 'current_registrations', 'registered_count',
      'image_url', 'banner_url', 'is_fundraising', 'target_amount', 'collected_amount', 'is_registration_open'
    ];
    const vals = [
      escapeSql(ev.id),
      escapeSql(ev.tenantId),
      escapeSql(ev.title),
      escapeSql(ev.description),
      escapeSql(ev.speaker),
      escapeSql(Math.floor(ev.date / 1000)),
      escapeSql(ev.location),
      escapeSql(ev.capacity),
      escapeSql(ev.capacity),
      escapeSql(ev.currentRegistrations),
      escapeSql(ev.currentRegistrations),
      escapeSql(ev.imageUrl),
      escapeSql(ev.imageUrl),
      escapeSql(ev.isFundraising),
      escapeSql(ev.targetAmount),
      escapeSql(ev.collectedAmount),
      escapeSql(true),
    ];
    statements.push(`INSERT OR IGNORE INTO events (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  // 8. Monthly Prayer Schedules
  for (const ps of MOCK_MONTHLY_PRAYER_SCHEDULES) {
    const cols = ['id', 'tenant_id', 'year', 'month', 'days'];
    const vals = [
      escapeSql(ps.id),
      escapeSql(ps.tenantId),
      escapeSql(ps.year),
      escapeSql(ps.month),
      escapeSql(ps.days),
    ];
    statements.push(`INSERT OR IGNORE INTO monthly_prayer_schedules (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
  }

  return statements.join('\n');
}

export function writeSeedSqlFile(outputPath?: string): string {
  const filePath = outputPath || path.resolve(process.cwd(), 'drizzle', 'seed.sql');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sql = generateSeedSql();
  fs.writeFileSync(filePath, sql, 'utf-8');
  return filePath;
}

const isMain = typeof process !== 'undefined' &&
  Boolean(process.argv?.[1] && (
    process.argv[1].endsWith('generate-seed-sql.ts') ||
    process.argv[1].endsWith('generate-seed-sql.js')
  ));

if (isMain) {
  const out = writeSeedSqlFile();
  console.log(`✓ Generated seed SQL at: ${out}`);
}
