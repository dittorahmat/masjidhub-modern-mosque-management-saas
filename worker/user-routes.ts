import { getStorage } from "./storage";
import { Hono } from "hono";
import type { Env } from './core-utils';
import { getDb, schema } from "./db";
import { eq, or, and, desc, asc, sql } from "drizzle-orm";
import { seedDatabase } from "./db/seed";
import type {
  UserRole,
  ZisTransaction,
  DailyPrayer,
  Tenant,
  AppUser,
  Transaction,
  Mustahik,
  StatementLog,
  InventoryItem,
  Event,
  EventRegistration,
  ForumPost,
  PrayerSchedule,
  MonthlyPrayerSchedule,
  ChatSession,
  AIChatMessage,
  BlogPost,
  MediaItem,
  PageSection,
  KnowledgeSnippet,
  ChatRoom,
  ChatMessage,
  Ustadz,
  OrganizationMember,
  Notification
} from "@shared/types";
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

export function mapInventoryItemRow(row: typeof schema.inventoryItems.$inferSelect): InventoryItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    quantity: row.quantity,
    condition: row.condition,
    location: row.location,
    lastMaintenance: row.lastMaintenance ? (row.lastMaintenance > 1e11 ? row.lastMaintenance : row.lastMaintenance * 1000) : undefined,
    maintenanceIntervalDays: row.maintenanceIntervalDays ?? undefined,
    nextMaintenanceDate: row.nextMaintenanceDate ? (row.nextMaintenanceDate > 1e11 ? row.nextMaintenanceDate : row.nextMaintenanceDate * 1000) : undefined,
  };
}

export function mapEventRow(row: typeof schema.events.$inferSelect): Event {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    date: row.date > 1e11 ? row.date : row.date * 1000,
    location: row.location,
    capacity: row.capacity,
    currentRegistrations: row.currentRegistrations,
    speaker: row.speaker ?? undefined,
    minDonation: row.minDonation ?? undefined,
    imageUrl: row.imageUrl ?? row.bannerUrl ?? undefined,
    isFundraising: !!row.isFundraising,
    targetAmount: row.targetAmount ?? undefined,
    collectedAmount: row.collectedAmount ?? 0,
  };
}

export function mapEventRegistrationRow(row: typeof schema.eventRegistrations.$inferSelect): EventRegistration {
  return {
    id: row.id,
    eventId: row.eventId,
    tenantId: row.tenantId,
    name: row.name || row.attendeeName,
    email: row.email || row.attendeeEmail || '',
    phone: row.phone || row.attendeePhone || '',
    registeredAt: row.registeredAt > 1e11 ? row.registeredAt : row.registeredAt * 1000,
  };
}

export function mapMonthlyPrayerScheduleRow(row: typeof schema.monthlyPrayerSchedules.$inferSelect): MonthlyPrayerSchedule {
  return {
    id: row.id,
    tenantId: row.tenantId,
    year: row.year,
    month: row.month,
    days: (row.days as Record<string, DailyPrayer>) || {},
  };
}

export function mapPrayerScheduleRow(row: typeof schema.prayerSchedules.$inferSelect): PrayerSchedule {
  return {
    id: row.id,
    tenantId: row.tenantId,
    date: row.date ?? undefined,
    day: row.day,
    prayerTime: row.prayerTime,
    time: row.time,
    imamName: row.imamName ?? undefined,
    khatibName: row.khatibName ?? undefined,
    khutbahTopic: row.khutbahTopic ?? undefined,
    khutbahFileUrl: row.khutbahFileUrl ?? undefined,
    isLocked: !!row.isLocked,
  };
}

export function mapChatSessionRow(row: typeof schema.chatSessions.$inferSelect): ChatSession {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId ?? null,
    isAnonymous: !!row.isAnonymous,
    sessionSalt: row.sessionSalt,
    status: row.status,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    lastActivityAt: row.lastActivityAt > 1e11 ? row.lastActivityAt : row.lastActivityAt * 1000,
  };
}

