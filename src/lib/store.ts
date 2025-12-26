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
export const useUser = () => useAppStore((s) => s.user);
export const useCurrentTenant = () => useAppStore((s) => s.currentTenant);
export const useAppActions = () => useAppStore((s) => s.actions);