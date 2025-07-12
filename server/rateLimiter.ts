import { ExtendedRequest, RateLimitResult } from './types';

const requestCounts: Map<string, number> = new Map();
const lastRequestTimes: Map<string, number> = new Map();

const MAX_REQUESTS_PER_HOUR = 100;
const TIME_WINDOW_MS = 60 * 60 * 1000;
export function checkRateLimit(req: ExtendedRequest | string): RateLimitResult {
  const ip = typeof req === 'string' 
    ? req 
    : (req.clientIp || req.ip || req.headers['x-forwarded-for'] as string || '');
  
  if (!ip) {
    return {
      limited: true,
      remaining: 0,
      resetTime: Date.now() + TIME_WINDOW_MS
    };
  }

  const now = Date.now();
  const lastRequest = lastRequestTimes.get(ip) || 0;
  const requestCount = requestCounts.get(ip) || 0;
  
  if (now - lastRequest > TIME_WINDOW_MS) {
    requestCounts.set(ip, 1);
    lastRequestTimes.set(ip, now);
    return {
      limited: false,
      remaining: MAX_REQUESTS_PER_HOUR - 1,
      resetTime: now + TIME_WINDOW_MS
    };
  }
  
  if (requestCount >= MAX_REQUESTS_PER_HOUR) {
    return {
      limited: true,
      remaining: 0,
      resetTime: lastRequest + TIME_WINDOW_MS
    };
  }
  
  requestCounts.set(ip, requestCount + 1);
  lastRequestTimes.set(ip, now);
  
  return {
    limited: false,
    remaining: MAX_REQUESTS_PER_HOUR - requestCount - 1,
    resetTime: lastRequest + TIME_WINDOW_MS
  };
  requestCounts.set(ip, requestCount + 1);
  lastRequestTimes.set(ip, now);
  
  return {
    limited: false,
    remaining: MAX_REQUESTS_PER_HOUR - requestCount - 1,
    resetTime: lastRequest + TIME_WINDOW_MS
  };
}
