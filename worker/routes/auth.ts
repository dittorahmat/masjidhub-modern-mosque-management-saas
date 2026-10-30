import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import type { AppUser, UserRole } from "@shared/types";
import { ok, bad, notFound } from "../core-utils";
import { ensureDbInitialized, mapUserRow, mapTenantRow } from "./common";

export function registerAuthRoutes(app: Hono<any>) {
  app.post('/api/auth/register', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { name, email, mosqueName, slug, address } = await c.req.json();
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const nowSec = Math.floor(Date.now() / 1000);

    const defaultIqomah = { fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10 };

    await db.insert(schema.tenants).values({
      id: tenantId,
      name: mosqueName,
      slug: cleanSlug,
      ownerId: userId,
      createdAt: nowSec,
      updatedAt: nowSec,
      address,
      status: 'pending',
      selectedPersona: 'marbot_muda',
      kioskRunningText: "",
      kioskPrayerMode: 'silent',
      sholatDuration: 15,
      iqomahMinutes: defaultIqomah,
    });

    await db.insert(schema.users).values({
      id: userId,
      tenantId: tenantId,
      tenantIds: [tenantId],
      name,
      email,
      role: 'dkm_admin',
      isActive: true,
      isBanned: false,
      createdAt: nowSec,
      updatedAt: nowSec,
    });

    const tenant = mapTenantRow({
      id: tenantId,
      name: mosqueName,
      slug: cleanSlug,
      ownerId: userId,
      createdAt: nowSec,
      updatedAt: nowSec,
      address,
      city: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      timezone: 'Asia/Jakarta',
      bannerUrl: null,
      logoUrl: null,
      legalDocUrl: null,
      runningText: null,
      bankInfo: null,
      bankAccounts: null,
      dkmStructure: null,
      prayerCalculationMethod: 'KEMENAG',
      socialLinks: null,
      bio: null,
      status: 'pending',
      aiEnabled: false,
      selectedPersona: 'marbot_muda',
      kioskRunningText: "",
      kioskPrayerMode: 'silent',
      sholatDuration: 15,
      iqomahMinutes: defaultIqomah,
    });

    const user: AppUser = {
      id: userId,
      name,
      email,
      role: 'dkm_admin',
      tenantIds: [tenantId],
      isBanned: false,
    };

    return ok(c, { user, tenant });
  });

  // Alias route for register-mosque
  app.post('/api/auth/register-mosque', async (c) => {
    return app.fetch(new Request(c.req.url.replace('/api/auth/register-mosque', '/api/auth/register'), {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(await c.req.json()),
    }), c.env, c.executionCtx);
  });

  app.post('/api/auth/login', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { email } = await c.req.json();

    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    let user: AppUser;
    if (users.length > 0) {
      user = mapUserRow(users[0]);
    } else {
      const role: UserRole = email === 'admin@masjidhub.com' ? 'superadmin_platform' : 'dkm_admin';
      user = { id: crypto.randomUUID(), name: "Demo User", email, role, tenantIds: ['t1'] };
    }
    return ok(c, { user });
  });

  // Auth me endpoint
  app.get('/api/auth/me', async (c) => {
    await ensureDbInitialized(c.env);
    const email = c.req.query('email');
    const userId = c.req.query('id');
    const db = getDb(c.env);

    if (!email && !userId) {
      return bad(c, 'Query parameter email or id is required');
    }

    const whereClause = email
      ? eq(schema.users.email, email)
      : eq(schema.users.id, userId!);

    const users = await db.select().from(schema.users).where(whereClause).limit(1);
    if (users.length === 0) {
      return notFound(c, 'User not found');
    }
    return ok(c, { user: mapUserRow(users[0]) });
  });

  // Demo users endpoint
  app.get('/api/auth/demo-users', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const users = await db.select().from(schema.users);
    return ok(c, users.map(mapUserRow));
  });
}
