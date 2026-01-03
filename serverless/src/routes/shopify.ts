import { Hono, type Context } from 'hono';
import type { AppEnv } from '../types';
import { queueConversions, ConversionData } from '../services/google-ads-queue';
import { webhookRateLimit } from '../middleware/rate-limit';
import { validateShopifyWebhook } from '../services/crypto';
import { logger, logWebhookSuccess, logWebhookFailure, logPayloadError } from '../services/logging';

export const shopifyRoutes = new Hono<AppEnv>();

interface ShopifyCustomerWebhook {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string[];
  addresses?: Array<{
    address1: string;
    city: string;
    country: string;
    phone?: string;
  }>;
  created_at: string;
  updated_at: string;
  marketing_opt_in_level?: string;
  sms_marketing_consent?: {
    state: string;
    opt_in_level: string;
  };
  email_marketing_consent?: {
    state: string;
    opt_in_level: string;
  };
}

interface ShopifyOrderWebhook {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  landing_site?: string;
  referring_site?: string;
  source_name?: string;
  tags?: string[];
}

shopifyRoutes.post('/webhook', webhookRateLimit, async (c) => {
  try {
    // Get raw body for HMAC validation before parsing JSON
    const rawBody = await c.req.text();
    const headers = c.req.raw.headers;

    // Validate HMAC signature
    const shopDomain = c.req.header('X-Shopify-Shop-Domain');
    if (!shopDomain) {
      console.warn('Missing X-Shopify-Shop-Domain header');
      return createSecureErrorResponse(c, 'missing_shop_domain', 400);
    }

    const webhookAgency = await findAgencyByShopifyDomain(c.get('db'), shopDomain);

    if (!webhookAgency?.config?.shopify_webhook_secret) {
      console.error(`No webhook secret configured for shop: ${shopDomain}`);
      return createSecureErrorResponse(c, 'configuration_error', 500);
    }

    const headersRecord: Record<string, string | undefined> = {};
    headers.forEach((value, key) => {
      headersRecord[key] = value;
    });
    
    const validation = validateShopifyWebhook(headersRecord, rawBody, webhookAgency.config.shopify_webhook_secret);
    if (!validation.valid) {
      logWebhookFailure(c, shopDomain, validation.error || 'Unknown validation error');
      return createSecureErrorResponse(c, 'invalid_signature', 401);
    }

    // Parse JSON payload after validation
    const payload = JSON.parse(rawBody);
    const topic = c.req.header('X-Shopify-Topic');
    const db = c.get('db');

    // Validate payload integrity
    const payloadValidation = validateWebhookPayload(payload, topic);
    if (!payloadValidation.valid) {
      logPayloadError(c, shopDomain, topic || 'unknown', payloadValidation.error || 'Unknown payload validation error');
      return createSecureErrorResponse(c, 'invalid_payload', 400);
    }

    logWebhookSuccess(c, topic || 'unknown', shopDomain);

    let leadData: any = null;

    // Handle different Shopify webhook topics
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
        leadData = processShopifyCustomer(payload as ShopifyCustomerWebhook, topic);
        break;

      case 'orders/create':
      case 'orders/paid':
        leadData = processShopifyOrder(payload as ShopifyOrderWebhook, topic || 'unknown');
        break;

      default:
        // For other topics, try to extract customer data if available
        if (payload.customer) {
          leadData = processShopifyOrder(payload as ShopifyOrderWebhook, topic || 'unknown');
        } else {
          console.log(`Unhandled Shopify webhook topic: ${topic}`);
          return c.json({ status: 'ignored', topic }, 200);
  }
}

/**
 * Create a secure error response with appropriate headers
 */
function createSecureErrorResponse(c: Context, errorType: string, statusCode: number): Response {
  const response = c.json({
    error: errorType,
    message: getErrorMessage(errorType),
    timestamp: new Date().toISOString()
  }, statusCode);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add rate limit headers if applicable
  if (statusCode === 429) {
    response.headers.set('Retry-After', '60'); // Default retry after 60 seconds
  }

  return response;
}

/**
 * Get generic error message that doesn't leak validation logic
 */
function getErrorMessage(errorType: string): string {
  const messages: Record<string, string> = {
    'invalid_signature': 'Webhook signature validation failed',
    'invalid_payload': 'Webhook payload validation failed',
    'rate_limit_exceeded': 'Request rate limit exceeded',
    'missing_shop_domain': 'Required shop domain header missing',
    'configuration_error': 'Service configuration error',
    'agency_not_found': 'Agency configuration not found',
    'processing_failed': 'Webhook processing failed'
  };

  return messages[errorType] || 'An error occurred processing the webhook';
}

    if (!leadData) {
      return c.json({ status: 'no_lead_data' }, 200);
    }

    // Find agency by Shopify shop domain
    if (!shopDomain) {
      console.warn('Missing X-Shopify-Shop-Domain header');
      return c.json({ error: 'missing_shop_domain' }, 400);
    }
    
    const agency = await findAgencyByShopifyDomain(db, shopDomain);
    if (!agency) {
      console.warn(`No agency found for Shopify domain: ${shopDomain}`);
      return c.json({ error: 'agency_not_found', domain: shopDomain }, 404);
    }

    // Store the lead
    const storedLead = await db.insertLead({
      org_id: agency.id,
      site_id: shopDomain || 'shopify',
      email: leadData.email,
      phone: leadData.phone || null,
      gclid: leadData.gclid || null,
      fbclid: leadData.fbclid || null,
      landing_page: leadData.landing_page || null,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      base_value_cents: leadData.value_cents || 0,
      status: leadData.status || 'new',
      vertical: 'ecommerce'
    });

    // Store technology association
    await storeLeadTechnologies(db, storedLead.id, [{
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 1.0,
      detected_via: 'webhook'
    }]);

    // Queue Google Ads conversion if agency has credentials
    const agencyConfig = await db.prepare(
      'SELECT google_ads_config FROM agencies WHERE id = ?'
    ).bind(agency.id).first();

    if (agencyConfig?.google_ads_config) {
      const conversions: ConversionData[] = [{
        gclid: leadData.gclid || undefined,
        conversion_action_id: '',
        conversion_value: (leadData.value_cents || 0) / 100,
        currency_code: 'EUR',
        conversion_time: leadData.created_at || new Date().toISOString(),
      }];

      await queueConversions(c.env, agency.id, conversions);
    }

    const response = c.json({
      status: 'success',
      lead_id: storedLead.id,
      topic,
      shop_domain: shopDomain
    });

    // Add security headers to success responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;

  } catch (error) {
    console.error('Shopify webhook error:', error);
    return createSecureErrorResponse(c, 'processing_failed', 500);
  }
});

