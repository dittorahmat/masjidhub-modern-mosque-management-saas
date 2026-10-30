import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc, asc } from "drizzle-orm";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapBlogPostRow,
  mapPageSectionRow,
  getTenantBySlugOrSubdomain,
} from "../common";

const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function registerBlogRoutes(app: Hono<any>) {
  // --- SMART CMS & BLOG ---
  app.get('/api/:slug/blog', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.tenantId, tenant.id))
      .orderBy(desc(schema.blogPosts.createdAt));

    return ok(c, rows.map(mapBlogPostRow));
  });

  app.post('/api/:slug/blog', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const postId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const postSlug = body.slug || normalizeText(body.title || 'post-' + postId.slice(0, 8));

    await db.insert(schema.blogPosts).values({
      id: postId,
      tenantId: tenant.id,
      slug: postSlug,
      title: body.title || '',
      content: body.content || '',
      authorId: body.authorId || 'admin',
      category: body.category || 'umum',
      status: body.status || 'draft',
      createdAt: nowSec,
      updatedAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.blogPosts)
      .where(and(eq(schema.blogPosts.id, postId), eq(schema.blogPosts.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapBlogPostRow(rows[0]));
  });

  // --- PUZZLE PAGE BUILDER ---
  app.get('/api/:slug/page/sections', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.pageSections)
      .where(eq(schema.pageSections.tenantId, tenant.id))
      .orderBy(asc(schema.pageSections.order));

    return ok(c, rows.map(mapPageSectionRow));
  });

  app.post('/api/:slug/page/sections', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const sections = await c.req.json();
    if (!Array.isArray(sections)) return bad(c, 'Invalid format');
    for (const s of sections) {
      if (s.config?.color && !isValidHex(s.config.color)) return bad(c, 'Invalid color');
    }

    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    await db
      .delete(schema.pageSections)
      .where(eq(schema.pageSections.tenantId, tenant.id));

    const nowSec = Math.floor(Date.now() / 1000);
    for (let index = 0; index < sections.length; index++) {
      const s = sections[index];
      await db.insert(schema.pageSections).values({
        id: s.id || crypto.randomUUID(),
        tenantId: tenant.id,
        type: s.type || 'hero',
        order: index,
        config: s.config || {},
        isVisible: s.isVisible !== undefined ? !!s.isVisible : true,
        updatedAt: nowSec,
      });
    }

    const rows = await db
      .select()
      .from(schema.pageSections)
      .where(eq(schema.pageSections.tenantId, tenant.id))
      .orderBy(asc(schema.pageSections.order));

    return ok(c, rows.map(mapPageSectionRow));
  });
}
