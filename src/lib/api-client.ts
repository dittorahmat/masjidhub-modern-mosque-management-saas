import { ApiResponse } from "../../shared/types";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Builds a query string safely ignoring null or undefined values.
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const entries = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

/**
 * Deep HTTP Client wrapper: handles JSON/FormData payloads, query string serialization,
 * non-JSON 502/504 errors, and structured error reporting.
 */
export async function api<T>(path: string, options?: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {};

  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const queryString = buildQueryString(options?.params);
  const fullPath = `${path}${queryString}`;

  const res = await fetch(fullPath, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  let json: ApiResponse<T> | null = null;

  if (contentType.includes('application/json')) {
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      throw new ApiError(res.status, 'Invalid JSON returned from server');
    }
  } else {
    const text = await res.text();
    throw new ApiError(res.status, text || `Request failed with status ${res.status}`);
  }

  if (!res.ok || !json?.success || json?.data === undefined) {
    throw new ApiError(res.status, json?.error || 'Request failed', json);
  }

  return json.data;
}