shopifyRoutes.get('/webhook', (c) => {
  return c.json({
    status: 'Shopify webhook endpoint is ready',
    supported_topics: [
      'customers/create',
      'customers/update',
      'orders/create',
      'orders/paid'
    ],
    usage: 'Configure webhooks in Shopify admin to POST JSON payloads here'
  });
});

// Payload validation function
function validateWebhookPayload(payload: any, topic: string | undefined): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be a valid object' };
  }

  // Validate common required fields
  if (!payload.id || typeof payload.id !== 'number') {
    return { valid: false, error: 'Missing or invalid id field' };
  }

  if (!payload.created_at || !isValidISODate(payload.created_at)) {
    return { valid: false, error: 'Missing or invalid created_at timestamp' };
  }

  // Check if timestamp is not too old (within last 24 hours)
  const createdAt = new Date(payload.created_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (createdAt < oneDayAgo) {
    return { valid: false, error: 'Webhook timestamp is too old' };
  }

  // Topic-specific validation
  switch (topic) {
    case 'customers/create':
    case 'customers/update':
      return validateCustomerPayload(payload);
    case 'orders/create':
    case 'orders/paid':
      return validateOrderPayload(payload);
    default:
      return { valid: false, error: `Unsupported webhook topic: ${topic}` };
  }
}

function validateCustomerPayload(customer: any): { valid: boolean; error?: string } {
  if (!customer.email || typeof customer.email !== 'string' || !isValidEmail(customer.email)) {
    return { valid: false, error: 'Missing or invalid customer email' };
  }

  if (!customer.first_name && !customer.last_name) {
    return { valid: false, error: 'Customer must have at least first_name or last_name' };
  }

  // Validate tags array if present
  if (customer.tags && !Array.isArray(customer.tags)) {
    return { valid: false, error: 'Customer tags must be an array' };
  }

  return { valid: true };
}

