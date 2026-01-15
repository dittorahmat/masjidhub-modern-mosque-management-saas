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
  isBanned?: boolean; // For user banning functionality
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
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
  payment_reference?: string; // Transaction ID from payment gateway
  payment_gateway?: string; // Name of the payment gateway used
  payment_date?: number; // When the payment was processed
}
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  quantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string;
  lastMaintenance?: number;
  maintenanceIntervalDays?: number; // Days between maintenance
  nextMaintenanceDate?: number;    // Calculated next maintenance date
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
  speaker?: string;        // Speaker/preacher for the event
  minDonation?: number;    // Minimum donation required for the event (0 for free events)
  imageUrl?: string;
  isFundraising?: boolean; // If true, this event is specifically for fundraising
  targetAmount?: number;   // Target amount if it's a fundraising event
  collectedAmount?: number; // Total amount collected for this event
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
  isBanned?: boolean; // For post banning functionality
  likeCount?: number;
  commentCount?: number;
}
export interface PrayerSchedule {
  id: string;
  tenantId: string;
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  prayerTime: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  time: string; // in HH:MM format
  imamName?: string;
  khatibName?: string; // for Friday prayers
  khutbahTopic?: string;
  khutbahFileUrl?: string; // URL to khutbah material (PDF/Audio)
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
  address?: string;
  legalDocUrl?: string;  // URL to legal document
  logoUrl?: string;      // URL to mosque logo
  bannerUrl?: string;    // URL to banner image
  runningText?: string;  // Running text for announcements
  bankInfo?: string;
  bio?: string;
  status: 'active' | 'pending' | 'suspended';
}
export interface ChatRoom {
  id: string;
  tenantId: string;
  name: string; // Name of the chat room (e.g. "Konsultasi dengan Ustadz Ahmad")
  participants: string[]; // User IDs participating in the chat
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
  readBy?: string[]; // User IDs who have read the message
}

export interface Ustadz {
  id: string;
  tenantId: string;
  name: string;
  specialization: string; // e.g. "Fikih", "Tafsir", "Sirah"
  bio?: string;
  isActive: boolean;
  createdAt: number;
}

export interface OrganizationMember {
  id: string;
  tenantId: string;
  name: string;
  role: string; // e.g. "Ketua DKM", "Bendahara", "Sekretaris"
  imageUrl?: string;
  order: number; // For sorting the hierarchy
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
  nik?: string; // Nomor Induk Kependudukan
  phone?: string;
  address?: string;
  category: 'fakir' | 'miskin' | 'amil' | 'mualaf' | 'gharim' | 'riqab' | 'musafir' | 'other'; // Categories of recipients
  status: 'active' | 'inactive' | 'completed'; // Status of assistance
  registrationDate: number;
  lastAssistanceDate?: number;
  notes?: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string; // If null/undefined, it's a broadcast notification to all users in tenant
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