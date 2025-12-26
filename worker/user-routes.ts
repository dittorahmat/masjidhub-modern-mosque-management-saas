import { Hono } from "hono";
import type { Env } from './core-utils';
import {
  UserEntity,
  TenantEntity,
  TransactionEntity,
  InventoryItemEntity,
  EventEntity,
  EventRegistrationEntity,
  ForumPostEntity,
  ZisTransactionEntity
} from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  const getTenantBySlug = async (env: Env, slug: string) => {
    await TenantEntity.ensureSeed(env);
    await UserEntity.ensureSeed(env);
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
      status: 'pending'
    });
    const user = await UserEntity.create(c.env, {
      id: userId,
      name,
      email,
      role: 'dkm_admin',
      tenantIds: [tenantId]
    });
    return ok(c, { user, tenant });
  });
  app.post('/api/auth/login', async (c) => {
    const { email } = await c.req.json();
    const { items } = await UserEntity.list(c.env);
    let user = items.find(u => u.email === email);
    if (!user) {
        user = {
            id: crypto.randomUUID(),
            name: "Demo User",
            email: email,
            role: email === 'admin@masjidhub.com' ? 'superadmin_platform' : 'dkm_admin',
            tenantIds: ['t1']
        };
    }
    return ok(c, { user });
  });
  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    return ok(c, {
      totalTenants: tenants.length,
      totalUsers: users.length,
      totalBalance: txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: events.filter(e => e.date > Date.now()).length,
      pendingApprovals: tenants.filter(t => t.status === 'pending').length
    });
  });
  app.get('/api/super/tenants', async (c) => {
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const enriched = tenants.map(t => ({
      ...t,
      totalBalance: txs.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      memberCount: users.filter(u => u.tenantIds.includes(t.id)).length,
      eventCount: 0
    }));
    return ok(c, enriched);
  });
  app.get('/api/super/users', async (c) => {
    const { items: users } = await UserEntity.list(c.env);
    return ok(c, users);
  });
  app.post('/api/super/tenants/:id/approve', async (c) => {
    const id = c.req.param('id');
    const inst = new TenantEntity(c.env, id);
    if (!(await inst.exists())) return notFound(c, 'Tenant not found');
    await inst.patch({ status: 'active' });
    return ok(c, { success: true });
  });
  // --- TENANT CONTEXT ROUTES ---
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
  // Finance
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
    const tx = await TransactionEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id });
    return ok(c, tx);
  });
  // ZIS
  app.get('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ZisTransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });
  app.post('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await ZisTransactionEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      date: Date.now()
    });
    return ok(c, tx);
  });
  // Inventory
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
    const item = await InventoryItemEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id });
    return ok(c, item);
  });
  // Events
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
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const eventInst = new EventEntity(c.env, eventId);
    if (!(await eventInst.exists())) return notFound(c, 'Event not found');
    const reg = await EventRegistrationEntity.create(c.env, {
      id: crypto.randomUUID(),
      eventId,
      tenantId: tenant.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      registeredAt: Date.now()
    });
    await eventInst.mutate(s => ({
      ...s,
      currentRegistrations: s.currentRegistrations + 1
    }));
    return ok(c, reg);
  });
  // Members
  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });
  // Forum
  app.get('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ForumPostEntity.list(c.env);
    return ok(c, items.filter(p => p.tenantId === tenant.id));
  });
  app.post('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const post = await ForumPostEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      createdAt: Date.now()
    });
    return ok(c, post);
  });
}