export function mapAIChatMessageRow(row: typeof schema.aiChatMessages.$inferSelect): AIChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    tenantId: row.tenantId,
    senderRole: row.senderRole,
    text: row.text,
    timestamp: row.timestamp > 1e11 ? row.timestamp : row.timestamp * 1000,
    metadata: (row.metadata as AIChatMessage['metadata']) ?? undefined,
  };
}

export function mapBlogPostRow(row: typeof schema.blogPosts.$inferSelect): BlogPost {
  return {
    id: row.id,
    tenantId: row.tenantId,
    slug: row.slug,
    title: row.title,
    content: row.content,
    authorId: row.authorId,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    updatedAt: row.updatedAt > 1e11 ? row.updatedAt : row.updatedAt * 1000,
  };
}

export function mapMediaItemRow(row: typeof schema.mediaItems.$inferSelect): MediaItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    cloudinaryUrl: row.cloudinaryUrl,
    fileName: row.fileName,
    fileType: row.fileType,
    eventTag: row.eventTag ?? null,
    isWatermarked: !!row.isWatermarked,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
  };
}

export function mapForumPostRow(row: typeof schema.forumPosts.$inferSelect): ForumPost {
  return {
    id: row.id,
    tenantId: row.tenantId,
    authorId: row.authorId,
    authorName: row.authorName,
    category: row.category,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    isPinned: !!row.isPinned,
    isBanned: !!row.isBanned,
    likeCount: row.likeCount ?? 0,
    commentCount: row.commentCount ?? 0,
  };
}

export function mapPageSectionRow(row: typeof schema.pageSections.$inferSelect): PageSection {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type,
    order: row.order,
    config: (row.config as Record<string, unknown>) || {},
    isVisible: !!row.isVisible,
    updatedAt: row.updatedAt > 1e11 ? row.updatedAt : row.updatedAt * 1000,
  };
}

export function mapKnowledgeSnippetRow(row: typeof schema.knowledgeSnippets.$inferSelect): KnowledgeSnippet {
  return {
    id: row.id,
    tenantId: row.tenantId,
    content: row.content,
    priority: row.priority,
    expirationDate: row.expirationDate ? (row.expirationDate > 1e11 ? row.expirationDate : row.expirationDate * 1000) : null,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
  };
}

export function mapChatRoomRow(row: typeof schema.chatRooms.$inferSelect): ChatRoom {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    participants: (row.participants as string[]) || [],
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    lastMessageAt: row.lastMessageAt ? (row.lastMessageAt > 1e11 ? row.lastMessageAt : row.lastMessageAt * 1000) : undefined,
    lastMessage: row.lastMessage ?? undefined,
  };
}

export function mapChatMessageRow(row: typeof schema.chatMessages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    chatRoomId: row.chatRoomId,
    senderId: row.senderId,
    senderName: row.senderName,
    message: row.message,
    timestamp: row.timestamp > 1e11 ? row.timestamp : row.timestamp * 1000,
    readBy: (row.readBy as string[]) ?? undefined,
  };
}

export function mapUstadzRow(row: typeof schema.ustadzList.$inferSelect): Ustadz {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    specialization: row.specialization,
    bio: row.bio ?? undefined,
    isActive: !!row.isActive,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
  };
}

export function mapOrganizationMemberRow(row: typeof schema.organizationMembers.$inferSelect): OrganizationMember {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    role: row.role,
    imageUrl: row.imageUrl ?? undefined,
    order: row.order,
    bio: row.bio ?? undefined,
    socialLinks: (row.socialLinks as OrganizationMember['socialLinks']) ?? undefined,
  };
}

