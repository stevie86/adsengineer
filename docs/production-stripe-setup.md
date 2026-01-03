# Production Stripe Setup Guide

This guide walks through setting up Stripe for production use with AdsEngineer.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- AdsEngineer deployed to production (https://advocate-cloud.adsengineer.workers.dev)

## Step 1: Create Stripe Products

Log into your Stripe dashboard and create three products:

### 1. Starter Plan ($99/month)
- Name: "AdsEngineer Starter"
- Description: "Basic conversion tracking for small agencies"
- Price: $99/month
- API ID: Will be created automatically

### 2. Professional Plan ($299/month)
- Name: "AdsEngineer Professional"
- Description: "Advanced tracking with multi-platform integration"
- Price: $299/month
- API ID: Will be created automatically

### 3. Enterprise Plan ($999/month)
- Name: "AdsEngineer Enterprise"
- Description: "Unlimited tracking with dedicated support"
- Price: $999/month
- API ID: Will be created automatically

## Step 2: Get API Keys

In Stripe Dashboard:
1. Go to Developers → API Keys
2. Copy the **Secret key** (starts with `sk_live_`)
3. Copy the **Publishable key** (starts with `pk_live_`)

## Step 3: Set Up Webhook

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables

Set the following secrets in your Cloudflare Workers production environment:

```bash
# Set Stripe secrets
cd serverless
wrangler secret put STRIPE_SECRET_KEY --env production
# Paste your sk_live_... key

wrangler secret put STRIPE_WEBHOOK_SECRET --env production
# Paste your whsec_... key

wrangler secret put STRIPE_STARTER_PRICE_ID --env production
# Paste the price ID for Starter plan

wrangler secret put STRIPE_PROFESSIONAL_PRICE_ID --env production
# Paste the price ID for Professional plan

wrangler secret put STRIPE_ENTERPRISE_PRICE_ID --env production
# Paste the price ID for Enterprise plan

# Also set the publishable key for frontend
wrangler secret put VITE_STRIPE_PUBLISHABLE_KEY --env production
# Paste your pk_live_... key
```

## Step 5: Deploy Production

```bash
cd serverless
wrangler deploy --env production
```

## Step 6: Test Webhook

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Find your webhook endpoint
3. Click "Test webhook"
4. Select a test event (e.g., `customer.subscription.created`)
5. Verify the webhook was delivered successfully

## Step 7: Test Payment Flow

1. Visit your production frontend
2. Go through the signup flow
3. Complete a test payment with a real card
4. Verify the subscription is created in Stripe
5. Check that the webhook updated the database

## Troubleshooting

### Webhook Not Working
- Check the endpoint URL is correct
- Verify the webhook secret is set correctly
- Check Cloudflare Workers logs: `wrangler tail --env production`

### Payment Not Processing
- Ensure API keys are for live mode (not test mode)
- Check that products/prices are active in Stripe
- Verify frontend is using the correct publishable key

### Database Not Updating
- Check webhook is receiving events
- Verify database connection in production
- Check for errors in Cloudflare logs

## Security Notes

- Never commit API keys to version control
- Use live keys only in production environment
- Regularly rotate webhook secrets
- Monitor webhook delivery in Stripe dashboard

## Support

If you encounter issues:
1. Check Cloudflare Workers logs
2. Review Stripe webhook delivery logs
3. Verify all environment variables are set
4. Test with Stripe's test mode first