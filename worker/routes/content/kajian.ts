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
import { resolveTenantContext } from "../../middleware/tenant";
import { getAIProvider } from "../../ai/provider";
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from "../../../shared/youtube";
import { ParseKajianUrlRequest, ParsedKajianMetadata } from "../../../shared/types";

export { extractYoutubeVideoId };

import { parseYoutubeKajianMetadata } from "./kajian-ai";

export function registerKajianRoutes(app: Hono<any>) {
  // POST parse YouTube video metadata for auto-fill
  app.post('/api/:slug/kajian-videos/parse-url', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');

    let body: ParseKajianUrlRequest;
    try {
      body = await c.req.json();
    } catch {
      return bad(c, 'Payload JSON tidak valid');
    }

    if (!body || typeof body.url !== 'string' || !body.url.trim()) {
      return bad(c, 'URL YouTube wajib diisi');
    }

    const videoId = extractYoutubeVideoId(body.url.trim());
    if (!videoId) {
      return bad(c, 'URL atau ID YouTube tidak valid');
    }

    const aiProvider = c.env.GEMINI_API_KEY ? getAIProvider(c.env) : undefined;
    const metadata = await parseYoutubeKajianMetadata(videoId, aiProvider);

    const responseData: ParsedKajianMetadata = {
      videoId,
      ...metadata,
    };

    return ok(c, responseData);
  });

  // GET all kajian videos for a tenant
  app.get('/api/:slug/kajian-videos', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');

    const rows = await ctx.db
      .select()
      .from(schema.kajianVideos)
      .where(eq(schema.kajianVideos.tenantId, ctx.tenant.id))
      .orderBy(desc(schema.kajianVideos.createdAt));

    return ok(c, rows.map(mapKajianVideoRow));
  });

  // POST create new kajian video
  app.post('/api/:slug/kajian-videos', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return bad(c, 'Payload JSON tidak valid');
    }

    const {
      title,
      ustadzName,
      youtubeUrl,
      description,
      duration,
      category,
      thumbnailUrl,
      publishedAt
    } = body;

    if (!title || !youtubeUrl) {
      return bad(c, 'Judul dan URL YouTube wajib diisi');
    }

    const videoId = extractYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      return bad(c, 'URL YouTube tidak valid');
    }

    const id = crypto.randomUUID();
    const finalThumbnailUrl = thumbnailUrl || getYoutubeThumbnailUrl(videoId);
    const publishedAtMs = publishedAt ? toTimestampMs(publishedAt) : null;

    await ctx.db.insert(schema.kajianVideos).values({
      id,
      tenantId: ctx.tenant.id,
      title: title.trim(),
      ustadzName: ustadzName?.trim() || null,
      youtubeUrl: youtubeUrl.trim(),
      youtubeVideoId: videoId,
      description: description?.trim() || null,
      duration: duration?.trim() || null,
      category: category?.trim() || null,
      thumbnailUrl: finalThumbnailUrl,
      publishedAt: publishedAtMs,
      createdAt: Date.now(),
    });

    const inserted = await ctx.db
      .select()
      .from(schema.kajianVideos)
      .where(eq(schema.kajianVideos.id, id))
      .limit(1);

    return ok(c, mapKajianVideoRow(inserted[0]));
  });

  // DELETE kajian video
  app.delete('/api/:slug/kajian-videos/:id', async (c) => {
    const ctx = await resolveTenantContext(c);
    if (!ctx) return notFound(c, 'Tenant not found');

    const id = c.req.param('id');
    if (!id) return bad(c, 'ID video wajib diisi');

    await ctx.db
      .delete(schema.kajianVideos)
      .where(eq(schema.kajianVideos.id, id));

    return ok(c, { id });
  });
}
