import { Hono } from 'hono';
import type { AppEnv } from '../types';

interface Lead {
  id?: string;
  site_id: string;
  gclid?: string | null;
  fbclid?: string | null;
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
  lead_score?: number;
  base_value_cents?: number;
  adjusted_value_cents?: number;
  value_multiplier?: number;
  status: 'new' | 'qualified' | 'contacted' | 'won' | 'lost';
  vertical?: string;
  created_at?: string;
  updated_at?: string;
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

    const highValueLeads = leads.filter(lead => 
      (lead.adjusted_value_cents || 0) >= HIGH_VALUE_THRESHOLD_CENTS
    );

    if (highValueLeads.length > 0) {
      await db.insertTrigger({
        trigger_type: 'high_value_lead',
        lead_count: highValueLeads.length,
        org_id: auth.org_id,
        created_at: new Date().toISOString()
      });
    }

    return c.json({
      success: true,
      leads_processed: storedLeads.length,
      leads_stored: storedLeads.map(l => l.id)
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
