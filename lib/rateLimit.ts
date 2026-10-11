/**
 * FIX #1 — Rate Limiting
 * In-memory sliding window rate limiter. No Redis required.
 * Works per-IP, resets automatically.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const key = identifier;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Extract real IP from Next.js request headers */
export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (real) return real.trim();
  return "unknown";
}

/** Pre-configured limiters */
export const LIMITS = {
  /** Login: 10 attempts per 15 minutes */
  login: { limit: 10, windowSec: 15 * 60 },
  /** Register: 5 per hour */
  register: { limit: 5, windowSec: 60 * 60 },
  /** Password reset: 3 per hour */
  passwordReset: { limit: 3, windowSec: 60 * 60 },
  /** General API: 100 per minute */
  api: { limit: 100, windowSec: 60 },
  /** Submissions: 20 per hour */
  submissions: { limit: 20, windowSec: 60 * 60 },
};
