import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Helper function to convert Uint8Array to base64 safely
function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array safely
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminSecret = c.env.ADMIN_SECRET;

  // Allow fallback for local development if not configured
  const isDevelopment = c.env.ENVIRONMENT === 'development' || !adminSecret;
  const fallbackSecret = isDevelopment ? 'dev-admin-secret-12345' : null;
  const effectiveSecret = adminSecret || fallbackSecret;

  if (!effectiveSecret) {
    return c.json({ error: 'Admin endpoint not configured' }, 503);
  }

  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== effectiveSecret) {
    return c.json({ error: 'Unauthorized - Invalid admin token' }, 401);
  }

  await next();
});

// ============================================================================
// Backup Endpoints
// ============================================================================

/**
 * Generate encrypted backup of all data
 * Returns 503 if BACKUP_ENCRYPTION_KEY not configured (fail-close)
 */
adminRoutes.get('/backup', async (c) => {
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('Backup attempted without BACKUP_ENCRYPTION_KEY configured');

    return c.json(
      {
        success: false,
        error: 'backup_encryption_required',
        code: 'BACKUP_ENCRYPTION_REQUIRED',
        message: 'Cannot perform backup without encryption key. Contact administrator.',
      },
      503
    );
  }

  try {
    const [leads, waitlist, triggers] = await Promise.all([
      db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all(),
      db.prepare('SELECT * FROM waitlist ORDER BY created_at DESC').all(),
      db.prepare('SELECT * FROM optimization_triggers ORDER BY created_at DESC').all(),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        leads: leads.results,
        waitlist: waitlist.results,
        optimization_triggers: triggers.results,
      },
      counts: {
        leads: leads.results.length,
        waitlist: waitlist.results.length,
        optimization_triggers: triggers.results.length,
      },
    };

    await encryptBackup(JSON.stringify(backup), encryptionKey);
    return c.json(backup);
  } catch (error) {
    return c.json({ error: 'Backup generation failed', details: error.message }, 500);
  }
});

/**
 * Decrypt backup data
 */
