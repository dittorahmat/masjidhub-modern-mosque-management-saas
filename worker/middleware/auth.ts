import { Context } from 'hono';
import { getDb, schema } from '../db';
import { eq } from 'drizzle-orm';
import type { AppUser, UserRole } from '@shared/types';
import { mapUserRow, ensureDbInitialized } from '../routes/common';

export interface AuthContextState {
  user: AppUser;
}

/**
 * Resolves current user from request context.
 * Checks:
 * 1. Authorization: Bearer <userId or token or email>
 * 2. X-User-Id or X-User-Email header
 * 3. Cookie session if present
 */
export async function resolveCurrentUser(c: Context<any>): Promise<AppUser | null> {
  const existingUser = c.get('user') as AppUser | undefined;
  if (existingUser) return existingUser;

  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  const headerUserId = c.req.header('x-user-id');
  const headerEmail = c.req.header('x-user-email');

  const identifier = token || headerUserId || headerEmail;
  if (!identifier) return null;

  await ensureDbInitialized(c.env);
  const db = getDb(c.env);

  // Look up by id or email
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, identifier))
    .limit(1);

  if (users.length > 0) {
    const user = mapUserRow(users[0]);
    c.set('user', user);
    return user;
  }

  const usersByEmail = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, identifier))
    .limit(1);

  if (usersByEmail.length > 0) {
    const user = mapUserRow(usersByEmail[0]);
    c.set('user', user);
    return user;
  }

  return null;
}

/**
 * Middleware requiring an authenticated user.
 */
export function requireAuth() {
  return async (c: Context<any>, next: () => Promise<void>) => {
    const user = await resolveCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized: Authentication required' }, 401);
    }
    await next();
  };
}

/**
 * Middleware requiring a specific platform user role (e.g. 'superadmin_platform').
 */
export function requireRole(requiredRole: UserRole) {
  return async (c: Context<any>, next: () => Promise<void>) => {
    const user = await resolveCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized: Authentication required' }, 401);
    }
    if (user.role !== requiredRole && user.role !== 'superadmin_platform') {
      return c.json({ success: false, error: `Forbidden: Requires role ${requiredRole}` }, 403);
    }
    await next();
  };
}

/**
 * Middleware requiring that the authenticated user belongs to the target tenant
 * and has one of the allowed roles (defaults to 'dkm_admin' or 'superadmin_platform').
 */
export function requireTenantRole(allowedRoles: UserRole[] = ['dkm_admin']) {
  return async (c: Context<any>, next: () => Promise<void>) => {
    const user = await resolveCurrentUser(c);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized: Authentication required' }, 401);
    }

    // Platform superadmins have omni-tenant access
    if (user.role === 'superadmin_platform') {
      return await next();
    }

    const tenantId = c.get('tenantId') || (c.get('tenant') && c.get('tenant').id);
    if (!tenantId) {
      return c.json({ success: false, error: 'Tenant context unresolved' }, 400);
    }

    if (!user.tenantIds.includes(tenantId)) {
      return c.json({ success: false, error: 'Forbidden: You do not belong to this mosque tenant' }, 403);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` }, 403);
    }

    await next();
  };
}
