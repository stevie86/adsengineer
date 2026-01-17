import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { customEvents } from '../../src/routes/custom-events';

describe('Custom Events Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/custom-events', customEvents);
    vi.clearAllMocks();
  });

  describe('POST /api/v1/custom-events', () => {
    it('should create a custom event with valid JWT', async () => {
      const mockToken = 'valid.jwt.token';
      const eventData = {
        siteId: 'site-123',
        eventName: 'high-value-purchase',
        value: 2500,
        currency: 'USD',
        metadata: {
          productId: 'prod-456',
          customerId: 'customer-789',
          category: 'premium'
        },
        timestamp: '2026-01-12T15:30:00Z'
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        createCustomEvent: vi.fn().mockResolvedValue({
          id: 'event-456',
          ...eventData,
          createdAt: '2026-01-12T15:30:00Z'
        })
      }));

      const response = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id', 'event-456');
      expect(data.data.eventName).toBe('high-value-purchase');
      expect(data.data.value).toBe(2500);
    });

    it('should validate required fields', async () => {
      const mockToken = 'valid.jwt.token';
      const invalidEventData = {
        siteId: 'site-123'
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      const response = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidEventData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('required');
    });

    it('should validate event value is positive number', async () => {
      const mockToken = 'valid.jwt.token';
      const invalidEventData = {
        siteId: 'site-123',
        eventName: 'test-event',
        value: -100,
        currency: 'USD'
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      const response = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidEventData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('positive number');
    });
  });

  describe('GET /api/v1/custom-events', () => {
    it('should retrieve custom events with pagination', async () => {
      const mockToken = 'valid.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        getCustomEvents: vi.fn().mockResolvedValue({
          events: [
            {
              id: 'event-1',
              siteId: 'site-123',
              eventName: 'purchase',
              value: 100,
              currency: 'USD',
              timestamp: '2026-01-12T10:00:00Z'
            },
            {
              id: 'event-2',
              siteId: 'site-123',
              eventName: 'signup',
              value: 50,
              currency: 'USD',
              timestamp: '2026-01-12T09:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 2,
            hasMore: false
          }
        })
      }));

      const response = await app.request('/api/v1/custom-events?page=1&limit=50', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data.events).toHaveLength(2);
      expect(data.data.pagination).toHaveProperty('page', 1);
      expect(data.data.pagination).toHaveProperty('total', 2);
    });

    it('should filter by site ID', async () => {
      const mockToken = 'valid.jwt.token';
      const siteId = 'site-123';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        getCustomEvents: vi.fn().mockResolvedValue({
          events: [
            {
              id: 'event-1',
              siteId: siteId,
              eventName: 'purchase',
              value: 100
            }
          ],
          pagination: { page: 1, limit: 50, total: 1, hasMore: false }
        })
      }));

      const response = await app.request(`/api/v1/custom-events?siteId=${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data.events).toHaveLength(1);
      expect(data.data.events[0].siteId).toBe(siteId);
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/v1/custom-events', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/v1/custom-events/:eventId', () => {
    it('should retrieve specific custom event', async () => {
      const mockToken = 'valid.jwt.token';
      const eventId = 'event-456';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        getCustomEventById: vi.fn().mockResolvedValue({
          id: eventId,
          siteId: 'site-123',
          eventName: 'high-value-purchase',
          value: 2500,
          currency: 'USD',
          metadata: {
            productId: 'prod-456',
            customerId: 'customer-789'
          },
          timestamp: '2026-01-12T15:30:00Z'
        })
      }));

      const response = await app.request(`/api/v1/custom-events/${eventId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('id', eventId);
      expect(data.data).toHaveProperty('eventName', 'high-value-purchase');
      expect(data.data).toHaveProperty('value', 2500);
      expect(data.data).toHaveProperty('metadata');
    });

    it('should handle non-existent event', async () => {
      const mockToken = 'valid.jwt.token';
      const nonExistentId = 'non-existent';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        getCustomEventById: vi.fn().mockResolvedValue(null)
      }));

      const response = await app.request(`/api/v1/custom-events/${nonExistentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/v1/custom-events/:eventId', () => {
    it('should update custom event', async () => {
      const mockToken = 'valid.jwt.token';
      const eventId = 'event-456';
      const updateData = {
        eventName: 'updated-purchase',
        value: 3000,
        metadata: {
          updated: true
        }
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        updateCustomEvent: vi.fn().mockResolvedValue({
          id: eventId,
          siteId: 'site-123',
          ...updateData,
          updatedAt: '2026-01-12T16:00:00Z'
        })
      }));

      const response = await app.request(`/api/v1/custom-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('id', eventId);
      expect(data.data.eventName).toBe('updated-purchase');
      expect(data.data.value).toBe(3000);
    });

    it('should validate update data', async () => {
      const mockToken = 'valid.jwt.token';
      const eventId = 'event-456';
      const invalidUpdateData = {
        value: 'invalid-value'
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      const response = await app.request(`/api/v1/custom-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidUpdateData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('validation');
    });
  });

  describe('DELETE /api/v1/custom-events/:eventId', () => {
    it('should delete custom event', async () => {
      const mockToken = 'valid.jwt.token';
      const eventId = 'event-456';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        }
      }));

      vi.mock('../../src/services/custom-events', () => ({
        deleteCustomEvent: vi.fn().mockResolvedValue(true)
      }));

      vi.mock('../../src/services/logging', () => ({
        logAuditEvent: vi.fn().mockResolvedValue(undefined)
      }));

      const response = await app.request(`/api/v1/custom-events/${eventId}`, {
        method: 'DELETE',
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
  });
});