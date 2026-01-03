# Stripe Integration Setup Guide

## Overview

This guide provides complete instructions for setting up Stripe payment processing for AdsEngineer, including product creation, price configuration, and environment variable setup.

## Current Status

✅ **Completed:**
- Stripe API key configured and uploaded to Cloudflare Workers
- Billing routes implemented with TypeScript types
- Environment variable structure defined
- Setup scripts created

⏳ **Remaining Tasks:**
- Create Stripe products and prices
- Configure environment variables
- Set up webhooks
- Test endpoints

## Step 1: Create Stripe Products

Run these commands to create the three subscription tiers in your Stripe dashboard:

### Create Products

```bash
# Starter Plan (€99/month)
stripe products create \
  --name='AdsEngineer Starter' \
  --description='Basic conversion tracking for small agencies'

# Professional Plan (€299/month)
stripe products create \
  --name='AdsEngineer Professional' \
  --description='Advanced conversion tracking for growing agencies'

# Enterprise Plan (€999/month)
stripe products create \
  --name='AdsEngineer Enterprise' \
  --description='Unlimited conversion tracking for large agencies'
```

### Expected Output

After running each command, you'll see output like:
```
{
  "id": "prod_xxx123",
  "object": "product",
  "active": true,
  "created": 1703123456,
  "description": "Basic conversion tracking for small agencies",
  "name": "AdsEngineer Starter",
  ...
}
```

**Save the product IDs** (e.g., `prod_xxx123`) - you'll need them for the next step.

## Step 2: Create Subscription Prices

Create monthly recurring prices for each product:

```bash
# Replace prod_xxx with actual product IDs from Step 1

# Starter Price (€99/month)
stripe prices create \
  --product='prod_starter_id' \
  --unit-amount=9900 \
  --currency=eur \
  --interval=month

# Professional Price (€299/month)
stripe prices create \
  --product='prod_professional_id' \
  --unit-amount=29900 \
  --currency=eur \
  --interval=month

# Enterprise Price (€999/month)
stripe prices create \
  --product='prod_enterprise_id' \
  --unit-amount=99900 \
  --currency=eur \
  --interval=month
```

### Expected Output

Each command returns a price object:
```
{
  "id": "price_xxx456",
  "object": "price",
  "active": true,
  "currency": "eur",
  "unit_amount": 9900,
  "recurring": {
    "interval": "month"
  },
  "product": "prod_starter_id",
  ...
}
```

**Save the price IDs** (e.g., `price_xxx456`) - you'll need them for environment configuration.

## Step 3: Generate Webhook Secret

Generate a secure webhook secret for validating Stripe webhook signatures:

```bash
# Generate a random 32-byte hex string
openssl rand -hex 32
```

Or use the pre-generated secret from the setup script:
```
49c8d18219e06ec541903783e8c06a08c281da8f8d984338bd008306f0f02357
```

## Step 4: Configure Environment Variables

Set the environment variables in Cloudflare Workers. You have three options:

### Option A: Via Wrangler CLI (Recommended)

```bash
# Set the price IDs and webhook secret
wrangler secret put STRIPE_STARTER_PRICE_ID
wrangler secret put STRIPE_PROFESSIONAL_PRICE_ID
wrangler secret put STRIPE_ENTERPRISE_PRICE_ID
wrangler secret put STRIPE_WEBHOOK_SECRET
```

When prompted, enter the corresponding values from Steps 2 and 3.

### Option B: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **advocate-cloud**
3. Go to **Settings** → **Variables**
4. Add the following environment variables:
   - `STRIPE_STARTER_PRICE_ID`: `price_xxx_starter`
   - `STRIPE_PROFESSIONAL_PRICE_ID`: `price_xxx_professional`
   - `STRIPE_ENTERPRISE_PRICE_ID`: `price_xxx_enterprise`
   - `STRIPE_WEBHOOK_SECRET`: `your_webhook_secret_here`

### Option C: Via wrangler.jsonc (Local Development Only)

Update `serverless/wrangler.jsonc`:

