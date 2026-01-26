import { Hono } from 'hono';
import type { AppEnv } from '../types';

export interface TikTokWebhookEvent {
  event_type: string;
  event_time: number;
  event_id: string;
  user_unique_id?: string;
  order_id?: string;
  content_type?: string;
  advertiser_id?: string;
  campaign_id?: string;
  ad_group_id?: string;
  creative_id?: string;
  objective?: string;
  value?: number;
  currency?: string;
  status?: string;
  test_event?: boolean;
  custom_data?: Record<string, any>;
}

export interface TikTokWebhookResponse {
  code: number;
  message: string;
  data?: any;
}

export interface TikTokWebhookValidation {
  timestamp: string;
  nonce: string;
  partner_id: string;
}

export class TikTokWebhookService {
  constructor(
    private db: D1Database,
    private appSecret: string
  ) {}

  async validateWebhook(eventData: any, signature: string): Promise<boolean> {
    if (!this.appSecret || !signature) return false;

    const sortedKeys = Object.keys(eventData).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(eventData[key])}`)
      .join('&');

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(queryString, 'utf8')
      .digest('hex');

    return expectedSignature === signature;
  }

  async handleTikTokWebhook(eventData: TikTokWebhookEvent): Promise<TikTokWebhookResponse> {
    try {
      console.log('Processing TikTok webhook:', eventData);

      if (eventData.test_event) {
        return { code: 200, message: 'Test webhook received' };
      }

      const result = await this.db
        .prepare(
          'INSERT INTO tiktok_webhooks (id, event_type, event_time, event_id, user_unique_id, order_id, content_type, advertiser_id, campaign_id, ad_group_id, creative_id, objective, value, currency, status, test_event, custom_data, processed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          crypto.randomUUID(),
          eventData.event_type,
          eventData.event_time,
          eventData.event_id,
          eventData.user_unique_id,
          eventData.order_id,
          eventData.content_type,
          eventData.advertiser_id,
          eventData.campaign_id,
          eventData.ad_group_id,
          eventData.creative_id,
          eventData.objective,
          eventData.value,
          eventData.currency,
          eventData.status,
          eventData.test_event,
          JSON.stringify(eventData.custom_data || {}),
          false
        )
        .run();

      await this.db
        .prepare('UPDATE webhooks SET last_webhook_processed = ? WHERE id = ?')
        .bind('tiktok', Date.now().toString())
        .run();

      console.log('TikTok webhook processed successfully');
      return { code: 200, message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('TikTok webhook error:', error);
      return { code: 500, message: 'Webhook processing failed' };
    }
  }
}

const tiktokWebhookService = new TikTokWebhookService();
const tiktokRouter = new Hono();

// TikTok webhook endpoint
tiktokRouter.post('/webhooks/tiktok', async (c) => {
  const signature = c.req.header('X-Webhook-Signature');
  const timestamp = c.req.header('X-Webhook-Timestamp');
  const nonce = c.req.header('X-Webhook-Nonce');

  if (!signature || !timestamp || !nonce) {
    return c.json({ error: 'Missing TikTok webhook headers' }, 400);
  }

  const body = await c.req.text();

  try {
    const eventData = JSON.parse(body);
    const isValid = await tiktokWebhookService.validateWebhook(eventData, signature);

    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 401);
    }

    const result = await tiktokWebhookService.handleTikTokWebhook(eventData);
    return c.json(result);
  } catch (error) {
    console.error('TikTok webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// TikTok webhook verification endpoint
tiktokRouter.get('/webhooks/tiktok/verify', async (c) => {
  const partner_id = c.req.query('partner_id');

  if (!partner_id) {
    return c.json({ error: 'Partner ID required' }, 400);
  }

  const verification: TikTokWebhookValidation = {
    timestamp: new Date().toISOString(),
    nonce: crypto.randomUUID(),
    partner_id: partner_id!,
  };

  return c.json({
    code: 200,
    message: 'Webhook verification endpoint',
    data: verification,
  });
});

// TikTok API health check
tiktokRouter.get('/webhooks/tiktok/status', async (c) => {
  const lastProcessed = await this.db
    .prepare('SELECT last_webhook_processed FROM webhooks WHERE source = ?')
    .bind('tiktok')
    .first();

  return c.json({
    status: 'healthy',
    tiktok_webhooks_configured: !!lastProcessed,
    last_webhook_processed: lastProcessed || null,
    timestamp: new Date().toISOString(),
  });
});

export { tiktokRouter };
