import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client instance.
 * Automatically handles cookie management and API request credentials in browser.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
});

export const { signIn, signOut, useSession, getSession } = authClient;
