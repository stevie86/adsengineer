import { Hono } from 'hono';
import { z } from 'zod';
import Stripe from 'stripe';
import type { AppEnv } from '../types';

const billing = new Hono<AppEnv>();

// Initialize Stripe (lazy initialization to access env)
let stripe: Stripe | null = null;
const getStripe = (env: AppEnv['Bindings']) => {
  if (!stripe) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
};

// Pricing tiers configuration (lazy initialization)
let pricingTiers: any = null;
const getPricingTiers = (env: AppEnv['Bindings']) => {
  if (!pricingTiers) {
    pricingTiers = {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 9900, // $99 in cents
        currency: 'usd',
        interval: 'month',
        lead_limit: 1000,
        features: [
          'Basic conversion tracking',
          'Google Ads integration',
          'Email support',
          'Standard analytics',
          '1 website'
        ],
        stripe_price_id: env.STRIPE_STARTER_PRICE_ID
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 29900, // $299 in cents
        currency: 'usd',
        interval: 'month',
        lead_limit: 10000,
        features: [
          'Advanced conversion tracking',
          'Multi-platform integration (Google, Facebook, TikTok)',
          'Priority support',
          'Custom analytics dashboard',
          '5 websites',
          'API access',
          'White-label reporting'
        ],
        stripe_price_id: env.STRIPE_PROFESSIONAL_PRICE_ID
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99900, // $999 in cents
        currency: 'usd',
        interval: 'month',
        lead_limit: -1, // unlimited
        features: [
          'Unlimited conversion tracking',
          'All platform integrations',
          'Dedicated success manager',
          'Custom integrations',
          'Unlimited websites',
          'Advanced API access',
          'Custom reporting',
          'SLA guarantee',
          'Onboarding consultation'
        ],
        stripe_price_id: env.STRIPE_ENTERPRISE_PRICE_ID
      }
    };
  }
  return pricingTiers;
};

// Get pricing tiers
// Public pricing endpoint (no auth required)
billing.get('/pricing', (c) => {
  // Return basic pricing info without requiring Stripe connection
  const pricing = {
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 99,
      currency: 'EUR',
      interval: 'month',
      features: [
        'Basic conversion tracking',
        'Google Ads integration',
        'Email support',
        'Standard analytics',
        '1 website'
      ]
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      price: 299,
      currency: 'EUR',
      interval: 'month',
      features: [
        'Advanced conversion tracking',
        'Multi-platform integration',
        'Priority support',
        'Custom analytics',
        '5 websites'
      ]
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 999,
      currency: 'EUR',
      interval: 'month',
      features: [
        'Unlimited conversion tracking',
        'All platform integrations',
        'Dedicated success manager',
        'Custom integrations',
        'Unlimited websites'
      ]
    }
  };

  return c.json({
    success: true,
    message: 'Stripe integration configured successfully',
    data: Object.values(pricing)
  });
});

// Create Stripe customer
billing.post('/customers', async (c) => {
    const db = c.get('db');
    const { email, name, agency_id, stripe_config } = await c.req.json();

    try {
      // Check if customer already exists
      const existing = await db.prepare(
        'SELECT stripe_customer_id FROM customers WHERE email = ?'
      ).bind(email).first();

      if (existing?.stripe_customer_id) {
        return c.json({
          success: true,
          customer_id: existing.stripe_customer_id,
          message: 'Customer already exists'
        });
      }

      // Create Stripe customer
      const customer = await getStripe(c.env).customers.create({
        email,
        name,
        metadata: {
          agency_id,
          source: 'adsengineer'
        }
      });

      // Update database
      await db.prepare(
        'UPDATE customers SET stripe_customer_id = ?, updated_at = datetime(\'now\') WHERE email = ?'
      ).bind(customer.id, email).run();

      // Store encrypted Stripe credentials if provided
      if (stripe_config) {
        const credentialSuccess = await db.updateAgencyCredentials(agency_id, {
          stripe: stripe_config
        });

        if (!credentialSuccess) {
          console.warn('Failed to store Stripe credentials for agency:', agency_id);
          // Don't fail the request, just log the warning
        }
      }

      return c.json({
        success: true,
        customer_id: customer.id,
        message: 'Customer created successfully'
      });

    } catch (error) {
      console.error('Customer creation error:', error);
      return c.json({ success: false, error: 'Failed to create customer' }, 500);
    }
  }
);

