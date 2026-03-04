export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'superadmin_platform' | 'dkm_admin' | 'amil_zakat' | 'ustadz' | 'jamaah';
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantIds: string[];
  isBanned?: boolean;
}
export interface Transaction {
  id: string;
  tenantId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: number;
  createdBy: string;
}
export interface ZisTransaction {
  id: string;
  tenantId: string;
  type: 'zakat_fitrah' | 'zakat_maal' | 'fidyah' | 'infaq_shadaqah';
  flow: 'in' | 'out';
  amount: number;
  muzakki_name?: string;
  muzakki_email?: string;
  muzakki_phone?: string;
  mustahik_id?: string;
  description: string;
  date: number;
  payment_method?: 'cash' | 'bank_transfer' | 'mobile_payment' | 'credit_card';
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_reference?: string;
  payment_gateway?: string;
  payment_date?: number;
}
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  quantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string;
  lastMaintenance?: number;
  maintenanceIntervalDays?: number;
  nextMaintenanceDate?: number;
}
export interface Event {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  date: number;
  location: string;
  capacity: number;
  currentRegistrations: number;
  speaker?: string;
  minDonation?: number;
  imageUrl?: string;
  isFundraising?: boolean;
  targetAmount?: number;
  collectedAmount?: number;
}
export interface EventRegistration {
  id: string;
  eventId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: number;
}
export interface ForumPost {
  id: string;
  tenantId: string;
  authorId: string;
  authorName: string;
  category: 'kajian' | 'pengumuman' | 'diskusi';
  title: string;
  content: string;
  createdAt: number;
  isPinned?: boolean;
  isBanned?: boolean;
  likeCount?: number;
  commentCount?: number;
}
export interface DailyPrayer {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  isLocked?: boolean;
  imamName?: string;
}

export interface MonthlyPrayerSchedule {
  id: string; // Format: tenantId:YYYY-MM
  tenantId: string;
  year: number;
  month: number;
  days: Record<string, DailyPrayer>; // Key: YYYY-MM-DD
}

export interface PrayerSchedule {
  id: string;
  tenantId: string;
  date?: string;
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  prayerTime: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  time: string;
  imamName?: string;
  khatibName?: string;
  khutbahTopic?: string;
  khutbahFileUrl?: string;
  isLocked?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  legalDocUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  runningText?: string;
  bankInfo?: string;
  bio?: string;
  status: 'active' | 'pending' | 'suspended';
  aiEnabled?: boolean;
  selectedPersona?: AIPersona;
  kioskRunningText?: string;
  kioskPrayerMode?: 'silent' | 'clock';
  sholatDuration?: number; // NEW: Duration of silent mode in minutes
  iqomahMinutes?: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
}

export interface ChatRoom {
  id: string;
  tenantId: string;
  name: string;
  participants: string[];
  createdAt: number;
  lastMessageAt?: number;
  lastMessage?: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  readBy?: string[];
}

export interface ChatSession {
  id: string;
  tenantId: string;
  userId: string | null;
  isAnonymous: boolean;
  sessionSalt: string;
  status: 'active' | 'closed';
  createdAt: number;
  lastActivityAt: number;
}

export interface AIChatMessage {
  id: string;
  sessionId: string;
  tenantId: string;
  senderRole: 'user' | 'ai' | 'admin';
  text: string;
  timestamp: number;
  metadata?: {
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
  };
}

export interface BlogPost {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  status: 'draft' | 'published';
  createdAt: number;
  updatedAt: number;
}

export interface MediaItem {
  id: string;
  tenantId: string;
  cloudinaryUrl: string;
  fileName: string;
  fileType: string;
  eventTag: string | null;
  isWatermarked: boolean;
  createdAt: number;
}

export interface PageSection {
  id: string;
  tenantId: string;
  type: string;
  order: number;
  config: Record<string, unknown>;
  isVisible: boolean;
  updatedAt: number;
}

export interface KnowledgeSnippet {
  id: string;
  tenantId: string;
  content: string;
  priority: number;
  expirationDate: number | null;
  createdAt: number;
}

export interface StatementLog {
  id: string;
  tenantId: string;
  fileHash: string;
  fileName: string;
  processedAt: number;
  transactionCount: number;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  fingerprint: string;
  suggestedCategory: string;
  rationale: string;
  isDuplicate?: boolean;
}

export type AIPersona = 'marbot_muda' | 'ustadz_muda' | 'sekretaris_digital' | 'kakak_risma';

export interface Ustadz {
  id: string;
  tenantId: string;
  name: string;
  specialization: string;
  bio?: string;
  isActive: boolean;
  createdAt: number;
}

export interface OrganizationMember {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  imageUrl?: string;
  order: number;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    whatsapp?: string;
  };
}

export interface Mustahik {
  id: string;
  tenantId: string;
  name: string;
  nik?: string;
  phone?: string;
  address?: string;
  category: 'fakir' | 'miskin' | 'amil' | 'mualaf' | 'gharim' | 'riqab' | 'musafir' | 'other';
  status: 'active' | 'inactive' | 'completed';
  registrationDate: number;
  lastAssistanceDate?: number;
  notes?: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'announcement';
  createdAt: number;
  readAt?: number;
  isBroadcast: boolean;
}

export interface GlobalStats {
  totalTenants: number;
  totalUsers: number;
  totalBalance: number;
  activeEvents: number;
  pendingApprovals: number;
}
export interface TenantWithStats extends Tenant {
  memberCount: number;
  totalBalance: number;
  eventCount: number;
}
