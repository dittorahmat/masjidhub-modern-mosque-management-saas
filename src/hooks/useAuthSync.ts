import { useEffect } from 'react';
import { useAppActions } from '@/lib/store';
import { authClient } from '@/lib/auth-client';
import { api } from '@/lib/api-client';
import type { AppUser } from '@shared/types';

/**
 * Hook to synchronize Better Auth session state with the global Zustand app store on mount.
 */
export function useAuthSync() {
  const { setUser } = useAppActions();

  useEffect(() => {
    let isMounted = true;

    async function syncSession() {
      try {
        // Verify session with Better Auth /api/auth/me endpoint
        const user = await api<AppUser>('/api/auth/me');
        if (isMounted && user) {
          setUser(user);
        }
      } catch {
        // If not authenticated, maintain current cached state without throwing
      }
    }

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [setUser]);
}
