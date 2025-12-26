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
  mustahik_id?: string;
  description: string;
  date: number;
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
}
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  quantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string;
  lastMaintenance?: number;
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
  imageUrl?: string;
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
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
  address?: string;
  bankInfo?: string;
  bio?: string;
  status: 'active' | 'pending' | 'suspended';
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