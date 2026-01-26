import { Hono } from 'hono';
import { beforeEach, describe, expect, it } from 'vitest';
import type { JWTPayload } from '../../src/middleware/auth';
import {
  authMiddleware,
  extractAuthContext,
  optionalAuthMiddleware,
} from '../../src/middleware/auth';

const testSecret = 'test-jwt-secret-key-for-testing-purposes';

async function createValidJWT(payload: Partial<JWTPayload> = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    sub: 'user123',
    iss: 'adsengineer',
    aud: 'adsengineer-api',
    iat: now,
    exp: now + 3600,
    ...payload,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const message = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(testSecret);
  const dataBytes = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${message}.${signatureB64}`;
}

async function createTamperedJWT(): Promise<string> {
  const validToken = await createValidJWT();
  const parts = validToken.split('.');
  const tamperedSignature = parts[2].slice(0, -1) + 'X' + parts[2].slice(-1);
  return `${parts[0]}.${parts[1]}.${tamperedSignature}`;
}

describe('Auth Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    // Global middleware to set JWT_SECRET for all tests
    app.use('*', (c, next) => {
      c.env = { ...c.env, JWT_SECRET: testSecret };
      return next();
    });
    // Apply auth middleware only to protected routes
    app.get('/protected', authMiddleware(), (c) => {
      const auth = extractAuthContext(c);
      if (!auth) {
        return c.json({ error: 'No auth context' }, 500);
      }
      return c.json({ user_id: auth.user_id, org_id: auth.org_id, role: auth.role });
    });
    app.get('/optional', optionalAuthMiddleware(), (c) => {
      const auth = extractAuthContext(c);
      return c.json({ authenticated: !!auth, user_id: auth?.user_id });
    });
  });

  const requestWithEnv = async (path: string, options: any = {}) => {
    return app.request(path, {
      ...options,
      env: { JWT_SECRET: testSecret },
    });
  };

  describe('Valid JWT', () => {
    it('allows access with valid token', async () => {
      const token = await createValidJWT();
      console.log('Test token:', token.substring(0, 50) + '...');
      console.log('Test secret:', testSecret);
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', res.status);
      if (res.status !== 200) {
        const data = await res.json();
        console.log('Response data:', data);
      }
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user_id).toBe('user123');
    });

    it('extracts all auth fields correctly', async () => {
      const token = await createValidJWT({
        org_id: 'org456',
        role: 'admin',
      });
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.org_id).toBe('org456');
      expect(data.role).toBe('admin');
    });

    it('handles tokens with custom fields', async () => {
      const token = await createValidJWT({ customField: 'should be preserved' });
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Invalid Signature', () => {
    it('rejects token with invalid signature', async () => {
      const tamperedToken = await createTamperedJWT();
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid or tampered token');
    });

    it('rejects token without signature part', async () => {
      const validToken = await createValidJWT();
      const noSignatureToken = validToken.split('.')[0] + '.' + validToken.split('.')[1];
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${noSignatureToken}` },
      });
      expect(res.status).toBe(401);
    });

    it('rejects malformed token', async () => {
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: 'Bearer not-a-jwt' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Invalid Claims', () => {
    it('rejects token with wrong issuer', async () => {
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'HS256', typ: 'JWT' };
      const headerB64 = btoa(JSON.stringify(header))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const payload = {
        sub: 'user123',
        iss: 'attacker',
        aud: 'adsengineer-api',
        exp: now + 3600,
      };
      const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const message = `${headerB64}.${payloadB64}`;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(testSecret);
      const dataBytes = encoder.encode(message);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const token = `${message}.${signatureB64}`;
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });

    it('rejects token with wrong audience', async () => {
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'HS256', typ: 'JWT' };
      const headerB64 = btoa(JSON.stringify(header))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const payload = {
        sub: 'user123',
        iss: 'adsengineer',
        aud: 'wrong-audience',
        exp: now + 3600,
      };
      const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const message = `${headerB64}.${payloadB64}`;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(testSecret);
      const dataBytes = encoder.encode(message);

      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, dataBytes);
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const token = `${message}.${signatureB64}`;
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });

    it('rejects expired token', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const token = await createValidJWT({ exp: expiredTime });
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Missing Authorization', () => {
    it('rejects request without Authorization header', async () => {
      const res = await requestWithEnv('/protected', {});
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Missing or invalid authorization header');
    });

    it('rejects request with invalid Authorization format', async () => {
      const res = await requestWithEnv('/protected', {
        headers: { Authorization: 'InvalidFormat' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Optional Auth Middleware', () => {
    it('allows access without token when optional', async () => {
      const res = await requestWithEnv('/optional', {
        env: { JWT_SECRET: testSecret },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
    });

    it('extracts auth context when token provided', async () => {
      const token = await createValidJWT();
      const res = await requestWithEnv('/optional', {
        headers: { Authorization: `Bearer ${token}` },
        env: { JWT_SECRET: testSecret },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.authenticated).toBe(true);
      expect(data.user_id).toBe('user123');
    });
  });

  describe('Extract Auth Context', () => {
    it('returns null when no auth context set', async () => {
      const testApp = new Hono();
      testApp.get('/test', (c) => {
        const auth = extractAuthContext(c);
        return c.json({ hasAuth: !!auth });
      });
      const res = await testApp.request('/test', {});
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.hasAuth).toBe(false);
    });
  });
});
