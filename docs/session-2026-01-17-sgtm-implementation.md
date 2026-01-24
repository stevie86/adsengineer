# Session Report: sGTM Implementation & Codebase Audit

**Date:** 2026-01-17
**Branch:** main
**Focus:** Server-Side GTM integration, security hardening, codebase health

---

## Completed Tasks

### 1. Workers Observability Enabled
**File:** `serverless/wrangler.jsonc`

Added observability configuration for Cloudflare Workers monitoring:
```jsonc
"observability": {
  "enabled": true
}
```

### 2. Dev Guard Middleware
**File:** `serverless/src/middleware/dev-guard.ts`

New middleware that blocks unauthenticated requests in non-production environments:

| Path Type | Behavior |
|-----------|----------|
| Public (`/health`, `/snippet.js`, `/waitlist`, `/docs`) | Always allowed |
| Webhooks (`/shopify/webhook`, `/ghl/webhook`, `/tiktok/webhook`) | Allowed (HMAC auth) |
| All other paths | Requires `Authorization: Bearer` header |

Production environment passes through (route-level auth handles it).

### 3. sGTM Forwarder Service
**File:** `serverless/src/services/sgtm-forwarder.ts`

Complete service for sending events to customer's sGTM container via GA4 Measurement Protocol:

| Method | Event Name | Use Case |
|--------|------------|----------|
| `sendEvent()` | Custom | Generic event |
| `sendPurchase()` | `purchase` | Order completion |
| `sendAddToCart()` | `add_to_cart` | Cart additions |
| `sendBeginCheckout()` | `begin_checkout` | Checkout start |
| `sendLead()` | `generate_lead` | Form submissions |

Features:
- SHA-256 hashing of PII (email, phone) before sending
- Automatic client_id generation
- Support for e-commerce items array
- IP and user agent forwarding for geo/device attribution

### 4. Database Migration
**File:** `serverless/migrations/0020_sgtm_config.sql`

Added columns to `customers` table:

| Column | Type | Purpose |
|--------|------|---------|
| `sgtm_config` | TEXT (JSON) | `{container_url, measurement_id, api_secret}` |
| `client_tier` | TEXT | `internal`, `tier1`, `tier2` |

### 5. Site Setup Endpoints
**File:** `serverless/src/routes/onboarding.ts`

New endpoints for unified site configuration:

```
POST /api/v1/onboarding/site-setup
  Body: { customer_id, website, sgtm_container_url?, measurement_id?, client_tier? }
  Returns: tracking snippet, webhook URLs, sGTM/GA4 setup instructions

GET /api/v1/onboarding/site-setup/:customerId
  Returns: current site configuration
```

---

## Codebase Audit Findings

### Critical Issues

#### 1. JWT Service Uses Node.js Crypto (Won't Work in Workers)
**Files:** `src/services/jwt.ts`, `src/utils/crypto.ts`

```typescript
// BROKEN - Node.js crypto doesn't exist in Workers
import { createHmac } from 'crypto';
```

**Fix Required:** Rewrite to use Web Crypto API (like `src/middleware/auth.ts` does).

#### 2. No Login Endpoint
**Current state:**
- Registration exists (`POST /register`) - creates customer, stores agreements
- No password collection during registration
- No login endpoint to issue JWT tokens
- No token refresh mechanism

**Missing endpoints:**
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`

#### 3. Routes Index File Broken
**File:** `src/routes/index.ts`

References 13 routers that are never imported:
```typescript
app.route('/api/v1/leads', leadsRouter);        // ❌ Not imported
app.route('/api/v1/oauth', oauthRouter);        // ❌ Not imported
// ... etc
```

**Note:** Main app uses `src/index.ts` which only registers 3 routes (admin, billing, tiktok).

### High Priority Issues

#### 4. KV Rate Limiting Disabled
**File:** `wrangler.jsonc:19`
```jsonc
// Temporarily disabled - KV namespace not created yet
// "kv_namespaces": [...]
```

#### 5. Stripe Placeholder Values
**File:** `wrangler.jsonc:41-44`
```jsonc
"STRIPE_STARTER_PRICE_ID": "price_starter_placeholder",
"STRIPE_PROFESSIONAL_PRICE_ID": "price_professional_placeholder",
"STRIPE_ENTERPRISE_PRICE_ID": "price_enterprise_placeholder",
"STRIPE_WEBHOOK_SECRET": "whsec_webhook_placeholder"
```

#### 6. Disabled Features
**File:** `src/index.ts`
```typescript
// Temporarily commented out evaluation router during development
// import { evaluationRouter } from './routes/evaluate';

