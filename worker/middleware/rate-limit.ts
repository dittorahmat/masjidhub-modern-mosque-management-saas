import { Context } from 'hono';
import { bad } from '../core-utils';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Lightweight rate-limiting middleware for sensitive authentication routes.
 * Mitigates credential stuffing, brute force, and automated resource exhaustion.
 *
 * @param maxRequests Maximum allowed requests per window
 * @param windowMs Time window in milliseconds
 */
export function authRateLimiter(maxRequests = 30, windowMs = 60 * 1000) {
  return async (c: Context<any>, next: () => Promise<void>) => {
    // In test environment or preview mocks, allow seamless test iterations
    if (process.env.NODE_ENV === 'test' || c.env?.ENVIRONMENT === 'test') {
      return await next();
    }

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1';

    const path = c.req.path;
    const key = `${ip}:${path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return await next();
    }

    if (record.count >= maxRequests) {
      return bad(c, 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.');
    }

    record.count += 1;
    await next();
  };
}
