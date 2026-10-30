import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { sql } from 'drizzle-orm';
import { Env } from './core-utils';
import { getDb } from './db';
import { userRoutes } from './user-routes';
export * from './core-utils';

export type ClientErrorReport = { message: string; url: string; timestamp: string } & Record<string, unknown>;

export type AppVariables = {
  subdomain: string | null;
};

export const app = new Hono<{ Bindings: Env, Variables: AppVariables }>();

app.use('*', logger());

app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));

app.get('/api/health', async (c) => {
  try {
    const db = getDb(c.env);
    if ('all' in db && typeof (db as any).all === 'function') {
      await (db as any).all(sql`SELECT 1`);
    } else if ('run' in db && typeof (db as any).run === 'function') {
      await (db as any).run(sql`SELECT 1`);
    } else {
      await db.run(sql`SELECT 1`);
    }
    return c.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('[HEALTH CHECK FAILED]', error);
    return c.json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        error: error?.message || 'Database connectivity error',
        timestamp: Date.now(),
      },
    }, 500);
  }
});

app.post('/api/client-errors', async (c) => {
  try {
    const e = await c.req.json<ClientErrorReport>();
    console.error('[CLIENT ERROR]', JSON.stringify({ timestamp: e.timestamp || new Date().toISOString(), message: e.message, url: e.url, stack: e.stack, componentStack: e.componentStack, errorBoundary: e.errorBoundary }, null, 2));
    return c.json({ success: true });
  } catch (error) {
    console.error('[CLIENT ERROR HANDLER] Failed:', error);
    return c.json({ success: false, error: 'Failed to process' }, 500);
  }
});

// Middleware to extract tenant from subdomain
app.use('/api/*', async (c, next) => {
  const url = new URL(c.req.url);
  const host = url.host;
  const hostname = host.split(':')[0]; // Remove port if present

  // Extract subdomain from hostname
  // Assuming format: subdomain.domain.com
  const parts = hostname.split('.');
  let subdomain = null;

  // For development, we might have localhost:port
  if (parts.length >= 3) {
    subdomain = parts[0];
  }

  // Store subdomain in context for later use
  c.set('subdomain', subdomain);

  await next();
});

// Register user routes statically
userRoutes(app);

// Default Cloudflare Worker Exported Handler
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
