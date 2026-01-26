import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../types';

export const customEventsRoutes = new Hono<AppEnv>();

// Standard custom event names
const VALID_EVENT_NAMES = [
  'subscription_start',
  'returning_customer_purchase',
  'high_value_transaction',
  'subscription_intent',
  'loyalty_register',
];

// Event validation schema
const customEventSchema = {
  event_name: (value: any) => VALID_EVENT_NAMES.includes(value),
  event_timestamp: (value: any) => !isNaN(Date.parse(value)),
  platform: (value: any) => ['shopify', 'woocommerce', 'custom'].includes(value),
  site_id: (value: any) => typeof value === 'string' && value.length > 0,
  event_data: (value: any) => typeof value === 'object' && value !== null,
};

interface CustomEvent {
  event_name: string;
  event_timestamp: string;
  platform: string;
  site_id: string;
  user_id?: string;
  session_id?: string;
  gclid?: string;
  fbclid?: string;
  utm_parameters?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  event_data: Record<string, any>;
  org_id?: string;
  created_at?: string;
}

customEventsRoutes.post('/', authMiddleware(), async (c) => {
  try {
    const body = await c.req.json();
    const events: CustomEvent[] = Array.isArray(body) ? body : [body];

    // Validate events
    for (const event of events) {
      for (const [field, validator] of Object.entries(customEventSchema)) {
        const value = (event as any)[field];
        if (!validator(value)) {
          return c.json(
            {
              error: `Invalid ${field}: ${value}`,
            },
            400
          );
        }
      }
    }

    // Store events
    const storedEvents = await Promise.all(
      events.map((event) =>
        c.env.DB.prepare(`
        INSERT INTO custom_events (
          id, org_id, site_id, event_name, event_value, event_currency,
          customer_email, gclid_hash, event_timestamp, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
          .bind(
            crypto.randomUUID(),
            c.get('auth').org_id,
            event.site_id || 'unknown',
            event.event_name,
            event.event_value || null,
            event.event_currency || 'USD',
            event.customer_email || null,
            event.gclid_hash || null,
            event.event_timestamp || new Date().toISOString(),
            JSON.stringify(event.metadata || {}),
            new Date().toISOString()
          )
          .run()
          .then(() => ({ id: crypto.randomUUID() }))
      )
    );

    // Process for Google Ads conversions
    await processCustomEventConversions(events, c);

    return c.json({
      success: true,
      events_processed: events.length,
      events_stored: storedEvents.map((e) => e.id),
    });
  } catch (error) {
    console.error('Custom events processing error:', error);
    return c.json(
      {
        error: 'Custom events processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

customEventsRoutes.get('/', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;

    // Get custom events for organization
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const siteId = c.req.query('site_id');
    const eventName = c.req.query('event_name');

    let query = 'SELECT * FROM custom_events WHERE org_id = ?';
    const params: any[] = [c.get('auth').org_id];

    if (siteId) {
      query += ' AND site_id = ?';
      params.push(siteId);
    }
    if (eventName) {
      query += ' AND event_name = ?';
      params.push(eventName);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const eventsResult = await db
      .prepare(query)
      .bind(...params)
      .all();
    const events = eventsResult.results || [];

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM custom_events WHERE org_id = ?';
    const countParams: any[] = [c.get('auth').org_id];

    if (siteId) {
      countQuery += ' AND site_id = ?';
      countParams.push(siteId);
    }
    if (eventName) {
      countQuery += ' AND event_name = ?';
      countParams.push(eventName);
    }

    const totalCountResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ count: number }>();
    const totalCount = totalCountResult?.count || 0;

    return c.json({
      events,
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error('Custom events retrieval error:', error);
    return c.json(
      {
        error: 'Custom events retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Helper function to process conversions
async function processCustomEventConversions(events: CustomEvent[], c: any) {
  const conversionMappings: Record<string, string> = {
    subscription_start: 'subscription_purchase',
    returning_customer_purchase: 'repeat_purchase',
    high_value_transaction: 'high_value_purchase',
    subscription_intent: 'subscription_intent',
    loyalty_register: 'loyalty_registration',
  };

  for (const event of events) {
    const conversionAction = conversionMappings[event.event_name];
    if (conversionAction && event.gclid) {
      // Queue for Google Ads conversion upload
      await c.env.DB.prepare(`
        INSERT INTO conversion_queue (
          gclid, conversion_action, conversion_value, conversion_time, agency_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
        .bind(
          event.gclid,
          conversionAction,
          event.event_data?.value || 0,
          event.event_timestamp,
          c.get('auth').org_id,
          new Date().toISOString()
        )
        .run();
    }
  }
}
