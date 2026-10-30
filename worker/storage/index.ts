export interface StorageService {
  put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: { contentType?: string }
  ): Promise<{ key: string; url: string }>;
  get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; contentType?: string } | null>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

class R2StorageService implements StorageService {
  private bucket: R2Bucket;
  private publicBaseUrl: string;

  constructor(bucket: R2Bucket, publicBaseUrl?: string) {
    this.bucket = bucket;
    this.publicBaseUrl = publicBaseUrl || '/api/storage';
  }

  async put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: { contentType?: string }
  ): Promise<{ key: string; url: string }> {
    const cleanKey = key.replace(/^\/+/, '');
    const httpMetadata: Record<string, string> = {};
    if (options?.contentType) {
      httpMetadata.contentType = options.contentType;
    }

    await this.bucket.put(cleanKey, data, {
      httpMetadata: Object.keys(httpMetadata).length > 0 ? httpMetadata : undefined,
    });

    return {
      key: cleanKey,
      url: this.getUrl(cleanKey),
    };
  }

  async get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; contentType?: string } | null> {
    const cleanKey = key.replace(/^\/+/, '');
    const object = await this.bucket.get(cleanKey);
    if (!object) {
      return null;
    }

    return {
      data: object.body,
      contentType: object.httpMetadata?.contentType,
    };
  }

  async delete(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    await this.bucket.delete(cleanKey);
    return true;
  }

  getUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
}

class LocalFilesystemStorageService implements StorageService {
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor(uploadDir = 'uploads', publicBaseUrl = '/api/storage') {
    this.uploadDir = uploadDir;
    this.publicBaseUrl = publicBaseUrl;
  }

  private async getFsModules() {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    return { fs, path };
  }

  private async ensureDir(filePath: string) {
    const { fs, path } = await this.getFsModules();
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async streamToUint8Array(stream: ReadableStream): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLength += value.length;
      }
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  async put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: { contentType?: string }
  ): Promise<{ key: string; url: string }> {
    const cleanKey = key.replace(/^\/+/, '');
    const { fs, path } = await this.getFsModules();
    const filePath = path.join(process.cwd(), this.uploadDir, cleanKey);
    const metaPath = `${filePath}.meta.json`;

    await this.ensureDir(filePath);

    let bytes: Uint8Array;
    if (data instanceof Uint8Array) {
      bytes = data;
    } else if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else {
      bytes = await this.streamToUint8Array(data);
    }

    await fs.writeFile(filePath, bytes);

    if (options?.contentType) {
      await fs.writeFile(metaPath, JSON.stringify({ contentType: options.contentType }), 'utf8');
    }

    return {
      key: cleanKey,
      url: this.getUrl(cleanKey),
    };
  }

  async get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; contentType?: string } | null> {
    const cleanKey = key.replace(/^\/+/, '');
    const { fs, path } = await this.getFsModules();
    const filePath = path.join(process.cwd(), this.uploadDir, cleanKey);
    const metaPath = `${filePath}.meta.json`;

    try {
      const fileData = await fs.readFile(filePath);
      let contentType: string | undefined;

      try {
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const parsed = JSON.parse(metaContent);
        contentType = parsed.contentType;
      } catch {
        // Fallback or no meta file
      }

      const buffer = fileData.buffer.slice(
        fileData.byteOffset,
        fileData.byteOffset + fileData.byteLength
      ) as ArrayBuffer;

      return {
        data: buffer,
        contentType,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    const { fs, path } = await this.getFsModules();
    const filePath = path.join(process.cwd(), this.uploadDir, cleanKey);
    const metaPath = `${filePath}.meta.json`;

    let deleted = false;
    try {
      await fs.unlink(filePath);
      deleted = true;
    } catch {
      // Ignore if not exists
    }

    try {
      await fs.unlink(metaPath);
    } catch {
      // Ignore
    }

    return deleted;
  }

  getUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
}

export function getStorage(env?: any): StorageService {
  if (env?.BUCKET) {
    return new R2StorageService(env.BUCKET);
  }
  return new LocalFilesystemStorageService();
}
