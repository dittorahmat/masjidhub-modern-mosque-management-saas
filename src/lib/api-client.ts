import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  
  // Only set application/json if body is not FormData
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { 
    ...init,
    headers: { 
      ...headers, 
      ...init?.headers 
    }
  })
  
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}