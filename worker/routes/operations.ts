import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import type { DailyPrayer, PrayerSchedule } from "@shared/types";
import { ok, bad, notFound } from "../core-utils";
import {
  ensureDbInitialized,
  mapInventoryItemRow,
  mapEventRow,
  mapEventRegistrationRow,
  mapPrayerScheduleRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "./common";

export function registerOperationsRoutes(app: Hono<any>) {
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

  // --- PRAYER SCHEDULE HUB ---
  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    // 1. Fetch monthly schedules
    const monthly = await db
      .select()
      .from(schema.monthlyPrayerSchedules)
      .where(eq(schema.monthlyPrayerSchedules.tenantId, tenant.id));

    const allDaily: PrayerSchedule[] = [];
    monthly.forEach(m => {
      const days = (m.days as Record<string, DailyPrayer>) || {};
      Object.entries(days).forEach(([date, prayers]) => {
        const dayDate = new Date(date);
        const dayNames: PrayerSchedule['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];
        (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(pt => {
          allDaily.push({
            id: `${m.id}:${date}:${pt}`,
            tenantId: tenant.id,
            date,
            day: dayName,
            prayerTime: pt,
            time: (prayers as any)[pt],
            imamName: prayers.imamName,
            isLocked: prayers.isLocked,
          });
        });
      });
    });

    // 2. Fetch individual prayer schedules (if any)
    const individual = await db
      .select()
      .from(schema.prayerSchedules)
      .where(eq(schema.prayerSchedules.tenantId, tenant.id));

    const mappedIndividual = individual.map(mapPrayerScheduleRow);
    const combined = [...allDaily, ...mappedIndividual];

    return ok(c, combined);
  });

  app.post('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const scheduleId = body.id || crypto.randomUUID();

    await db.insert(schema.prayerSchedules).values({
      id: scheduleId,
      tenantId: tenant.id,
      date: body.date ?? null,
      day: body.day || 'friday',
      prayerTime: body.prayerTime || 'fajr',
      time: body.time || '05:00',
      imamName: body.imamName ?? null,
      khatibName: body.khatibName ?? null,
      khutbahTopic: body.khutbahTopic ?? null,
      khutbahFileUrl: body.khutbahFileUrl ?? null,
      isLocked: !!body.isLocked,
    });

    const rows = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, scheduleId), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapPrayerScheduleRow(rows[0]));
  });

  app.put('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    // Case A: ID is in composite format tenantId:YYYY-MM:YYYY-MM-DD:prayerTime
    const parts = id.split(':');
    if (parts.length >= 4) {
      const monthId = `${parts[0]}:${parts[1]}`;
      const dateKey = parts[2];
      const prayerTime = parts[3] as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

      const monthlyRows = await db
        .select()
        .from(schema.monthlyPrayerSchedules)
        .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)))
        .limit(1);

      if (monthlyRows.length > 0) {
        const mRow = monthlyRows[0];
        const days = { ...(mRow.days as Record<string, DailyPrayer>) };
        const dayEntry = { ...(days[dateKey] || { fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '' }) };

        if (body.time !== undefined) {
          (dayEntry as any)[prayerTime] = body.time;
        }
        if (body.imamName !== undefined) dayEntry.imamName = body.imamName;
        if (body.isLocked !== undefined) dayEntry.isLocked = body.isLocked;

        days[dateKey] = dayEntry;

        await db
          .update(schema.monthlyPrayerSchedules)
          .set({ days, updatedAt: Math.floor(Date.now() / 1000) })
          .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)));

        const dayDate = new Date(dateKey);
        const dayNames: PrayerSchedule['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];

        const updatedSchedule: PrayerSchedule = {
          id,
          tenantId: tenant.id,
          date: dateKey,
          day: dayName,
          prayerTime,
          time: (dayEntry as any)[prayerTime] || '',
          imamName: dayEntry.imamName,
          isLocked: dayEntry.isLocked,
        };

        return ok(c, updatedSchedule);
      }
    }

    // Case B: Regular prayer_schedules table row
    const existing = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Schedule not found');

    const updateData: Partial<typeof schema.prayerSchedules.$inferInsert> = {};
    if (body.time !== undefined) updateData.time = body.time;
    if (body.imamName !== undefined) updateData.imamName = body.imamName;
    if (body.khatibName !== undefined) updateData.khatibName = body.khatibName;
    if (body.khutbahTopic !== undefined) updateData.khutbahTopic = body.khutbahTopic;
    if (body.khutbahFileUrl !== undefined) updateData.khutbahFileUrl = body.khutbahFileUrl;
    if (body.isLocked !== undefined) updateData.isLocked = !!body.isLocked;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.day !== undefined) updateData.day = body.day;
    if (body.prayerTime !== undefined) updateData.prayerTime = body.prayerTime;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.prayerSchedules)
        .set(updateData)
        .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapPrayerScheduleRow(rows[0]));
  });

  app.delete('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Schedule not found');

    await db
      .delete(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  app.post('/api/:slug/prayer-schedules/sync-month', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    if (!tenant.latitude || !tenant.longitude) return bad(c, 'Lokasi masjid belum diatur.');
    const { year, month } = await c.req.json();
    const monthId = `${tenant.id}:${year}-${String(month).padStart(2, '0')}`;
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    try {
      const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${tenant.latitude}&longitude=${tenant.longitude}&method=20&month=${month}&year=${year}`);
      const data: any = await res.json();
      if (data.code !== 200) throw new Error('API Error');
      const prayerMap: Record<string, string> = { 'Fajr': 'fajr', 'Dhuhr': 'dhuhr', 'Asr': 'asr', 'Maghrib': 'maghrib', 'Isha': 'isha' };

      const existingRows = await db
        .select()
        .from(schema.monthlyPrayerSchedules)
        .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)))
        .limit(1);

      const existingState = existingRows.length > 0 ? (existingRows[0].days as Record<string, DailyPrayer>) : null;
      const days: Record<string, DailyPrayer> = existingState ? { ...existingState } : {};

      for (const dayData of data.data) {
        const [d, m, y] = dayData.date.gregorian.date.split('-');
        const isoDate = `${y}-${m}-${d}`;
        if (days[isoDate]?.isLocked) continue;
        const daily: any = days[isoDate] || {};
        for (const [apiName, internalName] of Object.entries(prayerMap)) {
          daily[internalName] = dayData.timings[apiName].split(' ')[0];
        }
        days[isoDate] = daily;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      if (existingRows.length > 0) {
        await db
          .update(schema.monthlyPrayerSchedules)
          .set({ days, updatedAt: nowSec })
          .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)));
      } else {
        await db.insert(schema.monthlyPrayerSchedules).values({
          id: monthId,
          tenantId: tenant.id,
          year: Number(year),
          month: Number(month),
          days,
          createdAt: nowSec,
          updatedAt: nowSec,
        });
      }

      return ok(c, { success: true, monthId });
    } catch (e) {
      return bad(c, 'Gagal sinkronisasi bulan ini.');
    }
  });
}
