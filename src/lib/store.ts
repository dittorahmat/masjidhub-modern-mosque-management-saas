import { create } from 'zustand';
import type { AppUser, Tenant } from '@shared/types';
interface AppActions {
  setUser: (user: AppUser | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  logout: () => void;
}
interface AppState {
  user: AppUser | null;
  currentTenant: Tenant | null;
  actions: AppActions;
}
export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentTenant: null,
  actions: {
    setUser: (user) => set({ user }),
    setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
    logout: () => set({ user: null, currentTenant: null }),
  },
}));
// Helper hooks for strict primitive selector rule
export const useUserId = () => useAppStore((s) => s.user?.id);
export const useUserRole = () => useAppStore((s) => s.user?.role);
export const useUserName = () => useAppStore((s) => s.user?.name);
export const useUserEmail = () => useAppStore((s) => s.user?.email);
export const useUserTenantIds = () => useAppStore((s) => s.user?.tenantIds ?? []);
export const useTenantId = () => useAppStore((s) => s.currentTenant?.id);
export const useTenantName = () => useAppStore((s) => s.currentTenant?.name);
export const useTenantStatus = () => useAppStore((s) => s.currentTenant?.status);
export const useTenantSlug = () => useAppStore((s) => s.currentTenant?.slug);
export const useAppActions = () => useAppStore((s) => s.actions);