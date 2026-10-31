import { Context } from 'hono';
import { getTenantBySlugOrSubdomain, ensureDbInitialized } from '../routes/common';
import { getDb, type AppDb } from '../db';
import type { Tenant } from '@shared/types';
import { notFound } from '../core-utils';

export interface TenantContextState {
  tenant: Tenant;
  db: AppDb;
  tenantId: string;
}

/**
 * Resolves the tenant and guarantees an initialized database connection.
 * If the route handler has a :slug param or a subdomain variable, this middleware
 * checks existence once and provides `c.var.tenant` and `c.var.db`.
 */
export async function tenantMiddleware(c: Context<any>, next: () => Promise<void>) {
  // Check if tenant context was already resolved
  if (c.get('tenant') && c.get('db')) {
    return await next();
  }

  const tenant = await getTenantBySlugOrSubdomain(c, c.env);
  if (!tenant) {
    return notFound(c, 'Tenant not found');
  }

  await ensureDbInitialized(c.env);
  const db = getDb(c.env);

  c.set('tenant', tenant);
  c.set('tenantId', tenant.id);
  c.set('db', db);

  await next();
}

/**
 * Helper to retrieve the strongly-typed TenantContext from Hono Context.
 * Falls back to direct resolution if invoked outside the middleware.
 */
export async function resolveTenantContext(c: Context<any>): Promise<{ tenant: Tenant; db: AppDb } | null> {
  let tenant = c.get('tenant') as Tenant | undefined;
  let db = c.get('db') as AppDb | undefined;

  if (tenant && db) {
    return { tenant, db };
  }

  tenant = (await getTenantBySlugOrSubdomain(c, c.env)) || undefined;
  if (!tenant) return null;

  await ensureDbInitialized(c.env);
  db = getDb(c.env);

  c.set('tenant', tenant);
  c.set('tenantId', tenant.id);
  c.set('db', db);

  return { tenant, db };
}