export function mapNotificationRow(row: typeof schema.notifications.$inferSelect): Notification {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId ?? undefined,
    title: row.title,
    message: row.message,
    type: row.type,
    createdAt: row.createdAt > 1e11 ? row.createdAt : row.createdAt * 1000,
    readAt: row.readAt ? (row.readAt > 1e11 ? row.readAt : row.readAt * 1000) : undefined,
    isBroadcast: !!row.isBroadcast,
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
    const rawExp = body.expirationDate;
    const expVal = rawExp ? (rawExp > 1e11 ? Math.floor(rawExp / 1000) : rawExp) : null;

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
    for (const s of sections) { if (s.config?.color && !isValidHex(s.config.color)) return bad(c, 'Invalid color'); }

    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    // Delete existing sections for this tenant
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

  // --- INVENTORY ---
  app.get('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.tenantId, tenant.id))
      .orderBy(desc(schema.inventoryItems.createdAt));

    return ok(c, rows.map(mapInventoryItemRow));
  });

  app.post('/api/:slug/inventory', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const itemId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const rawPurchaseDate = body.purchaseDate;
    const purchaseDateVal = rawPurchaseDate ? (rawPurchaseDate > 1e11 ? Math.floor(rawPurchaseDate / 1000) : rawPurchaseDate) : null;
    const rawLastMaint = body.lastMaintenance;
    const lastMaintVal = rawLastMaint ? (rawLastMaint > 1e11 ? Math.floor(rawLastMaint / 1000) : rawLastMaint) : null;
    const rawNextMaint = body.nextMaintenanceDate;
    const nextMaintVal = rawNextMaint ? (rawNextMaint > 1e11 ? Math.floor(rawNextMaint / 1000) : rawNextMaint) : null;

    await db.insert(schema.inventoryItems).values({
      id: itemId,
      tenantId: tenant.id,
      name: body.name || '',
      category: body.category || 'umum',
      quantity: Number(body.quantity || 1),
      condition: body.condition || 'good',
      location: body.location || '',
      purchaseDate: purchaseDateVal,
      purchasePrice: body.purchasePrice !== undefined ? Number(body.purchasePrice) : null,
      source: body.source ?? null,
      notes: body.notes ?? null,
      maintenanceLog: body.maintenanceLog ?? null,
      lastMaintenance: lastMaintVal,
      maintenanceIntervalDays: body.maintenanceIntervalDays !== undefined ? Number(body.maintenanceIntervalDays) : null,
      nextMaintenanceDate: nextMaintVal,
      createdAt: nowSec,
    });

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, itemId), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapInventoryItemRow(rows[0]));
  });

  app.put('/api/:slug/inventory/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Item not found');

    const updateData: Partial<typeof schema.inventoryItems.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.purchaseDate !== undefined) {
      updateData.purchaseDate = body.purchaseDate ? (body.purchaseDate > 1e11 ? Math.floor(body.purchaseDate / 1000) : body.purchaseDate) : null;
    }
    if (body.purchasePrice !== undefined) updateData.purchasePrice = Number(body.purchasePrice);
    if (body.source !== undefined) updateData.source = body.source;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.maintenanceLog !== undefined) updateData.maintenanceLog = body.maintenanceLog;
    if (body.lastMaintenance !== undefined) {
      updateData.lastMaintenance = body.lastMaintenance ? (body.lastMaintenance > 1e11 ? Math.floor(body.lastMaintenance / 1000) : body.lastMaintenance) : null;
    }
    if (body.maintenanceIntervalDays !== undefined) updateData.maintenanceIntervalDays = Number(body.maintenanceIntervalDays);
    if (body.nextMaintenanceDate !== undefined) {
      updateData.nextMaintenanceDate = body.nextMaintenanceDate ? (body.nextMaintenanceDate > 1e11 ? Math.floor(body.nextMaintenanceDate / 1000) : body.nextMaintenanceDate) : null;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.inventoryItems)
        .set(updateData)
        .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapInventoryItemRow(rows[0]));
  });

  app.delete('/api/:slug/inventory/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Item not found');

    await db
      .delete(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  // --- EVENTS & REGISTRATIONS ---
  app.get('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.tenantId, tenant.id))
      .orderBy(desc(schema.events.date));

    return ok(c, rows.map(mapEventRow));
  });

  app.post('/api/:slug/events', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const eventId = body.id || crypto.randomUUID();
    const rawDate = body.date ?? Date.now();
    const dateVal = rawDate > 1e11 ? Math.floor(rawDate / 1000) : rawDate;
    const capacityVal = Number(body.capacity || body.maxCapacity || 0);
    const currentRegs = Number(body.currentRegistrations || body.registeredCount || 0);

    await db.insert(schema.events).values({
      id: eventId,
      tenantId: tenant.id,
      title: body.title || '',
      description: body.description || '',
      speaker: body.speaker ?? null,
      date: dateVal,
      time: body.time ?? null,
      location: body.location || '',
      category: body.category || 'kajian',
      bannerUrl: body.bannerUrl ?? body.imageUrl ?? null,
      imageUrl: body.imageUrl ?? body.bannerUrl ?? null,
      capacity: capacityVal,
      maxCapacity: capacityVal,
      currentRegistrations: currentRegs,
      registeredCount: currentRegs,
      isRegistrationOpen: body.isRegistrationOpen !== undefined ? !!body.isRegistrationOpen : true,
      requireCheckIn: body.requireCheckIn !== undefined ? !!body.requireCheckIn : false,
      minDonation: body.minDonation !== undefined ? Number(body.minDonation) : null,
      isFundraising: body.isFundraising !== undefined ? !!body.isFundraising : false,
      targetAmount: body.targetAmount !== undefined ? Number(body.targetAmount) : null,
      collectedAmount: body.collectedAmount !== undefined ? Number(body.collectedAmount) : 0,
      createdAt: Math.floor(Date.now() / 1000),
    });

    const rows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRow(rows[0]));
  });

  app.put('/api/:slug/events/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Event not found');

    const updateData: Partial<typeof schema.events.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.speaker !== undefined) updateData.speaker = body.speaker;
    if (body.date !== undefined) {
      updateData.date = body.date > 1e11 ? Math.floor(body.date / 1000) : body.date;
    }
    if (body.time !== undefined) updateData.time = body.time;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.imageUrl !== undefined || body.bannerUrl !== undefined) {
      updateData.imageUrl = body.imageUrl ?? body.bannerUrl;
      updateData.bannerUrl = body.bannerUrl ?? body.imageUrl;
    }
    if (body.capacity !== undefined || body.maxCapacity !== undefined) {
      const cap = Number(body.capacity ?? body.maxCapacity);
      updateData.capacity = cap;
      updateData.maxCapacity = cap;
    }
    if (body.currentRegistrations !== undefined || body.registeredCount !== undefined) {
      const reg = Number(body.currentRegistrations ?? body.registeredCount);
      updateData.currentRegistrations = reg;
      updateData.registeredCount = reg;
    }
    if (body.isRegistrationOpen !== undefined) updateData.isRegistrationOpen = !!body.isRegistrationOpen;
    if (body.requireCheckIn !== undefined) updateData.requireCheckIn = !!body.requireCheckIn;
    if (body.minDonation !== undefined) updateData.minDonation = Number(body.minDonation);
    if (body.isFundraising !== undefined) updateData.isFundraising = !!body.isFundraising;
    if (body.targetAmount !== undefined) updateData.targetAmount = Number(body.targetAmount);
    if (body.collectedAmount !== undefined) updateData.collectedAmount = Number(body.collectedAmount);

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.events)
        .set(updateData)
        .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRow(rows[0]));
  });

  app.delete('/api/:slug/events/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Event not found');

    await db
      .delete(schema.events)
      .where(and(eq(schema.events.id, id), eq(schema.events.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  // Event Registrations & Check-In
  app.get('/api/:slug/events/:id/registrations', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const rows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.eventId, eventId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .orderBy(desc(schema.eventRegistrations.registeredAt));

    return ok(c, rows.map(mapEventRegistrationRow));
  });

  app.post('/api/:slug/events/:id/register', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const eventRows = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)))
      .limit(1);

    if (eventRows.length === 0) return notFound(c, 'Event not found');
    const currentEvent = eventRows[0];

    const regId = body.id || crypto.randomUUID();
    const nowSec = Math.floor(Date.now() / 1000);
    const attendeeName = body.name || body.attendeeName || '';
    const attendeeEmail = body.email || body.attendeeEmail || null;
    const attendeePhone = body.phone || body.attendeePhone || null;

    await db.insert(schema.eventRegistrations).values({
      id: regId,
      tenantId: tenant.id,
      eventId,
      attendeeName,
      name: attendeeName,
      attendeeEmail,
      email: attendeeEmail,
      attendeePhone,
      phone: attendeePhone,
      status: body.status || 'registered',
      checkedInAt: null,
      registeredAt: nowSec,
      createdAt: nowSec,
    });

    const newCount = (currentEvent.currentRegistrations || 0) + 1;
    await db
      .update(schema.events)
      .set({
        currentRegistrations: newCount,
        registeredCount: newCount,
      })
      .where(and(eq(schema.events.id, eventId), eq(schema.events.tenantId, tenant.id)));

    const createdRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.id, regId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRegistrationRow(createdRows[0]));
  });

  app.post('/api/:slug/events/:eventId/check-in', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const eventId = c.req.param('eventId');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const regId = body.registrationId || body.id;
    if (!regId) return bad(c, 'Registration ID is required');

    const regRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(
        eq(schema.eventRegistrations.id, regId),
        eq(schema.eventRegistrations.eventId, eventId),
        eq(schema.eventRegistrations.tenantId, tenant.id)
      ))
      .limit(1);

    if (regRows.length === 0) return notFound(c, 'Registration not found');

    const nowSec = Math.floor(Date.now() / 1000);
    await db
      .update(schema.eventRegistrations)
      .set({
        status: 'attended',
        checkedInAt: nowSec,
      })
      .where(and(
        eq(schema.eventRegistrations.id, regId),
        eq(schema.eventRegistrations.tenantId, tenant.id)
      ));

    const updatedRows = await db
      .select()
      .from(schema.eventRegistrations)
      .where(and(eq(schema.eventRegistrations.id, regId), eq(schema.eventRegistrations.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapEventRegistrationRow(updatedRows[0]));
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

  // User Management (for Forum moderation / banning)
  app.get('/api/:slug/users', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const allUsers = await db.select().from(schema.users);
    const mapped = allUsers.map(mapUserRow);
    return ok(c, mapped.filter(u => u.tenantIds.includes(tenant.id)));
  });

  app.post('/api/:slug/users/:id/ban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) return notFound(c, 'User not found');
    const user = mapUserRow(existing[0]);
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await db.update(schema.users).set({ isBanned: true, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.users.id, userId));
    return ok(c, { success: true, message: 'User banned successfully' });
  });

  app.post('/api/:slug/users/:id/unban', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const userId = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (existing.length === 0) return notFound(c, 'User not found');
    const user = mapUserRow(existing[0]);
    if (!user.tenantIds.includes(tenant.id)) return notFound(c, 'User not found in this tenant');

    await db.update(schema.users).set({ isBanned: false, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.users.id, userId));
    return ok(c, { success: true, message: 'User unbanned successfully' });
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

  // --- PRAYER SCHEDULE HUB ---
  app.get('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    // 1. Fetch monthly schedules
    const monthly = await db
      .select()
      .from(schema.monthlyPrayerSchedules)
      .where(eq(schema.monthlyPrayerSchedules.tenantId, tenant.id));

    const allDaily: PrayerSchedule[] = [];
    monthly.forEach(m => {
      const days = (m.days as Record<string, DailyPrayer>) || {};
      Object.entries(days).forEach(([date, prayers]) => {
        const dayDate = new Date(date);
        const dayNames: PrayerSchedule['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];
        (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(pt => {
          allDaily.push({
            id: `${m.id}:${date}:${pt}`,
            tenantId: tenant.id,
            date,
            day: dayName,
            prayerTime: pt,
            time: (prayers as any)[pt],
            imamName: prayers.imamName,
            isLocked: prayers.isLocked,
          });
        });
      });
    });

    // 2. Fetch individual prayer schedules (if any)
    const individual = await db
      .select()
      .from(schema.prayerSchedules)
      .where(eq(schema.prayerSchedules.tenantId, tenant.id));

    const mappedIndividual = individual.map(mapPrayerScheduleRow);
    const combined = [...allDaily, ...mappedIndividual];

    return ok(c, combined);
  });

  app.post('/api/:slug/prayer-schedules', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const scheduleId = body.id || crypto.randomUUID();

    await db.insert(schema.prayerSchedules).values({
      id: scheduleId,
      tenantId: tenant.id,
      date: body.date ?? null,
      day: body.day || 'friday',
      prayerTime: body.prayerTime || 'fajr',
      time: body.time || '05:00',
      imamName: body.imamName ?? null,
      khatibName: body.khatibName ?? null,
      khutbahTopic: body.khutbahTopic ?? null,
      khutbahFileUrl: body.khutbahFileUrl ?? null,
      isLocked: !!body.isLocked,
    });

    const rows = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, scheduleId), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapPrayerScheduleRow(rows[0]));
  });

  app.put('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    const body = await c.req.json();
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    // Case A: ID is in composite format tenantId:YYYY-MM:YYYY-MM-DD:prayerTime
    const parts = id.split(':');
    if (parts.length >= 4) {
      const monthId = `${parts[0]}:${parts[1]}`;
      const dateKey = parts[2];
      const prayerTime = parts[3] as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

      const monthlyRows = await db
        .select()
        .from(schema.monthlyPrayerSchedules)
        .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)))
        .limit(1);

      if (monthlyRows.length > 0) {
        const mRow = monthlyRows[0];
        const days = { ...(mRow.days as Record<string, DailyPrayer>) };
        const dayEntry = { ...(days[dateKey] || { fajr: '', dhuhr: '', asr: '', maghrib: '', isha: '' }) };

        if (body.time !== undefined) {
          (dayEntry as any)[prayerTime] = body.time;
        }
        if (body.imamName !== undefined) dayEntry.imamName = body.imamName;
        if (body.isLocked !== undefined) dayEntry.isLocked = body.isLocked;

        days[dateKey] = dayEntry;

        await db
          .update(schema.monthlyPrayerSchedules)
          .set({ days, updatedAt: Math.floor(Date.now() / 1000) })
          .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)));

        const dayDate = new Date(dateKey);
        const dayNames: PrayerSchedule['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayDate.getDay()];

        const updatedSchedule: PrayerSchedule = {
          id,
          tenantId: tenant.id,
          date: dateKey,
          day: dayName,
          prayerTime,
          time: (dayEntry as any)[prayerTime] || '',
          imamName: dayEntry.imamName,
          isLocked: dayEntry.isLocked,
        };

        return ok(c, updatedSchedule);
      }
    }

    // Case B: Regular prayer_schedules table row
    const existing = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Schedule not found');

    const updateData: Partial<typeof schema.prayerSchedules.$inferInsert> = {};
    if (body.time !== undefined) updateData.time = body.time;
    if (body.imamName !== undefined) updateData.imamName = body.imamName;
    if (body.khatibName !== undefined) updateData.khatibName = body.khatibName;
    if (body.khutbahTopic !== undefined) updateData.khutbahTopic = body.khutbahTopic;
    if (body.khutbahFileUrl !== undefined) updateData.khutbahFileUrl = body.khutbahFileUrl;
    if (body.isLocked !== undefined) updateData.isLocked = !!body.isLocked;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.day !== undefined) updateData.day = body.day;
    if (body.prayerTime !== undefined) updateData.prayerTime = body.prayerTime;

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.prayerSchedules)
        .set(updateData)
        .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)));
    }

    const rows = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    return ok(c, mapPrayerScheduleRow(rows[0]));
  });

  app.delete('/api/:slug/prayer-schedules/:id', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    const id = c.req.param('id');
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    const existing = await db
      .select()
      .from(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)))
      .limit(1);

    if (existing.length === 0) return notFound(c, 'Schedule not found');

    await db
      .delete(schema.prayerSchedules)
      .where(and(eq(schema.prayerSchedules.id, id), eq(schema.prayerSchedules.tenantId, tenant.id)));

    return ok(c, { success: true });
  });

  app.post('/api/:slug/prayer-schedules/sync-month', async (c) => {
    const tenant = await getTenantBySlugOrSubdomain(c, c.env);
    if (!tenant) return notFound(c, 'Tenant not found');
    if (!tenant.latitude || !tenant.longitude) return bad(c, 'Lokasi masjid belum diatur.');
    const { year, month } = await c.req.json();
    const monthId = `${tenant.id}:${year}-${String(month).padStart(2, '0')}`;
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);

    try {
      const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${tenant.latitude}&longitude=${tenant.longitude}&method=20&month=${month}&year=${year}`);
      const data: any = await res.json();
      if (data.code !== 200) throw new Error('API Error');
      const prayerMap: Record<string, string> = { 'Fajr': 'fajr', 'Dhuhr': 'dhuhr', 'Asr': 'asr', 'Maghrib': 'maghrib', 'Isha': 'isha' };

      const existingRows = await db
        .select()
        .from(schema.monthlyPrayerSchedules)
        .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)))
        .limit(1);

      const existingState = existingRows.length > 0 ? (existingRows[0].days as Record<string, DailyPrayer>) : null;
      const days: Record<string, DailyPrayer> = existingState ? { ...existingState } : {};

      for (const dayData of data.data) {
        const [d, m, y] = dayData.date.gregorian.date.split('-');
        const isoDate = `${y}-${m}-${d}`;
        if (days[isoDate]?.isLocked) continue;
        const daily: any = days[isoDate] || {};
        for (const [apiName, internalName] of Object.entries(prayerMap)) {
          daily[internalName] = dayData.timings[apiName].split(' ')[0];
        }
        days[isoDate] = daily;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      if (existingRows.length > 0) {
        await db
          .update(schema.monthlyPrayerSchedules)
          .set({ days, updatedAt: nowSec })
          .where(and(eq(schema.monthlyPrayerSchedules.id, monthId), eq(schema.monthlyPrayerSchedules.tenantId, tenant.id)));
      } else {
        await db.insert(schema.monthlyPrayerSchedules).values({
          id: monthId,
          tenantId: tenant.id,
          year: Number(year),
          month: Number(month),
          days,
          createdAt: nowSec,
          updatedAt: nowSec,
        });
      }

      return ok(c, { success: true, monthId });
    } catch (e) {
      return bad(c, 'Gagal sinkronisasi bulan ini.');
    }
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

    // Verify room belongs to tenant
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

    // Verify room belongs to tenant
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

  // --- MEDIA & SEARCH ---
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

  // --- SUPER ADMIN ---
  app.get('/api/super/summary', async (c) => {
    await ensureDbInitialized(c.env);
    const db = getDb(c.env);
    const [tenantsList, usersList, txsList, eventsList] = await Promise.all([
      db.select().from(schema.tenants),
      db.select().from(schema.users),
      db.select().from(schema.transactions),
      db.select().from(schema.events),
    ]);
    const nowSec = Math.floor(Date.now() / 1000);
    return ok(c, {
      totalTenants: tenantsList.length,
      totalUsers: usersList.length,
      totalBalance: txsList.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
      activeEvents: eventsList.filter(e => e.date > nowSec).length,
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
