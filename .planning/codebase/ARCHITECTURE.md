# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Multi-Package Micro-Frontend/Micro-Service Architecture

**Key Characteristics:**
- **Backend:** Hono-based serverless API on Cloudflare Workers with Layered Service Architecture
- **Frontend:** Multi-tenant React dashboard with TypeScript
- **Infrastructure:** OpenTofu-managed Cloudflare resources
- **Package Organization:** Monorepo-style with independent packages per domain
- **Security-First:** JWT + HMAC auth, AES-256-GCM encryption, rate limiting

## Layers

### API Layer (Routes)
- **Purpose:** HTTP endpoints, input validation, response formatting
- **Location:** `serverless/src/routes/`
- **Contains:** Hono routers, Zod schemas, middleware chains
- **Depends on:** Services layer
- **Used by:** External clients (dashboard, webhooks, integrations)

**Pattern:**
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();

const InputSchema = z.object({
  field: z.string(),
});

router.post('/endpoint', zValidator('json', InputSchema), async (c) => {
  const data = c.req.valid('json');
  // Call service, NOT direct DB
  const result = await myService(c.env.DB, data);
  return c.json({ success: true, data: result });
});

export { router as myRouter };
```

**Key Route Files:**
- `serverless/src/routes/index.ts` - Route registration and Hono app setup
- `serverless/src/routes/shopify.ts` - Shopify webhook handlers (HMAC auth)
- `serverless/src/routes/ghl.ts` - GoHighLevel CRM webhooks
- `serverless/src/routes/billing.ts` - Stripe subscription management
- `serverless/src/routes/oauth.ts` - Google/Meta/TikTok OAuth flows
- `serverless/src/routes/custom-events.ts` - Custom event tracking API

### Service Layer
- **Purpose:** Business logic, external API integration, data transformation
- **Location:** `serverless/src/services/`
- **Contains:** Pure async functions, platform clients, encryption utilities
- **Depends on:** Database layer, external APIs
- **Used by:** Routes layer, workers

**Pattern:**
```typescript
export async function myService(db: D1Database, data: Input): Promise<Output> {
  const stmt = db.prepare('SELECT * FROM table WHERE id = ?').bind(data.id);
  return stmt.first();
}
```

**Key Service Files:**
- `serverless/src/services/google-ads.ts` - Google Ads API v21 client
- `serverless/src/services/meta-conversions.ts` - Meta CAPI integration
- `serverless/src/services/tiktok-conversions.ts` - TikTok Events API
- `serverless/src/services/billing.ts` - Stripe subscription logic
- `serverless/src/services/encryption.ts` - AES-256-GCM credential encryption
- `serverless/src/services/sgtm-forwarder.ts` - Server-Side GTM Measurement Protocol

### Database Layer
- **Purpose:** D1 database queries, schema migrations
- **Location:** `serverless/src/database/index.ts`, `serverless/migrations/`
- **Contains:** SQL queries, prepared statements, type definitions
- **Depends on:** Cloudflare D1 bindings
- **Used by:** Services layer

**Pattern:**
```typescript
const stmt = db.prepare('SELECT * FROM agencies WHERE id = ?').bind(id);
const result = await stmt.first();
```

**Migration Files (numbered sequentially):**
- `serverless/migrations/0001_init.sql` - Core schema (agencies, leads, audit_logs)
- `serverless/migrations/0004_technology_tracking.sql` - Tech stack detection
- `serverless/migrations/0018_custom_events_definitions.sql` - Custom event system
- `serverless/migrations/0019_billing_system.sql` - Stripe subscription tables
- `serverless/migrations/0020_sgtm_config.sql` - sGTM configuration

### Middleware Layer
- **Purpose:** Cross-cutting request processing (auth, rate limiting, CORS)
- **Location:** `serverless/src/middleware/`
- **Contains:** JWT validation, HMAC verification, rate limiting
- **Depends on:** Cloudflare KV, secrets
- **Used by:** Routes layer

**Key Middleware:**
- `serverless/src/middleware/auth.ts` - JWT validation, HMAC webhook verification
- `serverless/src/middleware/rate-limit.ts` - Multi-tier rate limiting (uses KV)
- `serverless/src/middleware/dev-guard.ts` - Environment-based access control

### Worker Layer (Background Processing)
- **Purpose:** Async background jobs, offline conversion uploads
- **Location:** `serverless/src/workers/`
- **Contains:** Queue consumers, multi-platform tracking, universal engine
- **Depends on:** Services layer
- **Used by:** Triggered by routes or scheduled events

**Worker Modules:**
- `serverless/src/workers/offline-conversions.ts` - Google Ads upload queue
- `serverless/src/workers/multi-platform-tracking/` - Shopify/WooCommerce adapters
- `serverless/src/workers/universal-engine/` - Universal tracking snippet engine

### Frontend Dashboard Layer
- **Purpose:** User-facing React application for agency management
- **Location:** `frontend/src/`
- **Contains:** React components, pages, services, types
- **Depends on:** Backend API
- **Used by:** Agency users

**Structure:**
- `frontend/src/pages/` - Route-based page components
- `frontend/src/components/` - Reusable UI components
- `frontend/src/services/` - API service layer (Axios)
- `frontend/src/utils/` - Utility functions

### Landing Page Layer
- **Purpose:** Marketing site built with Astro
- **Location:** `landing-page/src/`
- **Contains:** Astro pages, components, content
- **Depends on:** Static content
- **Used by:** Public visitors

## Data Flow

### Webhook Flow (Shopify/GHL)
```
1. External Platform → POST /api/v1/shopify/webhook
2. HMAC Validation (middleware/rate-limit.ts)
3. Route handler extracts data (routes/shopify.ts)
4. GCLID extraction from note_attributes/tags/landing_site
5. Lead creation via services/customer-crm.ts
6. Google Ads conversion upload via services/google-ads.ts
7. Response returned to webhook caller
```

### API Request Flow (Dashboard)
```
1. Frontend → GET /api/v1/leads (with JWT Bearer token)
2. JWT validation (middleware/auth.ts)
3. Route handler validates params (routes/leads.ts)
4. Service layer queries database (services/customer-crm.ts)
5. Response returned to frontend
```

### sGTM Forwarding Flow
```
1. E-commerce event (purchase, add_to_cart)
2. Event normalized (services/event-normalizer.ts)
3. sGTM forwarder transforms to Measurement Protocol (services/sgtm-forwarder.ts)
4. POST to customer's sGTM container
5. sGTM processes and forwards to GA4/Meta/TikTok
```

### OAuth Flow (Platform Connection)
```
1. User clicks "Connect Google Ads" in dashboard
2. Redirect to OAuth provider (routes/oauth.ts)
3. Callback with auth code
4. Exchange for refresh token
5. Encrypt credentials (services/encryption.ts)
6. Store in agencies table (database)
```

## State Management

**Server-Side:**
- Database: Cloudflare D1 (SQLite-based)
- Cache: Cloudflare KV (rate limiting, session data)
- Secrets: Cloudflare Secrets (via wrangler/Doppler)

**Client-Side:**
- React Context API for global state
- React Hook Form for form state
- No Redux/MobX - uses built-in React patterns

## Key Abstractions

### Platform Conversion Router
- **Purpose:** Routes conversions to appropriate platform based on click ID
- **Location:** `serverless/src/services/conversion-router.ts`
- **Pattern:** Maps `gclid` → Google Ads, `fbclid` → Meta, `ttclid` → TikTok

### sGTM Forwarder
- **Purpose:** Unified integration hub using Server-Side GTM
- **Location:** `serverless/src/services/sgtm-forwarder.ts`
- **Pattern:** Measurement Protocol v2 format for GA4 compatibility

### Encryption Service
- **Purpose:** AES-256-GCM encryption for OAuth credentials
- **Location:** `serverless/src/services/encryption.ts`
- **Pattern:** Credentials encrypted at rest, decrypted at runtime

## Entry Points

### Main API Entry Point
- **Location:** `serverless/src/index.ts`
- **Triggers:** Cloudflare Workers HTTP requests
- **Responsibilities:**
  - Hono app initialization
  - Global CORS configuration
  - Middleware registration (dev-guard, logging)
  - Route mounting
  - Health check endpoint

### Route Registration Entry Point
- **Location:** `serverless/src/routes/index.ts`
- **Triggers:** Imported by main index.ts
- **Responsibilities:**
  - OpenAPI Hono setup
  - Swagger UI configuration
  - Individual route registration under `/api/v1/*`
  - CORS headers

### Frontend Entry Point
- **Location:** `frontend/src/main.tsx`
- **Triggers:** Browser navigation
- **Responsibilities:**
  - React app mounting
  - React Router setup
  - Global styles (Tailwind)

### Landing Page Entry Point
- **Location:** `landing-page/src/pages/index.astro`
- **Triggers:** HTTP requests to marketing domain
- **Responsibilities:**
  - Astro page rendering
  - Static content delivery

### Webhook Entry Points
- **Shopify:** `serverless/src/routes/shopify.ts` - Order/customer webhooks
- **GHL:** `serverless/src/routes/ghl.ts` - CRM contact/opportunity webhooks
- **Stripe:** `serverless/src/routes/billing.ts` - Subscription webhooks

## Error Handling

**Strategy:** Graceful degradation with structured error responses

**Patterns:**
1. **Route Level:** Try/catch blocks return `{ success: false, error: string }`
2. **Service Level:** Typed errors (GoogleAdsError) with specific error codes
3. **Middleware Level:** HMAC failures return 401 with security headers
4. **Database Level:** Prepared statements prevent SQL injection

**Response Format:**
```json
{
  "success": false,
  "error": "Invalid webhook signature",
  "message": "Webhook signature validation failed",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Cross-Cutting Concerns

### Logging
- **Location:** `serverless/src/services/logging.ts`
- **Pattern:** Structured JSON logging with request ID correlation
- **Levels:** DEBUG, INFO, WARN, ERROR

### Validation
- **Pattern:** Zod schemas on all route inputs
- **Location:** Inline in route files
- **Response:** 400 with validation error details

### Authentication
- **JWT Routes:** `Authorization: Bearer <token>` header
- **Webhook Routes:** HMAC signature headers (platform-specific)
- **Admin Routes:** `X-Admin-Token` header

### Rate Limiting
- **Pattern:** KV-based sliding window rate limiting
- **Tiers:** IP-based, Shop-based, Customer-based
- **Location:** `serverless/src/middleware/rate-limit.ts`

### Encryption
- **Algorithm:** AES-256-GCM
- **Keys:** Stored in Cloudflare Secrets (ENCRYPTION_MASTER_KEY)
- **Usage:** OAuth credentials at rest

---

*Architecture analysis: 2026-02-03*
