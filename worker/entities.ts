import { IndexedEntity } from "./core-utils";
import type { 
  Transaction, InventoryItem, Event, EventRegistration, Tenant, AppUser, ForumPost, ZisTransaction,
  PrayerSchedule, Notification, ChatRoom, ChatMessage, Ustadz, OrganizationMember, Mustahik,
  ChatSession, BlogPost, MediaItem, PageSection, KnowledgeSnippet, AIChatMessage, StatementLog
} from "@shared/types";

export class StatementLogEntity extends IndexedEntity<StatementLog> {
  static readonly entityName = "statement_log";
  static readonly indexName = "statement_logs";
  static readonly initialState: StatementLog = {
    id: "",
    tenantId: "",
    fileHash: "",
    fileName: "",
    processedAt: 0,
    transactionCount: 0
  };
}

export class ChatSessionEntity extends IndexedEntity<ChatSession> {
  static readonly entityName = "chat_session";
  static readonly indexName = "chat_sessions";
  static readonly initialState: ChatSession = {
    id: "",
    tenantId: "",
    userId: null,
    isAnonymous: true,
    sessionSalt: "",
    status: 'active',
    createdAt: 0,
    lastActivityAt: 0
  };
}

export class AIChatMessageEntity extends IndexedEntity<AIChatMessage> {
  static readonly entityName = "ai_chat_message";
  static readonly indexName = "ai_chat_messages";
  static readonly initialState: AIChatMessage = {
    id: "",
    sessionId: "",
    tenantId: "",
    senderRole: 'user',
    text: "",
    timestamp: 0
  };
}

export class BlogPostEntity extends IndexedEntity<BlogPost> {
  static readonly entityName = "blog_post";
  static readonly indexName = "blog_posts";
  static readonly initialState: BlogPost = {
    id: "",
    tenantId: "",
    slug: "",
    title: "",
    content: "",
    authorId: "",
    category: "umum",
    status: 'draft',
    createdAt: 0,
    updatedAt: 0
  };
}

export class MediaItemEntity extends IndexedEntity<MediaItem> {
  static readonly entityName = "media_item";
  static readonly indexName = "media_items";
  static readonly initialState: MediaItem = {
    id: "",
    tenantId: "",
    cloudinaryUrl: "",
    fileName: "",
    fileType: "",
    eventTag: null,
    isWatermarked: false,
    createdAt: 0
  };
}

export class PageSectionEntity extends IndexedEntity<PageSection> {
  static readonly entityName = "page_section";
  static readonly indexName = "page_sections";
  static readonly initialState: PageSection = {
    id: "",
    tenantId: "",
    type: "hero",
    order: 0,
    config: {},
    isVisible: true,
    updatedAt: 0
  };
}

export class KnowledgeSnippetEntity extends IndexedEntity<KnowledgeSnippet> {
  static readonly entityName = "knowledge_snippet";
  static readonly indexName = "knowledge_snippets";
  static readonly initialState: KnowledgeSnippet = {
    id: "",
    tenantId: "",
    content: "",
    priority: 0,
    expirationDate: null,
    createdAt: 0
  };
}

export class TenantEntity extends IndexedEntity<Tenant> {
  static readonly entityName = "tenant";
  static readonly indexName = "tenants";
  static readonly initialState: Tenant = {
    id: "",
    name: "",
    slug: "",
    ownerId: "",
    createdAt: 0,
    address: "",
    city: "",
    latitude: 0,
    longitude: 0,
    timezone: "Asia/Jakarta",
    logoUrl: "",
    bannerUrl: "",
    runningText: "",
    bankInfo: "",
    bio: "",
    status: 'active',
    selectedPersona: 'marbot_muda'
  };
  static seedData: Tenant[] = [
    {
      id: "t1",
      name: "Masjid Al-Hikmah",
      slug: "al-hikmah",
      ownerId: "u1",
      createdAt: Date.now(),
      address: "Jl. Sudirman No. 12, Jakarta",
      city: "Jakarta",
      latitude: -6.2088,
      longitude: 106.8456,
      timezone: "Asia/Jakarta",
      logoUrl: "https://placehold.co/100x100?text=MH",
      bannerUrl: "https://placehold.co/800x200?text=Masjid+Al-Hikmah",
      runningText: "Selamat datang di Portal Masjid Al-Hikmah",
      bankInfo: "BSI 7123456789 a/n Masjid Al-Hikmah",
      bio: "A community-focused mosque dedicated to religious education and social welfare.",
      status: 'active',
      selectedPersona: 'ustadz_muda'
    }
  ];
}

