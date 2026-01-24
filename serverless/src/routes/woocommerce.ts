import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../types';
import { webhookRateLimit } from '../middleware/rate-limit';
import { logger } from '../services/logging';
import { hashGCLID } from '../utils/gclid';

export const woocommerceRoutes = new Hono<AppEnv>();

async function validateWooCommerceSignature(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const bodyData = encoder.encode(body);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedSignature = btoa(String.fromCharCode(...signatureArray));

  return calculatedSignature === signature;
}

const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  currency: z.string(),
  total: z.string(),
  billing: z.object({
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  }),
  meta_data: z.array(z.object({
    key: z.string(),
    value: z.any(),
  })).optional(),
  date_created_gmt: z.string(),
});

woocommerceRoutes.post('/webhook', webhookRateLimit, async (c) => {
  const signature = c.req.header('x-wc-webhook-signature');
  const source = c.req.header('x-wc-webhook-source');

  if (!signature || !source) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  const rawBody = await c.req.text();
  const db = c.env.DB;
  
  let domain = source;
  try {
    const url = new URL(source);
    domain = url.hostname;
  } catch (e) {
    // keep as is
  }

  const agencies = await db.prepare('SELECT id, config FROM agencies').all();
  let matchedAgency: any = null;
  let webhookSecret = '';

  for (const agency of agencies.results) {
    try {
      const config = typeof agency.config === 'string' ? JSON.parse(agency.config) : agency.config;
      if (config.woocommerce_domain === domain || (config.woocommerce_url && config.woocommerce_url.includes(domain))) {
        matchedAgency = agency;
        webhookSecret = config.woocommerce_webhook_secret;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!matchedAgency || !webhookSecret) {
    logger.warn('Unknown WooCommerce domain or missing secret', { domain });
    return c.json({ error: 'Site not configured' }, 404);
  }

  const isValid = await validateWooCommerceSignature(webhookSecret, rawBody, signature);
  if (!isValid) {
    logger.warn('Invalid WooCommerce signature', { domain });
    return c.json({ error: 'Invalid signature' }, 401);
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  logger.info('Processing WooCommerce Order', { orderId: order.id, status: order.status, domain });

  let gclid = null;
  if (order.meta_data && Array.isArray(order.meta_data)) {
    const gclidMeta = order.meta_data.find((m: any) => m.key === '_gclid' || m.key === 'gclid');
    if (gclidMeta) {
      gclid = gclidMeta.value;
    }
  }

  const gclidHash = gclid ? await hashGCLID(gclid) : null;

  try {
    const leadData = {
      org_id: matchedAgency.id,
      site_id: domain,
      email: order.billing.email,
      phone: order.billing.phone || null,
      gclid_hash: gclidHash,
      value_cents: Math.round(parseFloat(order.total) * 100),
      currency: order.currency,
      status: order.status === 'completed' || order.status === 'processing' ? 'won' : 'new',
      vertical: 'ecommerce',
      metadata: JSON.stringify({
        source: 'woocommerce',
        order_id: order.id,
        raw_gclid: gclid 
      })
    };

    const result = await db.prepare(`
      INSERT INTO leads (
        id, org_id, site_id, email, phone, gclid_hash, 
        base_value_cents, status, vertical, metadata, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).bind(
      crypto.randomUUID(),
      leadData.org_id,
      leadData.site_id,
      leadData.email,
      leadData.phone,
      leadData.gclid_hash,
      leadData.value_cents,
      leadData.status,
      leadData.vertical,
      leadData.metadata,
      new Date().toISOString()
    ).run();

    if (gclid) {
       logger.info('GCLID found, ready for upload', { gclid: gclid.substring(0, 10) + '...' });
    }

    return c.json({ success: true, lead_id: result.meta.last_row_id });

  } catch (error) {
    logger.error('Failed to store WooCommerce lead', { error });
    return c.json({ error: 'Internal processing failed' }, 500);
  }
});
