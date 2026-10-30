import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle as drizzleBetterSqlite, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema';

export type AppDb = DrizzleD1Database<typeof schema> | BetterSQLite3Database<typeof schema>;

export interface DbContextEnv {
  DB?: D1Database;
  DATABASE_PATH?: string;
  [key: string]: any;
}

export type DbInput = D1Database | DbContextEnv | null | undefined;

let fallbackSqliteDb: BetterSQLite3Database<typeof schema> | null = null;

function isD1Database(val: unknown): val is D1Database {
  return !!val && typeof val === 'object' && typeof (val as D1Database).prepare === 'function';
}

function ensureDirExists(filePath: string) {
  if (filePath && filePath !== ':memory:') {
    const dir = path.dirname(path.resolve(filePath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export interface GetDbOptions {
  sqlitePath?: string;
}

/**
 * Returns a Drizzle database instance initialized with the schema.
 * Supports:
 * - Cloudflare D1 (via `drizzle-orm/d1`) when passed directly or as `env.DB`
 * - Local / VPS SQLite fallback (via `better-sqlite3`) when D1 is not present, connecting to `data/sqlite.db` or `./local.sqlite`
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
      ensureDirExists(envOrD1.DATABASE_PATH);
      const sqlite = new Database(envOrD1.DATABASE_PATH);
      return drizzleBetterSqlite(sqlite, { schema });
    }
  }

  // Case 3: Options specified sqlitePath directly
  if (options?.sqlitePath) {
    ensureDirExists(options.sqlitePath);
    const sqlite = new Database(options.sqlitePath);
    return drizzleBetterSqlite(sqlite, { schema });
  }

  // Case 4: Local SQLite fallback (singleton for process)
  if (!fallbackSqliteDb) {
    const dbPath =
      process.env.LOCAL_DB_PATH ||
      process.env.DATABASE_URL ||
      path.resolve(process.cwd(), 'data', 'sqlite.db');

    ensureDirExists(dbPath);
    const sqlite = new Database(dbPath);
    fallbackSqliteDb = drizzleBetterSqlite(sqlite, { schema });
  }

  return fallbackSqliteDb;
}

export { schema };
export * from './schema';
