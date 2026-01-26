import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsRoutes as analytics } from '../../src/routes/analytics';

describe('Analytics Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/v1/analytics', analytics);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/analytics/conversions', () => {
    it('should return conversion analytics with valid JWT token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockAnalytics = {
        totalConversions: 150,
        totalValue: 7500,
        averageConversionValue: 50,
        conversionRate: 0.032,
        topConvertingSources: ['google', 'facebook', 'email'],
        dailyBreakdown: [
          { date: '2026-01-12', conversions: 12, value: 600 },
          { date: '2026-01-11', conversions: 8, value: 400 },
        ],
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/analytics/conversions', {
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
      expect(data.data).toMatchObject(mockAnalytics);
    });

    it('should require authentication', async () => {
      const response = await app.request('/api/v1/analytics/conversions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should support date range filtering', async () => {
      const mockToken = 'valid.jwt.token';
      const startDate = '2026-01-01';
      const endDate = '2026-01-12';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request(
        `/api/v1/analytics/conversions?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('filteredRange', {
        startDate,
        endDate,
      });
    });
  });

  describe('GET /api/v1/analytics/performance', () => {
    it('should return performance metrics', async () => {
      const mockToken = 'valid.jwt.token';

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/analytics/performance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('metrics');
      expect(data.data.metrics).toHaveProperty('responseTime');
      expect(data.data.metrics).toHaveProperty('errorRate');
      expect(data.data.metrics).toHaveProperty('uptime');
    });
  });

  describe('POST /api/v1/analytics/export', () => {
    it('should generate and return analytics export', async () => {
      const mockToken = 'valid.jwt.token';
      const exportRequest = {
        format: 'csv',
        dateRange: {
          startDate: '2026-01-01',
          endDate: '2026-01-12',
        },
        metrics: ['conversions', 'value', 'sources'],
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/analytics/export', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      expect(response.headers.get('content-disposition')).toContain('attachment');
    });

    it('should validate export request parameters', async () => {
      const mockToken = 'valid.jwt.token';
      const invalidRequest = {
        format: 'xml',
      };

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/analytics/export', {
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
      expect(data.error).toContain('Invalid');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limits to analytics endpoints', async () => {
      const mockToken = 'valid.jwt.token';
      const requests = Array.from({ length: 101 }, () =>
        app.request('/api/v1/analytics/conversions', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        })
      );

      vi.mock('../../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const responses = await Promise.allSettled(requests);
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
