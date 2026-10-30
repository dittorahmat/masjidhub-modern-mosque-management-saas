import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { ok, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapMustahikRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "../common";

export function registerMustahikRoutes(app: Hono<any>) {
  // --- MUSTAHIK ---
  // 18. Mustahik List
  app.get('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.mustahiks)
      .where(eq(schema.mustahiks.tenantId, tenant.id))
      .orderBy(desc(schema.mustahiks.registrationDate));

    return ok(c, rows.map(mapMustahikRow));
  });

  // 19. Mustahik Create
  app.post('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const regDateSec = toEpochSeconds(body.registrationDate ?? Date.now());

    await db.insert(schema.mustahiks).values({
      id,
      tenantId: tenant.id,
      name: body.name,
      nik: body.nik ?? null,
      category: body.category || 'miskin',
      address: body.address ?? null,
      phone: body.phone ?? null,
      familyMembers: body.familyMembers ? Number(body.familyMembers) : 1,
      status: body.status || 'active',
      assistanceReceived: body.assistanceReceived ? Number(body.assistanceReceived) : 0,
      lastAssistanceDate: body.lastAssistanceDate ? toEpochSeconds(body.lastAssistanceDate) : null,
      registrationDate: regDateSec,
      notes: body.notes ?? null,
      createdAt: nowSec,
    });

    const inserted = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapMustahikRow(inserted[0]));
  });

  // 20. Mustahik Update (PUT)
  app.put('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Mustahik not found');

    const updateData: Partial<typeof schema.mustahiks.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.nik !== undefined) updateData.nik = body.nik;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.familyMembers !== undefined) updateData.familyMembers = Number(body.familyMembers);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assistanceReceived !== undefined) updateData.assistanceReceived = Number(body.assistanceReceived);
    if (body.lastAssistanceDate !== undefined) {
      updateData.lastAssistanceDate = body.lastAssistanceDate ? toEpochSeconds(body.lastAssistanceDate) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.mustahiks)
        .set(updateData)
        .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapMustahikRow(updated[0]));
  });

  // 21. Mustahik Delete (DELETE)
  app.delete('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Mustahik not found');

    await db
      .delete(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)));

    return ok(c, { success: true });
  });
}