// Create subscription
billing.post('/subscriptions', async (c) => {
    const db = c.get('db');
    const { customer_id, price_id, agency_id } = await c.req.json();

    try {
      // Verify customer belongs to agency
      const customer = await db.prepare(
        'SELECT id FROM customers WHERE stripe_customer_id = ? AND id = ?'
      ).bind(customer_id, agency_id).first();

      if (!customer) {
        return c.json({ success: false, error: 'Customer not found or access denied' }, 404);
      }

      // Create subscription
      const subscription = await getStripe(c.env).subscriptions.create({
        customer: customer_id,
        items: [{ price: price_id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          agency_id
        }
      });

      // Store subscription in database
      await db.prepare(`
        INSERT INTO subscriptions (
          id, agency_id, stripe_subscription_id, stripe_price_id,
          status, current_period_start, current_period_end,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        agency_id,
        subscription.id,
        price_id,
        subscription.status,
        new Date(subscription.current_period_start * 1000).toISOString(),
        new Date(subscription.current_period_end * 1000).toISOString()
      ).run();

      return c.json({
        success: true,
        subscription_id: subscription.id,
        client_secret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      });

    } catch (error) {
      console.error('Subscription creation error:', error);
      return c.json({ success: false, error: 'Failed to create subscription' }, 500);
    }
  }
);

// Get subscription status
billing.get('/subscriptions/:agency_id', async (c) => {
  const db = c.get('db');
  const agency_id = c.req.param('agency_id');

  try {
    const subscription = await db.prepare(`
      SELECT
        s.*,
        c.stripe_customer_id,
        p.name as plan_name,
        p.lead_limit,
        p.features
      FROM subscriptions s
      JOIN customers c ON s.agency_id = c.id
      JOIN pricing_tiers p ON s.stripe_price_id = p.stripe_price_id
      WHERE s.agency_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `).bind(agency_id).first();

    if (!subscription) {
      return c.json({
        success: true,
        has_subscription: false,
        message: 'No active subscription found'
      });
    }

    // Get usage statistics
    const usage = await db.prepare(`
      SELECT
        COUNT(*) as leads_this_month,
        SUM(lead_value_cents) as revenue_this_month
      FROM leads
      WHERE agency_id = ?
      AND created_at >= date('now', 'start of month')
    `).bind(agency_id).first();

    return c.json({
      success: true,
      has_subscription: true,
      subscription: {
        id: subscription.stripe_subscription_id,
        status: subscription.status,
        plan: subscription.plan_name,
        lead_limit: subscription.lead_limit,
        features: JSON.parse(subscription.features),
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        usage: {
          leads_this_month: usage?.leads_this_month || 0,
          revenue_this_month: usage?.revenue_this_month || 0,
          lead_limit: subscription.lead_limit
        }
      }
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return c.json({ success: false, error: 'Failed to get subscription status' }, 500);
  }
});

// Cancel subscription
billing.post('/subscriptions/:subscription_id/cancel', async (c) => {
    const db = c.get('db');
    const subscription_id = c.req.param('subscription_id');
    const { agency_id, cancel_at_period_end } = await c.req.json();

    try {
      // Verify ownership
      const sub = await db.prepare(
        'SELECT id FROM subscriptions WHERE stripe_subscription_id = ? AND agency_id = ?'
      ).bind(subscription_id, agency_id).first();

      if (!sub) {
        return c.json({ success: false, error: 'Subscription not found or access denied' }, 404);
      }

      // Cancel in Stripe
      const cancellation = await getStripe(c.env).subscriptions.update(subscription_id, {
        cancel_at_period_end
      });

      // Update database
      await db.prepare(
        'UPDATE subscriptions SET status = ?, cancelled_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE stripe_subscription_id = ?'
      ).bind(cancel_at_period_end ? 'canceling' : 'canceled', subscription_id).run();

      return c.json({
        success: true,
        message: cancel_at_period_end ? 'Subscription will cancel at period end' : 'Subscription canceled immediately',
        cancel_at: cancellation.cancel_at,
        status: cancellation.status
      });

    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return c.json({ success: false, error: 'Failed to cancel subscription' }, 500);
    }
  }
);

// Webhook for Stripe events
billing.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  try {
    const event = getStripe(c.env).webhooks.constructEvent(
      body,
      signature!,
      c.env.STRIPE_WEBHOOK_SECRET!
    );

    const db = c.get('db');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await db.prepare(`
          UPDATE subscriptions SET
            status = ?,
            current_period_start = ?,
            current_period_end = ?,
            updated_at = datetime('now')
          WHERE stripe_subscription_id = ?
        `).bind(
          subscription.status,
          new Date(subscription.current_period_start * 1000).toISOString(),
          new Date(subscription.current_period_end * 1000).toISOString(),
          subscription.id
        ).run();
        break;

      case 'customer.subscription.deleted':
        await db.prepare(
          'UPDATE subscriptions SET status = \'canceled\', updated_at = datetime(\'now\') WHERE stripe_subscription_id = ?'
        ).bind(event.data.object.id).run();
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        console.log('Payment succeeded for invoice:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed for invoice:', event.data.object.id);
        break;
    }

    return c.json({ success: true, received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ success: false, error: 'Webhook processing failed' }, 400);
  }
});

export { billing as billingRoutes, getPricingTiers };