import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc } from "drizzle-orm";
import { ok, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapForumPostRow,
  getTenantBySlugOrSubdomain,
} from "../common";

export function registerForumRoutes(app: Hono<any>) {
  // --- FORUM ---
  app.get('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.forumPosts)
      .where(eq(schema.forumPosts.tenantId, tenant.id))
      .orderBy(desc(schema.forumPosts.isPinned), desc(schema.forumPosts.createdAt));

    return ok(c, rows.map(mapForumPostRow));
  });

  app.post('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const postId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.forumPosts).values({
      id: postId,
      tenantId: tenant.id,
      authorId: body.authorId || 'anon',
      authorName: body.authorName || 'Jamaah',
      category: body.category || 'diskusi',
      title: body.title || '',
      content: body.content || '',
      isPinned: !!body.isPinned,
      isBanned: !!body.isBanned,
      likeCount: Number(body.likeCount || 0),
      commentCount: Number(body.commentCount || 0),
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, postId), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapForumPostRow(rows[0]));
  });

  app.delete('/api/:slug/forum/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Post not found');

    await db
      .delete(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  app.post('/api/:slug/forum/:id/pin', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Post not found');

    await db
      .update(schema.forumPosts)
      .set({ isPinned: true })
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)));

    const rows = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapForumPostRow(rows[0]));
  });

  app.post('/api/:slug/forum/:id/unpin', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Post not found');

    await db
      .update(schema.forumPosts)
      .set({ isPinned: false })
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)));

    const rows = await db
      .select()
      .from(schema.forumPosts)
      .where(and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapForumPostRow(rows[0]));
  });
}