// app.doc('/docs', swaggerUI({ url: '/openapi.json' })); // Temporarily disabled
// app.route('/api/v1/evaluate', evaluationRouter); // Temporarily disabled
```

### Syntax Errors in Services

| File | Issue |
|------|-------|
| `src/services/conversion-router.ts` | Multiple syntax errors (lines 85-132) |
| `src/services/tiktok-conversions.ts` | Multiple syntax errors (lines 45-269) |
| `src/services/customer-portal.ts` | Syntax error (line 53) |

### TypeScript Configuration Issues

Project-wide issues from missing/misconfigured tsconfig:
- Missing `@cloudflare/workers-types`
- ES5 target (should be ES2020+)
- Missing lib entries for modern APIs

---

## Files Modified This Session

| File | Action |
|------|--------|
| `serverless/wrangler.jsonc` | Added observability config |
| `serverless/src/index.ts` | Added dev-guard middleware imports |
| `serverless/src/middleware/dev-guard.ts` | **NEW** - Environment access control |
| `serverless/src/services/sgtm-forwarder.ts` | **NEW** - sGTM Measurement Protocol |
| `serverless/migrations/0020_sgtm_config.sql` | **NEW** - DB schema update |
| `serverless/src/routes/onboarding.ts` | Added site-setup endpoints |
| `serverless/src/services/AGENTS.md` | Updated with sGTM docs |
| `serverless/src/middleware/AGENTS.md` | Updated with dev-guard docs |
| `serverless/src/routes/AGENTS.md` | Updated with site-setup docs |
| `serverless/AGENTS.md` | Updated timestamp and file count |

---

## Recommended Next Steps

### Immediate (P0)
1. **Fix JWT service** - Rewrite `src/services/jwt.ts` to use Web Crypto API
2. **Add login endpoint** - Create auth flow that issues tokens
3. **Fix broken services** - Repair syntax errors in conversion-router, tiktok-conversions

### Short-term (P1)
4. **Create KV namespace** - Enable rate limiting
5. **Configure Stripe** - Replace placeholder price IDs
6. **Fix routes index** - Either delete `src/routes/index.ts` or properly import routers

### Testing (P2)
7. **Apply migration** - `wrangler d1 migrations apply adsengineer-db --remote`
8. **Test sGTM flow** - WooCommerce → AdsEngineer → sGTM → GA4
9. **Set up sGTM container** - For test site `stefan.mastersmarket.eu`

---

## Architecture Reference

### sGTM Integration Flow
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   WooCommerce   │────▶│  AdsEngineer API │────▶│  Customer sGTM  │
│   (webhook)     │     │  (sgtm-forwarder)│     │  (Cloud Run)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌────────────────────────────┼────────────────────────────┐
                              │                            │                            │
                              ▼                            ▼                            ▼
                        ┌──────────┐               ┌──────────────┐             ┌──────────┐
                        │   GA4    │               │  Google Ads  │             │   Meta   │
                        └──────────┘               └──────────────┘             └──────────┘
```

### New Database Schema
```sql
-- customers table additions
ALTER TABLE customers ADD COLUMN sgtm_config TEXT;
-- JSON: {container_url, measurement_id, api_secret}

ALTER TABLE customers ADD COLUMN client_tier TEXT DEFAULT 'tier2';
-- Values: 'internal', 'tier1', 'tier2'
```
