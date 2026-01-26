import type { AppEnv } from '../types';
import { resolveEventTimeSeconds } from '../utils/event-time';
import type { GA4Event } from './ga4-measurement';

export interface ShopifyWebhook {
  id: string;
  topic: 'orders/create' | 'orders/updated' | 'orders/paid';
  created_at: string;
  customer?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  line_items: Array<{
    product_id: string;
    variant_id: string;
    title: string;
    quantity: number;
    price: string;
    sku?: string;
  }>;
  total_price: string;
  currency: string;
  order_number?: string;
  note_attributes?: Array<{ name: string; value: string }>;
  tags?: string[];
  landing_site?: string;
}

export interface WooCommerceWebhook {
  id: number;
  date_created: string;
  status: string;
  billing: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  line_items: Array<{
    product_id: number;
    name: string;
    quantity: number;
    price: string;
  }>;
  total: string;
  currency: string;
  order_key: string;
}

export interface CustomEvent {
  event_name: string;
  event_time?: number;
  timestamp?: string | Date;
  value?: number;
  currency?: string;
  user_data?: {
    email?: string;
    phone?: string;
    user_id?: string;
  };
  custom_data?: Record<string, string | number>;
}

export interface NormalizedEvent {
  name: string;
  params: {
    currency?: string;
    value?: number;
    transaction_id?: string;
    items?: Array<{
      item_id?: string;
      item_name?: string;
      price?: number;
      quantity?: number;
      item_variant_id?: string;
      item_sku?: string;
    }>;
    user_id?: string;
    email?: string;
    phone?: string;
    page_location?: string;
  };
  timestamp_micros?: number;
}

export function normalizeShopifyEvent(webhook: ShopifyWebhook): NormalizedEvent {
  const eventTimeSeconds = resolveEventTimeSeconds({
    timestamp: webhook.created_at,
  });

  const totalValue = parseFloat(webhook.total_price || '0');
  const items: Array<{
    item_id?: string;
    item_name?: string;
    price?: number;
    quantity?: number;
    item_variant_id?: string;
    item_sku?: string;
  }> = webhook.line_items.map((item) => ({
    item_id: item.product_id?.toString(),
    item_name: item.title,
    price: parseFloat(item.price || '0'),
    quantity: item.quantity,
    item_variant_id: item.variant_id?.toString(),
    item_sku: item.sku,
  }));

  const params: NormalizedEvent['params'] = {
    currency: webhook.currency,
    value: totalValue,
    items,
    transaction_id: webhook.order_number?.toString() || webhook.id,
  };

  if (webhook.customer?.email) {
    params.email = webhook.customer.email;
  }

  if (webhook.customer?.phone) {
    params.phone = webhook.customer.phone;
  }

  if (webhook.customer?.email) {
    params.user_id = webhook.customer.email;
  }

  if (webhook.landing_site) {
    params.page_location = webhook.landing_site;
  }

  let eventName = 'purchase';
  if (webhook.topic === 'orders/create') {
    eventName = 'purchase';
  } else if (webhook.topic === 'orders/paid') {
    eventName = 'purchase';
  } else if (webhook.topic === 'orders/updated') {
    eventName = 'purchase';
  }

  return {
    name: eventName,
    params,
    timestamp_micros: eventTimeSeconds * 1000000,
  };
}

export function normalizeWooCommerceEvent(webhook: WooCommerceWebhook): NormalizedEvent {
  const eventTimeSeconds = resolveEventTimeSeconds({
    timestamp: webhook.date_created,
  });

  const totalValue = parseFloat(webhook.total || '0');
  const items = webhook.line_items.map((item) => ({
    item_id: item.product_id?.toString(),
    item_name: item.name,
    price: parseFloat(item.price || '0'),
    quantity: item.quantity,
  }));

  const params: NormalizedEvent['params'] = {
    currency: webhook.currency,
    value: totalValue,
    items,
    transaction_id: webhook.order_key,
  };

  if (webhook.billing?.email) {
    params.email = webhook.billing.email;
    params.user_id = webhook.billing.email;
  }

  if (webhook.billing?.phone) {
    params.phone = webhook.billing.phone;
  }

  return {
    name: 'purchase',
    params,
    timestamp_micros: eventTimeSeconds * 1000000,
  };
}

export function normalizeCustomEvent(customEvent: CustomEvent): NormalizedEvent {
  const eventTimeSeconds = resolveEventTimeSeconds({
    event_time: customEvent.event_time,
    timestamp: customEvent.timestamp,
  });

  const params: NormalizedEvent['params'] = {
    ...(customEvent.value !== undefined && { value: customEvent.value }),
    ...(customEvent.currency && { currency: customEvent.currency }),
  };

  if (customEvent.user_data) {
    if (customEvent.user_data.email) {
      params.email = customEvent.user_data.email;
    }

    if (customEvent.user_data.phone) {
      params.phone = customEvent.user_data.phone;
    }

    if (customEvent.user_data.user_id) {
      params.user_id = customEvent.user_data.user_id;
    }
  }

  if (customEvent.custom_data) {
    Object.assign(params, customEvent.custom_data);
  }

  return {
    name: customEvent.event_name,
    params,
    timestamp_micros: eventTimeSeconds * 1000000,
  };
}

export function toGA4Event(normalized: NormalizedEvent): GA4Event {
  const event: GA4Event = {
    name: normalized.name,
    ...(normalized.timestamp_micros && {
      timestamp_micros: normalized.timestamp_micros,
    }),
  };

  if (normalized.params && Object.keys(normalized.params).length > 0) {
    event.params = normalized.params;
  }

  return event;
}

export function normalizeEvent(event: ShopifyWebhook | WooCommerceWebhook | CustomEvent): GA4Event {
  let normalized: NormalizedEvent;

  if ('topic' in event) {
    normalized = normalizeShopifyEvent(event as ShopifyWebhook);
  } else if ('billing' in event) {
    normalized = normalizeWooCommerceEvent(event as WooCommerceWebhook);
  } else {
    normalized = normalizeCustomEvent(event as CustomEvent);
  }

  return toGA4Event(normalized);
}
