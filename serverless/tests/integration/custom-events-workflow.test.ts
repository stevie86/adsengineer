import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src';

describe('Custom Events Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Custom Events Flow', () => {
    it('should handle full custom event lifecycle', async () => {
      const agencyToken = 'agency.jwt.token';
      let createdEventId: string | null = null;

      vi.mock('../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      vi.mock('../src/services/custom-events', () => ({
        createCustomEventDefinition: vi.fn().mockResolvedValue({
          id: 'def-123',
          name: 'high-value-purchase',
          description: 'Purchases over $1000',
          valueThreshold: 1000,
          agencyId: 'agency-123',
        }),
        createCustomEvent: vi.fn().mockImplementation((data) => {
          createdEventId = 'event-' + Math.random().toString(36).substr(2, 9);
          return Promise.resolve({
            id: createdEventId,
            ...data,
            createdAt: new Date().toISOString(),
          });
        }),
        getCustomEvents: vi.fn().mockResolvedValue({
          events: [],
          pagination: { page: 1, limit: 50, total: 0, hasMore: false },
        }),
      }));

      vi.mock('../src/services/google-ads', () => ({
        uploadConversion: vi.fn().mockResolvedValue({
          success: true,
          conversionId: 'gconv-456',
        }),
      }));

      vi.mock('../src/services/logging', () => ({
        logAuditEvent: vi.fn().mockResolvedValue(undefined),
      }));

      const testSiteId = 'site-123';

      const assignResponse = await app.request(
        `/api/v1/custom-event-definitions/sites/${testSiteId}/assign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${agencyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventDefinitions: [
              {
                name: 'high-value-purchase',
                description: 'Purchases over $1000',
                valueThreshold: 1000,
              },
              {
                name: 'subscription-signup',
                description: 'Monthly subscription signup',
                valueThreshold: 50,
              },
            ],
          }),
        }
      );

      expect(assignResponse.status).toBe(200);
      expect(await assignResponse.json()).toHaveProperty('success', true);

      const createEventData = {
        siteId: testSiteId,
        eventName: 'high-value-purchase',
        value: 1500,
        currency: 'USD',
        metadata: {
          productId: 'premium-product',
          customerId: 'customer-789',
        },
      };

      const eventResponse = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createEventData),
      });

      expect(eventResponse.status).toBe(201);
      const eventResult = await eventResponse.json();
      expect(eventResult.data).toHaveProperty('id');
      createdEventId = eventResult.data.id;

      const analyticsResponse = await app.request(
        `/api/v1/analytics/conversions?siteId=${testSiteId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${agencyToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(analyticsResponse.status).toBe(200);
      const analyticsResult = await analyticsResponse.json();
      expect(analyticsResult.data).toHaveProperty('totalConversions');

      expect(createdEventId).toBeTruthy();
    });

    it('should handle event assignment to multiple sites', async () => {
      const agencyToken = 'agency.jwt.token';
      const siteIds = ['site-123', 'site-456', 'site-789'];

      vi.mock('../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      vi.mock('../src/services/custom-events', () => ({
        assignEventToSites: vi.fn().mockResolvedValue({
          success: true,
          assignments: siteIds.map((siteId) => ({
            siteId,
            eventDefinitionId: 'def-123',
            assignedAt: new Date().toISOString(),
          })),
        }),
      }));

      const assignments = siteIds.map((siteId) => ({
        siteId,
        eventDefinitions: ['high-value-purchase'],
      }));

      for (const assignment of assignments) {
        const response = await app.request(
          `/api/v1/custom-event-definitions/sites/${assignment.siteId}/assign`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${agencyToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assignment),
          }
        );

        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toHaveProperty('success', true);
      }
    });
  });

  describe('Google Ads Integration Workflow', () => {
    it('should upload conversions to Google Ads for tracked events', async () => {
      const eventData = {
        siteId: 'site-123',
        eventName: 'purchase',
        value: 15000,
        currency: 'USD',
        metadata: {
          gclid: 'EAIaIQobChMI_123',
          customerId: 'customer-456',
        },
      };

      vi.mock('../src/services/google-ads', () => ({
        uploadConversion: vi.fn().mockResolvedValue({
          success: true,
          conversionId: 'gconv-789',
          warnings: [],
        }),
        validateGCLID: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/custom-events', () => ({
        createCustomEvent: vi.fn().mockResolvedValue({
          id: 'event-123',
          ...eventData,
          createdAt: new Date().toISOString(),
        }),
        markEventAsProcessed: vi.fn().mockResolvedValue(true),
      }));

      const agencyToken = 'agency.jwt.token';
      vi.mock('../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result.data).toHaveProperty('id', 'event-123');
    });

    it('should handle Google Ads API failures gracefully', async () => {
      const eventData = {
        siteId: 'site-123',
        eventName: 'purchase',
        value: 15000,
        currency: 'USD',
        metadata: {
          gclid: 'EAIaIQobChMI_123',
        },
      };

      vi.mock('../src/services/google-ads', () => ({
        uploadConversion: vi
          .fn()
          .mockRejectedValue(new Error('QUOTA_EXCEEDED: Daily budget exceeded')),
        validateGCLID: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/custom-events', () => ({
        createCustomEvent: vi.fn().mockResolvedValue({
          id: 'event-123',
          ...eventData,
          createdAt: new Date().toISOString(),
          status: 'pending_google_upload',
        }),
      }));

      vi.mock('../src/services/logging', () => ({
        logError: vi.fn().mockResolvedValue(undefined),
      }));

      const agencyToken = 'agency.jwt.token';
      vi.mock('../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      const response = await app.request('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.data).toHaveProperty('status', 'pending_google_upload');
    });
  });

  describe('Analytics Reporting Workflow', () => {
    it('should generate comprehensive analytics report', async () => {
      const agencyToken = 'agency.jwt.token';

      vi.mock('../src/middleware/auth', () => ({
        authMiddleware: () => async (c, next) => {
          c.set('jwt', { sub: 'agency-123', role: 'agency' });
          await next();
        },
      }));

      vi.mock('../src/services/analytics', () => ({
        getConversionAnalytics: vi.fn().mockResolvedValue({
          totalConversions: 150,
          totalValue: 75000,
          averageConversionValue: 500,
          conversionRate: 0.032,
          topConvertingSources: ['google', 'facebook', 'email'],
          topEvents: ['purchase', 'signup', 'quote-request'],
          dailyBreakdown: [
            { date: '2026-01-12', conversions: 25, value: 12500 },
            { date: '2026-01-11', conversions: 22, value: 11000 },
          ],
        }),
        getPerformanceMetrics: vi.fn().mockResolvedValue({
          responseTime: { average: 145, p95: 280, p99: 450 },
          errorRate: 0.002,
          uptime: 0.999,
          throughput: 150,
        }),
      }));

      const conversionsResponse = await app.request(
        '/api/v1/analytics/conversions?startDate=2026-01-01&endDate=2026-01-12',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${agencyToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(conversionsResponse.status).toBe(200);
      const conversionsData = await conversionsResponse.json();
      expect(conversionsData).toHaveProperty('success', true);
      expect(conversionsData.data).toHaveProperty('totalConversions', 150);
      expect(conversionsData.data).toHaveProperty('totalValue', 75000);

      const performanceResponse = await app.request('/api/v1/analytics/performance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${agencyToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(performanceResponse.status).toBe(200);
      const performanceData = await performanceResponse.json();
      expect(performanceData).toHaveProperty('success', true);
      expect(performanceData.data.metrics).toHaveProperty('responseTime');
      expect(performanceData.data.metrics).toHaveProperty('uptime', 0.999);
    });
  });
});
