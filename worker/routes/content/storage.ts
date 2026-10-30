import { Hono } from "hono";
import { ok, bad, notFound } from "../../core-utils";
import { getStorage } from "../../storage";

export function registerStorageRoutes(app: Hono<any>) {
  // Config Cloudinary
  app.get('/api/config/cloudinary', (c) => {
    return ok(c, {
      cloudName: c.env.CLOUDINARY_CLOUD_NAME || 'masjidhub',
      uploadPreset: c.env.CLOUDINARY_UPLOAD_PRESET || 'masjidhub_preset'
    });
  });

  // --- STORAGE & FILE UPLOAD ---
  app.post('/api/upload', async (c) => {
    try {
      const storage = getStorage(c.env);
      const contentTypeHeader = c.req.header('content-type') || '';

      if (contentTypeHeader.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        const file = (formData.get('file') || formData.get('media')) as unknown as File | null;
        if (!file || !(file instanceof File)) {
          return bad(c, 'No file found in multipart form-data. Key should be "file" or "media".');
        }

        const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
        const randomId = crypto.randomUUID();
        const key = 'uploads/' + randomId + ext;
        const buffer = await file.arrayBuffer();

        const result = await storage.put(key, buffer, { contentType: file.type || 'application/octet-stream' });
        return ok(c, {
          key: result.key,
          url: result.url,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          size: file.size,
        });
      }

      // Handle raw binary file upload
      const arrayBuffer = await c.req.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return bad(c, 'Upload payload is empty');
      }

      const customKey = c.req.query('key');
      const filename = c.req.header('x-filename') || 'file.bin';
      const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '';
      const key = customKey || ('uploads/' + crypto.randomUUID() + ext);
      const contentType = c.req.header('content-type') || 'application/octet-stream';

      const result = await storage.put(key, arrayBuffer, { contentType });
      return ok(c, {
        key: result.key,
        url: result.url,
        fileName: filename,
        fileType: contentType,
        size: arrayBuffer.byteLength,
      });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      return bad(c, err?.message || 'Failed to upload file');
    }
  });

  // Global storage serving handler
  const handleStorageGet = async (c: any) => {
    const fullPath = c.req.path;
    // Strip either /api/storage/ or /api/:slug/storage/
    const key = decodeURIComponent(fullPath.replace(/^\/api(\/[^/]+)?\/storage\//, ''));
    if (!key) return notFound(c, 'Storage key required');

    const storage = getStorage(c.env);
    const item = await storage.get(key);
    if (!item) {
      return notFound(c, 'File not found');
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
  };

  app.get('/api/storage/*', handleStorageGet);
  app.get('/api/:slug/storage/*', handleStorageGet);
}
