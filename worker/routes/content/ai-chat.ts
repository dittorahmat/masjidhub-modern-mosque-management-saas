import { Hono } from "hono";
import { getDb, schema } from "../../db";
import { eq, and, desc, asc } from "drizzle-orm";
import { streamText } from "hono/streaming";
import { ok, bad, notFound } from "../../core-utils";
import {
  ensureDbInitialized,
  mapChatSessionRow,
  mapAIChatMessageRow,
  mapMediaItemRow,
  mapKnowledgeSnippetRow,
  getTenantBySlugOrSubdomain,
  toEpochSeconds
} from "../common";
import { streamChatResponse } from "../../ai-logic";
import { generateShadowId, generateSessionSalt } from "../../crypto-utils";
import { getStorage } from "../../storage";

export function registerAIChatRoutes(app: Hono<any>) {
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
}
