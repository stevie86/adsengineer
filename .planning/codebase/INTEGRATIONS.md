# External Integrations

**Analysis Date:** 2026-01-24

## APIs & External Services

**Advertising Platforms:**
- Google Ads - Conversion tracking and upload
  - SDK/Client: google-ads-api 21.0.1
  - Auth: OAuth2 with refresh token (GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET)
  - Implementation: `serverless/src/services/google-ads.ts`

**Payment Processing:**
- Stripe - Billing and subscriptions
  - SDK/Client: stripe 14.25.0
  - Auth: API key (STRIPE_SECRET_KEY)
  - Webhooks: Webhook signature verification (STRIPE_WEBHOOK_SECRET)
  - Implementation: `serverless/src/routes/billing.ts`, `serverless/src/services/billing*.ts`

**E-commerce Platforms:**
- Shopify - Order webhook processing
  - SDK/Client: @shopify/shopify-api 8.0.0, @shopify/shopify-app-express 4.0.0
  - Auth: HMAC signature verification
  - Implementation: `serverless/src/routes/shopify.ts`, `shopify-plugin/index.js`

- WooCommerce - Native integration support
  - Implementation: `serverless/src/routes/woocommerce.ts`

**CRM/Marketing:**
- GoHighLevel - Contact and opportunity webhooks
  - Auth: Webhook signature verification (GHL_WEBHOOK_SECRET)
  - Implementation: `serverless/src/routes/ghl.ts`

## Data Storage

**Databases:**
- Cloudflare D1 - Primary SQL database
  - Connection: Bound via Cloudflare Workers
  - Client: Native D1 prepared statements
  - Schema: `serverless/migrations/`

**File Storage:**
- Cloudflare Workers environment - Static assets and temporary storage
- No external file storage detected

**Caching:**
- Cloudflare KV (planned) - Rate limiting and caching
  - Implementation: Configured but temporarily disabled in `wrangler.jsonc`

## Authentication & Identity

**Auth Provider:**
- Custom JWT implementation - API authentication
  - Implementation: `serverless/src/middleware/auth.ts`
  - Secret: JWT_SECRET environment variable

**Platform-specific:**
- Shopify OAuth - App installation and permissions
- Google Ads OAuth2 - Conversion upload access

## Monitoring & Observability

**Error Tracking:**
- Cloudflare Workers observability - Built-in monitoring
- Console logging with structured output

**Logs:**
- Cloudflare Workers tail - Real-time log streaming
- Command: `wrangler tail`

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers - Serverless API
- Cloudflare Pages - Landing page deployment
- Custom domains: api.adsengineer.cloud

**CI Pipeline:**
- Manual deployment with Wrangler CLI
- Infrastructure as Code with OpenTofu

## Environment Configuration

**Required env vars:**
- JWT_SECRET - API authentication
- STRIPE_SECRET_KEY - Payment processing
- STRIPE_WEBHOOK_SECRET - Stripe webhook verification
- GOOGLE_ADS_CLIENT_ID - Google Ads OAuth
- GOOGLE_ADS_CLIENT_SECRET - Google Ads OAuth
- GHL_WEBHOOK_SECRET - GoHighLevel webhook verification
- ADMIN_TOKEN - Administrative access

**Secrets location:**
- Doppler secrets management (production)
- Cloudflare Workers secrets dashboard
- Local development via Doppler CLI

## Webhooks & Callbacks

**Incoming:**
- `/api/v1/shopify/webhook` - Shopify order events
- `/api/v1/ghl/webhook` - GoHighLevel contact/opportunity events
- `/api/v1/billing/webhook` - Stripe billing events

**Outgoing:**
- Google Ads API - Conversion uploads
- Measurement Protocol - Analytics data forwarding (proposed sGTM architecture)

---

*Integration audit: 2026-01-24*