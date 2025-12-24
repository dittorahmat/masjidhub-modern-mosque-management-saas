import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, TenantEntity, TransactionEntity, InventoryItemEntity, EventEntity, EventRegistrationEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // HELPER: Find Tenant by Slug
  const getTenantBySlug = async (env: Env, slug: string) => {
    const { items } = await TenantEntity.list(env);
    return items.find(t => t.slug === slug);
  };
  // AUTH
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
      createdAt: Date.now()
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
    const { items } = await UserEntity.list(c.env);
    const user = items[0] || UserEntity.initialState;
    return ok(c, { user });
  });
  // TENANTS / SETTINGS
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
  // EVENTS
  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    await EventEntity.ensureSeed(c.env);
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
  // MEMBERS
  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });
  // FINANCE & INVENTORY
  app.get('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await TransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });
  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlug(c.env, c.req.param('slug'));
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await InventoryItemEntity.list(c.env);
    return ok(c, items.filter(i => i.tenantId === tenant.id));
  });
}