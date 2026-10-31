import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import { ok, bad, notFound } from "../../core-utils";
import { resolveTenantContext } from "../../middleware/tenant";
import {
  ensureDbInitialized,
  mapNotificationRow,
  mapUstadzRow,
  mapChatRoomRow,
  mapChatMessageRow,
  mapMediaItemRow,
  mapTransactionRow,
  mapInventoryItemRow,
  mapEventRow,
  mapForumPostRow,
  mapZisTransactionRow,
  getTenantBySlugOrSubdomain,
} from "../common";

export function registerMiscRoutes(app: Hono<any>) {
  // Geo search
  app.get('/api/geo/search', async (c) => {
    const q = c.req.query('q');
    if (!q) return bad(c, 'Query required');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=id&limit=5`, {
        headers: { 'User-Agent': 'MasjidHub-SaaS' }
      });
      const data = await res.json();
      return ok(c, data);
    } catch (e) {
      return bad(c, 'Gagal mencari lokasi.');
    }
  });

  // Quran search
  app.get('/api/quran/search', async (c) => {
    const query = c.req.query('q');
    if (!query) return bad(c, 'Query required');
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&language=id`, {
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      return ok(c, data);
    } catch (e) {
      return bad(c, 'Quran API tidak dapat dijangkau');
    }
  });

  // --- NOTIFICATIONS ---
  app.get('/api/:slug/notifications', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.tenantId, tenant.id))
      .orderBy(desc(schema.notifications.createdAt));

    return ok(c, rows.map(mapNotificationRow));
  });

  app.get('/api/:slug/notifications/unread', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.tenantId, tenant.id), sql`${schema.notifications.readAt} IS NULL`))
      .orderBy(desc(schema.notifications.createdAt));

    return ok(c, rows.map(mapNotificationRow));
  });

  app.post('/api/:slug/notifications', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const notifId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.notifications).values({
      id: notifId,
      tenantId: tenant.id,
      userId: body.userId ?? null,
      title: body.title || '',
      message: body.message || '',
      type: body.type || 'info',
      isBroadcast: body.isBroadcast !== undefined ? !!body.isBroadcast : false,
      readAt: null,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.id, notifId), eq(schema.notifications.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapNotificationRow(rows[0]));
  });

  app.post('/api/:slug/notifications/:id/read', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Notification not found');

    const nowSec = Math.floor(Date.now() / 1000);
    await db
      .update(schema.notifications)
      .set({ readAt: nowSec })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.tenantId, tenant.id)));

    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapNotificationRow(rows[0]));
  });

  app.delete('/api/:slug/notifications/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Notification not found');

    await db
      .delete(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  // --- USTADZ DIRECTORY ---
  app.get('/api/:slug/ustadz', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.ustadzList)
      .where(and(eq(schema.ustadzList.tenantId, tenant.id), eq(schema.ustadzList.isActive, true)))
      .orderBy(asc(schema.ustadzList.name));

    return ok(c, rows.map(mapUstadzRow));
  });

  app.post('/api/:slug/ustadz', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const ustadzId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.ustadzList).values({
      id: ustadzId,
      tenantId: tenant.id,
      name: body.name || '',
      specialization: body.specialization || '',
      bio: body.bio ?? null,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.ustadzList)
      .where(and(eq(schema.ustadzList.id, ustadzId), eq(schema.ustadzList.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapUstadzRow(rows[0]));
  });

  app.put('/api/:slug/ustadz/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.ustadzList)
      .where(and(eq(schema.ustadzList.id, id), eq(schema.ustadzList.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Ustadz not found');

    const updateData: Partial<typeof schema.ustadzList.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.ustadzList)
        .set(updateData)
        .where(and(eq(schema.ustadzList.id, id), eq(schema.ustadzList.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.ustadzList)
      .where(and(eq(schema.ustadzList.id, id), eq(schema.ustadzList.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapUstadzRow(rows[0]));
  });

  app.delete('/api/:slug/ustadz/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.ustadzList)
      .where(and(eq(schema.ustadzList.id, id), eq(schema.ustadzList.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Ustadz not found');

    await db
      .update(schema.ustadzList)
      .set({ isActive: false })
      .where(and(eq(schema.ustadzList.id, id), eq(schema.ustadzList.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  // --- CHAT ROOMS & MESSAGES ---
  app.get('/api/:slug/chat-rooms', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.chatRooms)
      .where(eq(schema.chatRooms.tenantId, tenant.id))
      .orderBy(desc(schema.chatRooms.lastMessageAt), desc(schema.chatRooms.createdAt));

    return ok(c, rows.map(mapChatRoomRow));
  });

  app.post('/api/:slug/chat-rooms', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const roomId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.chatRooms).values({
      id: roomId,
      tenantId: tenant.id,
      name: body.name || '',
      participants: (body.participants as string[]) || [],
      createdAt: nowSec,
      lastMessageAt: nowSec,
      lastMessage: body.lastMessage ?? null,
    });

    const rows = await db
      .select()
      .from(schema.chatRooms)
      .where(and(eq(schema.chatRooms.id, roomId), eq(schema.chatRooms.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapChatRoomRow(rows[0]));
  });

  app.get('/api/:slug/chat-rooms/:roomId', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.chatRooms)
      .where(and(eq(schema.chatRooms.id, roomId), eq(schema.chatRooms.tenantId, tenant.id)))
      .limit(1);

    if (rows.length === 0) return notFound(c, 'Chat room not found');

    return ok(c, mapChatRoomRow(rows[0]));
  });

  app.get('/api/:slug/chat-rooms/:roomId/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const roomRows = await db
      .select()
      .from(schema.chatRooms)
      .where(and(eq(schema.chatRooms.id, roomId), eq(schema.chatRooms.tenantId, tenant.id)))
      .limit(1);

    if (roomRows.length === 0) return notFound(c, 'Chat room not found');

    const msgRows = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.chatRoomId, roomId))
      .orderBy(asc(schema.chatMessages.timestamp));

    return ok(c, msgRows.map(mapChatMessageRow));
  });

  app.post('/api/:slug/chat-rooms/:roomId/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const roomId = c.req.param('roomId');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const roomRows = await db
      .select()
      .from(schema.chatRooms)
      .where(and(eq(schema.chatRooms.id, roomId), eq(schema.chatRooms.tenantId, tenant.id)))
      .limit(1);

    if (roomRows.length === 0) return notFound(c, 'Chat room not found');

    const msgId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const msgText = body.message || '';

    await db.insert(schema.chatMessages).values({
      id: msgId,
      chatRoomId: roomId,
      senderId: body.senderId || 'anon',
      senderName: body.senderName || 'Jamaah',
      message: msgText,
      timestamp: nowSec,
      readBy: body.readBy ?? null,
    });

    const truncated = msgText.length > 50 ? msgText.substring(0, 50) + '...' : msgText;
    await db
      .update(schema.chatRooms)
      .set({
        lastMessageAt: nowSec,
        lastMessage: truncated,
      })
      .where(and(eq(schema.chatRooms.id, roomId), eq(schema.chatRooms.tenantId, tenant.id)));

    const createdRows = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.id, msgId))
      .limit(1);

    return ok(c, mapChatMessageRow(createdRows[0]));
  });

  // --- MEDIA, QR-CODE & SEARCH ---
  app.get('/api/:slug/media', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.mediaItems)
      .where(eq(schema.mediaItems.tenantId, tenant.id))
      .orderBy(desc(schema.mediaItems.createdAt));

    return ok(c, rows.map(mapMediaItemRow));
  });

  app.get('/api/:slug/qr-code', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');

    const qrData = `masjidhub://${tenant.slug}`;
    return ok(c, {
      slug: tenant.slug,
      name: tenant.name,
      qrData,
      url: `https://masjidhub.com/portal/${tenant.slug}`,
    });
  });

  app.get('/api/:slug/search', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');
    const rawQ = c.req.query('q') || "";
    const searchPattern = `%${rawQ}%`;

    // Deep database query with SQL LIKE and LIMIT 20 bounds
    const [txRows, invRows, evRows, postRows, zisRows] = await Promise.all([
      ctx.db.select().from(schema.transactions)
        .where(and(eq(schema.transactions.tenantId, ctx.tenant.id), like(schema.transactions.description, searchPattern)))
        .limit(20),
      ctx.db.select().from(schema.inventoryItems)
        .where(and(eq(schema.inventoryItems.tenantId, ctx.tenant.id), or(like(schema.inventoryItems.name, searchPattern), like(schema.inventoryItems.location, searchPattern))))
        .limit(20),
      ctx.db.select().from(schema.events)
        .where(and(eq(schema.events.tenantId, ctx.tenant.id), or(like(schema.events.title, searchPattern), like(schema.events.description, searchPattern))))
        .limit(20),
      ctx.db.select().from(schema.forumPosts)
        .where(and(eq(schema.forumPosts.tenantId, ctx.tenant.id), or(like(schema.forumPosts.title, searchPattern), like(schema.forumPosts.content, searchPattern))))
        .limit(20),
      ctx.db.select().from(schema.zisTransactions)
        .where(and(eq(schema.zisTransactions.tenantId, ctx.tenant.id), or(like(schema.zisTransactions.description, searchPattern), like(schema.zisTransactions.muzakkiName, searchPattern))))
        .limit(20),
    ]);

    return ok(c, {
      transactions: txRows.map(mapTransactionRow),
      inventory: invRows.map(mapInventoryItemRow),
      events: evRows.map(mapEventRow),
      forum: postRows.map(mapForumPostRow),
      zis: zisRows.map(mapZisTransactionRow),
    });
  });
}
