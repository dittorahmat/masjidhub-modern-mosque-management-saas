import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Tenants
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: text('owner_id').notNull(),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  email: text('email'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  timezone: text('timezone').default('Asia/Jakarta'),
  bannerUrl: text('banner_url'),
  logoUrl: text('logo_url'),
  qrisImageUrl: text('qris_image_url'),
  legalDocUrl: text('legal_doc_url'),
  runningText: text('running_text'),
  bankInfo: text('bank_info'),
  bankAccounts: text('bank_accounts', { mode: 'json' }).$type<Array<{
    bankName: string;
    accountNumber: string;
    holderName: string;
    isPrimary?: boolean;
    qrCodeUrl?: string;
  }>>(),
  dkmStructure: text('dkm_structure', { mode: 'json' }).$type<Array<{
    position: string;
    name: string;
    phone?: string;
    photoUrl?: string;
  }>>(),
  prayerCalculationMethod: text('prayer_calculation_method').default('KEMENAG'),
  socialLinks: text('social_links', { mode: 'json' }).$type<{
    instagram?: string;
    youtube?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  }>(),
  bio: text('bio'),
  status: text('status').$type<'active' | 'pending' | 'suspended'>().notNull().default('active'),
  aiEnabled: integer('ai_enabled', { mode: 'boolean' }).default(false),
  selectedPersona: text('selected_persona').default('marbot_muda'),
  kioskRunningText: text('kiosk_running_text'),
  kioskPrayerMode: text('kiosk_prayer_mode').$type<'silent' | 'clock'>().default('silent'),
  sholatDuration: integer('sholat_duration').default(15),
  iqomahMinutes: text('iqomah_minutes', { mode: 'json' }).$type<{
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  }>(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 2. Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  tenantIds: text('tenant_ids', { mode: 'json' }).$type<string[]>(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').$type<'superadmin_platform' | 'dkm_admin' | 'amil_zakat' | 'ustadz' | 'jamaah'>().notNull().default('jamaah'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isBanned: integer('is_banned', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 3. Transactions
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
  type: text('type').$type<'income' | 'expense'>().notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
  receiptUrl: text('receipt_url'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  tenantDateIdx: index('idx_transactions_tenant_date').on(table.tenantId, table.date),
  tenantCategoryIdx: index('idx_transactions_tenant_category').on(table.tenantId, table.category),
  tenantTypeIdx: index('idx_transactions_tenant_type').on(table.tenantId, table.type),
}));

// 4. ZIS Transactions
export const zisTransactions = sqliteTable('zis_transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: integer('date').notNull(),
  type: text('type').$type<'zakat_fitrah' | 'zakat_maal' | 'fidyah' | 'infaq_shadaqah'>().notNull(),
  flow: text('flow').$type<'in' | 'out'>().notNull().default('in'),
  amount: real('amount').notNull(),
  muzakkiName: text('muzakki_name'),
  muzakkiEmail: text('muzakki_email'),
  muzakkiPhone: text('muzakki_phone'),
  mustahikId: text('mustahik_id'),
  paymentMethod: text('payment_method').$type<'cash' | 'bank_transfer' | 'mobile_payment' | 'credit_card'>(),
  paymentStatus: text('payment_status').$type<'pending' | 'completed' | 'failed' | 'refunded'>(),
  paymentReference: text('payment_reference'),
  paymentGateway: text('payment_gateway'),
  paymentDate: integer('payment_date'),
  distributionStatus: text('distribution_status').$type<'pending' | 'distributed' | 'partially_distributed'>(),
  distributedTo: text('distributed_to'),
  distributedAmount: real('distributed_amount'),
  notes: text('notes'),
  description: text('description'),
  receiptUrl: text('receipt_url'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  tenantDateIdx: index('idx_zis_tenant_date').on(table.tenantId, table.date),
  tenantFlowIdx: index('idx_zis_tenant_flow').on(table.tenantId, table.flow),
  tenantTypeIdx: index('idx_zis_tenant_type').on(table.tenantId, table.type),
}));

