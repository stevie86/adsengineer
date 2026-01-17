import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { tracking } from '../../src/routes/tracking';

describe('Tracking Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/tracking', tracking);
    vi.clearAllMocks();
  });

  describe('GET /tracking/snippet.js', () => {
    it('should return tracking JavaScript snippet for website', async () => {
      const siteId = 'site-123';

      vi.mock('../../src/services/tracking', () => ({
        generateTrackingSnippet: vi.fn().mockReturnValue(`
(function(window, document) {
  window.AdsEngineer = {
    track: function(eventName, value, metadata) {
      fetch('/api/v1/custom-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SITE_TOKEN'
        },
        body: JSON.stringify({
          siteId: '${siteId}',
          eventName: eventName,
          value: value,
          metadata: metadata,
          timestamp: new Date().toISOString()
        })
      });
    }
  };
})(window, document);
        `.trim())
      }));

      const response = await app.request(`/tracking/snippet.js?siteId=${siteId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/javascript' }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/javascript');
      expect(response.headers.get('cache-control')).toContain('public');
      const snippet = await response.text();
      expect(snippet).toContain('window.AdsEngineer');
      expect(snippet).toContain('track: function');
      expect(snippet).toContain(siteId);
    });

    it('should require site ID parameter', async () => {
      const response = await app.request('/tracking/snippet.js', {
        method: 'GET',
        headers: { 'Accept': 'application/javascript' }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('siteId required');
    });

    it('should validate site ID exists', async () => {
      const invalidSiteId = 'invalid-site';

      vi.mock('../../src/services/tracking', () => ({
        generateTrackingSnippet: vi.fn().mockImplementation((id) => {
          if (id === invalidSiteId) {
            throw new Error('Site not found');
          }
          return 'valid snippet';
        })
      }));

      const response = await app.request(`/tracking/snippet.js?siteId=${invalidSiteId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/javascript' }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Site not found');
    });
  });

  describe('GET /tracking/pixel.png', () => {
    it('should return tracking pixel for email clients', async () => {
      const siteId = 'site-123';
      const eventName = 'email-open';
      const userId = 'user-456';

      vi.mock('../../src/services/tracking', () => ({
        createPixelEvent: vi.fn().mockResolvedValue({
          id: 'event-789',
          siteId,
          eventName,
          userId,
          userAgent: 'Email Client',
          ip: '192.168.1.1',
          timestamp: '2026-01-12T15:30:00Z'
        })
      }));

      const response = await app.request(
        `/tracking/pixel.png?siteId=${siteId}&event=${eventName}&userId=${userId}`,
        {
          method: 'GET',
          headers: { 'User-Agent': 'Email Client' }
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/png');
      expect(response.headers.get('cache-control')).toContain('no-cache');
    });

    it('should validate pixel tracking parameters', async () => {
      const response = await app.request('/tracking/pixel.png?siteId=invalid', {
        method: 'GET',
        headers: { 'User-Agent': 'Test Client' }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid parameters');
    });
  });

  describe('POST /tracking/webhook', () => {
    it('should process webhook events from external sources', async () => {
      const webhookData = {
        source: 'shopify',
        event: 'order_created',
        data: {
          orderId: 'order-123',
          customerId: 'customer-456',
          total: 15000,
          currency: 'USD',
          lineItems: [
            {
              productId: 'prod-789',
              quantity: 2,
              price: 7500
            }
          ]
        },
        timestamp: '2026-01-12T15:30:00Z',
        signature: 'webhook-signature-123'
      };

      vi.mock('../../src/services/webhook', () => ({
        verifyWebhookSignature: vi.fn().mockResolvedValue(true),
        processWebhookEvent: vi.fn().mockResolvedValue({
          processed: true,
          eventId: 'event-456'
        })
      }));

      const response = await app.request('/tracking/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'webhook-signature-123'
        },
        body: JSON.stringify(webhookData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('processed', true);
    });

    it('should verify webhook signature', async () => {
      const webhookData = {
        source: 'shopify',
        event: 'order_created'
      };

      vi.mock('../../src/services/webhook', () => ({
        verifyWebhookSignature: vi.fn().mockResolvedValue(false)
      }));

      const response = await app.request('/tracking/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'invalid-signature'
        },
        body: JSON.stringify(webhookData)
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid signature');
    });

    it('should handle different webhook sources', async () => {
      const webhookData = {
        source: 'custom',
        event: 'user_signup',
        data: {
          userId: 'user-123',
          email: 'user@example.com',
          metadata: {
            source: 'landing-page',
            campaign: 'summer-sale'
          }
        }
      };

      vi.mock('../../src/services/webhook', () => ({
        verifyWebhookSignature: vi.fn().mockResolvedValue(true),
        processWebhookEvent: vi.fn().mockResolvedValue({
          processed: true,
          eventId: 'event-456'
        })
      }));

      const response = await app.request('/tracking/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'valid-signature'
        },
        body: JSON.stringify(webhookData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  describe('POST /tracking/events', () => {
    it('should accept events from tracking snippet', async () => {
      const eventData = {
        siteId: 'site-123',
        eventName: 'button_click',
        value: 0,
        metadata: {
          buttonId: 'cta-button',
          page: '/pricing',
          sessionId: 'session-456'
        },
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.1',
        timestamp: '2026-01-12T15:30:00Z'
      };

      vi.mock('../../src/services/tracking', () => ({
        createTrackingEvent: vi.fn().mockResolvedValue({
          id: 'event-789',
          processed: true
        })
      }));

      vi.mock('../../src/services/rate-limit', () => ({
        checkRateLimit: vi.fn().mockResolvedValue({ allowed: true })
      }));

      const response = await app.request('/tracking/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer site-token-123'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('event', 'event-789');
    });

    it('should validate site token', async () => {
      const eventData = {
        siteId: 'site-123',
        eventName: 'test-event'
      };

      const response = await app.request('/tracking/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid token');
    });

    it('should apply rate limiting to event endpoints', async () => {
      const eventData = {
        siteId: 'site-123',
        eventName: 'test-event'
      };

      vi.mock('../../src/services/rate-limit', () => ({
        checkRateLimit: vi.fn().mockResolvedValue({ 
          allowed: false,
          limit: 1000,
          resetTime: '2026-01-12T16:00:00Z'
        })
      }));

      const response = await app.request('/tracking/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer site-token-123'
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Rate limit exceeded');
    });
  });
});