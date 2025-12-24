export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
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
  ts: number; // epoch millis
}
// Finance Module Types
export interface Transaction {
  id: string;
  tenantId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: number; // timestamp
  createdBy: string; // userId
}
// Inventory Module Types
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  quantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  location: string;
  lastMaintenance?: number;
}