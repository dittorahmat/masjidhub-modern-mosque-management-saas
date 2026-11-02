import type { AppUser } from '@shared/types';

const STORAGE_KEY = 'masjidhub_user';

/**
 * Safely loads the cached AppUser from localStorage.
 */
export function getStoredUser(): AppUser | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AppUser) : null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Safely saves the AppUser to localStorage or clears it if null.
 */
export function setStoredUser(user: AppUser | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage quota or access errors
  }
}
