import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const loginFailuresMap = new Map<string, RateLimitRecord>();
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginFailuresMap.entries()) {
      if (record.resetAt <= now && (!record.blockedUntil || record.blockedUntil <= now)) {
        loginFailuresMap.delete(key);
      }
    }
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Checks if login is currently blocked due to 5 consecutive failed attempts.
 */
export function checkLoginRateLimit(req: NextRequest, prefix: string): { blocked: boolean; minutesLeft: number } {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = loginFailuresMap.get(key);

  if (record && record.blockedUntil && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / (60 * 1000));
    return { blocked: true, minutesLeft };
  }

  return { blocked: false, minutesLeft: 0 };
}

/**
 * Records a failed login attempt. If failures reach 5, blocks IP for 15 minutes.
 */
export function recordLoginFailure(req: NextRequest, prefix: string): void {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = loginFailuresMap.get(key);

  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (!record || record.resetAt <= now) {
    loginFailuresMap.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  record.count += 1;
  if (record.count >= 5) {
    record.blockedUntil = now + windowMs;
  }
}

/**
 * Resets failed attempts upon successful login.
 */
export function resetLoginRateLimit(req: NextRequest, prefix: string): void {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  loginFailuresMap.delete(key);
}

/**
 * Standard general rate limiter helper.
 */
export function checkRateLimit(
  req: NextRequest,
  keyPrefix: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const ip = getClientIp(req);
  const cacheKey = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(cacheKey);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(cacheKey, {
      count: 1,
      resetAt: now + windowMs
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: Math.ceil(windowMs / 1000)
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetInSeconds
  };
}
