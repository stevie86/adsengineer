import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { queueConversions, ConversionData } from '../services/google-ads-queue';

// Meta conversion processing helper (synchronous for now)
async function processMetaConversions(env: AppEnv['Bindings'], agencyId: string, conversions: ConversionData[]): Promise<{ processed_count: number }> {
  try {
    // TODO: Implement synchronous Meta Conversions API calls when credentials are set up
    // For now, just count potential conversions
    const metaConversions = conversions.filter(c => c.fbclid);
    return { processed_count: metaConversions.length };
  } catch (error) {
    console.error('Meta processing error:', error);
    return { processed_count: 0 };
  }
}

interface Lead {
  id?: string;
  site_id: string;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null; // Microsoft Ads Click ID
  external_id?: string | null;
  email: string;
  phone?: string;
  landing_page: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  technologies?: TechnologyDetection[];
  // GDPR Consent Tracking
  consent_status?: 'granted' | 'denied' | 'pending' | 'withdrawn';
  consent_timestamp?: string;
  consent_method?: 'cookie_banner' | 'form_checkbox' | 'api_call';
  lead_score?: number;
  base_value_cents?: number;
  adjusted_value_cents?: number;
  value_multiplier?: number;
  status: 'new' | 'qualified' | 'contacted' | 'won' | 'lost';
  vertical?: string;
  created_at?: string;
  updated_at?: string;
}

interface TechnologyDetection {
  name: string;
  category: string;
  confidence: number;
  detected_via: 'webhook' | 'snippet' | 'api' | 'analysis';
}

// Helper function to validate GDPR consent
async function validateGdprConsent(db: any, leadId: string): Promise<boolean> {
  try {
    const lead = await db.prepare(
      'SELECT consent_status FROM leads WHERE id = ?'
    ).bind(leadId).first();

    return lead?.consent_status === 'granted';
  } catch (error) {
    console.error('GDPR consent validation error:', error);
    return false; // Default to no consent on error
  }
}

// Helper function to store technology associations
async function storeLeadTechnologies(db: any, leadId: string, technologies: TechnologyDetection[]) {
  for (const tech of technologies) {
    // Get or create technology
    let techResult = await db.prepare(
      'SELECT id FROM technologies WHERE name = ? AND category = ?'
    ).bind(tech.name, tech.category).first();

    if (!techResult) {
      const insertResult = await db.prepare(
        'INSERT INTO technologies (name, category) VALUES (?, ?)'
      ).bind(tech.name, tech.category).run();

      techResult = { id: insertResult.lastInsertRowid };
    }

    // Associate with lead
    await db.prepare(
      'INSERT OR IGNORE INTO lead_technologies (lead_id, technology_id, confidence_score) VALUES (?, ?, ?)'
    ).bind(leadId, techResult.id, tech.confidence).run();
  }
}

export const leadsRoutes = new Hono<AppEnv>();

const HIGH_VALUE_THRESHOLD_CENTS = 50000;

leadsRoutes.post('/', async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = await c.req.json();
    const leads: Lead[] = Array.isArray(body) ? body : [body];

    for (const lead of leads) {
      if (!lead.email || !lead.site_id) {
        return c.json({ error: 'email and site_id are required' }, 400);
      }
    }

    const storedLeads = await Promise.all(
      leads.map(lead =>
        db.insertLead({
          ...lead,
          org_id: auth.org_id,
          created_at: lead.created_at || new Date().toISOString()
        })
      )
    );

    // Validate GDPR consent for each lead
    const validLeads = [];
    const deniedLeads = [];

    for (const lead of storedLeads) {
      const consentValid = await validateGdprConsent(c.env.DB, lead.id);
      if (consentValid) {
        validLeads.push(lead);
      } else {
        deniedLeads.push(lead);
      }
    }

    let googleAdsQueued = 0;
    let metaQueued = 0;

    if (validLeads.length > 0) {
    // Process Google Ads conversions synchronously (queues require paid plan)
    // TODO: Check agency settings to see if Google Ads tracking is enabled
    try {
      const agencyConfig = await db.prepare(
        'SELECT google_ads_config FROM agencies WHERE id = ?'
      ).bind(auth.org_id).first();

      if (agencyConfig?.google_ads_config) {
        // For now, just count potential conversions
        // TODO: Implement synchronous Google Ads API calls when credentials are set up
        googleAdsQueued = validLeads.filter(lead => lead.gclid).length;
        console.log(`Would queue ${googleAdsQueued} Google Ads conversions (credentials configured)`);
      }
    } catch (error) {
      console.error('Google Ads processing error:', error);
      // Continue processing even if Google Ads processing fails
    }

    // Process Meta conversions synchronously (only if enabled)
    // TODO: Check agency settings to see if Meta tracking is enabled
    try {
      const metaCredentials = await db.prepare(
        'SELECT meta_config FROM agencies WHERE id = ?'
      ).bind(auth.org_id).first();

      if (metaCredentials?.meta_config) {
        const result = await processMetaConversions(c.env, auth.org_id, validLeads.map(lead => ({
          gclid: lead.gclid || undefined,
          fbclid: lead.fbclid || undefined,
          conversion_action_id: '',
          conversion_value: (lead.adjusted_value_cents || lead.base_value_cents || 0) / 100,
          currency_code: 'USD',
          conversion_time: lead.created_at || new Date().toISOString(),
          order_id: lead.external_id || undefined,
          external_id: lead.external_id,
        })));
        metaQueued = result.processed_count;
      }
    } catch (error) {
      console.error('Meta processing error:', error);
      // Continue processing even if Meta processing fails
    }

    // Log consent status for compliance
    const consentSummary = {
      total_leads: storedLeads.length,
      consented_leads: validLeads.length,
      denied_leads: storedLeads.length - validLeads.length,
      processed_conversions: googleAdsQueued
    };
    console.log('GDPR Consent Summary:', consentSummary);
    }

    return c.json({
      success: true,
      leads_processed: storedLeads.length,
      leads_stored: storedLeads.map(l => l.id),
      google_ads_queued: googleAdsQueued,
      meta_queued: metaQueued,
      consent_summary: consentSummary
    });
  } catch (error) {
    console.error('Lead ingestion error:', error);
    return c.json({
      error: 'Lead processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

leadsRoutes.get('/', async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const query = c.req.query();
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const offset = parseInt(query.offset || '0');

    const leads = await db.getLeadsByOrg(auth.org_id, {
      status: query.status,
      vertical: query.vertical,
      limit,
      offset
    });

    const total = await db.countLeadsByOrg(auth.org_id, {
      status: query.status,
      vertical: query.vertical
    });

    return c.json({
      leads,
      pagination: { limit, offset, total }
    });
  } catch (error) {
    console.error('Lead retrieval error:', error);
    return c.json({ 
      error: 'Lead retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

leadsRoutes.get('/:id', async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { id } = c.req.param();
    const lead = await db.getLeadById(id, auth.org_id);

    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    return c.json(lead);
  } catch (error) {
    console.error('Lead retrieval error:', error);
    return c.json({ 
      error: 'Lead retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

leadsRoutes.put('/:id', async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.get('db');
    if (!auth) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { id } = c.req.param();
    const updates = await c.req.json();
    
    const lead = await db.getLeadById(id, auth.org_id);
    if (!lead) {
      return c.json({ error: 'Lead not found' }, 404);
    }

    const success = await db.updateLead(id, auth.org_id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    if (!success) {
      return c.json({ error: 'Update failed' }, 500);
    }

    return c.json({ success: true, id });
  } catch (error) {
    console.error('Lead update error:', error);
    return c.json({ 
      error: 'Lead update failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
