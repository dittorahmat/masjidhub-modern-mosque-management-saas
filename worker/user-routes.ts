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
  AIChatMessageEntity,
  StatementLogEntity,
  MonthlyPrayerScheduleEntity
} from "./entities";
import type { UserRole, ZisTransaction, DailyPrayer } from "@shared/types";
import { ok, bad, notFound } from './core-utils';
import { streamChatResponse, parseBankStatement } from "./ai-logic";
import { streamText } from 'hono/streaming';
import { generateShadowId, generateSessionSalt, calculateFileHash } from "./crypto-utils";
import { getOptimizedImageUrl, generateFinanceInfographicUrl } from "./cloudinary";

// Helper for Hex Color validation
const isValidHex = (color: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);

// Helper for Data Normalization
const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

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
    const tenant = await TenantEntity.create(c.env, { id: tenantId, name: mosqueName, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), ownerId: userId, createdAt: Date.now(), address, status: 'pending', selectedPersona: 'marbot_muda', kioskRunningText: "", kioskPrayerMode: 'silent', iqomahMinutes: { fajr: 12, dhuhr: 10, asr: 10, maghrib: 7, isha: 10 } });
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

  // --- AI CHAT MANAGEMENT ---
  app.get('/api/:slug/chat/sessions', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await ChatSessionEntity.list(c.env);
    return ok(c, items.filter(s => s.tenantId === tenant.id).sort((a, b) => b.lastActivityAt - a.lastActivityAt));
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

  // --- FINANCE STATEMENT PARSER ---
  app.post('/api/:slug/finance/parse-statement', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    if (!file) return bad(c, 'No file uploaded');
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) return bad(c, 'AI configuration missing');
    const buffer = await file.arrayBuffer();
    const fileHash = await calculateFileHash(buffer);
    const { items: logs } = await StatementLogEntity.list(c.env);
    if (logs.some(l => l.fileHash === fileHash && l.tenantId === tenant.id)) return bad(c, 'File sudah pernah diproses.');
    try {
      const transactions = await parseBankStatement(apiKey, buffer, file.type, tenant.name);
      const { items: existingTxs } = await TransactionEntity.list(c.env);
      const tenantTxs = existingTxs.filter(t => t.tenantId === tenant.id);
      const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
      const enhancedTxs = await Promise.all(transactions.map(async (tx) => {
        const fingerprint = await generateShadowId(secret, `${tx.date}:${tx.amount}:${normalizeText(tx.description)}`);
        const isDuplicate = tenantTxs.some(etx => etx.amount === tx.amount && normalizeText(etx.description).includes(normalizeText(tx.description).substring(0, 15)));
        return { ...tx, fingerprint, isDuplicate };
      }));
      const signature = await generateShadowId(secret, JSON.stringify(enhancedTxs) + fileHash);
      return ok(c, { fileHash, transactions: enhancedTxs, signature });
    } catch (e: any) { return bad(c, e.message); }
  });

  app.post('/api/:slug/finance/bulk-save', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { transactions, fileHash, fileName, signature } = await c.req.json();
    const secret = c.env.INTERNAL_SECRET_KEY || 'default_secret';
    const expectedSignature = await generateShadowId(secret, JSON.stringify(transactions) + fileHash);
    if (signature !== expectedSignature) return bad(c, 'Data integrity check failed.');
    const impact: Record<string, number> = {};
    transactions.filter((tx: any) => !tx.isDuplicate).forEach((tx: any) => { impact[tx.suggestedCategory] = (impact[tx.suggestedCategory] || 0) + tx.amount; });
    const savedCount = transactions.length;
    for (const tx of transactions) { if (tx.isDuplicate) continue; await TransactionEntity.create(c.env, { id: crypto.randomUUID(), tenantId: tenant.id, type: tx.type, amount: tx.amount, category: tx.suggestedCategory, description: tx.description, date: Date.now(), createdBy: 'ai_importer' }); }
    await StatementLogEntity.create(c.env, { id: crypto.randomUUID(), tenantId: tenant.id, fileHash, fileName, processedAt: Date.now(), transactionCount: savedCount });
    return ok(c, { count: savedCount, impact });
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

  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: events } = await EventEntity.list(c.env);
    return ok(c, { totalTenants: tenants.length, totalUsers: users.length, totalBalance: txs.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0), activeEvents: events.filter(e => e.date > Date.now()).length, pendingApprovals: tenants.filter(t => t.status === 'pending').length });
  });

  app.get('/api/super/tenants', async (c) => {
    await TenantEntity.ensureSeed(c.env);
    const { items: tenants } = await TenantEntity.list(c.env);
    const { items: txs } = await TransactionEntity.list(c.env);
    const { items: users } = await UserEntity.list(c.env);
    return ok(c, tenants.map(t => ({ ...t, totalBalance: txs.filter(tx => tx.tenantId === t.id).reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0), memberCount: users.filter(u => u.tenantIds.includes(t.id)).length, eventCount: 0 })));
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

  app.get('/api/:slug/finance', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items } = await TransactionEntity.list(c.env);
    return ok(c, items.filter(t => t.tenantId === tenant.id));
  });

  app.post('/api/:slug/zis', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    const tx = await ZisTransactionEntity.create(c.env, { ...body, id: crypto.randomUUID(), tenantId: tenant.id, date: Date.now(), payment_status: body.payment_status || 'pending' });
    return ok(c, tx);
  });

  // --- PRAYER SCHEDULE HUB (OPTIMIZED) ---
  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const { items: monthly } = await MonthlyPrayerScheduleEntity.list(c.env);
    const tenantMonthly = monthly.filter(m => m.tenantId === tenant.id);
    
    // Flatten daily prayers for frontend compatibility
    const allDaily: any[] = [];
    tenantMonthly.forEach(m => {
      Object.entries(m.days).forEach(([date, prayers]) => {
        const dayDate = new Date(date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];
        
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(pt => {
          allDaily.push({
            id: `${m.id}:${date}:${pt}`,
            tenantId: tenant.id,
            date,
            day: dayName,
            prayerTime: pt,
            time: (prayers as any)[pt],
            imamName: prayers.imamName,
            isLocked: prayers.isLocked
          });
        });
      });
    });
    return ok(c, allDaily);
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
      
      // Load existing monthly record to preserve manual edits
      const inst = new MonthlyPrayerScheduleEntity(c.env, monthId);
      const existing = await inst.exists() ? await inst.getState() : null;
      const days: Record<string, DailyPrayer> = existing ? { ...existing.days } : {};

      for (const dayData of data.data) {
        const [d, m, y] = dayData.date.gregorian.date.split('-');
        const isoDate = `${y}-${m}-${d}`;
        
        // Skip if this day is locked by admin
        if (days[isoDate]?.isLocked) continue;

        const daily: any = days[isoDate] || {};
        for (const [apiName, internalName] of Object.entries(prayerMap)) {
          daily[internalName as string] = dayData.timings[apiName as string].split(' ')[0];
        }
        days[isoDate] = daily;
      }

      await MonthlyPrayerScheduleEntity.create(c.env, { id: monthId, tenantId: tenant.id, year, month, days });
      return ok(c, { success: true, monthId });
    } catch (e) { return bad(c, 'Gagal sinkronisasi bulan ini.'); }
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
