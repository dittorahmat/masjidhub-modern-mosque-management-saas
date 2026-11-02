/**
 * Cryptographic utilities for Shadow ID generation and security
 */

/**
 * Generates a Shadow ID using HMAC-SHA256
 * @param secret The server-side secret key (Environment Variable)
 * @param data The string to hash (e.g., "userId:tenantId:sessionSalt")
 * @returns Hex-encoded HMAC string
 */
export async function generateShadowId(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  
  // Convert ArrayBuffer to Hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculates SHA-256 hash of a file (ArrayBuffer)
 */
export async function calculateFileHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a random session salt using CSPRNG
 */
export function generateSessionSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a signed session token: base64(payload).signature
 */
export async function createSessionToken(userId: string, secret: string): Promise<string> {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const encodedPayload = btoa(payload);
  const signature = await generateShadowId(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token and returns userId if valid and not expired.
 */
export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, providedSignature] = parts;

  try {
    const expectedSignature = await generateShadowId(secret, encodedPayload);
    if (expectedSignature !== providedSignature) return null;

    const payload = JSON.parse(atob(encodedPayload));
    if (!payload?.userId || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;

    return payload.userId;
  } catch {
    return null;
  }
}
