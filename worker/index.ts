// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './core-utils';
import { userRoutes } from './user-routes';
export * from './core-utils';

export type ClientErrorReport = { message: string; url: string; timestamp: string } & Record<string, unknown>;

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());

app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));

app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() }}));

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

app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => { console.error(`[ERROR] ${err}`); return c.json({ success: false, error: 'Internal Server Error' }, 500); });

console.log(`Server is running`)

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

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;