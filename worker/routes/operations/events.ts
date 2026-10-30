import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapEventRow,
  mapEventRegistrationRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "../common";

export function registerEventRoutes(app: Hono<any>) {
  // --- EVENTS & REGISTRATIONS ---
  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.tenantId, tenant.id))
      .orderBy(desc(schema.events.date));

    return ok(c, rows.map(mapEventRow));
  });

  app.post('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const eventId = body.id || crypto.randomUUID();
    const dateVal = toEpochSeconds(body.date ?? Date.now());
    const capacityVal = Number(body.capacity || body.maxCapacity || 0);
    const currentRegs = Number(body.currentRegistrations || body.registeredCount || 0);

    await db.insert(schema.events).values({
      id: eventId,
      tenantId: tenant.id,
      title: body.title || '',
      description: body.description || '',
      speaker: body.speaker ?? null,
      date: dateVal,
      time: body.time ?? null,
      location: body.location || '',
      category: body.category || 'kajian',
      bannerUrl: body.bannerUrl ?? body.imageUrl ?? null,
      imageUrl: body.imageUrl ?? body.bannerUrl ?? null,
      capacity: capacityVal,
      maxCapacity: capacityVal,
      currentRegistrations: currentRegs,
      registeredCount: currentRegs,
      isRegistrationOpen: body.isRegistrationOpen !== undefined ? !!body.isRegistrationOpen : true,
      requireCheckIn: body.requireCheckIn !== undefined ? !!body.requireCheckIn : false,
      minDonation: body.minDonation !== undefined ? Number(body.minDonation) : null,
      isFundraising: body.isFundraising !== undefined ? !!body.isFundraising : false,
      targetAmount: body.targetAmount !== undefined ? Number(body.targetAmount) : null,
      collectedAmount: body.collectedAmount !== undefined ? Number(body.collectedAmount) : 0,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const rows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRow(rows[0]));
  });

  app.put('/api/:slug/events/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Event not found');

    const updateData: Partial<typeof schema.events.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.speaker !== undefined) updateData.speaker = body.speaker;
    if (body.date !== undefined) {
      updateData.date = toEpochSeconds(body.date);
    }
    if (body.time !== undefined) updateData.time = body.time;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined || body.bannerUrl !== undefined) {
      updateData.imageUrl = body.imageUrl ?? body.bannerUrl;
      updateData.bannerUrl = body.bannerUrl ?? body.imageUrl;
    }
    if (body.capacity !== undefined || body.maxCapacity !== undefined) {
      const cap = Number(body.capacity ?? body.maxCapacity);
      updateData.capacity = cap;
      updateData.maxCapacity = cap;
    }
    if (body.currentRegistrations !== undefined || body.registeredCount !== undefined) {
      const reg = Number(body.currentRegistrations ?? body.registeredCount);
      updateData.currentRegistrations = reg;
      updateData.registeredCount = reg;
    }
    if (body.isRegistrationOpen !== undefined) updateData.isRegistrationOpen = !!body.isRegistrationOpen;
    if (body.requireCheckIn !== undefined) updateData.requireCheckIn = !!body.requireCheckIn;
    if (body.minDonation !== undefined) updateData.minDonation = Number(body.minDonation);
    if (body.isFundraising !== undefined) updateData.isFundraising = !!body.isFundraising;
    if (body.targetAmount !== undefined) updateData.targetAmount = Number(body.targetAmount);
    if (body.collectedAmount !== undefined) updateData.collectedAmount = Number(body.collectedAmount);

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.events)
        .set(updateData)
        .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRow(rows[0]));
  });

  app.delete('/api/:slug/events/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Event not found');

    await db
      .delete(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  // Event Registrations & Check-In
  app.get('/api/:slug/events/:id/registrations', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.eventId, eventId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .orderBy(desc(schema.eventRegistrations.registeredAt));

    return ok(c, rows.map(mapEventRegistrationRow));
  });

  app.post('/api/:slug/events/:id/register', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const eventRows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (eventRows.length === 0) return notFound(c, 'Event not found');
    const currentEvent = eventRows[0];

    const regId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const attendeeName = body.name || body.attendeeName || '';
    const attendeeEmail = body.email || body.attendeeEmail || null;
    const attendeePhone = body.phone || body.attendeePhone || null;

    await db.insert(schema.eventRegistrations).values({
      id: regId,
      tenantId: tenant.id,
      eventId,
      attendeeName,
      name: attendeeName,
      attendeeEmail,
      email: attendeeEmail,
      attendeePhone,
      phone: attendeePhone,
      status: body.status || 'registered',
      checkedInAt: null,
      registeredAt: nowSec,
      createdAt: nowSec,
    });

    const newCount = (currentEvent.currentRegistrations || 0) + 1;
    await db
      .update(schema.events)
      .set({
        currentRegistrations: newCount,
        registeredCount: newCount,
      })
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)));

    const createdRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.id, regId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRegistrationRow(createdRows[0]));
  });

  app.post('/api/:slug/events/:eventId/check-in', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('eventId');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const regId = body.registrationId || body.id;
    if (!regId) return bad(c, 'Registration ID is required');

    const regRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(
        eq(schema.eventRegistrations.id, regId),
        eq(schema.eventRegistrations.eventId, eventId),
        eq(schema.eventRegistrations.tenantId, tenant.id)
      ))
      .limit(1);

    if (regRows.length === 0) return notFound(c, 'Registration not found');

    const nowSec = Math.floor(Date.now() / 1000);
    await db
      .update(schema.eventRegistrations)
      .set({
        status: 'attended',
        checkedInAt: nowSec,
      })
      .where(and(
        eq(schema.eventRegistrations.id, regId),
        eq(schema.eventRegistrations.tenantId, tenant.id)
      ));

    const updatedRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.id, regId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRegistrationRow(updatedRows[0]));
  });
}