```json
{
  "env": {
    "production": {
      "vars": {
        "STRIPE_STARTER_PRICE_ID": "price_xxx_starter",
        "STRIPE_PROFESSIONAL_PRICE_ID": "price_xxx_professional",
        "STRIPE_ENTERPRISE_PRICE_ID": "price_xxx_enterprise",
        "STRIPE_WEBHOOK_SECRET": "your_webhook_secret_here"
      }
    }
  }
}
```

## Step 5: Deploy to Production

Deploy the updated configuration:

```bash
cd serverless
wrangler deploy
```

## Step 6: Set Up Stripe Webhooks

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Set the endpoint URL to:
   ```
   https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/webhooks/stripe
   ```
5. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **"Add endpoint"**

## Step 7: Test Integration

### Test Pricing Endpoint

```bash
curl -s https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/pricing | jq .
```

Expected response:
```json
{
  "success": true,
  "message": "Stripe integration configured successfully",
  "data": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 99,
      "currency": "EUR",
      "interval": "month",
      "features": [...]
    }
  ]
}
```

### Test Customer Creation (Requires JWT Token)

```bash
curl -X POST https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","agency_id":"test_agency"}'
```

### Test Webhook Validation

Use Stripe CLI to test webhooks:

```bash
stripe listen --forward-to localhost:8090/api/v1/billing/webhooks/stripe
stripe trigger customer.subscription.created
```

## Available Billing Endpoints

### Public Endpoints (No Auth Required)
- `GET /api/v1/billing/pricing` - Get available subscription plans

### Protected Endpoints (JWT Required)
- `POST /api/v1/billing/customers` - Create Stripe customer
- `POST /api/v1/billing/subscriptions` - Create subscription
- `GET /api/v1/billing/subscriptions/:agency_id` - Get agency subscription
- `POST /api/v1/billing/subscriptions/:subscription_id/cancel` - Cancel subscription
- `POST /api/v1/billing/webhooks/stripe` - Stripe webhook handler

## Troubleshooting

### Common Issues

**"STRIPE_SECRET_KEY not found"**
- Ensure you ran: `wrangler secret put STRIPE_SECRET_KEY`
- Verify the secret was uploaded: `wrangler secret list`

**"Price ID not found"**
- Double-check the price IDs from Step 2
- Ensure environment variables are set correctly

**"Webhook signature verification failed"**
- Verify the `STRIPE_WEBHOOK_SECRET` matches what you set in Step 3
- Ensure the webhook secret in Stripe dashboard matches

### Debug Commands

```bash
# Check environment variables
wrangler secret list

# Test local development
cd serverless && wrangler dev --port 8090

# Check TypeScript errors
cd serverless && pnpm types:check

# Test Stripe CLI connection
stripe --version
stripe config --list
```

## Security Notes

- ✅ Stripe secret key is stored as a Cloudflare Worker secret (encrypted)
- ✅ Webhook signatures are validated using HMAC-SHA256
- ✅ Price IDs and webhook secrets are environment-specific
- ✅ All billing endpoints include rate limiting and security headers

## Next Steps

After completing this setup:

1. **Test customer onboarding flow** - Create test customers and subscriptions
2. **Implement payment success/failure handling** - Handle webhooks properly
3. **Add subscription management UI** - Frontend for customers to manage subscriptions
4. **Set up revenue analytics** - Track MRR, churn, and customer metrics
5. **Configure tax settings** - Set up Stripe Tax or Avalara integration

## Files Modified

- `serverless/src/types.ts` - Added Stripe environment variable types
- `serverless/wrangler.jsonc` - Added Stripe configuration placeholders
- `serverless/src/routes/billing.ts` - Updated pricing endpoint
- `serverless/scripts/setup-stripe.sh` - Secret setup script
- `serverless/scripts/setup-stripe-products.sh` - Product creation guide
- `serverless/scripts/test-stripe.js` - Configuration validation script

## Support

If you encounter issues:

1. Check the [Stripe CLI documentation](https://stripe.com/docs/stripe-cli)
2. Review Cloudflare Workers [secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
3. Test with [Stripe's test mode](https://stripe.com/docs/testing) first

---

**Last Updated:** January 2, 2026
**Stripe Integration Version:** 1.0.0