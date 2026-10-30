import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import fs from 'node:fs';
import { app } from './index';
import { getStorage } from './storage';

// In Node/VPS environments, read environment variables from process.env
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Resolve frontend client dist directory (Vite output is in dist/client or dist)
const clientDistCandidates = [
  path.resolve(process.cwd(), 'dist', 'client'),
  path.resolve(process.cwd(), 'dist'),
];
const clientDistDir = clientDistCandidates.find((d) => fs.existsSync(path.join(d, 'index.html'))) || clientDistCandidates[0];

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Serve local storage uploads at /uploads/*
app.get('/uploads/*', async (c) => {
  const rawPath = c.req.path.replace(/^\/uploads\//, '');
  const key = decodeURIComponent(rawPath);
  if (!key) return c.text('File not found', 404);

  const storage = getStorage({ UPLOAD_DIR: uploadDir });
  const item = await storage.get(key);
  if (!item) {
    return c.text('File not found', 404);
  }

  const headers: Record<string, string> = {
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  if (item.contentType) {
    headers['Content-Type'] = item.contentType;
  }

  return new Response(item.data as any, {
    status: 200,
    headers,
  });
});

// 2. Serve static assets from frontend build
app.use(
  '/*',
  serveStatic({
    root: path.relative(process.cwd(), clientDistDir),
  })
);

// 3. Fallback to index.html for Single Page Application client-side routing
app.get('*', async (c) => {
  const indexPath = path.join(clientDistDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    return c.html(html);
  }
  return c.text('MasjidHub API server running. (Frontend dist not found, run `bun run build` first)', 200);
});

console.log(`[MasjidHub] Starting standalone VPS/Node server...`);
console.log(`[MasjidHub] Client dist path: ${clientDistDir}`);
console.log(`[MasjidHub] Uploads path: ${uploadDir}`);

serve({
  fetch: (request) => {
    return app.fetch(request, {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      INTERNAL_SECRET_KEY: process.env.INTERNAL_SECRET_KEY,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
      UPLOAD_DIR: uploadDir,
      SQLITE_DB_PATH: process.env.SQLITE_DB_PATH,
    });
  },
  port,
  hostname: host,
}, (info) => {
  console.log(`[MasjidHub] Server is listening at http://${info.address}:${info.port}`);
});
