import type { Context, Next } from 'hono';
import { logger } from '../services/logging';

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  keyGenerator: (c: Context) => string;  // Function to generate unique key
  message?: string;       // Custom error message
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiting middleware using Cloudflare Workers KV
 */
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const key = config.keyGenerator(c);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    try {
      // Get existing rate limit data from KV
      const kv = c.env.RATE_LIMIT_KV;
      if (!kv) {
        console.warn('RATE_LIMIT_KV not bound, skipping rate limiting');
        return next();
      }

      const rateLimitKey = `rate_limit:${key}`;
      const existingData = await kv.get(rateLimitKey);
      
      let requests: number[] = [];
      if (existingData) {
        try {
          requests = JSON.parse(existingData);
        } catch (e) {
          console.error('Failed to parse rate limit data:', e);
        }
      }

      // Filter out old requests outside the time window
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if limit exceeded
      const result: RateLimitResult = {
        allowed: requests.length < config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - requests.length),
        resetTime: Math.ceil((windowStart + config.windowMs) / 1000),
      };

      if (!result.allowed) {
        // Calculate retry after (when the oldest request will expire)
        const oldestRequest = Math.min(...requests);
        result.retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
      }

      // Add current request timestamp if allowed
      if (result.allowed) {
        requests.push(now);
        
        // Store updated data in KV with TTL
        await kv.put(rateLimitKey, JSON.stringify(requests), {
          expirationTtl: Math.ceil(config.windowMs / 1000) + 60 // Extra 60s buffer
        });
      }

      // Add rate limit headers to response
      c.header('X-RateLimit-Limit', result.limit.toString());
      c.header('X-RateLimit-Remaining', result.remaining.toString());
      c.header('X-RateLimit-Reset', result.resetTime.toString());

      if (!result.allowed) {
        // Log rate limit violation
        logger.logRateLimitExceeded(c, key, result.limit, config.windowMs);

        // Return secure error response with rate limit headers
        const response = c.json({
          error: 'rate_limit_exceeded',
          message: config.message || 'Too many requests, please try again later.',
          retry_after: result.retryAfter
        }, 429);

        // Add rate limit specific headers
        response.headers.set('Retry-After', (result.retryAfter || 60).toString());
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

        // Add security headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');

        return response;
      }

      return next();

    } catch (error) {
      logger.log('ERROR', 'Rate limiting middleware error', { error: error instanceof Error ? error.message : 'Unknown error' }, c);
      // Fail open - allow request if rate limiting fails
      return next();
    }
  };
};

/**
 * IP-based rate limiting for webhooks
 */
export const webhookIpRateLimit = (c: Context, next: Next) => {
  return rateLimitMiddleware({
    windowMs: parseInt(c.env.WEBHOOK_IP_WINDOW_MS || '3600000'),  // Default: 1 hour
    maxRequests: parseInt(c.env.WEBHOOK_IP_MAX_REQUESTS || '100'),  // Default: 100 requests
    keyGenerator: (ctx: Context) => {
      const ip = ctx.req.header('CF-Connecting-IP') || 
                 ctx.req.header('X-Forwarded-For')?.split(',')[0] || 
                 'unknown';
      return `webhook:ip:${ip}`;
    },
    message: 'Webhook rate limit exceeded for this IP address'
  })(c, next);
};

/**
 * Shop domain-based rate limiting for webhooks
 */
export const webhookShopRateLimit = (c: Context, next: Next) => {
  return rateLimitMiddleware({
    windowMs: parseInt(c.env.WEBHOOK_SHOP_WINDOW_MS || '3600000'),  // Default: 1 hour
    maxRequests: parseInt(c.env.WEBHOOK_SHOP_MAX_REQUESTS || '1000'),  // Default: 1000 requests
    keyGenerator: (ctx: Context) => {
      const shopDomain = ctx.req.header('X-Shopify-Shop-Domain') || 'unknown';
      return `webhook:shop:${shopDomain}`;
    },
    message: 'Webhook rate limit exceeded for this shop'
  })(c, next);
};

/**
 * Combined rate limiting for webhooks (both IP and shop domain)
 */
export const webhookRateLimit = async (c: Context, next: Next) => {
  // Apply IP rate limiting first
  let ipLimitPassed = false;
  await webhookIpRateLimit(c, async () => {
    ipLimitPassed = true;
    return Promise.resolve();
  });

  // If IP rate limit blocked the request, it will have already returned
  if (!ipLimitPassed) {
    return; // Request was blocked by IP rate limit
  }

  // Apply shop domain rate limiting
  return webhookShopRateLimit(c, next);
};

/**
 * Generic rate limiting factory for custom configurations
 */
export const createRateLimit = (config: Partial<RateLimitConfig>) => {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 100,
    keyGenerator: (c: Context) => {
      const ip = c.req.header('CF-Connecting-IP') || 
                 c.req.header('X-Forwarded-For')?.split(',')[0] || 
                 'unknown';
      return `generic:${ip}`;
    },
    message: 'Rate limit exceeded'
  };

  return rateLimitMiddleware({ ...defaultConfig, ...config });
};

/**
 * Rate limiting for API endpoints (stricter limits)
 */
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 60,           // 60 requests per minute
  keyGenerator: (c: Context) => {
    const auth = c.get('auth');
    const identifier = auth?.user_id || 
                       c.req.header('CF-Connecting-IP') || 
                       c.req.header('X-Forwarded-For')?.split(',')[0] || 
                       'anonymous';
    return `api:${identifier}`;
  },
  message: 'API rate limit exceeded'
});

/**
 * Rate limiting for admin endpoints (very strict)
 */
export const adminRateLimit = createRateLimit({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 30,           // 30 requests per minute
  keyGenerator: (c: Context) => {
    const auth = c.get('auth');
    if (!auth?.user_id) {
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      return `admin:anonymous:${ip}`;
    }
    return `admin:user:${auth.user_id}`;
  },
  message: 'Admin API rate limit exceeded'
});