/**
 * Multi-Platform Tracking Worker
 *
 * Router that accepts platform-specific webhooks, normalizes them via adapters,
 * and sends to Facebook CAPI using a single StandardEvent interface.
 */

import { Hono } from 'hono';
import { generalAdapter } from './adapters/general';
import { shopifyAdapter } from './adapters/shopify';
import { woocommerceAdapter } from './adapters/woocommerce';
import { sendToFacebookCAPI } from './services/facebook';
import type { StandardEvent } from './types';

const app = new Hono<{
  Bindings: any;
}>();

/**
 * Shopify Webhook Endpoint
 *
 * POST /webhooks/shopify
 * Uses shopifyAdapter to convert Shopify webhook → StandardEvent → Facebook CAPI
 */
app.post('/webhooks/shopify', async (c) => {
  const payload = await c.req.json();

  const result = shopifyAdapter(payload);

  if (!result.success || !result.event) {
    return c.json({ success: false, error: result.error }, 400);
  }

  const facebookResult = await sendToFacebookCAPI(result.event);

  return c.json({
    success: true,
    platform: 'shopify',
    facebook: facebookResult,
    standardEvent: {
      eventName: result.event.eventName,
      userData: result.event.userData,
      customData: result.event.customData,
    },
  });
});

/**
 * WooCommerce Webhook Endpoint
 *
 * POST /webhooks/woo
 * Uses woocommerceAdapter to convert WooCommerce webhook → StandardEvent → Facebook CAPI
 */
app.post('/webhooks/woo', async (c) => {
  const payload = await c.req.json();

  const result = woocommerceAdapter(payload);

  if (!result.success || !result.event) {
    return c.json({ success: false, error: result.error }, 400);
  }

  const facebookResult = await sendToFacebookCAPI(result.event);

  return c.json({
    success: true,
    platform: 'woocommerce',
    facebook: facebookResult,
    standardEvent: {
      eventName: result.event.eventName,
      userData: result.event.userData,
      customData: result.event.customData,
    },
  });
});

/**
 * General Tracking Endpoint
 *
 * POST /track/standard
 * Expects StandardEvent format already (pass-through via generalAdapter)
 */
app.post('/track/general', async (c) => {
  const payload = await c.req.json();

  const result = generalAdapter(payload);

  if (!result.success || !result.event) {
    return c.json({ success: false, error: result.error }, 400);
  }

  const facebookResult = await sendToFacebookCAPI(result.event);

  return c.json({
    success: true,
    platform: 'general',
    facebook: facebookResult,
    standardEvent: {
      eventName: result.event.eventName,
      userData: result.event.userData,
      customData: result.event.customData,
    },
  });
});

export default app;