// 5. Mustahiks
export const mustahiks = sqliteTable('mustahiks', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nik: text('nik'),
  category: text('category').$type<'fakir' | 'miskin' | 'amil' | 'mualaf' | 'gharim' | 'riqab' | 'musafir' | 'other'>().notNull().default('miskin'),
  address: text('address'),
  phone: text('phone'),
  familyMembers: integer('family_members').default(1),
  status: text('status').$type<'active' | 'inactive' | 'completed'>().notNull().default('active'),
  assistanceReceived: real('assistance_received').default(0),
  lastAssistanceDate: integer('last_assistance_date'),
  registrationDate: integer('registration_date').notNull().default(sql`(unixepoch())`),
  notes: text('notes'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  tenantStatusIdx: index('idx_mustahiks_tenant_status').on(table.tenantId, table.status),
  tenantCategoryIdx: index('idx_mustahiks_tenant_category').on(table.tenantId, table.category),
}));

// 6. Inventory Items
export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('umum'),
  quantity: integer('quantity').notNull().default(1),
  condition: text('condition').$type<'new' | 'good' | 'fair' | 'poor'>().notNull().default('good'),
  location: text('location').notNull(),
  purchaseDate: integer('purchase_date'),
  purchasePrice: real('purchase_price'),
  source: text('source'),
  notes: text('notes'),
  maintenanceLog: text('maintenance_log', { mode: 'json' }).$type<Array<{
    date: number;
    description: string;
    cost?: number;
    performedBy?: string;
  }>>(),
  lastMaintenance: integer('last_maintenance'),
  maintenanceIntervalDays: integer('maintenance_interval_days'),
  nextMaintenanceDate: integer('next_maintenance_date'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  tenantCategoryIdx: index('idx_inventory_tenant_category').on(table.tenantId, table.category),
  tenantLocationIdx: index('idx_inventory_tenant_location').on(table.tenantId, table.location),
}));

// 7. Events
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  speaker: text('speaker'),
  date: integer('date').notNull(),
  time: text('time'),
  location: text('location').notNull(),
  category: text('category').notNull().default('kajian'),
  bannerUrl: text('banner_url'),
  imageUrl: text('image_url'),
  maxCapacity: integer('max_capacity').notNull().default(0),
  capacity: integer('capacity').notNull().default(0),
  registeredCount: integer('registered_count').notNull().default(0),
  currentRegistrations: integer('current_registrations').notNull().default(0),
  isRegistrationOpen: integer('is_registration_open', { mode: 'boolean' }).notNull().default(true),
  requireCheckIn: integer('require_check_in', { mode: 'boolean' }).notNull().default(false),
  minDonation: real('min_donation'),
  isFundraising: integer('is_fundraising', { mode: 'boolean' }).default(false),
  targetAmount: real('target_amount'),
  collectedAmount: real('collected_amount').default(0),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  tenantDateIdx: index('idx_events_tenant_date').on(table.tenantId, table.date),
  tenantCategoryIdx: index('idx_events_tenant_category').on(table.tenantId, table.category),
}));

