import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and } from "drizzle-orm";
import type { DailyPrayer, PrayerSchedule } from "@shared/types";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapPrayerScheduleRow,
  getTenantBySlugOrSubdomain,
} from "../common";

export function registerPrayerRoutes(app: Hono<any>) {
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
