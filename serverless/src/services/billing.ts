import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29900,
    features: ['1 store', '10K events/month', 'Basic tracking', 'Email support'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 79900,
    features: ['5 stores', '100K events/month', 'Advanced tracking', 'Priority support'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249900,
    features: ['Unlimited stores', 'Unlimited events', 'Full intelligence', 'Dedicated manager'],
  },
} as const;

// Customer billing schema
export const billingSchema = z.object({
  customer_id: z.string(),
  email: z.string().email(),
  tier: z.enum(['starter', 'growth', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'annual']),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled']),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Billing = z.infer<typeof billingSchema>;

// Create Stripe customer
export async function createStripeCustomer(
  email: string,
  metadata: Record<string, string>
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    metadata,
  });
  return customer.id;
}

// Create subscription
export async function createSubscription(
  customerId: string,
  tier: keyof typeof PRICING_TIERS,
  billingCycle: 'monthly' | 'annual'
): Promise<string> {
  const priceId = getStripePriceId(tier, billingCycle);

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription.id;
}

// Get Stripe price ID (you'll need to create these in Stripe dashboard)
function getStripePriceId(tier: keyof typeof PRICING_TIERS, billingCycle: string): string {
  // These are example price IDs - create actual ones in Stripe dashboard
  const priceIds = {
    monthly: {
      starter: 'price_starter_monthly',
      growth: 'price_growth_monthly',
      enterprise: 'price_enterprise_monthly',
    },
    annual: {
      starter: 'price_starter_annual',
      growth: 'price_growth_annual',
      enterprise: 'price_enterprise_annual',
    },
  };

  return priceIds[billingCycle][tier];
}

export async function handleStripeWebhook(payload: string, signature: string): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;

    case 'customer.subscription.updated':
      // Handle subscription updates (upgrade/downgrade)
      console.log('Subscription updated:', event.data.object.id);
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      console.log('Subscription deleted:', event.data.object.id);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const customerEmail = (customer as Stripe.Customer).email;

  await updateCustomerBilling(subscription.customer as string, {
    stripe_subscription_id: subscription.id,
    status: 'active',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  await sendWelcomeEmail(customerEmail!, subscription.id);
}

// Handle payment succeeded
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  const customerEmail = (customer as Stripe.Customer).email;

  // Send payment confirmation
  await sendPaymentConfirmation(customerEmail!, invoice.amount_paid);
}

// Handle payment failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  const customerEmail = (customer as Stripe.Customer).email;

  // Send payment failure email
  await sendPaymentFailureEmail(customerEmail!, invoice.amount_due);
}

// Customer billing management
export async function updateCustomerBilling(
  customerId: string,
  updates: Partial<Billing>
): Promise<void> {
  // Update your database with billing info
  // This would connect to your D1 database
  const db = getDatabase(); // You'll implement this

  await db
    .prepare(`
    UPDATE customers 
    SET stripe_customer_id = ?, stripe_subscription_id = ?, status = ?, 
        current_period_start = ?, current_period_end = ?, updated_at = ?
    WHERE stripe_customer_id = ?
  `)
    .bind(
      updates.stripe_customer_id,
      updates.stripe_subscription_id,
      updates.status,
      updates.current_period_start,
      updates.current_period_end,
      new Date().toISOString(),
      customerId
    )
    .run();
}

// Billing dashboard data
export async function getBillingDashboard(customerId: string): Promise<{
  subscription: Stripe.Subscription;
  upcoming_invoice: Stripe.Invoice | null;
  payment_history: Stripe.Invoice[];
}> {
  const subscription = await stripe.subscriptions.retrieve(
    await getCustomerSubscriptionId(customerId)
  );

  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: customerId,
  });

  const paymentHistory = await stripe.invoices.list({
    customer: customerId,
    limit: 12,
  });

  return {
    subscription,
    upcoming_invoice: upcomingInvoice,
    payment_history: paymentHistory.data,
  };
}

// Helper functions
async function getCustomerSubscriptionId(customerId: string): Promise<string> {
  // Get from your database
  const db = getDatabase();
  const result = await db
    .prepare('SELECT stripe_subscription_id FROM customers WHERE stripe_customer_id = ?')
    .bind(customerId)
    .first();

  return result?.stripe_subscription_id;
}

async function sendWelcomeEmail(email: string, subscriptionId: string): Promise<void> {
  // Implement email sending
  console.log(`Welcome email sent to ${email} for subscription ${subscriptionId}`);
}

async function sendPaymentConfirmation(email: string, amount: number): Promise<void> {
  console.log(`Payment confirmation sent to ${email} for $${amount / 100}`);
}

async function sendPaymentFailureEmail(email: string, amount: number): Promise<void> {
  console.log(`Payment failure email sent to ${email} for $${amount / 100}`);
}

function getDatabase() {
  // This would connect to your D1 database
  // Implementation depends on your setup
  throw new Error('Database connection not implemented');
}
