import { Hono } from "hono";
import { getDb, schema } from "../db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { streamText } from "hono/streaming";
import { ok, bad, notFound } from "../core-utils";
import {
  ensureDbInitialized,
  mapChatSessionRow,
  mapAIChatMessageRow,
  mapMediaItemRow,
  mapKnowledgeSnippetRow,
  mapBlogPostRow,
  mapPageSectionRow,
  mapForumPostRow,
  mapOrganizationMemberRow,
  mapNotificationRow,
  mapUstadzRow,
  mapChatRoomRow,
  mapChatMessageRow,
  mapTransactionRow,
  mapInventoryItemRow,
  mapEventRow,
  mapZisTransactionRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "./common";
import { streamChatResponse } from "../ai-logic";
import { generateShadowId, generateSessionSalt } from "../crypto-utils";
import { getStorage } from "../storage";

const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

export function registerContentRoutes(app: Hono<any>) {
  // Config Cloudinary
  app.get('/api/config/cloudinary', (c) => {
    return ok(c, {
      cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub',
      uploadPreset: c.env.CLOUDINARY_UPLOAD_PRESET || 'masjidhub_preset'
    });
  });

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

  // --- AI CHAT ENGAGEMENT ---
  app.post('/api/:slug/chat/init', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const { userId, isAnonymous } = await c.req.json();
    const sessionId = crypto.randomUUID();
    const sessionSalt = generateSessionSalt();
    let finalUserId = userId || 'guest';
    if (isAnonymous) {
      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret_key';
      finalUserId = await generateShadowId(secret, `${finalUserId}:${tenant.id}:${sessionSalt}`);
    }
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.chatSessions).values({
      id: sessionId,
      tenantId: tenant.id,
      userId: finalUserId,
      isAnonymous: !!isAnonymous,
      sessionSalt,
      status: 'active',
      createdAt: nowSec,
      lastActivityAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.chatSessions)
      .where(and(eq(schema.chatSessions.id, sessionId), eq(schema.chatSessions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapChatSessionRow(rows[0]));
  });

  app.post('/api/:slug/chat/send', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { message, sessionId, history } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) return bad(c, 'AI configuration missing');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const userMsgId = crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.aiChatMessages).values({
      id: userMsgId,
      sessionId,
      tenantId: tenant.id,
      senderRole: 'user',
      text: message,
      timestamp: nowSec,
    });

    const snippetsRows = await db
      .select()
      .from(schema.knowledgeSnippets)
      .where(eq(schema.knowledgeSnippets.tenantId, tenant.id))
      .orderBy(desc(schema.knowledgeSnippets.priority), desc(schema.knowledgeSnippets.createdAt));

    const tenantSnippets = snippetsRows.map(s => s.content);
    const trustedDomains = snippetsRows
      .filter(s => s.content.toUpperCase().startsWith("REFERENSI:"))
      .map(s => s.content.split(":")[1]?.trim())
      .flatMap(d => d ? d.split(",").map(i => i.trim()) : [])
      .filter(Boolean);

    await db
      .update(schema.chatSessions)
      .set({ lastActivityAt: Math.floor(Date.now() / 1000) })
      .where(and(eq(schema.chatSessions.id, sessionId), eq(schema.chatSessions.tenantId, tenant.id)));

    return streamText(c, async (stream) => {
      let accumulatedText = "";
      const responseStream = streamChatResponse(
        apiKey,
        message,
        {
          mosqueName: tenant.name,
          snippets: tenantSnippets,
          fileUris: [],
          persona: tenant.selectedPersona || 'marbot_muda',
          trustedDomains,
        },
        history
      );
      for await (const chunk of responseStream) {
        accumulatedText += chunk;
        await stream.write(chunk);
      }
      await db.insert(schema.aiChatMessages).values({
        id: crypto.randomUUID(),
        sessionId,
        tenantId: tenant.id,
        senderRole: 'ai',
        text: accumulatedText,
        timestamp: Math.floor(Date.now() / 1000),
      });
    });
  });

  // --- AI KNOWLEDGE MANAGEMENT ---
  app.get('/api/:slug/knowledge/files', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.mediaItems)
      .where(and(eq(schema.mediaItems.tenantId, tenant.id), eq(schema.mediaItems.fileType, 'application/pdf')))
      .orderBy(desc(schema.mediaItems.createdAt));

    return ok(c, rows.map(mapMediaItemRow));
  });

  app.post('/api/:slug/knowledge/upload', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    if (!file || file.type !== 'application/pdf') return bad(c, 'Only PDF allowed');
    if (file.size > 50 * 1024 * 1024) return bad(c, 'File too large');

    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const mediaId = crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    let storageUrl = "";
    let r2Key: string | null = null;
    try {
      const storage = getStorage(c.env);
      const buffer = await file.arrayBuffer();
      r2Key = `knowledge/${tenant.id}/${mediaId}-${file.name}`;
      const uploadRes = await storage.put(r2Key, buffer, { contentType: file.type });
      storageUrl = uploadRes.url;
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }

    await db.insert(schema.mediaItems).values({
      id: mediaId,
      tenantId: tenant.id,
      cloudinaryUrl: storageUrl,
      r2Key,
      fileName: file.name,
      fileType: file.type,
      eventTag: 'knowledge_base',
      isWatermarked: false,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.mediaItems)
      .where(and(eq(schema.mediaItems.id, mediaId), eq(schema.mediaItems.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapMediaItemRow(rows[0]));
  });

  app.get('/api/:slug/knowledge/snippets', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.knowledgeSnippets)
      .where(eq(schema.knowledgeSnippets.tenantId, tenant.id))
      .orderBy(desc(schema.knowledgeSnippets.createdAt));

    return ok(c, rows.map(mapKnowledgeSnippetRow));
  });

  app.post('/api/:slug/knowledge/snippets', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    if (body.content?.length > 2000) return bad(c, 'Snippet too long');

    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const snippetId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const expVal = body.expirationDate ? toEpochSeconds(body.expirationDate) : null;

    await db.insert(schema.knowledgeSnippets).values({
      id: snippetId,
      tenantId: tenant.id,
      content: body.content,
      priority: Number(body.priority || 0),
      expirationDate: expVal,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.knowledgeSnippets)
      .where(and(eq(schema.knowledgeSnippets.id, snippetId), eq(schema.knowledgeSnippets.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapKnowledgeSnippetRow(rows[0]));
  });

  // --- AI CHAT MANAGEMENT ---
  app.get('/api/:slug/chat/sessions', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.chatSessions)
      .where(eq(schema.chatSessions.tenantId, tenant.id))
      .orderBy(desc(schema.chatSessions.lastActivityAt));

    return ok(c, rows.map(mapChatSessionRow));
  });

  app.get('/api/:slug/chat/sessions/:id/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const sessionId = c.req.param('id');

    const rows = await db
      .select()
      .from(schema.aiChatMessages)
      .where(and(eq(schema.aiChatMessages.sessionId, sessionId), eq(schema.aiChatMessages.tenantId, tenant.id)))
      .orderBy(asc(schema.aiChatMessages.timestamp))
      .limit(100);

    return ok(c, rows.map(mapAIChatMessageRow));
  });

  app.post('/api/:slug/chat/sessions/:id/reply', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { text } = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const sessionId = c.req.param('id');
    const msgId = crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.aiChatMessages).values({
      id: msgId,
      sessionId,
      tenantId: tenant.id,
      senderRole: 'admin',
      text,
      timestamp: nowSec,
    });

    await db
      .update(schema.chatSessions)
      .set({ lastActivityAt: nowSec })
      .where(and(eq(schema.chatSessions.id, sessionId), eq(schema.chatSessions.tenantId, tenant.id)));

    const rows = await db
      .select()
      .from(schema.aiChatMessages)
      .where(and(eq(schema.aiChatMessages.id, msgId), eq(schema.aiChatMessages.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapAIChatMessageRow(rows[0]));
  });

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

  // --- ORGANIZATION MEMBERS ---
  app.get('/api/:slug/organization', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.tenantId, tenant.id))
      .orderBy(asc(schema.organizationMembers.order));

    return ok(c, rows.map(mapOrganizationMemberRow));
  });

  app.post('/api/:slug/organization', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const memberId = body.id || crypto.randomUUID();

    await db.insert(schema.organizationMembers).values({
      id: memberId,
      tenantId: tenant.id,
      name: body.name || '',
      role: body.role || '',
      imageUrl: body.imageUrl ?? null,
      order: Number(body.order || 0),
      bio: body.bio ?? null,
      socialLinks: body.socialLinks ?? null,
    });

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, memberId), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapOrganizationMemberRow(rows[0]));
  });

  app.put('/api/:slug/organization/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Member not found');

    const updateData: Partial<typeof schema.organizationMembers.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.organizationMembers)
        .set(updateData)
        .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapOrganizationMemberRow(rows[0]));
  });

  app.delete('/api/:slug/organization/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Member not found');

    await db
      .delete(schema.organizationMembers)
      .where(and(eq(schema.organizationMembers.id, id), eq(schema.organizationMembers.tenantId, tenant.id)));

    return ok(c, { success: true });
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
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const q = c.req.query('q')?.toLowerCase() || "";
    const [txRows, invRows, evRows, postRows, zisRows] = await Promise.all([
      db.select().from(schema.transactions).where(eq(schema.transactions.tenantId, tenant.id)),
      db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.tenantId, tenant.id)),
      db.select().from(schema.events).where(eq(schema.events.tenantId, tenant.id)),
      db.select().from(schema.forumPosts).where(eq(schema.forumPosts.tenantId, tenant.id)),
      db.select().from(schema.zisTransactions).where(eq(schema.zisTransactions.tenantId, tenant.id)),
    ]);
    const mappedTxs = txRows.map(mapTransactionRow);
    const mappedInv = invRows.map(mapInventoryItemRow);
    const mappedEvs = evRows.map(mapEventRow);
    const mappedPosts = postRows.map(mapForumPostRow);
    const mappedZis = zisRows.map(mapZisTransactionRow);
    return ok(c, {
      transactions: mappedTxs.filter(t => t.description.toLowerCase().includes(q)),
      inventory: mappedInv.filter(i => i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)),
      events: mappedEvs.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
      forum: mappedPosts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)),
      zis: mappedZis.filter(z => z.description.toLowerCase().includes(q) || (z.muzakki_name && z.muzakki_name.toLowerCase().includes(q))),
    });
  });

  // --- STORAGE & FILE UPLOAD ---
  app.post('/api/upload', async (c) => {
    try {
      const storage = getStorage(c.env);
      const contentTypeHeader = c.req.header('content-type') || '';

      if (contentTypeHeader.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        const file = (formData.get('file') || formData.get('media')) as unknown as File | null;
        if (!file || !(file instanceof File)) {
          return bad(c, 'No file found in multipart form-data. Key should be "file" or "media".');
        }

        const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
        const randomId = crypto.randomUUID();
        const key = 'uploads/' + randomId + ext;
        const buffer = await file.arrayBuffer();

        const result = await storage.put(key, buffer, { contentType: file.type || 'application/octet-stream' });
        return ok(c, {
          key: result.key,
          url: result.url,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          size: file.size,
        });
      }

      // Handle raw binary file upload
      const arrayBuffer = await c.req.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return bad(c, 'Upload payload is empty');
      }

      const customKey = c.req.query('key');
      const filename = c.req.header('x-filename') || 'file.bin';
      const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
      const key = customKey || ('uploads/' + crypto.randomUUID() + ext);
      const contentType = c.req.header('content-type') || 'application/octet-stream';

      const result = await storage.put(key, arrayBuffer, { contentType });
      return ok(c, {
        key: result.key,
        url: result.url,
        fileName: filename,
        fileType: contentType,
        size: arrayBuffer.byteLength,
      });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      return bad(c, err?.message || 'Failed to upload file');
    }
  });

  // Global storage serving handler
  const handleStorageGet = async (c: any) => {
    const fullPath = c.req.path;
    // Strip either /api/storage/ or /api/:slug/storage/
    const key = decodeURIComponent(fullPath.replace(/^\/api(\/[^/]+)?\/storage\//, ''));
    if (!key) return notFound(c, 'Storage key required');

    const storage = getStorage(c.env);
    const item = await storage.get(key);
    if (!item) {
      return notFound(c, 'File not found');
    }

    const headers: Record<string, string> = {
      'Cache-Control': 'public, max-age=31536000, immutable',
    };
    if (item.contentType) {
      headers['Content-Type'] = item.contentType;
    }

    return new Response(item.data as any, {
      status: 200,
      headers,
    });
  };

  app.get('/api/storage/*', handleStorageGet);
  app.get('/api/:slug/storage/*', handleStorageGet);
}
