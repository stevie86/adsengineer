import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/utils/event-time');
import { resolveEventTimeSeconds } from '../../src/utils/event-time';
import {
  normalizeShopifyEvent,
  normalizeWooCommerceEvent,
  normalizeCustomEvent,
  type ShopifyWebhook,
  type WooCommerceWebhook,
  type CustomEvent
} from '../../src/services/event-normalizer';

const mockResolveEventTimeSeconds = vi.mocked(resolveEventTimeSeconds);

describe('Event Normalizer', () => {
  beforeEach(() => {
    mockResolveEventTimeSeconds.mockReturnValue(1234567890);
  });

  describe('normalizeShopifyEvent', () => {
    it('should call resolveEventTimeSeconds with created_at timestamp', () => {
      const webhook: ShopifyWebhook = {
        id: '123',
        topic: 'orders/create',
        created_at: '2023-01-01T12:00:00Z',
        customer: { email: 'test@example.com', phone: '1234567890', first_name: 'Test', last_name: 'User' },
        line_items: [{ product_id: 'prod1', variant_id: 'var1', title: 'Product 1', quantity: 1, price: '100.00', sku: 'SKU1' }],
        total_price: '100.00',
        currency: 'USD',
        order_number: 'ORD123'
      };

      const result = normalizeShopifyEvent(webhook);

      expect(mockResolveEventTimeSeconds).toHaveBeenCalledWith({ timestamp: '2023-01-01T12:00:00Z' });
      expect(result.timestamp_micros).toBe(1234567890000000);
    });
  });

  describe('normalizeWooCommerceEvent', () => {
    it('should call resolveEventTimeSeconds with date_created timestamp', () => {
      const webhook: WooCommerceWebhook = {
        id: 123,
        date_created: '2023-01-01T12:00:00Z',
        status: 'completed',
        billing: { email: 'test@example.com', phone: '1234567890', first_name: 'Test', last_name: 'User' },
        line_items: [{ product_id: 456, name: 'Product 1', quantity: 1, price: '100.00' }],
        total: '100.00',
        currency: 'USD',
        order_key: 'wc_order_key123'
      };

      const result = normalizeWooCommerceEvent(webhook);

      expect(mockResolveEventTimeSeconds).toHaveBeenCalledWith({ timestamp: '2023-01-01T12:00:00Z' });
      expect(result.timestamp_micros).toBe(1234567890000000);
    });
  });

  describe('normalizeCustomEvent', () => {
    it('should call resolveEventTimeSeconds with event_time and timestamp', () => {
      const customEvent: CustomEvent = {
        event_name: 'custom_event',
        event_time: 987654321,
        timestamp: '2023-01-01T12:00:00Z',
        value: 150,
        currency: 'USD',
        user_data: { email: 'test@example.com', phone: '1234567890', user_id: 'user123' },
        custom_data: { custom_field: 'value' }
      };

      const result = normalizeCustomEvent(customEvent);

      expect(mockResolveEventTimeSeconds).toHaveBeenCalledWith({
        event_time: 987654321,
        timestamp: '2023-01-01T12:00:00Z'
      });
      expect(result.timestamp_micros).toBe(1234567890000000);
    });
  });
});