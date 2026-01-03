import type { Context, Next } from 'hono';

export interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  tenant_id?: string;
  org_id?: string;
  role?: string;
}

export interface AuthContext {
  user_id: string;
  org_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export const authMiddleware = (options: { requireAuth?: boolean } = { requireAuth: true }) => {
  return async (c: Context, next: Next) => {
    if (options.requireAuth === false) {
      return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = decodeJWT(token);

      if (!payload) {
        return c.json({ error: 'Invalid token format' }, 401);
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return c.json({ error: 'Token expired' }, 401);
      }

      c.set('auth', {
        user_id: payload.sub,
        org_id: payload.org_id || payload.tenant_id || payload.sub,
        tenant_id: payload.tenant_id || payload.sub,
        role: (payload.role || 'member') as AuthContext['role'],
      } satisfies AuthContext);

      return next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      return c.json({ error: 'Token verification failed' }, 401);
    }
  };
};

export const optionalAuthMiddleware = () => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = decodeJWT(token);

      if (!payload || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
        return next();
      }

      c.set('auth', {
        user_id: payload.sub,
        org_id: payload.org_id || payload.tenant_id || payload.sub,
        tenant_id: payload.tenant_id || payload.sub,
        role: (payload.role || 'member') as AuthContext['role'],
      } satisfies AuthContext);

      return next();
    } catch {
      return next();
    }
  };
};

export const extractAuthContext = (c: Context): AuthContext | null => {
  return c.get('auth') || null;
};
