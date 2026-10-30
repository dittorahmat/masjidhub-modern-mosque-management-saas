import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { ok, bad, notFound } from "../core-utils";
import {
  ensureDbInitialized,
  mapTenantRow,
  mapUserRow,
  getTenantBySlugOrSubdomain
} from "./common";

export function registerTenantRoutes(app: Hono<any>) {
  // Check subdomain availability
  app.get('/api/check-subdomain/:slug', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const slug = c.req.param('slug').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const rows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);

    const exists = rows.length > 0;
    return ok(c, { available: !exists, slug: c.req.param('slug') });
  });

  // Tenants list endpoint
  app.get('/api/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const rows = await db.select().from(schema.tenants);
    return ok(c, rows.map(mapTenantRow));
  });

  // Create tenant endpoint
  app.post('/api/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();
    const tenantId = body.id || crypto.randomUUID();
    const cleanSlug = (body.slug || body.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.tenants).values({
      id: tenantId,
      name: body.name,
      slug: cleanSlug,
      ownerId: body.ownerId || 'u1',
      address: body.address,
      city: body.city,
      phone: body.phone,
      email: body.email,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone || 'Asia/Jakarta',
      bannerUrl: body.bannerUrl,
      logoUrl: body.logoUrl,
      qrisImageUrl: body.qrisImageUrl,
      legalDocUrl: body.legalDocUrl,
      runningText: body.runningText,
      bankInfo: body.bankInfo,
      bankAccounts: body.bankAccounts,
      dkmStructure: body.dkmStructure,
      prayerCalculationMethod: body.prayerCalculationMethod || 'KEMENAG',
      socialLinks: body.socialLinks,
      bio: body.bio,
      status: body.status || 'active',
      aiEnabled: body.aiEnabled ?? false,
      selectedPersona: body.selectedPersona || 'marbot_muda',
      kioskRunningText: body.kioskRunningText || '',
      kioskPrayerMode: body.kioskPrayerMode || 'silent',
      sholatDuration: body.sholatDuration || 15,
      iqomahMinutes: body.iqomahMinutes || { fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10 },
      createdAt: nowSec,
      updatedAt: nowSec,
    });

    const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    return ok(c, mapTenantRow(rows[0]));
  });

  // Get tenant by slug
  app.get('/api/tenants/:slug', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
  });

  // Tenant members list
  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const allUsers = await db.select().from(schema.users);
    const mapped = allUsers.map(mapUserRow);
    return ok(c, mapped.filter(u => u.tenantIds.includes(tenant.id)));
  });

  // User Management for tenant (moderation / banning)
  app.get('/api/:slug/users', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const allUsers = await db.select().from(schema.users);
    const mapped = allUsers.map(mapUserRow);
    return ok(c, mapped.filter(u => u.tenantIds.includes(tenant.id)));
  });

  app.post('/api/:slug/users/:id/ban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) return notFound(c, 'User not found');
    const user = mapUserRow(existing[0]);
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await db.update(schema.users).set({ isBanned: true, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.users.id, userId));
    return ok(c, { success: true, message: 'User banned successfully' });
  });

  app.post('/api/:slug/users/:id/unban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) return notFound(c, 'User not found');
    const user = mapUserRow(existing[0]);
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await db.update(schema.users).set({ isBanned: false, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.users.id, userId));
    return ok(c, { success: true, message: 'User unbanned successfully' });
  });
}
