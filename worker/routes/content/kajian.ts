import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, desc } from "drizzle-orm";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapKajianVideoRow,
  getTenantBySlugOrSubdomain,
  toTimestampMs,
} from "../common";
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "../../../shared/youtube";

export { extractYoutubeVideoId };

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
    const thumbnailUrl = body.thumbnailUrl?.trim() || getYoutubeThumbnailUrl(videoId);

    // Standardize to epoch milliseconds (Date.now()) per AGENTS.md §2
    let publishedAtMs: number | null = null;
    if (body.publishedAt) {
      const pubNum = typeof body.publishedAt === 'string' ? new Date(body.publishedAt).getTime() : Number(body.publishedAt);
      if (!isNaN(pubNum)) {
        publishedAtMs = toTimestampMs(pubNum);
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
      publishedAt: publishedAtMs,
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
