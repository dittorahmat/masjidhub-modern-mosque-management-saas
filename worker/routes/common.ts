import { Hono } from "hono";
import type { Env } from "../core-utils";
import { getDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { seedDatabase } from "../db/seed";
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

// Cache check for DB seeding to avoid redundant seed executions in warm worker invocations
let isDbSeeded = false;

export async function ensureDbInitialized(env: Env) {
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
      console.warn("Notice: Failed initializing/seeding database:", seedErr);
    }
  }
}

/**
 * Standardize timestamp to epoch milliseconds.
 * Always returns a number in milliseconds (Date.now() format).
 */
export function toTimestampMs(val: number | string | Date | null | undefined, fallback = Date.now()): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    if (isNaN(val)) return fallback;
    // If <= 10 billion, it's in seconds (e.g. 1.7e9), convert to ms
    return val > 1e11 ? Math.floor(val) : Math.floor(val * 1000);
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallback : val.getTime();
  }
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Convert milliseconds or Date input to seconds for database storage if needed.
 */
export function toEpochSeconds(val: number | string | Date | null | undefined, fallback = Date.now()): number {
  const ms = toTimestampMs(val, fallback);
  return Math.floor(ms / 1000);
}

export function mapTenantRow(row: typeof schema.tenants.$inferSelect): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.ownerId,
    createdAt: toTimestampMs(row.createdAt),
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
    date: toTimestampMs(row.date),
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
    date: toTimestampMs(row.date),
    payment_method: row.paymentMethod ?? undefined,
    payment_status: row.paymentStatus ?? undefined,
    payment_reference: row.paymentReference ?? undefined,
    payment_gateway: row.paymentGateway ?? undefined,
    payment_date: row.paymentDate ? toTimestampMs(row.paymentDate) : undefined,
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
    registrationDate: toTimestampMs(row.registrationDate),
    lastAssistanceDate: row.lastAssistanceDate ? toTimestampMs(row.lastAssistanceDate) : undefined,
    notes: row.notes ?? undefined,
  };
}

export function mapStatementLogRow(row: typeof schema.statementLogs.$inferSelect): StatementLog {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fileHash: row.fileHash,
    fileName: row.fileName,
    processedAt: toTimestampMs(row.processedAt),
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
    lastMaintenance: row.lastMaintenance ? toTimestampMs(row.lastMaintenance) : undefined,
    maintenanceIntervalDays: row.maintenanceIntervalDays ?? undefined,
    nextMaintenanceDate: row.nextMaintenanceDate ? toTimestampMs(row.nextMaintenanceDate) : undefined,
  };
}

export function mapEventRow(row: typeof schema.events.$inferSelect): Event {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    date: toTimestampMs(row.date),
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
    registeredAt: toTimestampMs(row.registeredAt),
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
    createdAt: toTimestampMs(row.createdAt),
    lastActivityAt: toTimestampMs(row.lastActivityAt),
  };
}

export function mapAIChatMessageRow(row: typeof schema.aiChatMessages.$inferSelect): AIChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    tenantId: row.tenantId,
    senderRole: row.senderRole,
    text: row.text,
    timestamp: toTimestampMs(row.timestamp),
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
    createdAt: toTimestampMs(row.createdAt),
    updatedAt: toTimestampMs(row.updatedAt),
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
    createdAt: toTimestampMs(row.createdAt),
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
    createdAt: toTimestampMs(row.createdAt),
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
    updatedAt: toTimestampMs(row.updatedAt),
  };
}

export function mapKnowledgeSnippetRow(row: typeof schema.knowledgeSnippets.$inferSelect): KnowledgeSnippet {
  return {
    id: row.id,
    tenantId: row.tenantId,
    content: row.content,
    priority: row.priority,
    expirationDate: row.expirationDate ? toTimestampMs(row.expirationDate) : null,
    createdAt: toTimestampMs(row.createdAt),
  };
}

export function mapChatRoomRow(row: typeof schema.chatRooms.$inferSelect): ChatRoom {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    participants: (row.participants as string[]) || [],
    createdAt: toTimestampMs(row.createdAt),
    lastMessageAt: row.lastMessageAt ? toTimestampMs(row.lastMessageAt) : undefined,
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
    timestamp: toTimestampMs(row.timestamp),
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
    createdAt: toTimestampMs(row.createdAt),
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
    createdAt: toTimestampMs(row.createdAt),
    readAt: row.readAt ? toTimestampMs(row.readAt) : undefined,
    isBroadcast: !!row.isBroadcast,
  };
}

export const getTenantBySlug = async (env: Env, slug: string): Promise<Tenant | null> => {
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

export const getTenantBySlugOrSubdomain = async (c: any, env: Env): Promise<Tenant | null> => {
  const slug = c.req.param('slug');
  if (slug) return await getTenantBySlug(env, slug);
  const subdomain = c.get('subdomain');
  if (subdomain) return await getTenantBySlug(env, subdomain);
  return null;
};
