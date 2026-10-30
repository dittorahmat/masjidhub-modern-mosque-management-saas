import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// Minimal type signature for the database client
export type AppDb = DrizzleD1Database<typeof schema>;

export interface DbContextEnv {
  DB?: D1Database;
  DATABASE_PATH?: string;
  [key: string]: any;
}

export type DbInput = D1Database | DbContextEnv | null | undefined;

let fallbackSqliteDb: any = null;

function isD1Database(val: unknown): val is D1Database {
  return !!val && typeof val === 'object' && typeof (val as D1Database).prepare === 'function';
}

export interface GetDbOptions {
  sqlitePath?: string;
}

/**
 * Returns a Drizzle database instance initialized with the schema.
 * Supports:
 * - Cloudflare D1 (via `drizzle-orm/d1`) when passed directly or as `env.DB`
 * - Local / VPS SQLite fallback (lazy loaded so better-sqlite3 is not bundled into Cloudflare Workers)
 */
export function getDb(envOrD1?: DbInput, options?: GetDbOptions): AppDb {
  // Case 1: Directly passed a D1Database instance
  if (isD1Database(envOrD1)) {
    return drizzleD1(envOrD1, { schema });
  }

  // Case 2: Passed an environment or context object with DB binding
  if (envOrD1 && typeof envOrD1 === 'object') {
    if ('DB' in envOrD1 && isD1Database(envOrD1.DB)) {
      return drizzleD1(envOrD1.DB, { schema });
    }
    // Optional custom file path for SQLite in env
    if (typeof envOrD1.DATABASE_PATH === 'string' && envOrD1.DATABASE_PATH) {
      return getLocalSqliteDb(envOrD1.DATABASE_PATH);
    }
  }

  // Case 3: Options specified sqlitePath directly
  if (options?.sqlitePath) {
    return getLocalSqliteDb(options.sqlitePath);
  }

  // Case 4: Local SQLite fallback (singleton for process)
  if (!fallbackSqliteDb) {
    const dbPath =
      (typeof process !== 'undefined' &&
        (process.env.SQLITE_DB_PATH || process.env.LOCAL_DB_PATH || process.env.DATABASE_URL)) ||
      './data/sqlite.db';

    fallbackSqliteDb = getLocalSqliteDb(dbPath);
  }

  return fallbackSqliteDb;
}

function getLocalSqliteDb(dbPath: string): any {
  // Isolate require from Vite static analysis by resolving dynamic require at runtime
  try {
    let req: any;
    if (typeof require === 'function') {
      req = require;
    } else {
      const getModule = new Function('return import("node:module")');
      // For synchronous fallback in Node ESM/Bun
      const nodeModule = (globalThis as any).process?.getBuiltinModule?.('node:module');
      if (nodeModule?.createRequire) {
        req = nodeModule.createRequire(import.meta.url);
      }
    }

    if (!req) {
      throw new Error('Runtime require function is not available.');
    }

    const Database = (globalThis as any).Bun?.Database || req('better-sqlite3');
    const { drizzle: drizzleBetterSqlite } = req('drizzle-orm/better-sqlite3');
    const fs = req('node:fs');
    const path = req('node:path');

    if (dbPath && dbPath !== ':memory:') {
      const resolved = path.resolve(dbPath);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const sqlite = new Database(dbPath);
    return drizzleBetterSqlite(sqlite, { schema });
  } catch (err) {
    throw new Error(
      `Failed to initialize local SQLite database at "${dbPath}". Ensure better-sqlite3 is installed or run with Cloudflare D1. Error: ${err}`
    );
  }
}

export { schema };
export * from './schema';