export class UserEntity extends IndexedEntity<AppUser> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: AppUser = {
    id: "",
    name: "",
    email: "",
    role: "jamaah",
    tenantIds: []
  };
}

export class TransactionEntity extends IndexedEntity<Transaction> {
  static readonly entityName = "transaction";
  static readonly indexName = "transactions";
  static readonly initialState: Transaction = {
    id: "",
    tenantId: "",
    type: 'income',
    amount: 0,
    category: "",
    description: "",
    date: Date.now(),
    createdBy: ""
  };
}

export class InventoryItemEntity extends IndexedEntity<InventoryItem> {
  static readonly entityName = "inventory_item";
  static readonly indexName = "inventory";
  static readonly initialState: InventoryItem = {
    id: "",
    tenantId: "",
    name: "",
    quantity: 0,
    condition: 'good',
    location: ""
  };
}

export class EventEntity extends IndexedEntity<Event> {
  static readonly entityName = "event";
  static readonly indexName = "events";
  static readonly initialState: Event = {
    id: "",
    tenantId: "",
    title: "",
    description: "",
    date: Date.now(),
    location: "",
    capacity: 0,
    currentRegistrations: 0
  };
}

export class EventRegistrationEntity extends IndexedEntity<EventRegistration> {
  static readonly entityName = "event_registration";
  static readonly indexName = "event_registrations";
  static readonly initialState: EventRegistration = {
    id: "",
    eventId: "",
    tenantId: "",
    name: "",
    email: "",
    phone: "",
    registeredAt: Date.now()
  };
}

export class ForumPostEntity extends IndexedEntity<ForumPost> {
  static readonly entityName = "forum_post";
  static readonly indexName = "forum_posts";
  static readonly initialState: ForumPost = {
    id: "",
    tenantId: "",
    authorId: "",
    authorName: "",
    category: 'diskusi',
    title: "",
    content: "",
    createdAt: Date.now()
  };
}

export class ZisTransactionEntity extends IndexedEntity<ZisTransaction> {
  static readonly entityName = "zis_transaction";
  static readonly indexName = "zis_transactions";
  static readonly initialState: ZisTransaction = {
    id: "",
    tenantId: "",
    type: 'infaq_shadaqah',
    flow: 'in',
    amount: 0,
    description: "",
    date: Date.now()
  };
}

export class PrayerScheduleEntity extends IndexedEntity<PrayerSchedule> {
  static readonly entityName = "prayer_schedule";
  static readonly indexName = "prayer_schedules";
  static readonly initialState: PrayerSchedule = {
    id: "",
    tenantId: "",
    day: 'monday',
    prayerTime: 'fajr',
    time: "05:00",
    isLocked: false
  };
}

export class NotificationEntity extends IndexedEntity<Notification> {
  static readonly entityName = "notification";
  static readonly indexName = "notifications";
  static readonly initialState: Notification = {
    id: "",
    tenantId: "",
    title: "",
    message: "",
    type: 'info',
    createdAt: Date.now(),
    isBroadcast: false
  };
}

export class ChatRoomEntity extends IndexedEntity<ChatRoom> {
  static readonly entityName = "chat_room";
  static readonly indexName = "chat_rooms";
  static readonly initialState: ChatRoom = {
    id: "",
    tenantId: "",
    name: "",
    participants: [],
    createdAt: Date.now()
  };
}

export class ChatMessageEntity extends IndexedEntity<ChatMessage> {
  static readonly entityName = "chat_message";
  static readonly indexName = "chat_messages";
  static readonly initialState: ChatMessage = {
    id: "",
    chatRoomId: "",
    senderId: "",
    senderName: "",
    message: "",
    timestamp: Date.now()
  };
}

export class UstadzEntity extends IndexedEntity<Ustadz> {
  static readonly entityName = "ustadz";
  static readonly indexName = "ustadz_list";
  static readonly initialState: Ustadz = {
    id: "",
    tenantId: "",
    name: "",
    specialization: "",
    isActive: true,
    createdAt: Date.now()
  };
}

export class MustahikEntity extends IndexedEntity<Mustahik> {
  static readonly entityName = "mustahik";
  static readonly indexName = "mustahik";
  static readonly initialState: Mustahik = {
    id: "",
    tenantId: "",
    name: "",
    category: 'miskin',
    status: 'active',
    registrationDate: Date.now()
  };
}
