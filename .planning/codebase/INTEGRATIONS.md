# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

### Google Ads
- **Purpose:** Offline conversion uploads via REST API v17
- **Files:** `serverless/src/services/google-ads.ts`
- **Features:** OAuth2 authentication, click ID tracking (GCLID)
- **Config:** Per-agency credentials stored encrypted in D1

### Meta (Facebook) Conversions API
- **Purpose:** Server-side event tracking
- **Files:** `serverless/src/services/meta-conversions.ts`
- **Features:** Facebook OAuth, click ID (FBCLID)
- **Routes:** `serverless/src/routes/oauth.ts` (OAuth flow)

### TikTok Events API
- **Purpose:** Conversion tracking for TikTok ads
- **Files:** `serverless/src/services/tiktok-conversions.ts`
- **Routes:** `serverless/src/routes/tiktok.ts` (webhooks)
- **Features:** Webhook validation, click ID tracking

### Stripe
- **Purpose:** Payment processing and subscription management
- **Files:** `serverless/src/services/billing.ts`, `serverless/src/routes/billing.ts`
- **Frontend SDK:** `@stripe/react-stripe-js`, `@stripe/stripe-js`
- **Features:** Subscription tiers, webhooks, customer portal
- **Auth:** API key + webhook signature verification

### GoHighLevel (GHL)
- **Purpose:** Lead management and webhook processing
- **Files:** `serverless/src/routes/ghl.ts`
- **Features:** Contact/Opportunity webhooks, GCLID extraction
- **Auth:** Webhook signature via `GHL_WEBHOOK_SECRET`

### Shopify
- **Purpose:** E-commerce order tracking
- **Files:** `serverless/src/routes/shopify.ts`, `shopify-plugin/`
- **Plugin:** Express.js proxy in `shopify-plugin/index.js`
- **Features:** Order webhooks, GCLID extraction from metadata
- **Auth:** HMAC signature verification

### Server-Side GTM (sGTM) - Proposed
- **Purpose:** Single integration hub for all platforms
- **Files:** `serverless/src/services/sgtm-forwarder.ts`
- **Status:** Proposed architecture (see `docs/sgtm-architecture-proposal.md`)
- **Features:** Measurement Protocol forwarding

## Data Storage

### Primary Database
- **Cloudflare D1** - SQLite-compatible edge database
  - Location: `serverless/wrangler.jsonc`
  - Name: `adsengineer-db`
  - Binding: `DB`
  - Migrations: `serverless/migrations/*.sql`

### Planned KV Storage
- **Cloudflare KV** - Key-value for rate limiting (commented in config)
  - Namespace: `RATE_LIMIT_KV` (not yet active)

### File Storage
- **Local filesystem only** - No external file storage service
- Static assets served from Workers/Pages

### Caching
- **None detected** - Direct D1 queries used

## Authentication & Identity

### JWT Authentication
- **Purpose:** Dashboard and API access
- **Location:** `serverless/src/middleware/auth.ts`
- **Secret:** `JWT_SECRET` (Doppler)
- **Pattern:** Bearer token in Authorization header

### HMAC Verification
- **Purpose:** Webhook signature validation
- **Location:** `serverless/src/middleware/auth.ts`
- **Used by:** Shopify, GHL webhooks

### OAuth2 Flows
- **Google Ads:** `serverless/src/routes/oauth.ts` (Google OAuth)
- **Meta:** `serverless/src/routes/oauth.ts` (Facebook OAuth)
- **Storage:** Encrypted tokens in D1 via `serverless/src/services/oauth-storage.ts`

## Monitoring & Observability

### Error Tracking
- **Sentry** (optional) - DSN configured via `SENTRY_DSN`
- **Logging:** Structured logging via `serverless/src/services/logging.ts`

### Health Checks
- **API Health:** `GET /health` endpoint
- **Scripts:** `scripts/api-health-check.js`, `scripts/health-check.sh`

