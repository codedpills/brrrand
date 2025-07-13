/**
 * Rate limiting utilities for Cloudflare Workers
 */

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  WINDOW_SIZE: 60 * 60 * 1000, // 1 hour in milliseconds
  MAX_REQUESTS: 100, // Maximum requests per window
  KEY_PREFIX: 'rate_limit:',
} as const;

/**
 * Checks and updates rate limit for a client IP
 */
export async function checkRateLimit(
  clientIp: string, 
  kvStore: KVNamespace
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_CONFIG.WINDOW_SIZE) * RATE_LIMIT_CONFIG.WINDOW_SIZE;
  const resetTime = windowStart + RATE_LIMIT_CONFIG.WINDOW_SIZE;
  
  // Create key for this IP and time window
  const key = `${RATE_LIMIT_CONFIG.KEY_PREFIX}${clientIp}:${windowStart}`;
  
  try {
    // Get current count
    const currentCountStr = await kvStore.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    
    // Check if limit exceeded
    if (currentCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
      return {
        limited: true,
        remaining: 0,
        resetTime,
      };
    }
    
    // Increment counter
    const newCount = currentCount + 1;
    const ttl = Math.ceil((resetTime - now) / 1000); // TTL in seconds
    
    // Store updated count with TTL
    await kvStore.put(key, newCount.toString(), { expirationTtl: ttl });
    
    return {
      limited: false,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - newCount,
      resetTime,
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // On error, allow the request but log it
    return {
      limited: false,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS - 1,
      resetTime,
    };
  }
}

/**
 * Gets current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  clientIp: string, 
  kvStore: KVNamespace
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_CONFIG.WINDOW_SIZE) * RATE_LIMIT_CONFIG.WINDOW_SIZE;
  const resetTime = windowStart + RATE_LIMIT_CONFIG.WINDOW_SIZE;
  
  const key = `${RATE_LIMIT_CONFIG.KEY_PREFIX}${clientIp}:${windowStart}`;
  
  try {
    const currentCountStr = await kvStore.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    
    return {
      limited: currentCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS,
      remaining: Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS - currentCount),
      resetTime,
    };
    
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    
    return {
      limited: false,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS,
      resetTime,
    };
  }
}

/**
 * Clears rate limit for a specific IP (admin function)
 */
export async function clearRateLimit(
  clientIp: string, 
  kvStore: KVNamespace
): Promise<boolean> {
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_CONFIG.WINDOW_SIZE) * RATE_LIMIT_CONFIG.WINDOW_SIZE;
  const key = `${RATE_LIMIT_CONFIG.KEY_PREFIX}${clientIp}:${windowStart}`;
  
  try {
    await kvStore.delete(key);
    return true;
  } catch (error) {
    console.error('Rate limit clear failed:', error);
    return false;
  }
}
