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

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return signatureB64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify JWT signature and decode payload
 * Returns null if signature is invalid
 */
async function verifyAndDecodeJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payloadB64, signature] = parts;

    // Verify signature
    const expectedSignature = await computeHMAC(`${header}.${payloadB64}`, secret);
    if (!timingSafeEqual(signature, expectedSignature)) {
      console.warn('JWT signature verification failed');
      return null;
    }

    // Decode payload
    const decoded = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payloadData: JWTPayload = JSON.parse(decoded);

    // Validate claims
    const now = Math.floor(Date.now() / 1000);

    if (payloadData.exp && payloadData.exp < now) {
      console.warn('Token expired');
      return null;
    }

    // Validate issuer
    if (payloadData.iss !== 'adsengineer') {
      console.warn('Invalid token issuer:', payloadData.iss);
      return null;
    }

    // Validate audience
    if (payloadData.aud !== 'adsengineer-api') {
      console.warn('Invalid token audience:', payloadData.aud);
      return null;
    }

    return payloadData;
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

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return c.json({ error: 'Server misconfiguration' }, 500);
    }

    const payload = await verifyAndDecodeJWT(token, jwtSecret);

    if (!payload) {
      return c.json({ error: 'Invalid or tampered token' }, 401);
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
  };
};

export const optionalAuthMiddleware = () => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const payload = await verifyAndDecodeJWT(token, jwtSecret);

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
  };
};

export const extractAuthContext = (c: Context): AuthContext | null => {
  return c.get('auth') || null;
};
