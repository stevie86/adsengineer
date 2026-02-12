/**
 * Standard Event Types
 *
 * The single event contract that all adapters must satisfy.
 * Router and CAPI service only depend on this, not platform specifics.
 */

/**
 * Standard User Data
 *
 * Universal user identifiers across all platforms
 */
export interface StandardUserData {
  email?: string;
  phone?: string;
  ip?: string;
  fbp?: string; // Facebook Browser fbp cookie
  fbc?: string; // Facebook Click id (fbc param)
  client_user_agent?: string;
  external_id?: string;
}

/**
 * Standard Custom Data
 *
 * E-commerce and search event parameters
 */
export interface StandardCustomData {
  // E-commerce fields
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  num_items?: number;
  order_id?: string;

  // Search/query fields (WooCommerce-specific mapping)
  x?: number;
  y?: number;
  query_string?: string;

  // Generic event properties
  event_source_url?: string;
  external_id?: string;
}

/**
 * Standard Event
 *
 * ALL adapters must return this exact structure.
 * Router and CAPI sender depend only on this interface.
 */
export interface StandardEvent {
  eventName: string;
  userData: StandardUserData;
  customData: StandardCustomData;
  timestamp?: number;
}

/**
 * Platform Types
 *
 * Source system identification for routing and logging
 */
export type Platform = 'shopify' | 'woocommerce' | 'custom' | 'general';

/**
 * Adapter Result
 *
 * Return type for all adapter functions
 */
export interface AdapterResult<T = unknown> {
  success: boolean;
  event?: StandardEvent;
  error?: string;
  originalRequest?: T;
}
