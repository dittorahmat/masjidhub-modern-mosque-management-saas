import { getStorage } from './index';

export interface UploadMediaOptions {
  category?: 'receipts' | 'qris' | 'documents' | 'general' | 'avatars';
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
}

export interface UploadMediaResult {
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
];

const DEFAULT_MAX_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Deep Asset Storage Module: Encapsulates key generation, MIME filtering,
 * size checks, and binary data dispatch behind a clean domain interface.
 */
export async function uploadAsset(
  env: any,
  file: File | { data: ArrayBuffer | Uint8Array; name: string; type?: string },
  options: UploadMediaOptions = {}
): Promise<UploadMediaResult> {
  const allowed = options.allowedMimeTypes || DEFAULT_ALLOWED_TYPES;
  const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;

  let buffer: ArrayBuffer;
  let filename = 'file';
  let contentType = 'application/octet-stream';
  let size = 0;

  if (file instanceof File) {
    filename = file.name;
    contentType = file.type || 'application/octet-stream';
    size = file.size;
    buffer = await file.arrayBuffer();
  } else {
    filename = file.name || 'file';
    contentType = file.type || 'application/octet-stream';
    buffer = file.data instanceof Uint8Array ? file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) : file.data;
    size = buffer.byteLength;
  }

  if (size > maxSize) {
    throw new Error(`File size exceeds maximum allowed limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  if (contentType !== 'application/octet-stream' && !allowed.includes(contentType)) {
    throw new Error(`File type '${contentType}' is not permitted.`);
  }

  // Generate canonical key
  const ext = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
  const categoryPrefix = options.category ? `${options.category}/` : '';
  const key = `uploads/${categoryPrefix}${crypto.randomUUID()}${ext}`;

  const storage = getStorage(env);
  const result = await storage.put(key, buffer, { contentType });

  return {
    key: result.key,
    url: result.url,
    filename,
    contentType,
    size,
  };
}
