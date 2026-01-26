import { Hono } from 'hono';
import { webhookRateLimit } from '../middleware/rate-limit';
import { validateShopifyWebhook } from '../services/crypto';
import { logger } from '../services/logging';
import type { AppEnv } from '../types';
import { hashGCLID, isValidGCLID, redactGCLID } from '../utils/gclid';

export const shopifyRoutes = new Hono<AppEnv>();

interface ShopifyOrderPayload {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  customer: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  landing_site?: string;
  source_name?: string;
  tags?: string[];
  note_attributes?: Array<{ name: string; value: string }>;
}

interface ShopifyCustomerPayload {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

/**
 * Create secure error response with proper headers
 */
function createErrorResponse(c: AppEnv['Bindings'], error: string, status: number): Response {
  const messages: Record<string, string> = {
    missing_shop_domain: 'Missing X-Shopify-Shop-Domain header',
    invalid_signature: 'Webhook signature validation failed',
    invalid_payload: 'Invalid webhook payload',
    agency_not_found: 'Shop not configured',
    processing_failed: 'Webhook processing failed',
  };

  const response = c.json(
    {
      success: false,
      error,
      message: messages[error] || 'An error occurred',
      timestamp: new Date().toISOString(),
    },
    status
  );

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

/**
 * Extract GCLID from various Shopify sources
 * Priority: note_attributes > tags > landing_site
 */
async function extractGCLID(order: ShopifyOrderPayload): Promise<string | null> {
  // 1. Check note_attributes (best - sent by JS snippet)
  if (order.note_attributes) {
    const gclidAttr = order.note_attributes.find((attr) => attr.name === 'gclid');
    if (gclidAttr && isValidGCLID(gclidAttr.value)) {
      return gclidAttr.value;
    }
  }

  // 2. Check tags (format: "gclid:GCLID_xxx")
  if (order.tags) {
    for (const tag of order.tags) {
      if (tag.startsWith('gclid:')) {
        const gclid = tag.replace('gclid:', '');
        if (isValidGCLID(gclid)) {
          return gclid;
        }
      }
    }
  }

  // 3. Check landing_site query params
  if (order.landing_site) {
    try {
      const url = new URL(order.landing_site);
      const gclid = url.searchParams.get('gclid');
      if (gclid && isValidGCLID(gclid)) {
        return gclid;
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  return null;
}

/**
 * Find agency by Shopify domain
 */
async function findAgencyByDomain(db: any, shopDomain: string): Promise<any> {
  const agencies = await db.prepare('SELECT id, config FROM agencies').all();

  for (const agency of agencies.results || agencies) {
    try {
      const config =
        typeof agency.config === 'string' ? JSON.parse(agency.config || '{}') : agency.config || {};

      if (config.shopify_domain === shopDomain) {
        return { ...agency, config };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Process Shopify order - extract lead data with GCLID
 */
async function processOrder(order: ShopifyOrderPayload): Promise<any> {
  const gclid = await extractGCLID(order);
  const gclidHash = gclid ? await hashGCLID(gclid) : null;

  logger.info('Processing Shopify order', {
    orderId: order.id,
    email: order.email,
    gclid: gclid ? redactGCLID(gclid) : null,
    gclidHash: gclidHash ? gclidHash.substring(0, 8) + '...' : null,
  });

  return {
    email: order.email,
    phone: order.customer?.phone || null,
    gclid_hash: gclidHash,
    landing_page: order.landing_site || null,
    utm_source: order.source_name || null,
    value_cents: Math.round(parseFloat(order.total_price || '0') * 100),
    status: 'won',
    created_at: order.created_at,
  };
}

/**
 * Process Shopify customer
 */
async function processCustomer(customer: ShopifyCustomerPayload): Promise<any> {
  // Try to find GCLID in tags
  let gclid: string | null = null;
  if (customer.tags) {
    for (const tag of customer.tags) {
      if (tag.startsWith('gclid:')) {
        const potential = tag.replace('gclid:', '');
        if (isValidGCLID(potential)) {
          gclid = potential;
          break;
        }
      }
    }
  }

  const gclidHash = gclid ? await hashGCLID(gclid) : null;

  return {
    email: customer.email,
    phone: customer.phone || null,
    gclid_hash: gclidHash,
    landing_page: null,
    utm_source: 'shopify',
    value_cents: 0,
    status: 'new',
    created_at: customer.created_at,
  };
}

// =============================================================================
// SHOPIFY WEBHOOK ENDPOINT - Ready for mycannaby.de demo!
// =============================================================================

shopifyRoutes.post('/webhook', webhookRateLimit, async (c) => {
  const shopDomain = c.req.header('X-Shopify-Shop-Domain');
  const topic = c.req.header('X-Shopify-Topic');

  // Validate shop domain
  if (!shopDomain) {
    return createErrorResponse(c, 'missing_shop_domain', 400);
  }

  // Get raw body for signature validation
  const rawBody = await c.req.text();

  // Find agency by shop domain
  const agency = await findAgencyByDomain(c.env.DB, shopDomain);
  if (!agency) {
    logger.warn('Unknown shop domain', { shopDomain });
    return createErrorResponse(c, 'agency_not_found', 404);
  }

  // Validate webhook signature
  const webhookSecret = agency.config.shopify_webhook_secret;
  if (!webhookSecret) {
    logger.error('Missing webhook secret', { shopDomain });
    return createErrorResponse(c, 'processing_failed', 500);
  }

  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => (headers[k] = v));

  const validation = validateShopifyWebhook(headers, rawBody, webhookSecret);
  if (!validation.valid) {
    logger.warn('Invalid webhook signature', { shopDomain });
    return createErrorResponse(c, 'invalid_signature', 401);
  }

  // Parse payload
  let payload: ShopifyOrderPayload | ShopifyCustomerPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return createErrorResponse(c, 'invalid_payload', 400);
  }

  // Validate required fields
  if (!payload.id || !payload.created_at || !payload.email) {
    return createErrorResponse(c, 'invalid_payload', 400);
  }

  // Process based on topic
  let leadData: any;
  let leadId: string | null = null;

  try {
    if (topic === 'customers/create' || topic === 'customers/update') {
      leadData = await processCustomer(payload as ShopifyCustomerPayload);
    } else {
      // orders/create, orders/paid, or any other topic
      leadData = await processOrder(payload as ShopifyOrderPayload);
    }

    // Store lead in database
    const stored = await c.env.DB.insertLead({
      org_id: agency.id,
      site_id: shopDomain,
      email: leadData.email,
      phone: leadData.phone || null,
      gclid_hash: leadData.gclid_hash || null,
      landing_page: leadData.landing_page || null,
      utm_source: leadData.utm_source || null,
      utm_medium: null,
      utm_campaign: null,
      base_value_cents: leadData.value_cents || 0,
      status: leadData.status || 'new',
      vertical: 'ecommerce',
    });

    leadId = stored.id;

    logger.info('Lead stored successfully', {
      leadId,
      shopDomain,
      topic,
      hasGclid: !!leadData.gclid_hash,
    });
  } catch (error) {
    logger.error('Failed to process webhook', { shopDomain, error });
    return createErrorResponse(c, 'processing_failed', 500);
  }

  // Success response
  const response = c.json({
    success: true,
    lead_id: leadId,
    topic,
    shop_domain: shopDomain,
    has_conversion_data: !!leadData.gclid_hash,
    timestamp: new Date().toISOString(),
  });

  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
});

// Info endpoint
shopifyRoutes.get('/webhook', (c) => {
  return c.json({
    status: 'ready',
    shop: 'mycannaby.de (demo)',
    endpoints: {
      POST: '/webhook - Receives Shopify webhooks',
    },
    supported_topics: ['customers/create', 'customers/update', 'orders/create', 'orders/paid'],
    gclid_support: {
      sources: ['note_attributes', 'tags', 'landing_site'],
      storage: 'sha256_hash',
      redaction: 'first8_last4',
    },
  });
});
