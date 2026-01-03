import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const ghlRoutes = new Hono<AppEnv>();

interface GHLWebhookPayload {
  contact_id?: string;
  location_id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  source?: string;
  gclid?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  workflow_id?: string;
  workflow_name?: string;
  timestamp?: string;
}

ghlRoutes.post('/webhook', async (c) => {
  try {
    const payload: GHLWebhookPayload = await c.req.json();
    const db = c.get('db');

    if (!payload.email && !payload.contact_id) {
      return c.json({ error: 'email or contact_id required' }, 400);
    }

    const gclid = payload.gclid || extractGclidFromUtm(payload);
    const fbclid = payload.fbclid || null;

    const leadValue = calculateLeadValue(payload);

    const result = await db.insertLead({
      org_id: payload.location_id || 'default',
      site_id: payload.location_id || 'ghl',
      email: payload.email || '',
      phone: payload.phone || null,
      gclid: gclid,
      fbclid: fbclid,
      landing_page: payload.source || null,
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      utm_content: payload.utm_content || null,
      utm_term: payload.utm_term || null,
      lead_score: leadValue.score,
      base_value_cents: leadValue.base_cents,
      adjusted_value_cents: leadValue.adjusted_cents,
      value_multiplier: leadValue.multiplier,
      status: 'new',
      vertical: detectVertical(payload),
      created_at: payload.timestamp || new Date().toISOString(),
    });

    const response: any = {
      success: true,
      lead_id: result.id,
      gclid_captured: !!gclid,
      fbclid_captured: !!fbclid,
      lead_value_cents: leadValue.adjusted_cents,
    };

    if (gclid) {
      response.conversion_ready = true;
      response.message = 'Lead captured with GCLID - ready for Google Ads upload';
    } else {
      response.conversion_ready = false;
      response.message = 'Lead captured but no GCLID - cannot upload to Google Ads';
    }

    return c.json(response);
  } catch (error) {
    console.error('GHL webhook error:', error);
    return c.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

ghlRoutes.get('/webhook', (c) => {
  return c.json({
    status: 'active',
    message: 'GHL webhook endpoint is ready',
    usage: 'POST JSON payload from GoHighLevel workflow',
    required_fields: ['email OR contact_id'],
    optional_fields: ['gclid', 'fbclid', 'utm_*', 'phone', 'custom_fields'],
  });
});

function extractGclidFromUtm(payload: GHLWebhookPayload): string | null {
  if (payload.custom_fields?.gclid) return payload.custom_fields.gclid;
  if (payload.custom_fields?.['google_click_id']) return payload.custom_fields['google_click_id'];
  return null;
}

function calculateLeadValue(payload: GHLWebhookPayload): {
  score: number;
  base_cents: number;
  adjusted_cents: number;
  multiplier: number;
} {
  let score = 50;
  let multiplier = 1.0;

  if (payload.phone) {
    score += 10;
    multiplier += 0.2;
  }

  if (payload.tags?.includes('qualified') || payload.tags?.includes('hot')) {
    score += 20;
    multiplier += 0.5;
  }

  if (payload.custom_fields?.budget && parseInt(payload.custom_fields.budget) > 10000) {
    score += 15;
    multiplier += 0.3;
  }

  if (payload.custom_fields?.company || payload.custom_fields?.business_name) {
    score += 10;
    multiplier += 0.2;
  }

  const base_cents = 10000;
  const adjusted_cents = Math.round(base_cents * multiplier);

  return { score: Math.min(score, 100), base_cents, adjusted_cents, multiplier };
}

function detectVertical(payload: GHLWebhookPayload): string | null {
  const tags = payload.tags?.join(' ').toLowerCase() || '';
  const source = payload.source?.toLowerCase() || '';

  if (tags.includes('real estate') || source.includes('realtor')) return 'real_estate';
  if (tags.includes('dental') || source.includes('dental')) return 'dental';
  if (tags.includes('legal') || source.includes('law')) return 'legal';
  if (tags.includes('hvac') || source.includes('hvac')) return 'hvac';
  if (tags.includes('roofing') || source.includes('roof')) return 'roofing';

  return null;
}
