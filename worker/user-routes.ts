import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, TenantEntity } from "./entities";
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
    // Mock login: always returns the seed user for demo
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
}