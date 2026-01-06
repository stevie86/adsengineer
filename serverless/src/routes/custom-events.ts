import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { authMiddleware } from '../middleware/auth';

export const customEventsRoutes = new Hono<AppEnv>();

// Standard custom event names
const VALID_EVENT_NAMES = [
  'subscription_start',
  'returning_customer_purchase',
  'high_value_transaction',
  'subscription_intent',
  'loyalty_register'
];

// Event validation schema
const customEventSchema = {
  event_name: (value: any) => VALID_EVENT_NAMES.includes(value),
  event_timestamp: (value: any) => !isNaN(Date.parse(value)),
  platform: (value: any) => ['shopify', 'woocommerce', 'custom'].includes(value),
  site_id: (value: any) => typeof value === 'string' && value.length > 0,
  event_data: (value: any) => typeof value === 'object' && value !== null
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
        if (!validator(event[field])) {
          return c.json({
            error: `Invalid ${field}: ${event[field]}`
          }, 400);
        }
      }
    }

    // Store events
    const storedEvents = await Promise.all(
      events.map(event => c.get('db').insertCustomEvent({
        ...event,
        org_id: c.get('auth').org_id,
        created_at: event.event_timestamp || new Date().toISOString()
      }))
    );

    // Process for Google Ads conversions
    await processCustomEventConversions(events, c);

    return c.json({
      success: true,
      events_processed: events.length,
      events_stored: storedEvents.map(e => e.id)
    });

  } catch (error) {
    console.error('Custom events processing error:', error);
    return c.json({
      error: 'Custom events processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

customEventsRoutes.get('/', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    const query = c.req.query();

    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const offset = parseInt(query.offset || '0');

    const events = await db.getCustomEventsByOrg(auth.org_id, {
      event_name: query.event_name,
      platform: query.platform,
      limit,
      offset,
    });

    const total = await db.countCustomEventsByOrg(auth.org_id, {
      event_name: query.event_name,
      platform: query.platform,
    });

    return c.json({
      events,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('Custom events retrieval error:', error);
    return c.json({
      error: 'Custom events retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Helper function to process conversions
async function processCustomEventConversions(events: CustomEvent[], c: any) {
  const conversionMappings: Record<string, string> = {
    'subscription_start': 'subscription_purchase',
    'returning_customer_purchase': 'repeat_purchase',
    'high_value_transaction': 'high_value_purchase',
    'subscription_intent': 'subscription_intent',
    'loyalty_register': 'loyalty_registration'
  };

  for (const event of events) {
    const conversionAction = conversionMappings[event.event_name];
    if (conversionAction && event.gclid) {
      // Queue for Google Ads conversion upload
      await c.env.DB.prepare(`
        INSERT INTO conversion_queue (
          gclid, conversion_action, conversion_value, conversion_time, agency_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        event.gclid,
        conversionAction,
        event.event_data?.value || 0,
        event.event_timestamp,
        c.get('auth').org_id,
        new Date().toISOString()
      ).run();
    }
  }
}