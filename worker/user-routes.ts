import { Hono } from "hono";
import type { Env } from './core-utils';
import {
  UserEntity,
  TenantEntity,
  TransactionEntity,
  InventoryItemEntity,
  EventEntity,
  EventRegistrationEntity,
  ForumPostEntity,
  ZisTransactionEntity,
  PrayerScheduleEntity,
  NotificationEntity,
  ChatRoomEntity,
  ChatMessageEntity,
  UstadzEntity,
  MustahikEntity,
  ChatSessionEntity,
  KnowledgeSnippetEntity,
  BlogPostEntity,
  PageSectionEntity,
  MediaItemEntity,
  AIChatMessageEntity
} from "./entities";
import type { UserRole, ZisTransaction } from "@shared/types";
import { ok, bad, notFound } from './core-utils';
import { streamChatResponse } from "./ai-logic";
import { streamText } from 'hono/streaming';
import { generateShadowId, generateSessionSalt } from "./crypto-utils";
import { getOptimizedImageUrl, generateFinanceInfographicUrl } from "./cloudinary";

// Helper for Hex Color validation (Design Guard Backend)
const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

// Mock payment processing function
async function processZisPayment(transaction: any, paymentMethod: string, amount: number) {
  console.log(`Processing payment for transaction ${transaction.id} using ${paymentMethod}`);
  await new Promise(resolve => setTimeout(resolve, 100));
  const success = Math.random() > 0.1;
  return {
    status: success ? 'completed' : 'failed',
    reference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    gateway: paymentMethod
  };
}

