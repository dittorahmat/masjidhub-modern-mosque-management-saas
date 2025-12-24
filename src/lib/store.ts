import { create } from 'zustand';
import type { AppUser } from '../../worker/entities';
import type { Tenant } from '../../shared/types';
interface AppState {
  user: AppUser | null;
  currentTenant: Tenant | null;
  setUser: (user: AppUser | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  logout: () => void;
}
export const useAppStore = create<AppState>((set) => ({
  user: null,
  currentTenant: null,
  setUser: (user) => set({ user }),
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  logout: () => set({ user: null, currentTenant: null }),
}));