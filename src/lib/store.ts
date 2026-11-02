import { create } from 'zustand';
import type { AppUser, Tenant } from '@shared/types';
import { getStoredUser, setStoredUser, getStoredToken } from './auth-storage';

interface AppActions {
  setUser: (user: AppUser | null, token?: string | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  logout: () => void;
}

interface AppState {
  user: AppUser | null;
  token: string | null;
  currentTenant: Tenant | null;
  actions: AppActions;
}

const EMPTY_ARRAY: any[] = [];

export const useAppStore = create<AppState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  currentTenant: null,
  actions: {
    setUser: (user, token) => {
      setStoredUser(user, token);
      set({ user, token: token || null });
    },
    setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
    logout: () => {
      setStoredUser(null, null);
      set({ user: null, token: null, currentTenant: null });
    },
  },
}));

// Helper hooks for stable primitive selector rule
export const useUserId = () => useAppStore((s) => s.user?.id);
export const useUserRole = () => useAppStore((s) => s.user?.role);
export const useUserName = () => useAppStore((s) => s.user?.name);
export const useUserEmail = () => useAppStore((s) => s.user?.email);
export const useUserTenantIds = () => useAppStore((s) => s.user?.tenantIds ?? EMPTY_ARRAY);
export const useTenantId = () => useAppStore((s) => s.currentTenant?.id);
export const useTenantName = () => useAppStore((s) => s.currentTenant?.name);
export const useTenantStatus = () => useAppStore((s) => s.currentTenant?.status);
export const useTenantSlug = () => useAppStore((s) => s.currentTenant?.slug);
export const useAppActions = () => useAppStore((s) => s.actions);
