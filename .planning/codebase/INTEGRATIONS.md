# External Integrations

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Ad Platforms

### Google Ads
- **Purpose:** Conversion upload, audience building
- **Integration:** REST API v17 via `google-ads-api` SDK
- **Auth:** OAuth2 with refresh token (stored per-agency)
- **Files:**
  - `serverless/src/services/google-ads.ts` - Conversion upload logic
  - `serverless/src/routes/oauth.ts` - OAuth flow handling
- **Key Operations:**
  - Upload click conversions (GCLID-based)
  - Create offline conversion actions
  - Build customer match audiences

### Meta (Facebook) Conversions API
- **Purpose:** Server-side event tracking
- **Integration:** Meta CAPI (planned)
- **Files:**
  - `serverless/migrations/0005_meta_tracking.sql` - Schema
- **Status:** Schema defined, implementation pending

### TikTok Events API
- **Purpose:** Server-side conversion tracking
- **Integration:** TikTok Events API
- **Files:**
  - `serverless/src/routes/tiktok.ts` - Event handling
- **Auth:** Access token per-agency

## E-commerce Platforms

### Shopify
- **Purpose:** Webhook receiver for order/checkout events
- **Integration:** Shopify Webhooks + dedicated plugin
- **Auth:** HMAC signature verification
- **Files:**
  - `serverless/src/routes/shopify.ts` - Webhook handler
  - `shopify-plugin/` - Dedicated Express proxy app
- **Events:** `orders/create`, `checkouts/create`, customer events

### WooCommerce
- **Purpose:** Order event tracking
- **Integration:** Custom webhook receiver
- **Files:**
  - `serverless/src/routes/woocommerce.ts` - Webhook handler
- **Auth:** Signature verification

## CRM / Marketing

### GoHighLevel (GHL)
- **Purpose:** Lead/contact event tracking
- **Integration:** GHL Webhooks
- **Auth:** Webhook signature verification
- **Files:**
  - `serverless/src/routes/ghl.ts` - Webhook handler
- **Events:** Contact created, contact updated, opportunity events

## Payment Processing

### Stripe
- **Purpose:** Subscription billing, payment processing
- **Integration:** Stripe SDK + Webhooks
- **Files:**
  - `serverless/src/routes/billing.ts` - Billing endpoints
  - `serverless/src/services/billing*.ts` - Business logic
- **Features:**
  - Subscription management (Starter/Professional/Enterprise tiers)
  - Customer portal
  - Webhook event handling
- **Environment Variables:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_*_PRICE_ID` (per tier)

## Analytics / Tracking

### Google Analytics 4 (GA4)
- **Purpose:** Measurement Protocol integration
- **Integration:** GA4 Measurement Protocol
- **Files:**
  - `serverless/src/services/ga4-measurement.ts` - Event sending

### Server-Side GTM (Proposed)
- **Purpose:** Unified integration hub
- **Integration:** Measurement Protocol to sGTM
- **Files:**
  - `serverless/src/routes/gtm.ts` - GTM endpoint
  - `serverless/migrations/0020_sgtm_config.sql` - Config schema
- **Status:** Proposed architecture pivot

## Database

### Cloudflare D1
- **Type:** SQLite-compatible
- **Binding:** `DB` in worker environment
- **Migrations:** `serverless/migrations/` (numbered SQL files)
- **Access Pattern:** Prepared statements only (no raw interpolation)

### Cloudflare KV
- **Binding:** `RATE_LIMIT_KV`
- **Purpose:** Rate limiting, session storage

## Authentication

### JWT (Dashboard)
- **Purpose:** User authentication for dashboard/API
- **Secret:** `JWT_SECRET` environment variable
- **Files:**
  - `serverless/src/middleware/auth.ts` - JWT validation

### HMAC (Webhooks)
- **Purpose:** Verify webhook authenticity
- **Implementation:** `@noble/hashes` for cryptographic operations
- **Files:**
  - `serverless/src/middleware/` - Signature verification

## Secrets Management

### Doppler
- **Purpose:** Runtime secrets injection
- **Usage:** `doppler run -- pnpm dev`
- **Environments:** development, staging, production

## Infrastructure

### Cloudflare
- **Workers:** API runtime
- **D1:** Database
- **KV:** Key-value storage
- **Pages:** Static site hosting
- **DNS:** Domain management

### OpenTofu
- **Purpose:** Infrastructure as Code
- **Files:** `infrastructure/*.tf`
- **Provider:** Cloudflare