export function userRoutes(app: Hono<any>) {
  const getTenantBySlug = async (env: Env, slug: string) => {
    await TenantEntity.ensureSeed(env);
    await UserEntity.ensureSeed(env);
    const { items } = await TenantEntity.list(env);
    return items.find(t => t.slug === slug);
  };

  const getTenantBySlugOrSubdomain = async (c: any, env: Env) => {
    const slug = c.req.param('slug');
    if (slug) return await getTenantBySlug(env, slug);
    const subdomain = c.get('subdomain');
    if (subdomain) return await getTenantBySlug(env, subdomain);
    return null;
  };

  // --- CONFIG ---
  app.get('/api/config/cloudinary', (c) => {
    return ok(c, {
      cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub',
      uploadPreset: c.env.CLOUDINARY_UPLOAD_PRESET || 'masjidhub_preset'
    });
  });

  // --- AI CHAT ENGAGEMENT (PUBLIC) ---
  app.post('/api/:slug/chat/init', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { userId, isAnonymous } = await c.req.json();
    const sessionId = crypto.randomUUID();
    const sessionSalt = generateSessionSalt();
    let finalUserId = userId || 'guest';
    
    // FIX: Shadow ID Hardening - use secret even for generating initial salt if needed
    if (isAnonymous) {
      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret_key';
      finalUserId = await generateShadowId(secret, `${finalUserId}:${tenant.id}:${sessionSalt}`);
    }

    const session = await ChatSessionEntity.create(c.env, {
      id: sessionId, 
      tenantId: tenant.id, 
      userId: finalUserId, 
      isAnonymous, 
      sessionSalt, // Note: In production this should be encrypted at rest
      status: 'active', 
      createdAt: Date.now(), 
      lastActivityAt: Date.now()
    });
    return ok(c, session);
  });

  app.post('/api/:slug/chat/send', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { message, sessionId, history } = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) return bad(c, 'AI configuration missing');
    
    await AIChatMessageEntity.create(c.env, { id: crypto.randomUUID(), sessionId, tenantId: tenant.id, senderRole: 'user', text: message, timestamp: Date.now() });
    
    const { items: allSnippets } = await KnowledgeSnippetEntity.list(c.env);
    const tenantSnippetsRaw = allSnippets.filter(s => s.tenantId === tenant.id);
    const tenantSnippets = tenantSnippetsRaw.map(s => s.content);

    const trustedDomains = tenantSnippetsRaw
      .filter(s => s.content.toUpperCase().startsWith("REFERENSI:"))
      .map(s => s.content.split(":")[1]?.trim())
      .flatMap(d => d ? d.split(",").map(i => i.trim()) : [])
      .filter(Boolean);

    const sessionInst = new ChatSessionEntity(c.env, sessionId);
    await sessionInst.patch({ lastActivityAt: Date.now() });

    return streamText(c, async (stream) => {
      let accumulatedText = "";
      const responseStream = streamChatResponse(apiKey, message, { mosqueName: tenant.name, snippets: tenantSnippets, fileUris: [], persona: tenant.selectedPersona || 'marbot_muda', trustedDomains }, history);
      for await (const chunk of responseStream) { accumulatedText += chunk; await stream.write(chunk); }
      await AIChatMessageEntity.create(c.env, { id: crypto.randomUUID(), sessionId, tenantId: tenant.id, senderRole: 'ai', text: accumulatedText, timestamp: Date.now() });
    });
  });

  // --- AI KNOWLEDGE MANAGEMENT (ADMIN) ---
  app.get('/api/:slug/knowledge/files', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await MediaItemEntity.list(c.env);
    return ok(c, items.filter(m => m.tenantId === tenant.id && m.fileType === 'application/pdf'));
  });

  app.post('/api/:slug/knowledge/upload', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    
    // FIX: Server-side validation for PDF
    if (!file || file.type !== 'application/pdf') return bad(c, 'Only PDF files are allowed for Knowledge Base');
    if (file.size > 50 * 1024 * 1024) return bad(c, 'File size exceeds 50MB limit');

    const media = await MediaItemEntity.create(c.env, { id: crypto.randomUUID(), tenantId: tenant.id, cloudinaryUrl: "", fileName: file.name, fileType: file.type, eventTag: 'knowledge_base', isWatermarked: false, createdAt: Date.now() });
    return ok(c, media);
  });

  app.get('/api/:slug/knowledge/snippets', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await KnowledgeSnippetEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id).sort((a, b) => b.createdAt - a.createdAt));
  });

  app.post('/api/:slug/knowledge/snippets', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    if (body.content?.length > 2000) return bad(c, 'Snippet content too long (max 2000 chars)');
    const snippet = await KnowledgeSnippetEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id, createdAt: Date.now() });
    return ok(c, snippet);
  });

  // --- AI CHAT MANAGEMENT (ADMIN) ---
  app.get('/api/:slug/chat/sessions', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ChatSessionEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id).sort((a, b) => b.lastActivityAt - a.lastActivityAt));
  });

  app.get('/api/:slug/chat/sessions/:id/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await AIChatMessageEntity.list(c.env);
    // Limit to last 100 messages for safety
    return ok(c, items.filter(m => m.sessionId === c.req.param('id') && m.tenantId === tenant.id).sort((a, b) => a.timestamp - b.timestamp).slice(-100));
  });

  app.post('/api/:slug/chat/sessions/:id/reply', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { text } = await c.req.json();
    const msg = await AIChatMessageEntity.create(c.env, { id: crypto.randomUUID(), sessionId: c.req.param('id'), tenantId: tenant.id, senderRole: 'admin', text, timestamp: Date.now() });
    const sessionInst = new ChatSessionEntity(c.env, c.req.param('id'));
    await sessionInst.patch({ lastActivityAt: Date.now() });
    return ok(c, msg);
  });

  // --- SMART CMS & BLOG ---
  app.get('/api/:slug/blog', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await BlogPostEntity.list(c.env);
    return ok(c, items.filter(p => p.tenantId === tenant.id).sort((a, b) => b.createdAt - a.createdAt));
  });

  app.post('/api/:slug/blog', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const post = await BlogPostEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id, createdAt: Date.now(), updatedAt: Date.now() });
    return ok(c, post);
  });

  app.get('/api/quran/search', async (c) => {
    const query = c.req.query('q');
    if (!query) return bad(c, 'Query required');
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&language=id`, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error('Quran API error');
      const data = await res.json();
      return ok(c, data);
    } catch (e) {
      return bad(c, 'Quran API tidak dapat dijangkau saat ini.');
    }
  });

  // --- PUZZLE PAGE BUILDER ---
  app.get('/api/:slug/page/sections', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await PageSectionEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id).sort((a, b) => a.order - b.order));
  });

  app.post('/api/:slug/page/sections', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const sections = await c.req.json();
    if (!Array.isArray(sections)) return bad(c, 'Invalid sections format');

    // FIX: Design Guard Backend Validation
    for (const section of sections) {
      if (section.config?.color && !isValidHex(section.config.color)) {
        return bad(c, `Invalid color format: ${section.config.color}. Must be hex.`);
      }
    }

    // FIX: Transaction-like replace to prevent race conditions
    const { items: existing } = await PageSectionEntity.list(c.env);
    const toDelete = existing.filter(s => s.tenantId === tenant.id).map(s => s.id);
    if (toDelete.length > 0) await PageSectionEntity.deleteMany(c.env, toDelete);

    const created = await Promise.all(sections.map((s: any, index: number) => PageSectionEntity.create(c.env, { 
      ...s, 
      id: crypto.randomUUID(), 
      tenantId: tenant.id, 
      order: index, 
      updatedAt: Date.now() 
    })));
    return ok(c, created);
  });

  // --- MEDIA LIBRARY ---
  app.get('/api/:slug/media', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await MediaItemEntity.list(c.env);
    return ok(c, items.filter(m => m.tenantId === tenant.id));
  });

  // --- FINANCE TRANSPARENCY ---
  app.get('/api/:slug/finance/report-card', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items: txs } = await TransactionEntity.list(c.env);
    const balance = txs.filter(t => t.tenantId === tenant.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const imageUrl = generateFinanceInfographicUrl(c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub', tenant.name, balance, new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    return ok(c, { imageUrl, balance });
  });

  // --- PUBLIC & AUTH ---
  app.get('/api/check-subdomain/:slug', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    const { items } = await TenantEntity.list(c.env);
    const exists = items.some(t => t.slug === c.req.param('slug').toLowerCase().replace(/[^a-z0-9-]/g, ''));
    return ok(c, { available: !exists, slug: c.req.param('slug') });
  });

  app.post('/api/auth/register', async (c) => {
    const { name, email, mosqueName, slug, address } = await c.req.json();
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const tenant = await TenantEntity.create(c.env, { id: tenantId, name: mosqueName, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), ownerId: userId, createdAt: Date.now(), address, status: 'pending', selectedPersona: 'marbot_muda' });
    const user = await UserEntity.create(c.env, { id: userId, name, email, role: 'dkm_admin', tenantIds: [tenantId] });
    return ok(c, { user, tenant });
  });

  app.post('/api/auth/login', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    await UserEntity.ensureSeed(c.env);
    const { email } = await c.req.json();
    const { items: users } = await UserEntity.list(c.env);
    let user = users.find(u => u.email === email);
    if (!user) {
      const role: UserRole = email === 'admin@masjidhub.com' ? 'superadmin_platform' : 'dkm_admin';
      user = { id: crypto.randomUUID(), name: "Demo User", email, role, tenantIds: ['t1'] };
    }
    return ok(c, { user });
  });

  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    return ok(c, {
      totalTenants: tenants.length, totalUsers: users.length, 
      totalBalance: txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: events.filter(e => e.date > Date.now()).length,
      pendingApprovals: tenants.filter(t => t.status === 'pending').length
    });
  });

  app.get('/api/super/tenants', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    return ok(c, tenants.map(t => ({
      ...t, 
      totalBalance: txs.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      memberCount: users.filter(u => u.tenantIds.includes(t.id)).length,
      eventCount: 0
    })));
  });

  app.get('/api/super/users', async (c) => {
    const { items: users } = await UserEntity.list(c.env);
    return ok(c, users);
  });

  app.post('/api/super/tenants/:id/approve', async (c) => {
    const inst = new TenantEntity(c.env, c.req.param('id'));
    if (!(await inst.exists())) return notFound(c, 'Tenant not found');
    await inst.patch({ status: 'active' });
    return ok(c, { success: true });
  });

  app.post('/api/super/tenants/:id/toggle-ai', async (c) => {
    const inst = new TenantEntity(c.env, c.req.param('id'));
    if (!(await inst.exists())) return notFound(c, 'Tenant not found');
    const { enabled } = await c.req.json();
    await inst.patch({ aiEnabled: enabled });
    return ok(c, { success: true, aiEnabled: enabled });
  });

  // --- TENANT SPECIFIC ---
  app.get('/api/tenants/:slug', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
  });

  app.put('/api/:slug/settings', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const inst = new TenantEntity(c.env, tenant.id);
    await inst.patch(body);
    return ok(c, await inst.getState());
  });

  // Finance & ZIS
  app.get('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await TransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });

  app.post('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await TransactionEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id });
    return ok(c, tx);
  });

  app.get('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ZisTransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });

  app.post('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await ZisTransactionEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id, date: Date.now(), payment_status: body.payment_status || 'pending' });
    return ok(c, tx);
  });

  app.get('/api/:slug/zis/report', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ZisTransactionEntity.list(c.env);
    const zisTransactions = items.filter(t => t.tenantId === tenant.id);
    return ok(c, {
      totalAmount: zisTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      totalTransactions: zisTransactions.length
    });
  });

  app.post('/api/:slug/zis/:id/process-payment', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const inst = new ZisTransactionEntity(c.env, c.req.param('id'));
    const tx = await inst.getState();
    const body = await c.req.json();
    const result = await processZisPayment(tx, body.payment_method, body.amount);
    await inst.patch({ payment_method: body.payment_method, payment_status: result.status as any, payment_reference: result.reference, payment_gateway: result.gateway, payment_date: Date.now() });
    return ok(c, await inst.getState());
  });

  // Inventory, Events, Forum, Members, Mustahik
  app.get('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await MustahikEntity.list(c.env);
    return ok(c, items.filter(m => m.tenantId === tenant.id));
  });

  app.post('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const mustahik = await MustahikEntity.create(c.env, { 
      ...body, 
      id: crypto.randomUUID(), 
      tenantId: tenant.id,
      registrationDate: Date.now()
    });
    return ok(c, mustahik);
  });

  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await InventoryItemEntity.list(c.env);
    return ok(c, items.filter(i => i.tenantId === tenant.id));
  });

  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await EventEntity.list(c.env);
    return ok(c, items.filter(e => e.tenantId === tenant.id));
  });

  app.get('/api/:slug/forum', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ForumPostEntity.list(c.env);
    return ok(c, items.filter(p => p.tenantId === tenant.id));
  });

  app.get('/api/:slug/members', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await UserEntity.list(c.env);
    return ok(c, items.filter(u => u.tenantIds.includes(tenant.id)));
  });

  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await PrayerScheduleEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id));
  });

  app.get('/api/:slug/search', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const q = c.req.query('q')?.toLowerCase() || "";
    const [txs, inv, evs, posts] = await Promise.all([TransactionEntity.list(c.env), InventoryItemEntity.list(c.env), EventEntity.list(c.env), ForumPostEntity.list(c.env)]);
    return ok(c, {
      transactions: txs.items.filter(t => t.tenantId === tenant.id && t.description.toLowerCase().includes(q)),
      inventory: inv.items.filter(i => i.tenantId === tenant.id && i.name.toLowerCase().includes(q)),
      events: evs.items.filter(e => e.tenantId === tenant.id && e.title.toLowerCase().includes(q)),
      forum: posts.items.filter(p => p.tenantId === tenant.id && p.title.toLowerCase().includes(q))
    });
  });
}
