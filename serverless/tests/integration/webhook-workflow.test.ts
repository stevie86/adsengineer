import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src';

describe('Webhook Processing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Shopify Webhook Processing', () => {
    it('should process Shopify order webhook end-to-end', async () => {
      const shopifyOrderPayload = {
        id: 123456789,
        email: 'customer@example.com',
        created_at: '2026-01-12T15:30:00Z',
        total_price: '150.00',
        currency: 'USD',
        line_items: [
          {
            product_id: 987654321,
            variant_id: 123456789,
            quantity: 2,
            price: '75.00',
          },
        ],
        customer: {
          id: 456789012,
          email: 'customer@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
        },
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'US',
          zip: '10001',
        },
        gateway: 'stripe',
        financial_status: 'paid',
      };

      const shopifyHmac = 'shopify-webhook-signature-123';

      vi.mock('../src/middleware/webhook', () => ({
        verifyShopifyWebhook: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/shopify', () => ({
        processShopifyOrder: vi.fn().mockResolvedValue({
          success: true,
          eventId: 'event-123',
          conversionValue: 15000,
          currency: 'USD',
          customerData: {
            email: 'customer@example.com',
            totalOrders: 1,
            lifetimeValue: 15000,
          },
        }),
      }));

      vi.mock('../src/services/custom-events', () => ({
        createCustomEvent: vi.fn().mockResolvedValue({
          id: 'event-123',
          siteId: 'site-456',
          eventName: 'shopify_order',
          value: 15000,
          currency: 'USD',
          metadata: {
            orderId: 123456789,
            gateway: 'stripe',
            customerEmail: 'customer@example.com',
          },
        }),
      }));

      vi.mock('../src/services/google-ads', () => ({
        uploadConversion: vi.fn().mockResolvedValue({
          success: true,
          conversionId: 'gconv-789',
        }),
      }));

      vi.mock('../src/services/logging', () => ({
        logWebhookEvent: vi.fn().mockResolvedValue(undefined),
        logAuditEvent: vi.fn().mockResolvedValue(undefined),
      }));

      const response = await app.request('/api/v1/shopify/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-Sha256': shopifyHmac,
          'X-Shopify-Topic': 'orders/create',
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        },
        body: JSON.stringify(shopifyOrderPayload),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('eventId', 'event-123');
    });

    it('should handle Shopify customer creation webhook', async () => {
      const customerPayload = {
        id: 456789012,
        email: 'newcustomer@example.com',
        created_at: '2026-01-12T15:30:00Z',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890',
        accepts_marketing: true,
        orders_count: 0,
        state: 'enabled',
        total_spent: '0.00',
        last_order_id: null,
        verified_email: true,
        multipass_identifier: null,
        tax_exempt: false,
        tags: '',
        last_order_name: null,
        currency: 'USD',
      };

      const shopifyHmac = 'shopify-customer-signature-456';

      vi.mock('../src/middleware/webhook', () => ({
        verifyShopifyWebhook: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/shopify', () => ({
        processShopifyCustomer: vi.fn().mockResolvedValue({
          success: true,
          eventId: 'customer-event-123',
          customerCreated: true,
          leadScore: 0.3,
        }),
      }));

      vi.mock('../src/services/leads', () => ({
        createOrUpdateLead: vi.fn().mockResolvedValue({
          id: 'lead-789',
          email: 'newcustomer@example.com',
          source: 'shopify',
          status: 'new',
          leadScore: 0.3,
          createdAt: new Date().toISOString(),
        }),
      }));

      const response = await app.request('/api/v1/shopify/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-Sha256': shopifyHmac,
          'X-Shopify-Topic': 'customers/create',
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        },
        body: JSON.stringify(customerPayload),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
    });

    it('should reject invalid Shopify webhook signatures', async () => {
      const invalidPayload = { test: 'data' };

      vi.mock('../src/middleware/webhook', () => ({
        verifyShopifyWebhook: vi.fn().mockReturnValue(false),
      }));

      const response = await app.request('/api/v1/shopify/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-Sha256': 'invalid-signature',
          'X-Shopify-Topic': 'orders/create',
        },
        body: JSON.stringify(invalidPayload),
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Invalid signature');
    });
  });

  describe('GoHighLevel Webhook Processing', () => {
    it('should process GHL contact webhook', async () => {
      const ghlContactPayload = {
        contact: {
          id: 'contact-123456',
          email: 'lead@example.com',
          phone: '+1234567890',
          firstName: 'Mike',
          lastName: 'Johnson',
          customField: {
            gclid: 'EAIaIQobChMI_789',
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'winter-sale',
          },
          tags: ['hot-lead', 'interested'],
          dateAdded: '2026-01-12T15:30:00Z',
          lastActivity: '2026-01-12T15:35:00Z',
        },
        locationId: 'location-789',
        type: 'ContactCreated',
      };

      const ghlSignature = 'ghl-webhook-signature-123';

      vi.mock('../src/middleware/webhook', () => ({
        verifyGHLWebhook: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/ghl', () => ({
        processGHLContact: vi.fn().mockResolvedValue({
          success: true,
          leadId: 'lead-456',
          leadScore: 0.8,
          converted: false,
          followUpRequired: true,
        }),
      }));

      vi.mock('../src/services/leads', () => ({
        createOrUpdateLead: vi.fn().mockResolvedValue({
          id: 'lead-456',
          email: 'lead@example.com',
          source: 'gohighlevel',
          status: 'new',
          leadScore: 0.8,
          gclid: 'EAIaIQobChMI_789',
          metadata: {
            locationId: 'location-789',
            tags: ['hot-lead', 'interested'],
          },
        }),
      }));

      vi.mock('../src/services/google-ads', () => ({
        uploadLeadConversion: vi.fn().mockResolvedValue({
          success: true,
          conversionId: 'gconv-123',
        }),
      }));

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': ghlSignature,
        },
        body: JSON.stringify(ghlContactPayload),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('leadId', 'lead-456');
    });

    it('should process GHL opportunity webhook', async () => {
      const ghlOpportunityPayload = {
        opportunity: {
          id: 'opp-123456',
          contactId: 'contact-789',
          title: 'Website Redesign Project',
          value: 15000,
          currency: 'USD',
          stage: 'Qualified',
          probability: 75,
          expectedCloseDate: '2026-02-15',
          dateAdded: '2026-01-12T15:30:00Z',
          lastUpdated: '2026-01-12T16:00:00Z',
        },
        locationId: 'location-789',
        type: 'OpportunityCreated',
      };

      const ghlSignature = 'ghl-opp-signature-456';

      vi.mock('../src/middleware/webhook', () => ({
        verifyGHLWebhook: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/ghl', () => ({
        processGHLOpportunity: vi.fn().mockResolvedValue({
          success: true,
          opportunityId: 'opp-123456',
          value: 15000,
          stage: 'Qualified',
        }),
      }));

      vi.mock('../src/services/custom-events', () => ({
        createCustomEvent: vi.fn().mockResolvedValue({
          id: 'event-789',
          siteId: 'site-123',
          eventName: 'opportunity_created',
          value: 15000,
          currency: 'USD',
          metadata: {
            opportunityId: 'opp-123456',
            stage: 'Qualified',
            probability: 75,
          },
        }),
      }));

      const response = await app.request('/api/v1/ghl/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GHL-Signature': ghlSignature,
        },
        body: JSON.stringify(ghlOpportunityPayload),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('eventId', 'event-789');
    });
  });

  describe('Webhook Error Handling and Retry Logic', () => {
    it('should handle external service failures during webhook processing', async () => {
      const shopifyOrderPayload = {
        id: 123456789,
        email: 'customer@example.com',
        total_price: '150.00',
        currency: 'USD',
      };

      const shopifyHmac = 'shopify-webhook-signature-123';

      vi.mock('../src/middleware/webhook', () => ({
        verifyShopifyWebhook: vi.fn().mockReturnValue(true),
      }));

      vi.mock('../src/services/shopify', () => ({
        processShopifyOrder: vi.fn().mockRejectedValue(new Error('Database connection timeout')),
      }));

      vi.mock('../src/services/logging', () => ({
        logError: vi.fn().mockResolvedValue(undefined),
        logWebhookEvent: vi.fn().mockResolvedValue(undefined),
      }));

      vi.mock('../src/services/queue', () => ({
        addToQueue: vi.fn().mockResolvedValue({
          success: true,
          queueId: 'retry-123',
        }),
      }));

      const response = await app.request('/api/v1/shopify/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Hmac-Sha256': shopifyHmac,
          'X-Shopify-Topic': 'orders/create',
        },
        body: JSON.stringify(shopifyOrderPayload),
      });

      expect(response.status).toBe(202);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('queued', true);
      expect(result).toHaveProperty('queueId', 'retry-123');
    });

    it('should implement exponential backoff for failed webhooks', async () => {
      vi.mock('../src/services/queue', () => ({
        getRetryCount: vi.fn().mockResolvedValue(3),
        calculateBackoffDelay: vi.fn().mockReturnValue(16000),
        scheduleRetry: vi.fn().mockResolvedValue({
          success: true,
          nextAttempt: new Date(Date.now() + 16000).toISOString(),
        }),
      }));

      const response = await app.request('/api/v1/webhook/retry/queue-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('retryScheduled', true);
    });
  });
});
