import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { ok, notFound } from "../core-utils";
import {
  ensureDbInitialized,
  mapUserRow,
  mapTenantRow
} from "./common";

export function registerSuperAdminRoutes(app: Hono<any>) {
  app.get('/api/super/summary', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const [tenantsList, usersList, txsList, eventsList] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.transactions),
      db.select().from(schema.events),
    ]);
    const nowSec = Math.floor(Date.now() / 1000);
    return ok(c, {
      totalTenants: tenantsList.length,
      totalUsers: usersList.length,
      totalBalance: txsList.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: eventsList.filter(e => e.date > nowSec).length,
      pendingApprovals: tenantsList.filter(t => t.status === 'pending').length,
    });
  });

  app.get('/api/super/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const [tenantsList, usersList, txsList] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.transactions),
    ]);
    const mappedUsers = usersList.map(mapUserRow);
    const mappedTenants = tenantsList.map(mapTenantRow);

    return ok(c, mappedTenants.map(t => ({
      ...t,
      totalBalance: txsList.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      memberCount: mappedUsers.filter(u => u.tenantIds.includes(t.id)).length,
      eventCount: 0,
    })));
  });

  app.get('/api/super/users', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const usersList = await db.select().from(schema.users);
    return ok(c, usersList.map(mapUserRow));
  });

  app.post('/api/super/tenants/:id/approve', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const tenantId = c.req.param('id');
    const existing = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    if (existing.length === 0) return notFound(c, 'Tenant not found');

    await db.update(schema.tenants).set({ status: 'active', updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.tenants.id, tenantId));
    return ok(c, { success: true });
  });

  app.post('/api/super/tenants/:id/toggle-ai', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const tenantId = c.req.param('id');
    const { enabled } = await c.req.json();
    const existing = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    if (existing.length === 0) return notFound(c, 'Tenant not found');

    await db.update(schema.tenants).set({ aiEnabled: enabled, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.tenants.id, tenantId));
    return ok(c, { success: true, aiEnabled: enabled });
  });
}
