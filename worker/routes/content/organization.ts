import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, asc } from "drizzle-orm";
import { ok, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapOrganizationMemberRow,
  getTenantBySlugOrSubdomain,
} from "../common";

export function registerOrganizationRoutes(app: Hono<any>) {
  // --- ORGANIZATION MEMBERS ---
  app.get('/api/:slug/organization', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.tenantId, tenant.id))
      .orderBy(asc(schema.organizationMembers.order));

    return ok(c, rows.map(mapOrganizationMemberRow));
  });

  app.post('/api/:slug/organization', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const memberId = body.id || crypto.randomUUID();

    await db.insert(schema.organizationMembers).values({
      id: memberId,
      tenantId: tenant.id,
      name: body.name || '',
      role: body.role || '',
      imageUrl: body.imageUrl ?? null,
      order: Number(body.order || 0),
      bio: body.bio ?? null,
      socialLinks: body.socialLinks ?? null,
    });

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, memberId), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapOrganizationMemberRow(rows[0]));
  });

  app.put('/api/:slug/organization/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Member not found');

    const updateData: Partial<typeof schema.organizationMembers.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.organizationMembers)
        .set(updateData)
        .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapOrganizationMemberRow(rows[0]));
  });

  app.delete('/api/:slug/organization/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Member not found');

    await db
      .delete(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)));

    return ok(c, { success: true });
  });
}
