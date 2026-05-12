import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  /** True cuando Upstash no está configurado · request se permite pero loggeamos warn */
  bypassed?: boolean;
}

let cachedLimiter: Ratelimit | null = null;
let warned = false;

const getLimiter = (): Ratelimit | null => {
  if (cachedLimiter) return cachedLimiter;
  const url = import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing · rate limit disabled');
      warned = true;
    }
    return null;
  }
  const redis = new Redis({ url, token });
  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'zenkai:lead-demo',
  });
  return cachedLimiter;
};

/** Sliding window: 5 requests por IP por hora. Si Upstash no está, bypassed:true. */
export const checkRateLimit = async (ipHash: string): Promise<RateLimitResult> => {
  const limiter = getLimiter();
  if (!limiter) {
    return { success: true, limit: 5, remaining: 5, reset: 0, bypassed: true };
  }
  const result = await limiter.limit(ipHash);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
};

export const _resetCache = () => {
  cachedLimiter = null;
  warned = false;
};
