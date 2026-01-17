import type { Context, Next } from 'hono';
import type { Bindings } from '../types';

// SECURITY: Paths accessible without auth in all environments
const PUBLIC_PATHS = [
  '/health',
  '/api/v1/waitlist',
  '/snippet.js',
  '/openapi.json',
  '/docs',
] as const;

// SECURITY: Webhook paths use HMAC signature auth, not JWT
const WEBHOOK_PATHS = [
  '/api/v1/shopify/webhook',
  '/api/v1/ghl/webhook',
  '/api/v1/tiktok/webhook',
] as const;

function matchesPath(path: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
  });
}

/**
 * SECURITY: Dev/staging guard - blocks unauthenticated requests to protected endpoints.
 * Production passes through (route-level auth handles it).
 * Public + webhook paths are always allowed (webhooks have HMAC auth).
 */
export const devGuardMiddleware = () => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const environment = c.env.ENVIRONMENT || 'development';
    
    if (environment === 'production') {
      return next();
    }

    const path = new URL(c.req.url).pathname;
    
    if (matchesPath(path, PUBLIC_PATHS) || matchesPath(path, WEBHOOK_PATHS)) {
      return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: `This ${environment} endpoint requires authentication. Provide a valid Authorization header.`,
          environment,
        },
        401
      );
    }

    return next();
  };
};

export const devLoggingMiddleware = () => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const environment = c.env.ENVIRONMENT || 'development';
    
    if (environment === 'production') {
      return next();
    }

    const start = Date.now();
    const method = c.req.method;
    const path = new URL(c.req.url).pathname;
    
    console.log(`[${environment.toUpperCase()}] ${method} ${path} - started`);

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;
    
    console.log(`[${environment.toUpperCase()}] ${method} ${path} - ${status} (${duration}ms)`);
  };
};
