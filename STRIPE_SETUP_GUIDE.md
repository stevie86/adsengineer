# Stripe Setup Guide - Get Selling in 30 Minutes

## Quick Setup Checklist

### 1. Create Stripe Account (5 minutes)
- Go to [stripe.com](https://stripe.com)
- Sign up for a Stripe account
- Complete verification (you'll need business details)

### 2. Create Your Products (10 minutes)
Go to Stripe Dashboard → Products → Create Product

**Product 1: Starter Plan**
- Name: "AdsEngineer Starter"
- Price: $99.00
- Billing period: Monthly
- Save the Price ID (looks like: `price_1234567890abc`)

**Product 2: Professional Plan**  
- Name: "AdsEngineer Professional"
- Price: $299.00
- Billing period: Monthly
- Save the Price ID (looks like: `price_0987654321xyz`)

**Product 3: Enterprise Plan**
- Name: "AdsEngineer Enterprise" 
- Price: $999.00
- Billing period: Monthly
- Save the Price ID (looks like: `price_abcdef123456`)

### 3. Add Stripe Secrets to Cloudflare (5 minutes)
Go to Cloudflare Dashboard → Workers & Pages → Settings → Variables

Add these secrets:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 4. Set Up Stripe Webhooks (5 minutes)
Go to Stripe Dashboard → Developers → Webhooks → Add endpoint

**Endpoint URL:** `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/billing/webhooks/stripe`

**Events to listen for:**
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Save the webhook secret** (looks like: `whsec_...`)

### 5. Test Your Setup (5 minutes)

**Test the pricing endpoint:**
```bash
curl https://adsengineer-cloud.adsengineer.workers.dev/api/v1/billing/pricing
```

**Test customer creation:**
```bash
curl -X POST https://adsengineer-cloud.adsengineer.workers.dev/api/v1/billing/customers \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test Customer","agency_id":"test-agency"}'
```

## Your Sales Pages Are Ready

### Landing Page
- **URL:** https://stefan.mastersmarket.eu/
- **Features:** Clear value prop, pricing, testimonials, CTA buttons

### Checkout Page  
- **URL:** https://stefan.mastersmarket.eu/checkout.html
- **Features:** Stripe Checkout integration, pricing selector, payment form

### Success Page
- **URL:** https://stefan.mastersmarket.eu/success.html
- **Features:** Next steps, support info, tracking

### Cancel Page
- **URL:** https://stefan.mastersmarket.eu/cancel.html
- **Features:** Helpful alternatives, support contact

## Next Steps

1. **Upload the landing pages** to your WordPress site
2. **Add Stripe price IDs** to Cloudflare secrets
3. **Test the full checkout flow** 
4. **Start driving traffic** to your landing page
5. **Monitor conversions** in your dashboard

## You're Ready to Sell!

Your infrastructure is complete. You have:
- ✅ Working product (WooCommerce plugin)
- ✅ API infrastructure (Cloudflare Workers)  
- ✅ Billing system (Stripe integration)
- ✅ Sales pages (Landing, checkout, success)
- ✅ Demo site (WordPress with API access)

**Go make some sales!** 🚀