// 8. Event Registrations
export const eventRegistrations = sqliteTable('event_registrations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  attendeeName: text('attendee_name').notNull(),
  attendeePhone: text('attendee_phone'),
  attendeeEmail: text('attendee_email'),
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  status: text('status').$type<'registered' | 'confirmed' | 'attended' | 'cancelled'>().notNull().default('registered'),
  checkedInAt: integer('checked_in_at'),
  registeredAt: integer('registered_at').notNull().default(sql`(unixepoch())`),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 9. Monthly Prayer Schedules
export const monthlyPrayerSchedules = sqliteTable('monthly_prayer_schedules', {
  id: text('id').primaryKey(), // Format: tenantId:YYYY-MM
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  days: text('days', { mode: 'json' }).notNull().$type<Record<string, {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    isLocked?: boolean;
    imamName?: string;
  }>>(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 10. Prayer Schedules (Weekly / Daily)
export const prayerSchedules = sqliteTable('prayer_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: text('date'),
  day: text('day').$type<'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'>().notNull(),
  prayerTime: text('prayer_time').$type<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>().notNull(),
  time: text('time').notNull(),
  imamName: text('imam_name'),
  khatibName: text('khatib_name'),
  khutbahTopic: text('khutbah_topic'),
  khutbahFileUrl: text('khutbah_file_url'),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
});

// 11. Statement Logs
export const statementLogs = sqliteTable('statement_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fileHash: text('file_hash').notNull(),
  fileName: text('file_name').notNull(),
  processedAt: integer('processed_at').notNull().default(sql`(unixepoch())`),
  transactionCount: integer('transaction_count').notNull().default(0),
});

// 12. Chat Sessions
export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull().default(true),
  sessionSalt: text('session_salt').notNull(),
  status: text('status').$type<'active' | 'closed'>().notNull().default('active'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  lastActivityAt: integer('last_activity_at').notNull().default(sql`(unixepoch())`),
});

// 13. AI Chat Messages
export const aiChatMessages = sqliteTable('ai_chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  senderRole: text('sender_role').$type<'user' | 'ai' | 'admin'>().notNull(),
  text: text('text').notNull(),
  timestamp: integer('timestamp').notNull().default(sql`(unixepoch())`),
  metadata: text('metadata', { mode: 'json' }).$type<{
    citations?: {
      fileId: string;
      fileName: string;
      pageNumber: number;
      snippet?: string;
    }[];
    interactiveCards?: {
      type: 'donation' | 'event' | 'finance_summary' | 'link_preview';
      data: {
        id: string;
        title: string;
        value?: number;
        current?: number;
        url: string;
      };
    }[];
  }>(),
});

// 14. Blog Posts
export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  category: text('category').notNull().default('umum'),
  status: text('status').$type<'draft' | 'published'>().notNull().default('draft'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 15. Media Items
export const mediaItems = sqliteTable('media_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  cloudinaryUrl: text('cloudinary_url').notNull(),
  r2Key: text('r2_key'),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  eventTag: text('event_tag'),
  isWatermarked: integer('is_watermarked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 16. Forum Posts
export const forumPosts = sqliteTable('forum_posts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(),
  category: text('category').$type<'kajian' | 'pengumuman' | 'diskusi'>().notNull().default('diskusi'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isBanned: integer('is_banned', { mode: 'boolean' }).default(false),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 17. Page Sections
export const pageSections = sqliteTable('page_sections', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  order: integer('order').notNull().default(0),
  config: text('config', { mode: 'json' }).notNull().$type<Record<string, unknown>>(),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

// 18. Knowledge Snippets
export const knowledgeSnippets = sqliteTable('knowledge_snippets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  priority: integer('priority').notNull().default(0),
  expirationDate: integer('expiration_date'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 19. Chat Rooms
export const chatRooms = sqliteTable('chat_rooms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  participants: text('participants', { mode: 'json' }).notNull().$type<string[]>(),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  lastMessageAt: integer('last_message_at'),
  lastMessage: text('last_message'),
});

// 20. Chat Messages
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  chatRoomId: text('chat_room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  timestamp: integer('timestamp').notNull().default(sql`(unixepoch())`),
  readBy: text('read_by', { mode: 'json' }).$type<string[]>(),
});

// 21. Ustadz List
export const ustadzList = sqliteTable('ustadz', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  specialization: text('specialization').notNull(),
  bio: text('bio'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});

// 22. Organization Members
export const organizationMembers = sqliteTable('organization_members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull(),
  imageUrl: text('image_url'),
  order: integer('order').notNull().default(0),
  bio: text('bio'),
  socialLinks: text('social_links', { mode: 'json' }).$type<{
    instagram?: string;
    whatsapp?: string;
  }>(),
});

// 23. Notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').$type<'info' | 'warning' | 'alert' | 'announcement'>().notNull().default('info'),
  isBroadcast: integer('is_broadcast', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});


// 24. Kajian Videos
export const kajianVideos = sqliteTable('kajian_videos', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  ustadzName: text('ustadz_name'),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeVideoId: text('youtube_video_id').notNull(),
  description: text('description'),
  duration: text('duration'),
  category: text('category').default('kajian_rutin'),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: integer('published_at'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
});
