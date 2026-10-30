import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, desc } from "drizzle-orm";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapKajianVideoRow,
  getTenantBySlugOrSubdomain,
} from "../common";

export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  // Patterns supported:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - VIDEO_ID directly (11 chars)
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function registerKajianRoutes(app: Hono<any>) {
  // GET all kajian videos for a tenant
  app.get('/api/:slug/kajian-videos', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.kajianVideos)
      .where(eq(schema.kajianVideos.tenantId, tenant.id))
      .orderBy(desc(schema.kajianVideos.createdAt));

    return ok(c, rows.map(mapKajianVideoRow));
  });

  // POST create new kajian video
  app.post('/api/:slug/kajian-videos', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    if (!body.title || !body.title.trim()) {
      return bad(c, 'Judul kajian wajib diisi');
    }

    if (!body.youtubeUrl || !body.youtubeUrl.trim()) {
      return bad(c, 'URL YouTube wajib diisi');
    }

    const videoId = body.youtubeVideoId?.trim() || extractYoutubeVideoId(body.youtubeUrl);
    if (!videoId) {
      return bad(c, 'URL atau ID YouTube tidak valid');
    }

    const videoIdRecord = body.id || crypto.randomUUID();
    const thumbnailUrl = body.thumbnailUrl?.trim() || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Handle publishedAt if provided (number or ISO string)
    let publishedAtSec: number | null = null;
    if (body.publishedAt) {
      const pubNum = typeof body.publishedAt === 'string' ? new Date(body.publishedAt).getTime() : Number(body.publishedAt);
      if (!isNaN(pubNum)) {
        // Store as unix seconds or epoch ms safely normalized
        publishedAtSec = pubNum > 1e11 ? Math.floor(pubNum / 1000) : pubNum;
      }
    }

    await db.insert(schema.kajianVideos).values({
      id: videoIdRecord,
      tenantId: tenant.id,
      title: body.title.trim(),
      ustadzName: body.ustadzName?.trim() || null,
      youtubeUrl: body.youtubeUrl.trim(),
      youtubeVideoId: videoId,
      description: body.description?.trim() || null,
      duration: body.duration?.trim() || null,
      category: body.category?.trim() || 'kajian_rutin',
      thumbnailUrl,
      publishedAt: publishedAtSec,
    });

    const [created] = await db
      .select()
      .from(schema.kajianVideos)
      .where(eq(schema.kajianVideos.id, videoIdRecord))
      .limit(1);

    return ok(c, mapKajianVideoRow(created));
  });

  // DELETE a kajian video
  app.delete('/api/:slug/kajian-videos/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const videoId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    await db
      .delete(schema.kajianVideos)
      .where(eq(schema.kajianVideos.id, videoId));

    return ok(c, { deleted: true, id: videoId });
  });
}
