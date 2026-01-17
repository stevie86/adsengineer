import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { oauth } from '../../src/routes/oauth';

describe('OAuth Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/oauth', oauth);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/oauth/google', () => {
    it('should redirect to Google OAuth consent screen', async () => {
      vi.mock('../../src/services/oauth', () => ({
        getGoogleAuthUrl: vi.fn().mockReturnValue(
          'https://accounts.google.com/oauth/authorize?client_id=123&redirect_uri=...'
        )
      }));

      const response = await app.request('/api/v1/oauth/google?redirect_uri=http://localhost:3000/callback', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('accounts.google.com');
      expect(response.headers.get('location')).toContain('client_id');
    });

    it('should require redirect_uri parameter', async () => {
      const response = await app.request('/api/v1/oauth/google', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('redirect_uri required');
    });

    it('should validate redirect URI', async () => {
      const response = await app.request('/api/v1/oauth/google?redirect_uri=http://malicious.com', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid redirect URI');
    });
  });

  describe('POST /api/v1/oauth/google/callback', () => {
    it('should handle Google OAuth callback with authorization code', async () => {
      const callbackData = {
        code: 'authorization-code-123',
        state: 'state-456'
      };

      vi.mock('../../src/services/oauth', () => ({
        handleGoogleCallback: vi.fn().mockResolvedValue({
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: {
            id: 'google-user-123',
            email: 'user@example.com',
            name: 'Test User'
          }
        })
      }));

      vi.mock('../../src/services/jwt', () => ({
        createJWT: vi.fn().mockReturnValue('jwt-token-123')
      }));

      const response = await app.request('/api/v1/oauth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('accessToken');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user.email).toBe('user@example.com');
    });

    it('should handle OAuth error response', async () => {
      const errorData = {
        error: 'access_denied',
        error_description: 'User denied access'
      };

      const response = await app.request('/api/v1/oauth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('access_denied');
    });

    it('should verify state parameter', async () => {
      const callbackData = {
        code: 'authorization-code-123'
      };

      const response = await app.request('/api/v1/oauth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid state parameter');
    });
  });

  describe('POST /api/v1/oauth/refresh', () => {
    it('should refresh access token', async () => {
      const refreshData = {
        refreshToken: 'refresh-token-123'
      };

      vi.mock('../../src/services/oauth', () => ({
        refreshAccessToken: vi.fn().mockResolvedValue({
          accessToken: 'new-access-token-456',
          expiresIn: 3600
        })
      }));

      const response = await app.request('/api/v1/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('accessToken', 'new-access-token-456');
      expect(data.data).toHaveProperty('expiresIn', 3600);
    });

    it('should validate refresh token', async () => {
      const refreshData = {
        refreshToken: ''
      };

      const response = await app.request('/api/v1/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('refresh token required');
    });

    it('should handle invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      vi.mock('../../src/services/oauth', () => ({
        refreshAccessToken: vi.fn().mockRejectedValue(new Error('Invalid refresh token'))
      }));

      const response = await app.request('/api/v1/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshData)
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid refresh token');
    });
  });

  describe('POST /api/v1/oauth/logout', () => {
    it('should logout and invalidate tokens', async () => {
      const mockToken = 'valid.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        }
      }));

      vi.mock('../../src/services/oauth', () => ({
        revokeTokens: vi.fn().mockResolvedValue(true)
      }));

      const response = await app.request('/api/v1/oauth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/v1/oauth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/v1/oauth/providers', () => {
    it('should list available OAuth providers', async () => {
      const response = await app.request('/api/v1/oauth/providers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data.providers)).toBe(true);
      expect(data.data.providers).toContain('google');
      expect(data.data.providers[0]).toHaveProperty('name');
      expect(data.data.providers[0]).toHaveProperty('authUrl');
      expect(data.data.providers[0]).toHaveProperty('scopes');
    });
  });
});