// Simple in-memory rate limiter (use Redis in production)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = parseInt(process.env.MAX_JOIN_ATTEMPTS || '5', 10);
const WINDOW_MS = parseInt(process.env.JOIN_CODE_RATE_LIMIT_WINDOW_MS || '60000', 10);

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetAt: entry.resetAt,
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute
