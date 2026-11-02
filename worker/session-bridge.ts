import { getDb, schema } from "./db";
import type { Env } from "./core-utils";
import type { AppUser } from "@shared/types";
import { eq } from "drizzle-orm";

/**
 * Creates an authentic Better Auth session for a user programmatically.
 * Used for onboarding (/api/auth/register-mosque) and verified persona demo switching.
 * Inserts directly into Better Auth sessions table with epoch millisecond timestamps.
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

  const nowSec = Math.floor(Date.now() / 1000);

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
      createdAt: nowSec,
      updatedAt: nowSec,
    });
  }

  // Create an authentic session token for Better Auth
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAtMs = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days in ms
  const sessionId = crypto.randomUUID();

  // Better Auth expects epoch milliseconds for expiresAt in sqlite integer mode
  await db.insert(schema.sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt: expiresAtMs,
    createdAt: nowSec,
    updatedAt: nowSec,
    ipAddress: metadata?.ipAddress || null,
    userAgent: metadata?.userAgent || null,
  });

  return { token, expiresAt: new Date(expiresAtMs) };
}
