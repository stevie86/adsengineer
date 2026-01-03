# 🚀 Quick Stripe Setup for Beta Launch

## What You Need (5 minutes setup):

### 1. Create Stripe Account
- Go to https://stripe.com → "Start now"
- Use your email: stefan.pirker86@gmail.com
- Complete business details (can be minimal for testing)

### 2. Get API Keys
```bash
# In Stripe Dashboard → Developers → API Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Safe for frontend
STRIPE_SECRET_KEY=sk_test_...      # Keep secret!
```

### 3. Create Test Products
```bash
# Dashboard → Products → Create product
Name: "AdsEngineer Starter"
Price: $99/month
API ID: price_xxx...
```

### 4. Set Production Secrets
```bash
cd serverless
wrangler secret put STRIPE_SECRET_KEY --env production
# Paste: sk_test_...

wrangler secret put STRIPE_STARTER_PRICE_ID --env production  
# Paste: price_xxx...

wrangler secret put VITE_STRIPE_PUBLISHABLE_KEY --env production
# Paste: pk_test_...
```

### 5. Configure Webhooks (Optional for Beta)
- Dashboard → Webhooks → Add endpoint
- URL: https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/webhooks/stripe
- Events: customer.subscription.created, invoice.payment_succeeded

---

## 🎯 Minimal Viable Stripe (What Works Now)

**✅ What you have working:**
- Subscription creation logic
- Payment processing code
- Webhook handling
- Price configuration

**✅ What you need (5 minutes):**
- Stripe account → Get API keys
- One test product → Get price ID  
- Set secrets → Payments work!

**❌ What you don't need yet:**
- Enterprise features
- Production webhooks (optional)
- Multiple currencies
- Advanced billing features

---

## 💰 Revenue Flow Once Set Up

1. **Agency signs up** → Creates Stripe customer
2. **Payment succeeds** → Webhook triggers subscription
3. **You get paid** → Stripe transfers to your bank
4. **Monthly renewal** → Automatic billing

**Total setup time: 10 minutes → You can accept payments!**

Ready to set this up? The Stripe account creation takes 2 minutes. 🚀