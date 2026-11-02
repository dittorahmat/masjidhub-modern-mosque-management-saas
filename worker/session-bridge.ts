import { getDb, schema } from "./db";
import type { Env } from "./core-utils";
import type { AppUser } from "@shared/types";
import { eq } from "drizzle-orm";

/**
 * Generates a clean, cryptographically secure 64-character session token.
 */
export function generateSessionToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

/**
 * Creates an authentic Better Auth session for a user programmatically.
 * Used for onboarding (/api/auth/register-mosque) and verified persona demo switching.
 * Strictly adheres to epoch milliseconds (Date.now()) per AGENTS.md § 2.
 */
export async function createBetterAuthSession(
  user: AppUser,
  env?: Env,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb(env);

  // Ensure user exists in users table
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  const nowMs = Date.now();

  if (existingUsers.length === 0) {
    await db.insert(schema.users).values({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantIds?.[0] || null,
      tenantIds: user.tenantIds || [],
      emailVerified: true,
      isActive: true,
      isBanned: false,
      createdAt: nowMs,
      updatedAt: nowMs,
    });
  }

  const token = generateSessionToken();
  const expiresAtMs = nowMs + 1000 * 60 * 60 * 24 * 7; // 7 days in ms
  const sessionId = crypto.randomUUID();

  // Better Auth expects epoch milliseconds for expiresAt, createdAt, updatedAt
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt: expiresAtMs,
    createdAt: nowMs,
    updatedAt: nowMs,
    ipAddress: metadata?.ipAddress || null,
    userAgent: metadata?.userAgent || null,
  });

  return { token, expiresAt: new Date(expiresAtMs) };
}
