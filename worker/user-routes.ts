import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, TenantEntity, TransactionEntity, InventoryItemEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH
  app.post('/api/auth/register', async (c) => {
    const { name, email, mosqueName, slug } = await c.req.json();
    if (!name || !email || !mosqueName || !slug) {
      return bad(c, 'All fields are required');
    }
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
    const user = new UserEntity(c.env, 'u1');
    const state = await user.getState();
    return ok(c, { user: state });
  });
  // TENANTS
  app.get('/api/tenants/:slug', async (c) => {
    const slug = c.req.param('slug');
    const { items } = await TenantEntity.list(c.env);
    const tenant = items.find(t => t.slug === slug);
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
  });
  app.get('/api/tenants', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    return ok(c, await TenantEntity.list(c.env));
  });
  // FINANCE
  app.get('/api/:slug/finance', async (c) => {
    const slug = c.req.param('slug');
    const { items: tenants } = await TenantEntity.list(c.env);
    const tenant = tenants.find(t => t.slug === slug);
    if (!tenant) return notFound(c, 'Tenant not found');
    await TransactionEntity.ensureSeed(c.env);
    const { items: transactions } = await TransactionEntity.list(c.env);
    const filtered = transactions.filter(t => t.tenantId === tenant.id);
    return ok(c, filtered);
  });
  app.post('/api/:slug/finance', async (c) => {
    const slug = c.req.param('slug');
    const { items: tenants } = await TenantEntity.list(c.env);
    const tenant = tenants.find(t => t.slug === slug);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await TransactionEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      date: Date.now()
    });
    return ok(c, tx);
  });
  // INVENTORY
  app.get('/api/:slug/inventory', async (c) => {
    const slug = c.req.param('slug');
    const { items: tenants } = await TenantEntity.list(c.env);
    const tenant = tenants.find(t => t.slug === slug);
    if (!tenant) return notFound(c, 'Tenant not found');
    await InventoryItemEntity.ensureSeed(c.env);
    const { items: inventory } = await InventoryItemEntity.list(c.env);
    const filtered = inventory.filter(i => i.tenantId === tenant.id);
    return ok(c, filtered);
  });
  app.post('/api/:slug/inventory', async (c) => {
    const slug = c.req.param('slug');
    const { items: tenants } = await TenantEntity.list(c.env);
    const tenant = tenants.find(t => t.slug === slug);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const item = await InventoryItemEntity.create(c.env, {
      ...body,
      id: crypto.randomUUID(),
      tenantId: tenant.id
    });
    return ok(c, item);
  });
}