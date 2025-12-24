import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, TenantEntity, TransactionEntity, InventoryItemEntity, EventEntity, EventRegistrationEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const getTenantBySlug = async (env: Env, slug: string) => {
    await TenantEntity.ensureSeed(env); await UserEntity.ensureSeed(env);
    const { items } = await TenantEntity.list(env);
    return items.find(t => t.slug === slug);
  };
  // --- PUBLIC & AUTH ---
  app.post('/api/auth/register', async (c) => {
    const { name, email, mosqueName, slug } = await c.req.json();
    if (!name || !email || !mosqueName || !slug) return bad(c, 'All fields are required');
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const tenant = await TenantEntity.create(c.env, {
      id: tenantId,
      name: mosqueName,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      ownerId: userId,
      createdAt: Date.now(),
      status: 'active'
    });
    const user = await UserEntity.create(c.env, {
      id: userId,
      name,
      email,
      role: 'mosque_admin',
      tenantIds: [tenantId]
    });
    return ok(c, { user, tenant });
  });
  app.post('/api/auth/login', async (c) => {
    const { email } = await c.req.json();
    const { items } = await UserEntity.list(c.env);
    const user = items.find(u => u.email === email) || items[0];
    return ok(c, { user });
  });
  // --- SUPER ADMIN ROUTES ---
  app.get('/api/super/summary', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    const totalBalance = txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const activeEvents = events.filter(e => e.date > Date.now()).length;
    return ok(c, {
      totalTenants: tenants.length,
      totalUsers: users.length,
      totalBalance,
      activeEvents
    });
  });
  app.get('/api/super/tenants', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    const enriched = tenants.map(t => {
      const tTxs = txs.filter(tx => tx.tenantId === t.id);
      const tUsers = users.filter(u => u.tenantIds.includes(t.id));
      const tEvents = events.filter(e => e.tenantId === t.id);
      return {
        ...t,
        totalBalance: tTxs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
        memberCount: tUsers.length,
        eventCount: tEvents.length
      };
    });
    return ok(c, enriched);
  });
  app.patch('/api/super/tenants/:id/status', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const inst = new TenantEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Tenant not found');
    await inst.patch({ status });
    return ok(c, await inst.getState());
  });
  app.delete('/api/super/tenants/:id', async (c) => {
    const id = c.req.param('id');
    const okDel = await TenantEntity.delete(c.env, id);
    return ok(c, { deleted: okDel });
  });
  app.get('/api/super/users', async (c) => {
    const { items } = await UserEntity.list(c.env);
    return ok(c, items);
  });
  // --- TENANT ROUTES ---
  app.get('/api/tenants/:slug', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
  });
  app.put('/api/:slug/settings', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const inst = new TenantEntity(c.env, tenant.id);
    await inst.patch(body);
    return ok(c, await inst.getState());
  });
  app.get('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await TransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });
  app.post('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const transaction = await TransactionEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdBy: 'u1'
    });
    return ok(c, transaction);
  });
  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await InventoryItemEntity.list(c.env);
    return ok(c, items.filter(i => i.tenantId === tenant.id));
  });
  app.post('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const item = await InventoryItemEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id
    });
    return ok(c, item);
  });
  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await EventEntity.list(c.env);
    return ok(c, items.filter(e => e.tenantId === tenant.id));
  });
  app.post('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const event = await EventEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      currentRegistrations: 0
    });
    return ok(c, event);
  });
  app.post('/api/:slug/events/:id/register', async (c) => {
    const eventId = c.req.param('id');
    const eventInst = new EventEntity(c.env, eventId);
    if (!(await eventInst.exists())) return notFound(c, 'Event not found');
    const body = await c.req.json();
    const reg = await EventRegistrationEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      eventId,
      registeredAt: Date.now()
    });
    await eventInst.mutate(s => ({ ...s, currentRegistrations: (s.currentRegistrations || 0) + 1 }));
    return ok(c, reg);
  });
  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });
}