adminRoutes.post('/backup/decrypt', async (c) => {
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return c.json({ error: 'BACKUP_ENCRYPTION_KEY not configured' }, 503);
  }

  try {
    const { data, iv } = await c.req.json<{ data: string; iv: string }>();

    if (!data || !iv) {
      return c.json({ error: 'Missing data or iv fields' }, 400);
    }

    const decrypted = await decryptBackup(data, iv, encryptionKey);
    const backup = JSON.parse(decrypted);

    return c.json(backup);
  } catch (error) {
    console.error('Decrypt error:', error);
    return c.json(
      {
        error: 'Decryption failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// ============================================================================
// Agency Management Endpoints
// ============================================================================

adminRoutes.post('/backup/decrypt', async (c) => {
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return c.json({ error: 'BACKUP_ENCRYPTION_KEY not configured' }, 503);
  }

  try {
    const { data, iv } = await c.req.json<{ data: string; iv: string }>();

    if (!data || !iv) {
      return c.json({ error: 'Missing data or iv fields' }, 400);
    }

    const decrypted = await decryptBackup(data, iv, encryptionKey);
    const backup = JSON.parse(decrypted);

    return c.json(backup);
  } catch (error) {
    console.error('Decrypt error:', error);
    return c.json(
      {
        error: 'Decryption failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

adminRoutes.get('/stats', async (c) => {
  const db = c.env.DB;

  try {
    const [leadsCount, waitlistCount, recentLeads] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM leads').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>(),
      db
        .prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM leads 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)
        .all(),
    ]);

    return c.json({
      totals: {
        leads: leadsCount?.count || 0,
        waitlist: waitlistCount?.count || 0,
      },
      leads_last_7_days: recentLeads.results,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

async function encryptBackup(
  plaintext: string,
  keyString: string
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
    iv: uint8ArrayToBase64(iv),
  };
}

async function decryptBackup(
  ciphertext: string,
  ivString: string,
  keyString: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const iv = base64ToUint8Array(ivString);
  const data = base64ToUint8Array(ciphertext);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyMaterial, data);

  return decoder.decode(plaintext);
}

/**
 * Get all agencies with pagination
 */
adminRoutes.get('/agencies', async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const agencies = await db
      .prepare('SELECT * FROM agencies ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all();

    return c.json({
      success: true,
      data: agencies.results,
      pagination: {
        page,
        limit,
        total: agencies.meta?.total || 0
      }
    });
  } catch (error) {
    console.error('Agencies fetch error:', error);
    return c.json({ error: 'Failed to fetch agencies' }, 500);
  }
});

/**
 * Create new agency
 */
adminRoutes.post('/agencies', async (c) => {
  const db = c.env.DB;
  const data = await c.req.json();

  try {
    const customerId = `cust_${crypto.randomUUID()}`;
    const agencyId = crypto.randomUUID();
    
    const result = await db
      .prepare(`
        INSERT INTO agencies (id, name, customer_id, contact_email, google_ads_config, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(agencyId, data.name, customerId, data.contact_email, '{}', data.status || 'active')
      .run();

    return c.json({
      success: true,
      message: 'Agency created successfully',
      agency_id: result.meta?.last_row_id,
    });
  } catch (error) {
    console.error('Agency creation error:', error);
    return c.json({ error: 'Failed to create agency' }, 500);
  }
});

/**
 * Update agency details
 */
adminRoutes.put('/agencies/:id', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');
  const data = await c.req.json();

  try {
    await db
      .prepare(`
        UPDATE agencies 
        SET name = ?, contact_email = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(data.name, data.contact_email, data.status, agencyId)
      .run();

    return c.json({
      success: true,
      message: 'Agency updated successfully',
    });
  } catch (error) {
    console.error('Agency update error:', error);
    return c.json({ error: 'Failed to update agency' }, 500);
  }
});

/**
 * Delete agency
 */
adminRoutes.delete('/agencies/:id', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');

  try {
    await db.prepare('DELETE FROM agencies WHERE id = ?').bind(agencyId).run();

    return c.json({
      success: true,
      message: 'Agency deleted successfully',
    });
  } catch (error) {
    console.error('Agency deletion error:', error);
    return c.json({ error: 'Failed to delete agency' }, 500);
  }
});

/**
 * Get agency users/members
 */
adminRoutes.get('/agencies/:id/users', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');

  try {
    const users = await db
      .prepare(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
        FROM customers u
        WHERE u.agency_id = ?
        ORDER BY u.created_at DESC
      `)
      .bind(agencyId)
      .all();

    return c.json({
      success: true,
      data: users.results,
    });
  } catch (error) {
    console.error('Agency users fetch error:', error);
    return c.json({ error: 'Failed to fetch agency users' }, 500);
  }
});

/**
 * Get subscription statistics for an agency
 */
adminRoutes.get('/agencies/:id/subscriptions', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');

  try {
    const subscriptions = await db
      .prepare(`
        SELECT s.*, p.name as plan_name, p.lead_limit, p.features
        FROM subscriptions s
        LEFT JOIN pricing_tiers p ON s.stripe_price_id = p.stripe_price_id
        WHERE s.agency_id = ?
        ORDER BY s.created_at DESC
      `)
      .bind(agencyId)
      .all();

    return c.json({
      success: true,
      data: subscriptions.results,
    });
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return c.json({ error: 'Failed to fetch subscriptions' }, 500);
  }
});

/**
 * Get usage metrics for an agency
 */
adminRoutes.get('/agencies/:id/usage', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');

  try {
    const usage = await db
      .prepare(`
        SELECT metric_type, period_start, period_end, usage_count, limit_count
        FROM usage_metrics
        WHERE agency_id = ?
        ORDER BY period_start DESC
      `)
      .bind(agencyId)
      .all();

    return c.json({
      success: true,
      data: usage.results,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return c.json({ error: 'Failed to fetch usage metrics' }, 500);
  }
});

/**
 * Create subscription for agency
 */
adminRoutes.post('/agencies/:id/subscriptions', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');
  const { customer_id, price_id } = await c.req.json();

  try {
    const subscription = await db
      .prepare(`
        INSERT INTO subscriptions (
          id, agency_id, stripe_customer_id, stripe_price_id,
          status, current_period_start, current_period_end,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        crypto.randomUUID(),
        agencyId,
        customer_id,
        price_id,
        'incomplete',
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      )
      .run();

    return c.json({
      success: true,
      message: 'Subscription created successfully',
      subscription_id: subscription.meta?.last_row_id,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return c.json({ error: 'Failed to create subscription' }, 500);
  }
});

/**
 * Update subscription (cancel/upgrade/downgrade)
 */
adminRoutes.put('/agencies/:id/subscriptions/:subscriptionId', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');
  const subscriptionId = c.req.param('subscriptionId');
  const { action, price_id } = await c.req.json();

  try {
    if (action === 'cancel') {
      await db
        .prepare(
          "UPDATE subscriptions SET status = 'canceled', canceled_at = datetime('now') WHERE id = ? AND agency_id = ?"
        )
        .bind(subscriptionId, agencyId)
        .run();

      return c.json({
        success: true,
        message: 'Subscription canceled successfully',
      });
    } else if (action === 'upgrade' && price_id) {
      await db
        .prepare(
          "UPDATE subscriptions SET stripe_price_id = ?, updated_at = datetime('now') WHERE id = ? AND agency_id = ?"
        )
        .bind(price_id, subscriptionId, agencyId)
        .run();

      return c.json({
        success: true,
        message: 'Subscription upgraded successfully',
      });
    } else {
      return c.json(
        {
          success: false,
          error: 'Invalid action. Supported actions: cancel, upgrade',
        },
        400
      );
    }
  } catch (error) {
    console.error('Subscription update error:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

/**
 * Get billing history for agency
 */
adminRoutes.get('/agencies/:id/billing', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');

  try {
    const billingEvents = await db
      .prepare(`
        SELECT be.*, s.status as subscription_status, p.name as plan_name
        FROM billing_events be
        LEFT JOIN subscriptions s ON be.subscription_id = s.id
        LEFT JOIN pricing_tiers p ON s.stripe_price_id = p.stripe_price_id
        WHERE s.agency_id = ?
        ORDER BY be.created_at DESC
        LIMIT 50
      `)
      .bind(agencyId)
      .all();

    return c.json({
      success: true,
      data: billingEvents.results,
    });
  } catch (error) {
    console.error('Billing history fetch error:', error);
    return c.json({ error: 'Failed to fetch billing history' }, 500);
  }
});

/**
 * Get comprehensive analytics for agency
 */
adminRoutes.get('/agencies/:id/analytics', async (c) => {
  const db = c.env.DB;
  const agencyId = c.req.param('id');
  const period = c.req.query('period') || '30'; // default to last 30 days

  try {
    const [leadStats, revenueStats, subscriptionStats, usageMetrics] = await Promise.all([
      // Lead analytics
      db
        .prepare(`
          SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN created_at >= datetime('now', '-${period} days') THEN 1 END) as leads_this_period,
            SUM(base_value_cents) as total_value_cents,
            AVG(base_value_cents) as avg_value_cents,
            MAX(base_value_cents) as max_value_cents
          FROM leads 
          WHERE org_id = ?
        `)
        .bind(agencyId)
        .first(),

      // Revenue analytics
      db
        .prepare(`
          SELECT 
            COUNT(*) as total_conversions,
            SUM(adjusted_value_cents) as total_revenue_cents,
            AVG(adjusted_value_cents) as avg_revenue_cents
          FROM leads 
          WHERE org_id = ? AND adjusted_value_cents > 0
        `)
        .bind(agencyId)
        .first(),

      // Subscription stats
      db
        .prepare(`
          SELECT 
            COUNT(*) as total_subscriptions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
            COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_subscriptions
          FROM subscriptions 
          WHERE agency_id = ?
        `)
        .bind(agencyId)
        .first(),

      // Usage metrics
      db
        .prepare(`
          SELECT 
            metric_type,
            SUM(usage_count) as total_usage,
            AVG(usage_count) as avg_daily_usage,
            MAX(usage_count) as max_daily_usage
          FROM usage_metrics 
          WHERE agency_id = ? AND created_at >= datetime('now', '-${period} days')
          GROUP BY metric_type
        `)
        .bind(agencyId)
        .all(),
    ]);

    return c.json({
      success: true,
      data: {
        leads: leadStats,
        revenue: revenueStats,
        subscriptions: subscriptionStats,
        usage: usageMetrics,
        period_days: period,
      },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

/**
 * Get system health and metrics
 */
adminRoutes.get('/system/health', async (c) => {
  const db = c.env.DB;

  try {
    const [agencyCount, totalLeads, totalRevenue, activeSubscriptions] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM agencies').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM leads').first<{ count: number }>(),
      db
        .prepare(
          'SELECT SUM(adjusted_value_cents) as total FROM leads WHERE adjusted_value_cents > 0'
        )
        .first<{ total: number }>(),
      db
        .prepare('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"')
        .first<{ count: number }>(),
    ]);

    return c.json({
      success: true,
      data: {
        system_health: 'healthy',
        timestamp: new Date().toISOString(),
        global_metrics: {
          total_agencies: agencyCount?.count || 0,
          total_leads: totalLeads?.count || 0,
          total_revenue_cents: totalRevenue?.total || 0,
          active_subscriptions: activeSubscriptions?.count || 0,
        },
      },
    });
  } catch (error) {
    console.error('System health error:', error);
    return c.json({ error: 'Failed to get system health' }, 500);
  }
});

/**
 * Test Stripe integration - create a test customer
 */
adminRoutes.post('/stripe/test-customer', async (c) => {
  try {
    // This would normally use Stripe SDK, but for demo we'll simulate
    // In a real implementation, you'd import Stripe and create a customer

    const testCustomer = {
      id: `cus_test_${crypto.randomUUID().slice(0, 14)}`,
      email: 'test@example.com',
      name: 'Test Customer',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      metadata: {
        source: 'adsengineer-admin-test',
        created_by: 'admin-dashboard'
      }
    };

    // In production, this would be:
    // const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    // const customer = await stripe.customers.create({
    //   email: 'test@example.com',
    //   name: 'Test Customer'
    // });

    return c.json({
      success: true,
      message: 'Stripe test customer created successfully',
      customer: testCustomer,
      note: 'This is a mock response. In production, this would create a real Stripe customer.'
    });

  } catch (error) {
    console.error('Stripe test error:', error);
    return c.json({
      success: false,
      error: 'Failed to create test customer',
      details: error.message
    }, 500);
  }
});

