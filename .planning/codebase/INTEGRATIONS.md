# External Integrations

**Analysis Date:** 2026-01-27

## APIs & External Services

**Payment Processing (Stripe):**
- Billing and subscription management
- SDK/Client: `stripe` package (v14.25.0)
- Auth: API key (`STRIPE_SECRET_KEY`), webhook secret (`STRIPE_WEBHOOK_SECRET`)
- Implementation: `src/routes/billing.ts`, `src/services/billing.ts`
- Price tiers configured via `STRIPE_STARTER_PRICE_ID`, `STRIPE_PROFESSIONAL_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`

**Google Ads:**
- Offline conversion uploads via REST API v17+
- SDK/Client: `google-ads-api` package (v21.0.1)
- Auth: OAuth2 with refresh token flow
- Implementation: `src/services/google-ads.ts`, `src/routes/oauth.ts`
- Env vars: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`
- Config stored per-agency in D1 `agencies.google_ads_config`

**Meta/Facebook Conversions API:**
- Conversion tracking via CAPI
- SDK/Client: Custom implementation using fetch
- Auth: OAuth2 access token
- Implementation: `src/services/meta-conversions.ts`, `src/routes/oauth.ts`
- Env vars: `META_APP_ID`, `META_APP_SECRET`
- Config stored in D1 `agencies.meta_config`

**TikTok Events API:**
- Conversion tracking
- SDK/Client: Custom implementation
- Auth: OAuth2
- Implementation: `src/routes/oauth.ts`

## Data Storage

**Databases:**
- Cloudflare D1 (SQLite via Cloudflare)
  - Connection: D1 binding via `wrangler.jsonc`
  - Client: Native D1 API (`c.env.DB`)
  - Migrations: Numbered SQL files in `serverless/migrations/`

**File Storage:**
- Cloudflare R2 (planned) or external CDN

**Caching:**
- Cloudflare KV (planned for rate limiting)
  - Connection: KV binding `RATE_LIMIT_KV`
  - Current: Disabled in `wrangler.jsonc` (commented out)

## Authentication & Identity

**Auth Providers:**
- Custom JWT implementation for API authentication
  - Secret: `JWT_SECRET`
  - Implementation: `src/middleware/auth.ts`, `src/services/jwt.ts`

- HMAC signature verification for webhooks (Shopify, GoHighLevel)
  - Shopify: `src/routes/shopify.ts`
  - GoHighLevel: `src/routes/ghl.ts` (`GHL_WEBHOOK_SECRET`)
  - Utility: `src/services/crypto.ts`

- OAuth2 flows for platform connections
  - Google Ads: `src/routes/oauth.ts` (callback: `/api/v1/oauth/google-ads/callback`)
  - Meta: `src/routes/oauth.ts` (callback: `/api/v1/oauth/meta/callback`)
  - TikTok: `src/routes/oauth.ts`

## Monitoring & Observability

**Error Tracking:**
 - Sentry (configured but optional)
  - Env var: `SENTRY_DSN`
  - Status: Configurable via Doppler

**Logs:**
- Console-based structured logging
- Implementation: `src/services/logging.ts`
- Env var: `LOG_LEVEL`
- No centralized log aggregation (console only)

**Health Checks:**
- `/health` endpoint
- API health check scripts: `scripts/api-health-check.js`
- API version monitoring: `scripts/api-version-check.js`

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers (production, staging, development environments)
- Custom domain: `api.adsengineer.cloud`
- Deployment: `wrangler deploy`

**CI Pipeline:**
- Manual deployment via Doppler + Wrangler
- Infrastructure provisioning via OpenTofu
- No GitHub Actions or other automated CI (manual workflow)

## Environment Configuration

**Required env vars:**
**Auth:**
- `JWT_SECRET`, `ADMIN_TOKEN`, `GHL_WEBHOOK_SECRET`

**Stripe:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PROFESSIONAL_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`

**Google Ads:**
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`

**Meta:**
- `META_APP_ID`, `META_APP_SECRET`

**Cloudflare:**
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`

**Security:**
- `ENCRYPTION_KEY` (AES-256 for credential storage)

**AI Services (optional):**
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`

**Secrets location:**
- Doppler (primary)
- Cloudflare Dashboard (secondary)
- No `.env` files committed to git

## Webhooks & Callbacks

**Incoming Webhooks:**
- Shopify orders/customers - `POST /api/v1/shopify/webhook` (HMAC validated)
- GoHighLevel contacts - `POST /api/v1/ghl/webhook` (signature validated)
- Stripe billing events - `POST /api/v1/billing/webhook` (signature validated)

**Outgoing Webhooks:**
- Notification hooks for system alerts
- Implementation: `src/services/api-monitor.ts`
- Configurable via notification hook API

## Platform Webhooks

**Shopify:**
- Routes: `src/routes/shopify.ts`
- Events: Orders, customers
- Auth: HMAC signature verification

**GoHighLevel:**
- Routes: `src/routes/ghl.ts`
- Events: Contact creation/updates
- Auth: Signature verification with `GHL_WEBHOOK_SECRET`

**Stripe:**
- Routes: `src/routes/billing.ts`
- Events: Payment, subscription changes
- Auth: Webhook signature verification

## Additional Integrations

**Shopify Plugin:**
- Location: `shopify-plugin/`
- Tech: Node.js + Express
- Purpose: Shopify webhook proxy server

**SEO Auditor:**
- Location: `seo-auditor/`
- Tech: Node.js + Puppeteer + Cheerio
- Purpose: Store SEO analysis

**E-commerce Platforms:**
- Shopify, WooCommerce, Magento, BigCommerce (integration configurations in `src/services/adsengineer-onboarding.ts`)

---

*Integration audit: 2026-01-27*