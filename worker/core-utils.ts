/**
 * Core utilities for Mosque Management API.
 * Note: Legacy Durable Objects have been deprecated in favor of Cloudflare D1 (SQLite) and R2 Storage.
 */
import type { ApiResponse } from "@shared/types";
import type { Context } from "hono";

export interface Env {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  GEMINI_API_KEY?: string;
  INTERNAL_SECRET_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
  DATABASE_PATH?: string;
  [key: string]: any;
}

/**
 * @deprecated Legacy Durable Object stub kept only for backward compatibility.
 * All data has been migrated to Cloudflare D1 (SQLite) and Drizzle ORM.
 */
export class GlobalDurableObject {
  constructor(_ctx?: any, _env?: any) {}
  async del(_key: string): Promise<boolean> { return false; }
  async has(_key: string): Promise<boolean> { return false; }
  async getDoc<T>(_key: string): Promise<any> { return null; }
  async casPut<T>(_key: string, _expectedV: number, _data: T): Promise<{ ok: boolean; v: number }> { return { ok: true, v: 1 }; }
  async listPrefix(_prefix: string, _startAfter?: string | null, _limit?: number) { return { keys: [], next: null }; }
  async indexAddBatch<T>(_items: T[]): Promise<void> {}
  async indexRemoveBatch<T>(_items: T[]): Promise<number> { return 0; }
  async indexDrop(_rootKey: string): Promise<void> {}
}

/**
 * @deprecated Base class for legacy entity access. All active models use Drizzle schema.
 */
export abstract class Entity<State> {
  protected _state!: State;
  constructor(protected env: Env, protected id: string) {}
  static keyOf<S extends { id: string }>(state: S): string {
    return state.id;
  }
  async getState(): Promise<State> {
    return this._state;
  }
  async save(state: State): Promise<void> {
    this._state = state;
  }
  async delete(): Promise<boolean> {
    return true;
  }
}

/**
 * @deprecated Legacy IndexedEntity class retained for compatibility. Active storage uses D1.
 */
export abstract class IndexedEntity<S extends { id: string }> extends Entity<S> {
  static readonly entityName: string = "entity";
  static readonly indexName: string = "entities";
  static readonly initialState: any = {};
  static readonly seedData?: any[];

  static async create(env: Env, state: any): Promise<any> {
    return state;
  }
  static async list(env: Env, cursor?: string | null, limit?: number): Promise<{ items: any[]; next: string | null }> {
    return { items: [], next: null };
  }
  static async ensureSeed(env: Env): Promise<void> {}
  static async delete(env: Env, id: string): Promise<boolean> {
    return true;
  }
  static async deleteMany(env: Env, ids: string[]): Promise<number> {
    return ids.length;
  }
  static async removeFromIndex(env: Env, id: string): Promise<void> {}
}

// API HELPERS
export const ok = <T>(c: Context, data: T) => c.json({ success: true, data } as ApiResponse<T>);
export const bad = (c: Context, error: string) => c.json({ success: false, error } as ApiResponse, 400);
export const notFound = (c: Context, error = 'not found') => c.json({ success: false, error } as ApiResponse, 404);
export const isStr = (s: unknown): s is string => typeof s === 'string' && s.length > 0;