## CI/CD & Deployment

### Infrastructure as Code
- **OpenTofu** (Terraform alternative)
  - Location: `infrastructure/`
  - Resources: Workers, D1, KV, DNS
  - State: Local (dev), planned remote (prod)

### Secrets Management
- **Doppler** - Centralized secrets
  - Project: `adsengineer`
  - Configs: dev, staging, production
  - Template: `doppler-secrets.template`

### CI/CD Platform
- **GitHub Actions** (configured but had Doppler v4 issues)
  - Workflows: `.github/workflows/`
  - Using Doppler CLI v3 for deployments

## Environment Configuration

### Required Environment Variables (via Doppler)

**Cloudflare:**
- `CLOUDFLARE_API_TOKEN` - Infrastructure deployment
- `CLOUDFLARE_ACCOUNT_ID` - Account identification
- `CLOUDFLARE_ZONE_ID` - Domain routing (production)

**Application:**
- `JWT_SECRET` - API authentication
- `GHL_WEBHOOK_SECRET` - Webhook verification
- `ADMIN_TOKEN` - Admin endpoints
- `ENCRYPTION_KEY` - 32-byte AES-256 key for credential encryption
- `ENVIRONMENT` - development/staging/production

**Stripe:**
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_PUBLISHABLE_KEY` - Frontend payments
- `STRIPE_WEBHOOK_SECRET` - Webhook validation
- `STRIPE_STARTER_PRICE_ID`, `STRIPE_PROFESSIONAL_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID` - Subscription tiers

**Google Ads:**
- `GOOGLE_ADS_DEVELOPER_TOKEN` - API access
- `GOOGLE_ADS_CLIENT_ID` - OAuth client ID
- `GOOGLE_ADS_CLIENT_SECRET` - OAuth secret

**AI Providers (optional):**
- `OPENAI_API_KEY` - OpenAI integration
- `GEMINI_API_KEY` - Google Gemini
- `ANTHROPIC_API_KEY` - Claude API

### Secrets Location
- **Doppler ONLY** - No `.env` files in git
- Access pattern: `doppler run -- <command>`

## Webhooks & Callbacks

### Incoming Webhooks

**Shopify:**
- Endpoint: `POST /api/v1/shopify/webhook`
- Events: Order creation
- Verification: HMAC signature
- File: `serverless/src/routes/shopify.ts`

**GoHighLevel:**
- Endpoint: `POST /api/v1/ghl/webhook`
- Events: Contact created/updated, Opportunity created
- Verification: Signature header
- File: `serverless/src/routes/ghl.ts`

**TikTok:**
- Endpoint: `POST /api/v1/tiktok/webhooks`
- Events: Conversion events
- Verification: Signature validation
- File: `serverless/src/routes/tiktok.ts`

**Stripe:**
- Endpoint: `POST /api/v1/billing/webhook`
- Events: Payment success/failure, subscription changes
- Verification: Stripe signature
- File: `serverless/src/routes/billing.ts`

### Outgoing Webhooks
- **None detected** - No customer webhooks implemented

## Third-Party SDKs

**Production SDKs:**
- `google-ads-api` - Google Ads REST API
- `stripe` - Payment processing
- `@shopify/shopify-api` - Shopify integration (plugin)
- `@shopify/shopify-app-express` - Shopify Express middleware

**Utility Libraries:**
- `zod` - Schema validation across all packages
- `@paralleldrive/cuid2` - Collision-resistant IDs
- `@noble/hashes` - SHA-256 hashing

## Integration Architecture

**Current Pattern:**
```
Shopify/GHL/WooCommerce → AdsEngineer API → Google Ads/Meta/TikTok
```

**Proposed Pattern (sGTM):**
```
E-commerce → AdsEngineer API → Customer sGTM → GA4/Ads/Meta/TikTok
```

---

*Integration audit: 2026-02-03*
