import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gdpr } from '../../src/routes/gdpr';

describe('GDPR Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/gdpr', gdpr);
    vi.clearAllMocks();
  });

  describe('POST /api/v1/gdpr/data-request', () => {
    it('should process data subject request with valid JWT', async () => {
      const mockToken = 'valid.jwt.token';
      const requestData = {
        type: 'access',
        email: 'user@example.com',
        requestId: 'req-123456',
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      vi.mock('../../src/services/logging', () => ({
        logAuditEvent: vi.fn().mockResolvedValue(undefined),
      }));

      const response = await app.request('/api/v1/gdpr/data-request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('requestId');
      expect(data).toHaveProperty('status', 'processing');
    });

    it('should validate request type', async () => {
      const mockToken = 'valid.jwt.token';
      const invalidRequest = {
        type: 'invalid-type',
        email: 'user@example.com',
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/gdpr/data-request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid request type');
    });

    it('should verify email format', async () => {
      const mockToken = 'valid.jwt.token';
      const invalidRequest = {
        type: 'access',
        email: 'invalid-email',
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/gdpr/data-request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid email format');
    });
  });

  describe('POST /api/v1/gdpr/data-deletion', () => {
    it('should process data deletion request', async () => {
      const mockToken = 'valid.jwt.token';
      const deleteRequest = {
        email: 'user@example.com',
        confirmation: true,
        requestId: 'del-123456',
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      vi.mock('../../src/services/logging', () => ({
        logAuditEvent: vi.fn().mockResolvedValue(undefined),
      }));

      const response = await app.request('/api/v1/gdpr/data-deletion', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('requestId');
      expect(data).toHaveProperty('status', 'scheduled');
    });

    it('should require confirmation for deletion', async () => {
      const mockToken = 'valid.jwt.token';
      const deleteRequest = {
        email: 'user@example.com',
        confirmation: false,
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/gdpr/data-deletion', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteRequest),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Confirmation required');
    });
  });

  describe('GET /api/v1/gdpr/request-status/:requestId', () => {
    it('should return request status', async () => {
      const mockToken = 'valid.jwt.token';
      const requestId = 'req-123456';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      vi.mock('../../src/database/gdpr', () => ({
        getRequestStatus: vi.fn().mockResolvedValue({
          id: requestId,
          status: 'completed',
          type: 'access',
          createdAt: '2026-01-12T10:00:00Z',
          completedAt: '2026-01-12T10:30:00Z',
          downloadUrl: 'https://example.com/download/data.zip',
        }),
      }));

      const response = await app.request(`/api/v1/gdpr/request-status/${requestId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id', requestId);
      expect(data.data).toHaveProperty('status', 'completed');
      expect(data.data).toHaveProperty('downloadUrl');
    });

    it('should handle non-existent request', async () => {
      const mockToken = 'valid.jwt.token';
      const nonExistentRequestId = 'non-existent';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'user-123', role: 'user' });
          await next();
        },
      }));

      vi.mock('../../src/database/gdpr', () => ({
        getRequestStatus: vi.fn().mockResolvedValue(null),
      }));

      const response = await app.request(`/api/v1/gdpr/request-status/${nonExistentRequestId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Request not found');
    });
  });

  describe('GET /api/v1/gdpr/privacy-policy', () => {
    it('should return privacy policy information', async () => {
      const response = await app.request('/api/v1/gdpr/privacy-policy', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('version');
      expect(data.data).toHaveProperty('lastUpdated');
      expect(data.data).toHaveProperty('sections');
      expect(Array.isArray(data.data.sections)).toBe(true);
    });
  });
});
