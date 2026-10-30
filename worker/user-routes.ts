import { getStorage } from "./storage";
import { Hono } from "hono";
import type { Env } from './core-utils';
import { getDb, schema } from "./db";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { seedDatabase } from "./db/seed";
import {
  InventoryItemEntity,
  EventEntity,
  EventRegistrationEntity,
  ForumPostEntity,
  PrayerScheduleEntity,
  NotificationEntity,
  ChatRoomEntity,
  ChatMessageEntity,
  UstadzEntity,
  ChatSessionEntity,
  KnowledgeSnippetEntity,
  BlogPostEntity,
  PageSectionEntity,
  MediaItemEntity,
  AIChatMessageEntity,
  MonthlyPrayerScheduleEntity
} from "./entities";
import type { UserRole, ZisTransaction, DailyPrayer, Tenant, AppUser, Transaction, Mustahik, StatementLog } from "@shared/types";
import { ok, bad, notFound } from './core-utils';
import { streamChatResponse, parseBankStatement } from "./ai-logic";
import { streamText } from 'hono/streaming';
import { generateShadowId, generateSessionSalt, calculateFileHash } from "./crypto-utils";
import { getOptimizedImageUrl, generateFinanceInfographicUrl } from "./cloudinary";

// Helper for Hex Color validation
const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

// Helper for Data Normalization
const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

// Cache check for DB seeding to avoid redundant seed executions in warm worker invocations
let isDbSeeded = false;
async function ensureDbInitialized(env: Env) {
  if (isDbSeeded) return;
  try {
    const db = getDb(env);
    const existing = await db.select().from(schema.tenants).limit(1);
    if (existing.length === 0) {
      await seedDatabase({ envOrD1: env, verbose: false, autoMigrateLocal: true });
    }
    isDbSeeded = true;
  } catch (e) {
    // If table doesn't exist yet in local fallback, try seeding
    try {
      await seedDatabase({ envOrD1: env, verbose: false, autoMigrateLocal: true });
      isDbSeeded = true;
    } catch (seedErr) {
      console.warn('Notice: Failed initializing/seeding database:', seedErr);
    }
  }
}

export function mapTenantRow(row: typeof schema.tenants.$inferSelect): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId,
    // Note: D1 stores Unix seconds; frontend expects milliseconds
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    timezone: row.timezone ?? 'Asia/Jakarta',
    legalDocUrl: row.legalDocUrl ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    bannerUrl: row.bannerUrl ?? undefined,
    runningText: row.runningText ?? undefined,
    bankInfo: row.bankInfo ?? undefined,
    bankAccounts: (row.bankAccounts as Tenant['bankAccounts']) ?? undefined,
    dkmStructure: (row.dkmStructure as Tenant['dkmStructure']) ?? undefined,
    prayerCalculationMethod: row.prayerCalculationMethod ?? 'KEMENAG',
    socialLinks: (row.socialLinks as Tenant['socialLinks']) ?? undefined,
    bio: row.bio ?? undefined,
    status: row.status,
    aiEnabled: !!row.aiEnabled,
    selectedPersona: (row.selectedPersona as Tenant['selectedPersona']) ?? 'marbot_muda',
    kioskRunningText: row.kioskRunningText ?? '',
    kioskPrayerMode: row.kioskPrayerMode ?? 'silent',
    sholatDuration: row.sholatDuration ?? 15,
    iqomahMinutes: (row.iqomahMinutes as Tenant['iqomahMinutes']) ?? {
      fajr: 12,
      dhuhr: 10,
      asr: 10,
      maghrib: 7,
      isha: 10,
    },
  };
}

export function mapUserRow(row: typeof schema.users.$inferSelect): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    tenantIds: (row.tenantIds as string[]) || (row.tenantId ? [row.tenantId] : []),
    isBanned: !!row.isBanned,
  };
}

export function mapTransactionRow(row: typeof schema.transactions.$inferSelect): Transaction {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description,
    date: row.date > 1e11 ? row.date : row.date * 1000,
    createdBy: row.createdBy,
  };
}

export function mapZisTransactionRow(row: typeof schema.zisTransactions.$inferSelect): ZisTransaction {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type,
    flow: row.flow,
    amount: row.amount,
    muzakki_name: row.muzakkiName ?? undefined,
    muzakki_email: row.muzakkiEmail ?? undefined,
    muzakki_phone: row.muzakkiPhone ?? undefined,
    mustahik_id: row.mustahikId ?? undefined,
    description: row.description ?? '',
    date: row.date > 1e11 ? row.date : row.date * 1000,
    payment_method: row.paymentMethod ?? undefined,
    payment_status: row.paymentStatus ?? undefined,
    payment_reference: row.paymentReference ?? undefined,
    payment_gateway: row.paymentGateway ?? undefined,
    payment_date: row.paymentDate ? (row.paymentDate > 1e11 ? row.paymentDate : row.paymentDate * 1000) : undefined,
  };
}