function validateOrderPayload(order: any): { valid: boolean; error?: string } {
  if (!order.email || typeof order.email !== 'string' || !isValidEmail(order.email)) {
    return { valid: false, error: 'Missing or invalid order email' };
  }

  if (!order.total_price || typeof order.total_price !== 'string' || isNaN(parseFloat(order.total_price))) {
    return { valid: false, error: 'Missing or invalid order total_price' };
  }

  if (!order.currency || typeof order.currency !== 'string' || order.currency.length !== 3) {
    return { valid: false, error: 'Missing or invalid order currency' };
  }

  if (!order.customer || typeof order.customer !== 'object') {
    return { valid: false, error: 'Missing or invalid order customer data' };
  }

  if (!order.customer.id || typeof order.customer.id !== 'number') {
    return { valid: false, error: 'Missing or invalid order customer id' };
  }

  // Validate tags array if present
  if (order.tags && !Array.isArray(order.tags)) {
    return { valid: false, error: 'Order tags must be an array' };
  }

  return { valid: true };
}

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Helper functions
function processShopifyCustomer(customer: ShopifyCustomerWebhook, topic: string) {
  // Extract UTM parameters from customer tags (if stored by JS snippet)
  const utmParams = extractUtmFromTags(customer.tags || []);

  return {
    email: customer.email,
    phone: customer.phone || customer.addresses?.[0]?.phone,
    gclid: utmParams.gclid,
    fbclid: utmParams.fbclid,
    landing_page: utmParams.landing_page,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    value_cents: 0, // Customer creation has no monetary value
    status: topic.includes('create') ? 'new' : 'qualified',
    created_at: customer.created_at
  };
}

function processShopifyOrder(order: ShopifyOrderWebhook, topic: string) {
  // Extract UTM parameters from order tags
  const utmParams = extractUtmFromTags(order.tags || []);

  return {
    email: order.email,
    phone: order.customer?.phone,
    gclid: utmParams.gclid,
    fbclid: utmParams.fbclid,
    landing_page: order.landing_site || utmParams.landing_page,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    value_cents: Math.round(parseFloat(order.total_price) * 100), // Convert to cents
    status: 'won', // Orders are conversions
    created_at: order.created_at
  };
}

function extractUtmFromTags(tags: string[]) {
  const utmData: any = {};

  for (const tag of tags) {
    if (tag.startsWith('gclid:')) {
      utmData.gclid = tag.replace('gclid:', '');
    } else if (tag.startsWith('fbclid:')) {
      utmData.fbclid = tag.replace('fbclid:', '');
    } else if (tag.startsWith('utm_source:')) {
      utmData.utm_source = tag.replace('utm_source:', '');
    } else if (tag.startsWith('utm_medium:')) {
      utmData.utm_medium = tag.replace('utm_medium:', '');
    } else if (tag.startsWith('utm_campaign:')) {
      utmData.utm_campaign = tag.replace('utm_campaign:', '');
    } else if (tag.startsWith('landing_page:')) {
      utmData.landing_page = decodeURIComponent(tag.replace('landing_page:', ''));
    }
  }

  return utmData;
}

async function findAgencyByShopifyDomain(db: any, shopDomain?: string) {
  if (!shopDomain) return null;

  // Look for agency with matching Shopify domain in their config
  const agencies = await db.prepare(
    'SELECT id, config FROM agencies'
  ).all();

  for (const agency of agencies.results || agencies) {
    try {
      const config = JSON.parse(agency.config || '{}');
      if (config.shopify_domain === shopDomain) {
        return agency;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

// Import the storeLeadTechnologies function
async function storeLeadTechnologies(db: any, leadId: string, technologies: any[]) {
  // Implementation from leads.ts
  for (const tech of technologies) {
    let techResult = await db.prepare(
      'SELECT id FROM technologies WHERE name = ? AND category = ?'
    ).bind(tech.name, tech.category).first();

    if (!techResult) {
      const insertResult = await db.prepare(
        'INSERT INTO technologies (name, category) VALUES (?, ?)'
      ).bind(tech.name, tech.category).run();

      techResult = { id: insertResult.lastInsertRowid };
    }

    await db.prepare(
      'INSERT OR IGNORE INTO lead_technologies (lead_id, technology_id, confidence_score) VALUES (?, ?, ?)'
    ).bind(leadId, techResult.id, tech.confidence).run();
  }
}