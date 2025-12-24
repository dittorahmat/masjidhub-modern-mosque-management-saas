export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'superadmin' | 'mosque_admin' | 'takmir' | 'jamaah';
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
// Restoring types for TemplateDemo.tsx
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
// Super Admin Specific Types
export interface GlobalStats {
  totalTenants: number;
  totalUsers: number;
  totalBalance: number;
  activeEvents: number;
}
export interface TenantWithStats extends Tenant {
  memberCount: number;
  totalBalance: number;
  eventCount: number;
}