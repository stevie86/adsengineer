/**
 * WooCommerce Adapter
 *
 * Converts WooCommerce webhook JSON to StandardEvent.
 * WooCommerce logic stays here - Router never sees WooCommerce internals.
 */

import type { StandardEvent, AdapterResult } from '../types';

/**
 * WooCommerce Webhook Payload
 *
 * Minimum schema for purchase/updated events
 */
interface WooCommerceWebhook {
  id?: number;
  event?: string;
  status?: string;
  customer?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  billing?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  total?: string;
  total_price?: string;
  currency?: string;
  line_items?: Array<{
    product_id?: number;
    product?: {
      id?: number;
    };
    name?: string;
    quantity?: number;
    price?: string;
  }>;
  order_key?: string;
  created_at?: string;
  date_created?: string;
  date_created_gmt?: string;
}

/**
 * WooCommerce Event Name Mapping
 *
 * Maps webhook topics and order statuses to standard event names
 */
const WOOCOMMERCE_EVENT_MAP: Record<string, string> = {
  'order.created': 'purchase',
  'order.updated': 'purchase',
  'order.deleted': 'cancel_order',
  'order.restored': 'purchase',
  'orders.created': 'purchase',
  'orders.updated': 'purchase',
  'wc_orders.created': 'purchase',
  'wc_orders.updated': 'purchase',
  'orders_status_updated': 'purchase',
  'customer.created': 'lead',
  'customer.updated': 'lead',
  'product.created': 'view_item',
  'product.updated': 'view_item',
  'custom_event': 'custom_event',
  completed: 'purchase',
  pending: 'purchase',
  processing: 'purchase',
  on_hold: 'purchase',
  failed: 'cancel_order',
  cancelled: 'cancel_order',
  refunded: 'cancel_order',
};

/**
 * Extract product ID from line item
 */
function extractProductId(item: WooCommerceWebhook['line_items'][0]): string | undefined {
  if (item?.product_id) return String(item.product_id);
  if (item?.product?.id) return String(item.product.id);
  return item?.name;
}

/**
 * Convert WooCommerce webhook to StandardEvent
 *
 * Maps different WooCommerce webhook types to appropriate standard events
 * Handles both standard WooCommerce webhook format and WordPress plugin format
 *
 * @param payload - WooCommerce webhook JSON
 * @returns AdapterResult with StandardEvent
 */
export function woocommerceAdapter(payload: WooCommerceWebhook): AdapterResult<WooCommerceWebhook> {
  try {
    const event = payload.event || payload.status || 'custom_event';
    const eventName = WOOCOMMERCE_EVENT_MAP[event] || 'custom_event';

    const userData: StandardEvent['userData'] = {
      email: payload.customer?.email || payload.billing?.email,
      phone: payload.customer?.phone || payload.billing?.phone,
      external_id: String(payload.id),
    };

    let customData: StandardEvent['customData'] = {};

    if (eventName === 'purchase') {
      const contentIds: string[] = [];
      payload.line_items?.forEach(item => {
        const productId = extractProductId(item);
        if (productId) {
          for (let i = 0; i < (item.quantity || 1); i++) {
            contentIds.push(productId);
          }
        }
      });

      customData = {
        value: payload.total || payload.total_price ? parseFloat(payload.total || payload.total_price) : undefined,
        currency: payload.currency,
        content_ids: contentIds,
        num_items: payload.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        order_id: payload.order_key || String(payload.id),
      };
    } else if (eventName === 'view_item') {
      customData = {
        content_ids: payload.line_items?.map(item => extractProductId(item)).filter(Boolean),
        content_name: payload.line_items?.[0]?.name,
      };
    } else if (eventName === 'search') {
      customData = {
        query_string: payload.line_items?.[0]?.name,
        content_ids: payload.line_items?.map(item => extractProductId(item)).filter(Boolean),
      };
    }

    const timestampSource = payload.created_at || payload.date_created || payload.date_created_gmt;
    const timestamp = timestampSource ? new Date(timestampSource).getTime() : Date.now();

    const standardEvent: StandardEvent = {
      eventName,
      userData,
      customData,
      timestamp,
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