export function mapMustahikRow(row: typeof schema.mustahiks.$inferSelect): Mustahik {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    nik: row.nik ?? undefined,
    category: row.category,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    familyMembers: row.familyMembers ?? 1,
    status: row.status,
    assistanceReceived: row.assistanceReceived ?? 0,
    registrationDate: row.registrationDate > 1e11 ? row.registrationDate : row.registrationDate * 1000,
    lastAssistanceDate: row.lastAssistanceDate ? (row.lastAssistanceDate > 1e11 ? row.lastAssistanceDate : row.lastAssistanceDate * 1000) : undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapStatementLogRow(row: typeof schema.statementLogs.$inferSelect): StatementLog {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fileHash: row.fileHash,
    fileName: row.fileName,
    processedAt: row.processedAt > 1e11 ? row.processedAt : row.processedAt * 1000,
    transactionCount: row.transactionCount,
  };
}

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
  const getTenantBySlug = async (env: Env, slug: string): Promise<Tenant | null> => {
    await ensureDbInitialized(env);
    const db = getDb(env);
    const normalizedSlug = slug.toLowerCase().trim();
    const rows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, normalizedSlug))
      .limit(1);

    if (rows.length === 0) return null;
    return mapTenantRow(rows[0]);
  };

  const getTenantBySlugOrSubdomain = async (c: any, env: Env): Promise<Tenant | null> => {
    const slug = c.req.param('slug');
    if (slug) return await getTenantBySlug(env, slug);
    const subdomain = c.get('subdomain');
    if (subdomain) return await getTenantBySlug(env, subdomain);
    return null;
  };

  // --- PUBLIC & AUTH ---
  app.get('/api/check-subdomain/:slug', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const slug = c.req.param('slug').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const rows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))
      .limit(1);

    const exists = rows.length > 0;
    return ok(c, { available: !exists, slug: c.req.param('slug') });
  });

  app.post('/api/auth/register', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { name, email, mosqueName, slug, address } = await c.req.json();
    const tenantId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const nowSec = Math.floor(Date.now() / 1000);

    const defaultIqomah = { fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10 };

    await db.insert(schema.tenants).values({
      id: tenantId,
      name: mosqueName,
      slug: cleanSlug,
      ownerId: userId,
      createdAt: nowSec,
      updatedAt: nowSec,
      address,
      status: 'pending',
      selectedPersona: 'marbot_muda',
      kioskRunningText: "",
      kioskPrayerMode: 'silent',
      sholatDuration: 15,
      iqomahMinutes: defaultIqomah,
    });

    await db.insert(schema.users).values({
      id: userId,
      tenantId: tenantId,
      tenantIds: [tenantId],
      name,
      email,
      role: 'dkm_admin',
      isActive: true,
      isBanned: false,
      createdAt: nowSec,
      updatedAt: nowSec,
    });

    const tenant = mapTenantRow({
      id: tenantId,
      name: mosqueName,
      slug: cleanSlug,
      ownerId: userId,
      createdAt: nowSec,
      updatedAt: nowSec,
      address,
      city: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      timezone: 'Asia/Jakarta',
      bannerUrl: null,
      logoUrl: null,
      legalDocUrl: null,
      runningText: null,
      bankInfo: null,
      bankAccounts: null,
      dkmStructure: null,
      prayerCalculationMethod: 'KEMENAG',
      socialLinks: null,
      bio: null,
      status: 'pending',
      aiEnabled: false,
      selectedPersona: 'marbot_muda',
      kioskRunningText: "",
      kioskPrayerMode: 'silent',
      sholatDuration: 15,
      iqomahMinutes: defaultIqomah,
    });

    const user: AppUser = {
      id: userId,
      name,
      email,
      role: 'dkm_admin',
      tenantIds: [tenantId],
      isBanned: false,
    };

    return ok(c, { user, tenant });
  });

  // Alias route for register-mosque
  app.post('/api/auth/register-mosque', async (c) => {
    return app.fetch(new Request(c.req.url.replace('/api/auth/register-mosque', '/api/auth/register'), {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(await c.req.json()),
    }), c.env, c.executionCtx);
  });

  app.post('/api/auth/login', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { email } = await c.req.json();

    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    let user: AppUser;
    if (users.length > 0) {
      user = mapUserRow(users[0]);
    } else {
      const role: UserRole = email === 'admin@masjidhub.com' ? 'superadmin_platform' : 'dkm_admin';
      user = { id: crypto.randomUUID(), name: "Demo User", email, role, tenantIds: ['t1'] };
    }
    return ok(c, { user });
  });

  // Auth me endpoint
  app.get('/api/auth/me', async (c) => {
    await ensureDbInitialized(c.env);
    const email = c.req.query('email');
    const userId = c.req.query('id');
    const db = getDb(c.env);

    if (!email && !userId) {
      return bad(c, 'Query parameter email or id is required');
    }

    const whereClause = email
      ? eq(schema.users.email, email)
      : eq(schema.users.id, userId!);

    const users = await db.select().from(schema.users).where(whereClause).limit(1);
    if (users.length === 0) {
      return notFound(c, 'User not found');
    }
    return ok(c, { user: mapUserRow(users[0]) });
  });

  // Demo users endpoint
  app.get('/api/auth/demo-users', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const users = await db.select().from(schema.users);
    return ok(c, users.map(mapUserRow));
  });

  // Tenants list or create endpoint
  app.get('/api/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const rows = await db.select().from(schema.tenants);
    return ok(c, rows.map(mapTenantRow));
  });

  app.post('/api/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();
    const tenantId = body.id || crypto.randomUUID();
    const cleanSlug = (body.slug || body.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const nowSec = Math.floor(Date.now() / 1000);

    await db.insert(schema.tenants).values({
      id: tenantId,
      name: body.name,
      slug: cleanSlug,
      ownerId: body.ownerId || 'u1',
      address: body.address,
      city: body.city,
      phone: body.phone,
      email: body.email,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone || 'Asia/Jakarta',
      bannerUrl: body.bannerUrl,
      logoUrl: body.logoUrl,
      legalDocUrl: body.legalDocUrl,
      runningText: body.runningText,
      bankInfo: body.bankInfo,
      bankAccounts: body.bankAccounts,
      dkmStructure: body.dkmStructure,
      prayerCalculationMethod: body.prayerCalculationMethod || 'KEMENAG',
      socialLinks: body.socialLinks,
      bio: body.bio,
      status: body.status || 'active',
      aiEnabled: body.aiEnabled ?? false,
      selectedPersona: body.selectedPersona || 'marbot_muda',
      kioskRunningText: body.kioskRunningText || '',
      kioskPrayerMode: body.kioskPrayerMode || 'silent',
      sholatDuration: body.sholatDuration || 15,
      iqomahMinutes: body.iqomahMinutes || { fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10 },
      createdAt: nowSec,
      updatedAt: nowSec,
    });

    const rows = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    return ok(c, mapTenantRow(rows[0]));
  });

  // --- CONFIG & UTILS ---
  app.get('/api/config/cloudinary', (c) => {
    return ok(c, { cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub', uploadPreset: c.env.CLOUDINARY_UPLOAD_PRESET || 'masjidhub_preset' });
  });

  app.get('/api/geo/search', async (c) => {
    const q = c.req.query('q');
    if (!q) return bad(c, 'Query required');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=id&limit=5`, { headers: { 'User-Agent': 'MasjidHub-SaaS' } });
      const data = await res.json();
      return ok(c, data);
    } catch (e) { return bad(c, 'Gagal mencari lokasi.'); }
  });

  // --- AI CHAT ENGAGEMENT ---
  app.post('/api/:slug/chat/init', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { userId, isAnonymous } = await c.req.json();
    const sessionId = crypto.randomUUID();
    const sessionSalt = generateSessionSalt();
    let finalUserId = userId || 'guest';
    if (isAnonymous) {
      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret_key';
      finalUserId = await generateShadowId(secret, `${finalUserId}:${tenant.id}:${sessionSalt}`);
    }
    const session = await ChatSessionEntity.create(c.env, { id: sessionId, tenantId: tenant.id, userId: finalUserId, isAnonymous, sessionSalt, status: 'active', createdAt: Date.now(), lastActivityAt: Date.now() });
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
    const trustedDomains = tenantSnippetsRaw.filter(s => s.content.toUpperCase().startsWith("REFERENSI:")).map(s => s.content.split(":")[1]?.trim()).flatMap(d => d ? d.split(",").map(i => i.trim()) : []).filter(Boolean);
    const sessionInst = new ChatSessionEntity(c.env, sessionId);
    await sessionInst.patch({ lastActivityAt: Date.now() });
    return streamText(c, async (stream) => {
      let accumulatedText = "";
      const responseStream = streamChatResponse(apiKey, message, { mosqueName: tenant.name, snippets: tenantSnippets, fileUris: [], persona: tenant.selectedPersona || 'marbot_muda', trustedDomains }, history);
      for await (const chunk of responseStream) { accumulatedText += chunk; await stream.write(chunk); }
      await AIChatMessageEntity.create(c.env, { id: crypto.randomUUID(), sessionId, tenantId: tenant.id, senderRole: 'ai', text: accumulatedText, timestamp: Date.now() });
    });
  });

  // --- AI KNOWLEDGE MANAGEMENT ---
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
    if (!file || file.type !== 'application/pdf') return bad(c, 'Only PDF allowed');
    if (file.size > 50 * 1024 * 1024) return bad(c, 'File too large');
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
    if (body.content?.length > 2000) return bad(c, 'Snippet too long');
    const snippet = await KnowledgeSnippetEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id, createdAt: Date.now() });
    return ok(c, snippet);
  });

  // --- AI CHAT MANAGEMENT ---
  app.get('/api/:slug/chat/sessions', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ChatSessionEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id).sort((a, b) => b.lastActivityAt - a.lastActivityAt));
  });

  app.get('/api/:slug/chat/sessions/:id/messages', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items: messages } = await AIChatMessageEntity.list(c.env);
    return ok(c, messages.filter(m => m.sessionId === c.req.param('id') && m.tenantId === tenant.id).sort((a, b) => a.timestamp - b.timestamp).slice(-100));
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
      const data = await res.json();
      return ok(c, data);
    } catch (e) { return bad(c, 'Quran API tidak dapat dijangkau'); }
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
    if (!Array.isArray(sections)) return bad(c, 'Invalid format');
    for (const s of sections) { if (s.config?.color && !isValidHex(s.config.color)) return bad(c, 'Invalid color'); }
    const { items: existing } = await PageSectionEntity.list(c.env);
    const toDelete = existing.filter(s => s.tenantId === tenant.id).map(s => s.id);
    if (toDelete.length > 0) await PageSectionEntity.deleteMany(c.env, toDelete);
    const created = await Promise.all(sections.map((s: any, index: number) => PageSectionEntity.create(c.env, { ...s, id: crypto.randomUUID(), tenantId: tenant.id, order: index, updatedAt: Date.now() })));
    return ok(c, created);
  });

  // --- FINANCE & ZIS ---
  // 1. Transactions List (supports both /finance and /finance/transactions)
  const getTransactionsHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const rows = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenant.id))
      .orderBy(desc(schema.transactions.date));
    return ok(c, rows.map(mapTransactionRow));
  };
  app.get('/api/:slug/finance', getTransactionsHandler);
  app.get('/api/:slug/finance/transactions', getTransactionsHandler);

  // 2. Transaction Create (supports both /finance and /finance/transactions)
  const createTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const rawDate = body.date ?? Date.now();
    const dateVal = rawDate > 1e11 ? Math.floor(rawDate / 1000) : rawDate;

    await db.insert(schema.transactions).values({
      id,
      tenantId: tenant.id,
      type: body.type,
      amount: Number(body.amount),
      category: body.category,
      description: body.description || '',
      date: dateVal,
      paymentMethod: body.paymentMethod ?? null,
      referenceNumber: body.referenceNumber ?? null,
      receiptUrl: body.receiptUrl ?? null,
      createdBy: body.createdBy || 'admin',
      createdAt: Math.floor(Date.now() / 1000),
    });

    const inserted = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapTransactionRow(inserted[0]));
  };
  app.post('/api/:slug/finance', createTransactionHandler);
  app.post('/api/:slug/finance/transactions', createTransactionHandler);

  // 3. Transaction Bulk Create
  app.post('/api/:slug/finance/transactions/bulk', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const { transactions } = await c.req.json();
    if (!Array.isArray(transactions)) return bad(c, 'transactions array required');

    const createdIds: string[] = [];
    for (const tx of transactions) {
      const id = tx.id || crypto.randomUUID();
      const rawDate = tx.date ?? Date.now();
      const dateVal = rawDate > 1e11 ? Math.floor(rawDate / 1000) : rawDate;
      await db.insert(schema.transactions).values({
        id,
        tenantId: tenant.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.category || tx.suggestedCategory || 'Umum',
        description: tx.description || '',
        date: dateVal,
        paymentMethod: tx.paymentMethod ?? null,
        referenceNumber: tx.referenceNumber ?? null,
        receiptUrl: tx.receiptUrl ?? null,
        createdBy: tx.createdBy || 'bulk_import',
        createdAt: Math.floor(Date.now() / 1000),
      });
      createdIds.push(id);
    }
    return ok(c, { count: createdIds.length, ids: createdIds });
  });

  // 4. Transaction Update (PUT)
  const updateTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Transaction not found');

    const updateData: Partial<typeof schema.transactions.$inferInsert> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) {
      updateData.date = body.date > 1e11 ? Math.floor(body.date / 1000) : body.date;
    }
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.referenceNumber !== undefined) updateData.referenceNumber = body.referenceNumber;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.transactions)
        .set(updateData)
        .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    return ok(c, mapTransactionRow(updated[0]));
  };
  app.put('/api/:slug/finance/transactions/:id', updateTransactionHandler);
  app.put('/api/:slug/finance/:id', updateTransactionHandler);

  // 5. Transaction Delete (DELETE)
  const deleteTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Transaction not found');

    await db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.tenantId, tenant.id)));
    return ok(c, { success: true });
  };
  app.delete('/api/:slug/finance/transactions/:id', deleteTransactionHandler);
  app.delete('/api/:slug/finance/:id', deleteTransactionHandler);

  // 6. Finance Overview / Summary / Insights
  app.get('/api/:slug/finance/overview', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenant.id));

    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory: Record<string, number> = {};

    for (const r of rows) {
      if (r.type === 'income') {
        totalIncome += r.amount;
      } else {
        totalExpense += r.amount;
      }
      byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
    }

    const balance = totalIncome - totalExpense;
    const idleCashWarning = balance > 10000000;

    return ok(c, {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: rows.length,
      byCategory,
      idleCashWarning,
      insights: idleCashWarning
        ? 'Saldo kas melebihi Rp 10.000.000. Pertimbangkan untuk menyalurkan ke program mustahik atau pembangunan agar dana lebih produktif.'
        : 'Arus kas terpantau stabil.',
    });
  });

  // 7. Statement Logs list
  app.get('/api/:slug/finance/statement-logs', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const logs = await db
      .select()
      .from(schema.statementLogs)
      .where(eq(schema.statementLogs.tenantId, tenant.id))
      .orderBy(desc(schema.statementLogs.processedAt));
    return ok(c, logs.map(mapStatementLogRow));
  });

  // 8. Bank statement OCR parsing
  app.post('/api/:slug/finance/parse-statement', async (c) => {
    console.log('[BACKEND] Received parse-statement request');
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    if (!file) {
      console.error('[BACKEND] No file found in request body');
      return bad(c, 'No file uploaded');
    }
    
    console.log('[BACKEND] File received:', file.name, file.type, file.size);

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[BACKEND] GEMINI_API_KEY missing');
      return bad(c, 'AI configuration missing (GEMINI_API_KEY)');
    }

    try {
      const buffer = await file.arrayBuffer();
      console.log('[BACKEND] ArrayBuffer generated, size:', buffer.byteLength);
      
      const fileHash = await calculateFileHash(buffer);
      const existingLogs = await db
        .select()
        .from(schema.statementLogs)
        .where(and(eq(schema.statementLogs.fileHash, fileHash), eq(schema.statementLogs.tenantId, tenant.id)))
        .limit(1);

      if (existingLogs.length > 0) {
        return bad(c, 'File sudah pernah diproses.');
      }

      console.log('[BACKEND] Calling Gemini Vision Parser...');
      const transactions = await parseBankStatement(apiKey, buffer, file.type, tenant.name);
      console.log('[BACKEND] Gemini Parsing Success, rows:', transactions.length);

      const existingTxs = await db
        .select()
        .from(schema.transactions)
        .where(eq(schema.transactions.tenantId, tenant.id));

      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
      
      const enhancedTxs = await Promise.all(transactions.map(async (tx) => {
        const fingerprint = await generateShadowId(secret, `${tx.date}:${tx.amount}:${normalizeText(tx.description)}`);
        const isDuplicate = existingTxs.some(etx => etx.amount === tx.amount && normalizeText(etx.description).includes(normalizeText(tx.description).substring(0, 15)));
        return { ...tx, fingerprint, isDuplicate };
      }));

      const signature = await generateShadowId(secret, JSON.stringify(enhancedTxs) + fileHash);
      return ok(c, { fileHash, transactions: enhancedTxs, signature });
    } catch (e: any) { 
      console.error('[BACKEND] Parsing failed:', e.message);
      return bad(c, `Gagal parsing: ${e.message}`); 
    }
  });

  // 9. Bulk Save Statement
  app.post('/api/:slug/finance/bulk-save', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const { transactions, fileHash, fileName, signature } = await c.req.json();
    const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
    const expectedSignature = await generateShadowId(secret, JSON.stringify(transactions) + fileHash);
    if (signature !== expectedSignature) return bad(c, 'Data integrity check failed.');

    const impact: Record<string, number> = {};
    transactions.filter((tx: any) => !tx.isDuplicate).forEach((tx: any) => {
      impact[tx.suggestedCategory] = (impact[tx.suggestedCategory] || 0) + tx.amount;
    });

    const nowSec = Math.floor(Date.now() / 1000);
    for (const tx of transactions) {
      if (tx.isDuplicate) continue;
      await db.insert(schema.transactions).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        type: tx.type,
        amount: Number(tx.amount),
        category: tx.suggestedCategory,
        description: tx.description,
        date: nowSec,
        createdBy: 'ai_importer',
        createdAt: nowSec,
      });
    }

    await db.insert(schema.statementLogs).values({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      fileHash,
      fileName,
      processedAt: nowSec,
      transactionCount: transactions.length,
    });

    return ok(c, { count: transactions.length, impact });
  });

  // 10. ZIS Transactions List (supports both /zis and /zis/transactions)
  const getZisTransactionsHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenant.id))
      .orderBy(desc(schema.zisTransactions.date));

    return ok(c, rows.map(mapZisTransactionRow));
  };
  app.get('/api/:slug/zis', getZisTransactionsHandler);
  app.get('/api/:slug/zis/transactions', getZisTransactionsHandler);

  // 11. ZIS Transaction Create (supports both /zis and /zis/transactions)
  const createZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = body.id || crypto.randomUUID();
    const rawDate = body.date ?? Date.now();
    const dateVal = rawDate > 1e11 ? Math.floor(rawDate / 1000) : rawDate;
    const nowSec = Math.floor(Date.now() / 1000);

    const rawPaymentDate = body.payment_date ?? body.paymentDate;
    const paymentDateVal = rawPaymentDate
      ? (rawPaymentDate > 1e11 ? Math.floor(rawPaymentDate / 1000) : rawPaymentDate)
      : null;

    await db.insert(schema.zisTransactions).values({
      id,
      tenantId: tenant.id,
      date: dateVal,
      type: body.type,
      flow: body.flow || 'in',
      amount: Number(body.amount),
      muzakkiName: body.muzakki_name ?? body.muzakkiName ?? null,
      muzakkiEmail: body.muzakki_email ?? body.muzakkiEmail ?? null,
      muzakkiPhone: body.muzakki_phone ?? body.muzakkiPhone ?? null,
      mustahikId: body.mustahik_id ?? body.mustahikId ?? null,
      description: body.description ?? '',
      paymentMethod: body.payment_method ?? body.paymentMethod ?? null,
      paymentStatus: body.payment_status ?? body.paymentStatus ?? 'pending',
      paymentReference: body.payment_reference ?? body.paymentReference ?? null,
      paymentGateway: body.payment_gateway ?? body.paymentGateway ?? null,
      paymentDate: paymentDateVal,
      distributionStatus: body.distribution_status ?? body.distributionStatus ?? null,
      distributedTo: body.distributed_to ?? body.distributedTo ?? null,
      distributedAmount: body.distributed_amount !== undefined ? Number(body.distributed_amount) : null,
      notes: body.notes ?? null,
      receiptUrl: body.receipt_url ?? body.receiptUrl ?? null,
      createdAt: nowSec,
    });

    const inserted = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(inserted[0]));
  };
  app.post('/api/:slug/zis', createZisTransactionHandler);
  app.post('/api/:slug/zis/transactions', createZisTransactionHandler);

  // 12. ZIS Transaction Update (PUT)
  const updateZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS Transaction not found');

    const updateData: Partial<typeof schema.zisTransactions.$inferInsert> = {};
    if (body.type !== undefined) updateData.type = body.type;
    if (body.flow !== undefined) updateData.flow = body.flow;
    if (body.amount !== undefined) updateData.amount = Number(body.amount);
    if (body.muzakki_name !== undefined || body.muzakkiName !== undefined) {
      updateData.muzakkiName = body.muzakki_name ?? body.muzakkiName;
    }
    if (body.muzakki_email !== undefined || body.muzakkiEmail !== undefined) {
      updateData.muzakkiEmail = body.muzakki_email ?? body.muzakkiEmail;
    }
    if (body.muzakki_phone !== undefined || body.muzakkiPhone !== undefined) {
      updateData.muzakkiPhone = body.muzakki_phone ?? body.muzakkiPhone;
    }
    if (body.mustahik_id !== undefined || body.mustahikId !== undefined) {
      updateData.mustahikId = body.mustahik_id ?? body.mustahikId;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) {
      updateData.date = body.date > 1e11 ? Math.floor(body.date / 1000) : body.date;
    }
    if (body.payment_method !== undefined || body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.payment_method ?? body.paymentMethod;
    }
    if (body.payment_status !== undefined || body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.payment_status ?? body.paymentStatus;
    }
    if (body.payment_reference !== undefined || body.paymentReference !== undefined) {
      updateData.paymentReference = body.payment_reference ?? body.paymentReference;
    }
    if (body.payment_gateway !== undefined || body.paymentGateway !== undefined) {
      updateData.paymentGateway = body.payment_gateway ?? body.paymentGateway;
    }
    if (body.payment_date !== undefined || body.paymentDate !== undefined) {
      const pd = body.payment_date ?? body.paymentDate;
      updateData.paymentDate = pd ? (pd > 1e11 ? Math.floor(pd / 1000) : pd) : null;
    }
    if (body.distribution_status !== undefined || body.distributionStatus !== undefined) {
      updateData.distributionStatus = body.distribution_status ?? body.distributionStatus;
    }
    if (body.distributed_to !== undefined || body.distributedTo !== undefined) {
      updateData.distributedTo = body.distributed_to ?? body.distributedTo;
    }
    if (body.distributed_amount !== undefined || body.distributedAmount !== undefined) {
      const da = body.distributed_amount ?? body.distributedAmount;
      updateData.distributedAmount = da !== undefined ? Number(da) : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.receipt_url !== undefined || body.receiptUrl !== undefined) {
      updateData.receiptUrl = body.receipt_url ?? body.receiptUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.zisTransactions)
        .set(updateData)
        .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(updated[0]));
  };
  app.put('/api/:slug/zis/transactions/:id', updateZisTransactionHandler);
  app.put('/api/:slug/zis/:id', updateZisTransactionHandler);

  // 13. ZIS Transaction Delete (DELETE)
  const deleteZisTransactionHandler = async (c: any) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS Transaction not found');

    await db
      .delete(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));
    return ok(c, { success: true });
  };
  app.delete('/api/:slug/zis/transactions/:id', deleteZisTransactionHandler);
  app.delete('/api/:slug/zis/:id', deleteZisTransactionHandler);

  // 14. ZIS Report / Overview / Distribution
  app.get('/api/:slug/zis/report', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const fromQuery = c.req.query('from');
    const toQuery = c.req.query('to');

    const rows = await db
      .select()
      .from(schema.zisTransactions)
      .where(eq(schema.zisTransactions.tenantId, tenant.id))
      .orderBy(desc(schema.zisTransactions.date));

    let zisTransactions = rows.map(mapZisTransactionRow);

    if (fromQuery) {
      const fromMs = new Date(fromQuery).getTime();
      if (!isNaN(fromMs)) {
        zisTransactions = zisTransactions.filter(t => t.date >= fromMs);
      }
    }
    if (toQuery) {
      const toDate = new Date(toQuery);
      toDate.setHours(23, 59, 59, 999);
      const toMs = toDate.getTime();
      if (!isNaN(toMs)) {
        zisTransactions = zisTransactions.filter(t => t.date <= toMs);
      }
    }

    const totals: Record<string, number> = {};
    const byType: Record<string, ZisTransaction[]> = {};
    const byMonth: Record<string, ZisTransaction[]> = {};

    for (const tx of zisTransactions) {
      totals[tx.type] = (totals[tx.type] || 0) + tx.amount;

      if (!byType[tx.type]) byType[tx.type] = [];
      byType[tx.type].push(tx);

      const d = new Date(tx.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) byMonth[monthKey] = [];
      byMonth[monthKey].push(tx);
    }

    const totalAmount = zisTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return ok(c, {
      totals,
      byType,
      byMonth,
      totalAmount,
      totalTransactions: zisTransactions.length,
    });
  });

  // 15. ZIS Overview Endpoint
  app.get('/api/:slug/zis/overview', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const [zisRows, mustahikRows] = await Promise.all([
      db.select().from(schema.zisTransactions).where(eq(schema.zisTransactions.tenantId, tenant.id)),
      db.select().from(schema.mustahiks).where(eq(schema.mustahiks.tenantId, tenant.id)),
    ]);

    let totalIn = 0;
    let totalOut = 0;
    const inByType: Record<string, number> = {};

    for (const tx of zisRows) {
      if (tx.flow === 'in' && (tx.paymentStatus === 'completed' || !tx.paymentStatus)) {
        totalIn += tx.amount;
        inByType[tx.type] = (inByType[tx.type] || 0) + tx.amount;
      } else if (tx.flow === 'out') {
        totalOut += tx.amount;
      }
    }

    return ok(c, {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      inByType,
      totalMustahik: mustahikRows.length,
      activeMustahik: mustahikRows.filter(m => m.status === 'active').length,
    });
  });

  // 16. ZIS Distribute (POST /api/:slug/zis/distribute)
  app.post('/api/:slug/zis/distribute', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const rawDate = body.date ?? Date.now();
    const dateVal = rawDate > 1e11 ? Math.floor(rawDate / 1000) : rawDate;
    const amount = Number(body.amount);

    await db.insert(schema.zisTransactions).values({
      id,
      tenantId: tenant.id,
      date: dateVal,
      type: body.type || 'infaq_shadaqah',
      flow: 'out',
      amount,
      mustahikId: body.mustahik_id ?? body.mustahikId ?? null,
      description: body.description || `Penyaluran ZIS kepada ${body.distributed_to || 'Mustahik'}`,
      distributionStatus: 'distributed',
      distributedTo: body.distributed_to ?? body.distributedTo ?? null,
      distributedAmount: amount,
      paymentStatus: 'completed',
      paymentDate: nowSec,
      createdAt: nowSec,
    });

    // If mustahikId is provided, update Mustahik's assistanceReceived and lastAssistanceDate
    if (body.mustahik_id || body.mustahikId) {
      const mId = body.mustahik_id || body.mustahikId;
      const targetMustahik = await db
        .select()
        .from(schema.mustahiks)
        .where(and(eq(schema.mustahiks.id, mId), eq(schema.mustahiks.tenantId, tenant.id)))
        .limit(1);

      if (targetMustahik.length > 0) {
        const currentAssistance = targetMustahik[0].assistanceReceived ?? 0;
        await db
          .update(schema.mustahiks)
          .set({
            assistanceReceived: currentAssistance + amount,
            lastAssistanceDate: nowSec,
          })
          .where(and(eq(schema.mustahiks.id, mId), eq(schema.mustahiks.tenantId, tenant.id)));
      }
    }

    const inserted = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(inserted[0]));
  });

  // 17. ZIS Payment Processing
  app.post('/api/:slug/zis/:id/process-payment', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'ZIS transaction not found');

    const tx = mapZisTransactionRow(existing[0]);
    const body = await c.req.json();
    const result = await processZisPayment(tx, body.payment_method, body.amount || tx.amount);

    const nowSec = Math.floor(Date.now() / 1000);
    await db
      .update(schema.zisTransactions)
      .set({
        paymentMethod: body.payment_method,
        paymentStatus: result.status as any,
        paymentReference: result.reference,
        paymentGateway: result.gateway,
        paymentDate: nowSec,
      })
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)));

    const updated = await db
      .select()
      .from(schema.zisTransactions)
      .where(and(eq(schema.zisTransactions.id, id), eq(schema.zisTransactions.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapZisTransactionRow(updated[0]));
  });

  // --- MUSTAHIK ---
  // 18. Mustahik List
  app.get('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.mustahiks)
      .where(eq(schema.mustahiks.tenantId, tenant.id))
      .orderBy(desc(schema.mustahiks.registrationDate));

    return ok(c, rows.map(mapMustahikRow));
  });

  // 19. Mustahik Create
  app.post('/api/:slug/mustahik', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const body = await c.req.json();

    const id = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const rawRegDate = body.registrationDate ?? Date.now();
    const regDateSec = rawRegDate > 1e11 ? Math.floor(rawRegDate / 1000) : rawRegDate;

    await db.insert(schema.mustahiks).values({
      id,
      tenantId: tenant.id,
      name: body.name,
      nik: body.nik ?? null,
      category: body.category || 'miskin',
      address: body.address ?? null,
      phone: body.phone ?? null,
      familyMembers: body.familyMembers ? Number(body.familyMembers) : 1,
      status: body.status || 'active',
      assistanceReceived: body.assistanceReceived ? Number(body.assistanceReceived) : 0,
      lastAssistanceDate: body.lastAssistanceDate
        ? (body.lastAssistanceDate > 1e11 ? Math.floor(body.lastAssistanceDate / 1000) : body.lastAssistanceDate)
        : null,
      registrationDate: regDateSec,
      notes: body.notes ?? null,
      createdAt: nowSec,
    });

    const inserted = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapMustahikRow(inserted[0]));
  });

  // 20. Mustahik Update (PUT)
  app.put('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Mustahik not found');

    const updateData: Partial<typeof schema.mustahiks.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.nik !== undefined) updateData.nik = body.nik;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.familyMembers !== undefined) updateData.familyMembers = Number(body.familyMembers);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assistanceReceived !== undefined) updateData.assistanceReceived = Number(body.assistanceReceived);
    if (body.lastAssistanceDate !== undefined) {
      updateData.lastAssistanceDate = body.lastAssistanceDate
        ? (body.lastAssistanceDate > 1e11 ? Math.floor(body.lastAssistanceDate / 1000) : body.lastAssistanceDate)
        : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.mustahiks)
        .set(updateData)
        .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)));
    }

    const updated = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapMustahikRow(updated[0]));
  });

  // 21. Mustahik Delete (DELETE)
  app.delete('/api/:slug/mustahik/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)))
      .limit(1);
    if (existing.length === 0) return notFound(c, 'Mustahik not found');

    await db
      .delete(schema.mustahiks)
      .where(and(eq(schema.mustahiks.id, id), eq(schema.mustahiks.tenantId, tenant.id)));
    return ok(c, { success: true });
  });

  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await InventoryItemEntity.list(c.env);
    return ok(c, items.filter(i => i.tenantId === tenant.id));
  });

  // --- EVENTS & FORUM ---
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
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const allUsers = await db.select().from(schema.users);
    const mapped = allUsers.map(mapUserRow);
    return ok(c, mapped.filter(u => u.tenantIds.includes(tenant.id)));
  });

  // --- PRAYER SCHEDULE HUB ---
  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items: monthly } = await MonthlyPrayerScheduleEntity.list(c.env);
    const tenantMonthly = monthly.filter(m => m.tenantId === tenant.id);
    const allDaily: any[] = [];
    tenantMonthly.forEach(m => {
      Object.entries(m.days).forEach(([date, prayers]) => {
        const dayDate = new Date(date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(pt => {
          allDaily.push({ id: `${m.id}:${date}:${pt}`, tenantId: tenant.id, date, day: dayName, prayerTime: pt, time: (prayers as any)[pt], imamName: prayers.imamName, isLocked: prayers.isLocked });
        });
      });
    });
    return ok(c, allDaily);
  });

  app.put('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const inst = new PrayerScheduleEntity(c.env, c.req.param('id'));
    const state = await inst.getState();
    if (!state || state.tenantId !== tenant.id) return notFound(c, 'Schedule not found');
    const allowedFields = ['time', 'imamName', 'isLocked', 'date'];
    const filteredBody: any = {};
    allowedFields.forEach(f => { if (body[f] !== undefined) filteredBody[f] = body[f]; });
    await inst.patch(filteredBody);
    return ok(c, await inst.getState());
  });

  app.post('/api/:slug/prayer-schedules/sync-month', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    if (!tenant.latitude || !tenant.longitude) return bad(c, 'Lokasi masjid belum diatur.');
    const { year, month } = await c.req.json();
    const monthId = `${tenant.id}:${year}-${String(month).padStart(2, '0')}`;
    try {
      const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${tenant.latitude}&longitude=${tenant.longitude}&method=20&month=${month}&year=${year}`);
      const data: any = await res.json();
      if (data.code !== 200) throw new Error('API Error');
      const prayerMap: any = { 'Fajr': 'fajr', 'Dhuhr': 'dhuhr', 'Asr': 'asr', 'Maghrib': 'maghrib', 'Isha': 'isha' };
      const inst = new MonthlyPrayerScheduleEntity(c.env, monthId);
      const existing = await inst.exists() ? await inst.getState() : null;
      const days: Record<string, DailyPrayer> = existing ? { ...existing.days } : {};
      for (const dayData of data.data) {
        const [d, m, y] = dayData.date.gregorian.date.split('-');
        const isoDate = `${y}-${m}-${d}`;
        if (days[isoDate]?.isLocked) continue;
        const daily: any = days[isoDate] || {};
        for (const [apiName, internalName] of Object.entries(prayerMap)) { daily[internalName as string] = dayData.timings[apiName as string].split(' ')[0]; }
        days[isoDate] = daily;
      }
      await MonthlyPrayerScheduleEntity.create(c.env, { id: monthId, tenantId: tenant.id, year, month, days });
      return ok(c, { success: true, monthId });
    } catch (e) { return bad(c, 'Gagal sinkronisasi bulan ini.'); }
  });

  // --- MEDIA & SEARCH ---
  app.get('/api/:slug/media', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await MediaItemEntity.list(c.env);
    return ok(c, items.filter(m => m.tenantId === tenant.id));
  });

  app.get('/api/:slug/finance/report-card', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const txs = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.tenantId, tenant.id));
    const balance = txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    const imageUrl = generateFinanceInfographicUrl(c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub', tenant.name, balance, new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    return ok(c, { imageUrl, balance });
  });

  app.get('/api/:slug/search', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const q = c.req.query('q')?.toLowerCase() || "";
    const [txRows, inv, evs, posts, zisRows] = await Promise.all([
      db.select().from(schema.transactions).where(eq(schema.transactions.tenantId, tenant.id)),
      InventoryItemEntity.list(c.env),
      EventEntity.list(c.env),
      ForumPostEntity.list(c.env),
      db.select().from(schema.zisTransactions).where(eq(schema.zisTransactions.tenantId, tenant.id)),
    ]);
    const mappedTxs = txRows.map(mapTransactionRow);
    const mappedZis = zisRows.map(mapZisTransactionRow);
    return ok(c, {
      transactions: mappedTxs.filter(t => t.description.toLowerCase().includes(q)),
      inventory: inv.items.filter(i => i.tenantId === tenant.id && i.name.toLowerCase().includes(q)),
      events: evs.items.filter(e => e.tenantId === tenant.id && e.title.toLowerCase().includes(q)),
      forum: posts.items.filter(p => p.tenantId === tenant.id && p.title.toLowerCase().includes(q)),
      zis: mappedZis.filter(z => z.description.toLowerCase().includes(q) || (z.muzakki_name && z.muzakki_name.toLowerCase().includes(q))),
    });
  });

  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const [tenantsList, usersList, txsList, events] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.transactions),
      EventEntity.list(c.env),
    ]);
    return ok(c, {
      totalTenants: tenantsList.length,
      totalUsers: usersList.length,
      totalBalance: txsList.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: events.items.filter(e => e.date > Date.now()).length,
      pendingApprovals: tenantsList.filter(t => t.status === 'pending').length,
    });
  });

  app.get('/api/super/tenants', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const [tenantsList, usersList, txsList] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.transactions),
    ]);
    const mappedUsers = usersList.map(mapUserRow);
    const mappedTenants = tenantsList.map(mapTenantRow);

    return ok(c, mappedTenants.map(t => ({
      ...t,
      totalBalance: txsList.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      memberCount: mappedUsers.filter(u => u.tenantIds.includes(t.id)).length,
      eventCount: 0,
    })));
  });

  app.get('/api/super/users', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const usersList = await db.select().from(schema.users);
    return ok(c, usersList.map(mapUserRow));
  });

  app.post('/api/super/tenants/:id/approve', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const tenantId = c.req.param('id');
    const existing = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    if (existing.length === 0) return notFound(c, 'Tenant not found');

    await db.update(schema.tenants).set({ status: 'active', updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.tenants.id, tenantId));
    return ok(c, { success: true });
  });

  app.post('/api/super/tenants/:id/toggle-ai', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const tenantId = c.req.param('id');
    const { enabled } = await c.req.json();
    const existing = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
    if (existing.length === 0) return notFound(c, 'Tenant not found');

    await db.update(schema.tenants).set({ aiEnabled: enabled, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.tenants.id, tenantId));
    return ok(c, { success: true, aiEnabled: enabled });
  });

  app.get('/api/tenants/:slug', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Mosque not found');
    return ok(c, tenant);
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

  app.get('/api/storage/*', async (c) => {
    const rawPath = c.req.path.replace(/^\/api\/storage\//, '');
    const key = decodeURIComponent(rawPath);
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
  });
}
