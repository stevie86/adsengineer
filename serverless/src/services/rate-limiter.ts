/**
 * Rate Limiting Service
 * 
 * Implements token bucket rate limiting for API endpoints.
 * Distributed across Cloudflare edge locations.
 */

interface RateLimitConfig {
  requests: number;
  window: '1s' | '1m' | '5m' | '1h';
}

interface RateLimiterContext {
  kv: KVNamespace;
  ip: string;
  token: string;
}

class RateLimiter {
  private config: RateLimitConfig;
  private windowMs: number;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.windowMs = this.parseWindow(config.window);
  }

  private parseWindow(window: string): number {
    const map: Record<string, number> = {
      '1s': 1000,
      '1m': 60000,
      '5m': 300000,
      '1h': 3600000,
    };
    return map[window] || 60000;
  }

  private getWindowKey(ip: string): string {
    const windowStart = Math.floor(Date.now() / this.windowMs);
    return `${ip}:${windowStart}`;
  }

  /**
   * Check if request should be rate limited
   */
  async check(ctx: RateLimiterContext): Promise<boolean> {
    const key = this.getWindowKey(ctx.ip);
    const { value } = await ctx.kv.get(key, { type: 'json' });
    
    const data = value || { count: 0, resetAt: Date.now() + this.windowMs };
    data.count += 1;

    // Auto-remove after window expires
    await ctx.kv.put(key, JSON.stringify(data), {
      expirationTtl: Math.ceil(this.windowMs / 1000),
    });

    if (data.count > this.config.requests) {
      return false;
    }

    return true;
  }

  /**
   * Get rate limit headers
   */
  getHeaders(ctx: RateLimiterContext): Record<string, string> {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const windowEnd = windowStart + this.windowMs;
    const reset = Math.ceil(windowEnd / 1000);

    return {
      'X-RateLimit-Limit': this.config.requests.toString(),
      'X-RateLimit-Reset': reset.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.config.requests - 1).toString(),
    };
  }
}

export { RateLimiter, type RateLimitConfig, type RateLimiterContext };