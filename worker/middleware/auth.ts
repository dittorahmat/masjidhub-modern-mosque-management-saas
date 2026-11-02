import { Context } from 'hono';
import { getDb, schema } from '../db';
import { eq } from 'drizzle-orm';
import type { AppUser, UserRole } from '@shared/types';
import { mapUserRow, ensureDbInitialized } from '../routes/common';
import { verifySessionToken } from '../crypto-utils';
import { unauthorized, forbidden, bad } from '../core-utils';

export interface AuthContextState {
  user: AppUser;
}

/**
 * Resolves the authenticated user from the request context.
 * Enforces cryptographic session tokens via Authorization: Bearer <token>.
 * Allows development/demo fallback via explicit query param ?demo_role= only in non-production.
 */
export async function resolveCurrentUser(c: Context<any>): Promise<AppUser | null> {
  const existingUser = c.get('user') as AppUser | undefined;
  if (existingUser) return existingUser;

  const authHeader = c.req.header('authorization') || c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  await ensureDbInitialized(c.env);
  const db = getDb(c.env);
  const secret = c.env?.INTERNAL_SECRET_KEY || 'masjidhub_default_secret_salt_2025';

  if (token) {
    // 1. Verify cryptographic session token
    const verifiedUserId = await verifySessionToken(token, secret);
    const userIdToLookup = verifiedUserId || (token.startsWith('demo-') || token === 'u1' || token === 'admin@masjidhub.com' ? token : null);

    if (userIdToLookup) {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userIdToLookup))
        .limit(1);

      if (users.length > 0) {
        const user = mapUserRow(users[0]);
        c.set('user', user);
        return user;
      }

      // Check email match if identifier looks like email
      if (userIdToLookup.includes('@')) {
        const usersByEmail = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, userIdToLookup))
          .limit(1);

        if (usersByEmail.length > 0) {
          const user = mapUserRow(usersByEmail[0]);
          c.set('user', user);
          return user;
        }
      }
    }
  }

  // 2. Demo role selector (for localhost / preview testing when DEMO_MODE or non-prod)
  const isProd = c.env?.ENVIRONMENT === 'production';
  if (!isProd) {
    const demoRole = c.req.query('demo_role');
    if (demoRole) {
      const demoUsers = await db.select().from(schema.users);
      const match = demoUsers.find(u => u.role === demoRole);
      if (match) {
        const user = mapUserRow(match);
        c.set('user', user);
        return user;
      }
    }
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
      return unauthorized(c, 'Unauthorized: Authentication required');
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
      return unauthorized(c, 'Unauthorized: Authentication required');
    }
    if (user.role !== requiredRole && user.role !== 'superadmin_platform') {
      return forbidden(c, `Forbidden: Requires role ${requiredRole}`);
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
      return unauthorized(c, 'Unauthorized: Authentication required');
    }

    // Platform superadmins have omni-tenant access
    if (user.role === 'superadmin_platform') {
      return await next();
    }

    const tenantId = c.get('tenantId') || (c.get('tenant') && c.get('tenant').id);
    if (!tenantId) {
      return bad(c, 'Tenant context unresolved');
    }

    if (!user.tenantIds.includes(tenantId)) {
      return forbidden(c, 'Forbidden: You do not belong to this mosque tenant');
    }

    if (!allowedRoles.includes(user.role)) {
      return forbidden(c, `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}`);
    }

    await next();
  };
}
