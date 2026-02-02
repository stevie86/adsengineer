/**
 * Shopify Adapter
 *
 * Converts Shopify webhook JSON to StandardEvent.
 * Shopify logic stays here - Router never sees Shopify internals.
 */

import type { StandardEvent, AdapterResult } from '../types';

/**
 * Shopify Webhook Payload
 *
 * Minimal schema - only what we need for conversion
 */
interface ShopifyWebhook {
  id?: string;
  topic?: string;
  customer?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  total_price?: string;
  currency?: string;
  line_items?: Array<{
    variant_id?: string;
    product_id?: string;
    quantity?: number;
  }>;
  order_id?: string;
  processed_at?: string;
}

/**
 * Shopify Event Name Mapping
 *
 * Maps Shopify webhook topics to standard event names
 */
const SHOPIFY_EVENT_MAP: Record<string, string> = {
  'orders/create': 'purchase',
  'orders/updated': 'purchase',
  'orders/paid': 'purchase',
  'carts/create': 'add_to_cart',
  'carts/update': 'add_to_cart',
  'checkout/create': 'begin_checkout',
  'checkout/update': 'begin_checkout',
  'products/create': 'view_item',
  'products/update': 'view_item',
  'orders/cancelled': 'cancel_order',
};

/**
 * Convert Shopify webhook to StandardEvent
 *
 * @param payload - Shopify webhook JSON
 * @returns AdapterResult with StandardEvent
 */
export function shopifyAdapter(payload: ShopifyWebhook): AdapterResult<ShopifyWebhook> {
  try {
    const topic = payload.topic || '';
    const eventName = SHOPIFY_EVENT_MAP[topic] || 'custom_event';

    const userData: StandardEvent['userData'] = {
      email: payload.customer?.email,
      phone: payload.customer?.phone,
      external_id: payload.id,
    };

    const customData: StandardEvent['customData'] = {
      value: payload.total_price ? parseFloat(payload.total_price) : undefined,
      currency: payload.currency,
      content_ids: payload.line_items?.map(item => item.product_id || item.variant_id).filter(Boolean),
      num_items: payload.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0),
      order_id: payload.order_id,
    };

    const standardEvent: StandardEvent = {
      eventName,
      userData,
      customData,
      timestamp: payload.processed_at ? new Date(payload.processed_at).getTime() : Date.now(),
    };

    return {
      success: true,
      event: standardEvent,
      originalRequest: payload,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      originalRequest: payload,
    };
  }
}