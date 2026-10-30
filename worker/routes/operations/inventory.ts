import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { ok, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapInventoryItemRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "../common";

export function registerInventoryRoutes(app: Hono<any>) {
  // --- INVENTORY ---
  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.tenantId, tenant.id))
      .orderBy(desc(schema.inventoryItems.createdAt));

    return ok(c, rows.map(mapInventoryItemRow));
  });

  app.post('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const itemId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const purchaseDateVal = body.purchaseDate ? toEpochSeconds(body.purchaseDate) : null;
    const lastMaintVal = body.lastMaintenance ? toEpochSeconds(body.lastMaintenance) : null;
    const nextMaintVal = body.nextMaintenanceDate ? toEpochSeconds(body.nextMaintenanceDate) : null;

    await db.insert(schema.inventoryItems).values({
      id: itemId,
      tenantId: tenant.id,
      name: body.name || '',
      category: body.category || 'umum',
      quantity: Number(body.quantity || 1),
      condition: body.condition || 'good',
      location: body.location || '',
      purchaseDate: purchaseDateVal,
      purchasePrice: body.purchasePrice !== undefined ? Number(body.purchasePrice) : null,
      source: body.source ?? null,
      notes: body.notes ?? null,
      maintenanceLog: body.maintenanceLog ?? null,
      lastMaintenance: lastMaintVal,
      maintenanceIntervalDays: body.maintenanceIntervalDays !== undefined ? Number(body.maintenanceIntervalDays) : null,
      nextMaintenanceDate: nextMaintVal,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, itemId), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapInventoryItemRow(rows[0]));
  });

  app.put('/api/:slug/inventory/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Item not found');

    const updateData: Partial<typeof schema.inventoryItems.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? toEpochSeconds(body.purchaseDate) : null;
    }
    if (body.purchasePrice !== undefined) updateData.purchasePrice = Number(body.purchasePrice);
    if (body.source !== undefined) updateData.source = body.source;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.maintenanceLog !== undefined) updateData.maintenanceLog = body.maintenanceLog;
    if (body.lastMaintenance !== undefined) {
      updateData.lastMaintenance = body.lastMaintenance ? toEpochSeconds(body.lastMaintenance) : null;
    }
    if (body.maintenanceIntervalDays !== undefined) updateData.maintenanceIntervalDays = Number(body.maintenanceIntervalDays);
    if (body.nextMaintenanceDate !== undefined) {
      updateData.nextMaintenanceDate = body.nextMaintenanceDate ? toEpochSeconds(body.nextMaintenanceDate) : null;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.inventoryItems)
        .set(updateData)
        .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapInventoryItemRow(rows[0]));
  });

  app.delete('/api/:slug/inventory/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Item not found');

    await db
      .delete(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)));

    return ok(c, { success: true });
  });
}
