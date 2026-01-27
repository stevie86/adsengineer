# Architecture

**Analysis Date:** 2026-01-27

## Pattern Overview

**Overall:** Layered Serverless Microservices

**Key Characteristics:**
- **Edge-first deployment** - Cloudflare Workers at CDN edge for global low latency
- **Horizontal platform modularity** - Each ad platform (Google, Meta, TikTok) as independent service module
- **Strict layer separation** - Routes (endpoints), Services (business logic), Database (queries), never mixed
- **HMAC + JWT dual auth** - Webhooks use HMAC signatures, dashboard uses JWT tokens
- **Encrypted credential storage** - All platform credentials encrypted at rest (AES-256-GCM)
- **Multi-tenant data isolation** - Organization-scoped queries via `org_id` tenant column

## Layers

**Routes Layer:**
- Purpose: HTTP endpoint definitions, request validation, response formatting
- Location: `serverless/src/routes/`
- Contains: 18 domain-specific router files (shopify.ts, ghl.ts, billing.ts, custom-events.ts, etc.)
- Depends on: Services layer, middleware/auth layer
- Used by: Hono app router registration

**Services Layer:**
- Purpose: Business logic, external API communication, data transformation
- Location: `serverless/src/services/`
- Contains: 29 service modules (google-ads.ts, meta-conversions.ts, tiktok-conversions.ts, conversion-router.ts, encryption.ts)
- Depends on: Database layer, Cloudflare bindings (D1, KV, secrets)
- Used by: Routes layer, Workers layer

**Database Layer:**
- Purpose: D1 query abstractors, prepared statements, data persistence
- Location: `serverless/src/database/` (createDb factory)
- Contains: Query functions for all tables (leads, agencies, custom_events, audit_logs)
- Depends on: Cloudflare D1 binding (c.env.DB)
- Used by: Services layer

**Middleware Layer:**
- Purpose: Request processing, authentication, rate limiting, environment guards
- Location: `serverless/src/middleware/`
- Contains: auth.ts (JWT/HMAC validation), rate-limit.ts (KV-based throttling), dev-guard.ts (non-prod access control)
- Depends on: Cloudflare bindings (KV, secrets)
- Used by: Routes layer (Hono middleware chain)

**Workers Layer:**
- Purpose: Background processing, offline conversion uploads, async operations
- Location: `serverless/src/workers/`
- Contains: offline-conversions.ts (Google Ads upload worker), queue-consumer.ts (queue processing)
- Depends on: Services layer, Database layer
- Used by: Scheduled events, external triggers

## Data Flow

**HTTP Request Flow:**

1. **Receive Request** - Cloudflare Worker receives HTTP request at edge location
2. **CORS Middleware** - Cross-origin headers applied via `cors()` middleware
3. **Dev Guard** - Development environment access control (dev-guard.ts)
4. **Auth Middleware** - JWT validation (dashboard) or HMAC signature validation (webhooks)
5. **Route Handler** - Domain-specific endpoint in `routes/*.ts`
6. **Input Validation** - Zod schema validation on request body/params
7. **Service Call** - Route calls appropriate service function (e.g., `google-ads.ts uploadConversion()`)
8. **Database Query** - Service calls prepared statement via `createDb()`
9. **External API** - Service calls Google/Meta/TikTok APIs (with encrypted credentials)
10. **Response** - Service returns data to route, route formats JSON response

**Webhook Flow (Shopify/GHL):**

1. Platform webhook POST to `/api/v1/shopify/webhook` or `/api/v1/ghl/webhook`
2. HMAC validation (X-Shopify-Hmac-Signature or platform-specific header)
3. Route extracts payload
4. Service normalizes event data (event-normalizer.ts)
5. Service stores lead/custom event in D1
6. Service queues conversion upload (conversion_queue table)
7. Worker processes offline conversion to Google Ads platform API
8. Audit log created for tracking

**Custom Event Tracking Flow:**

1. Frontend tracking snippet sends POST to `/api/v1/custom-events`
2. JWT auth via Authorization header
3. Route validates event schema (Zod)
4. Service stores custom event in `custom_events` table
5. Service routes conversion to configured platforms (conversion-router.ts):
   - Google Ads via google-ads.ts
   - Meta/Facebook via meta-conversions.ts
   - TikTok via tiktok-conversions.ts
   - sGTM via sgtm-forwarder.ts (Measurment Protocol)

## Key Abstractions

**Platform Module Interface:**
- Purpose: Unified abstraction for ad platform conversion APIs
- Examples: `serverless/src/services/google-ads.ts`, `meta-conversions.ts`, `tiktok-conversions.ts`
- Pattern: Stateless class with async methods (uploadConversions, validateCredentials)
- Key Methods:
  - `uploadConversion(credentials, data) -> Result`
  - `validateCredentials() -> boolean`
  - `formatConversionTime(date) -> string`

**Encryption Service:**
- Purpose: AES-256-GCM encryption for platform credentials at rest
- Examples: `serverless/src/services/encryption.ts`, `crypto.ts`
- Pattern: Web Crypto API (native to Cloudflare Workers)
- Key Functions:
  - `encryptCredential(data, keyId) -> encryptedData`
  - `decryptCredential(encryptedData, keyId) -> plainData`
  - Derives per-agency encryption keys from master key

**Database Factory:**
- Purpose: Type-safe D1 query interface with prepared statements
- Examples: `serverless/src/database/index.ts`
- Pattern: Factory function returning query methods object
- Key Methods:
  - `insertLead(data) -> {id}`
  - `getAgencyById(id) -> Agency|null`
  - `getAgencyCredentials(agencyId) -> Credentials|null`
  - `updateAgencyCredentials(agencyId, credentials) -> boolean`

**Conversion Router:**
- Purpose: Multi-platform conversion routing based on click ID type
- Examples: `serverless/src/services/conversion-router.ts`
- Pattern: Factory that detects click ID (gclid, fbclid, ttclid) and dispatches to platform module
- Routing Logic:
  - `gclid` → Google Ads (google-ads.ts)
  - `fbclid` → Meta CAPI (meta-conversions.ts)
  - `ttclid` → TikTok (tiktok-conversions.ts)
  - None → sGTM (sgtm-forwarder.ts)

## Entry Points

**Hono App Entry:**
- Location: `serverless/src/index.ts`
- Triggers: All HTTP requests to Cloudflare Worker
- Responsibilities:
  - Route registration (18 domain routers)
  - CORS middleware configuration
  - Dev guard middleware application
  - Health check endpoint (`/health`)

**Vite Frontend Entry:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser hits frontend URL
- Responsibilities: React root rendering, API client initialization

**OpenTofu Infrastructure:**
- Location: `infrastructure/main.tf`, `variables.tf`, `outputs.tf`
- Triggers: Manual `tofu apply` or CI/CD pipeline
- Responsibilities: Provision Cloudflare Worker, D1 database, KV namespaces

**Worker Scripts:**
- Location: `serverless/scripts/`, `serverless/src/workers/`
- Triggers: Scheduled cron jobs, manual execution
- Responsibilities: Health checks, migration tools, async conversion processing

## Error Handling

**Strategy:** Typed errors with user-friendly messages, audit logging on failures

**Patterns:**
- Custom error classes: `GoogleAdsError(message, code?, details?)` (google-ads.ts)
- Consistent error response: `{ success: false, error: "message" }` with HTTP status codes
- Audit logs on failure: `createAuditLog({ agency_id, action, result: 'failed', error, details })`
- Platform-specific mapping: Google API error codes → user-friendly messages
- Partial failure handling: Google Ads API `partial_failure: true` mode

## Cross-Cutting Concerns

**Logging:** Structured console logging with context (service/logger.ts), audit logs in D1 (audit_logs table)
**Validation:** Zod schemas on all route inputs (zValidator from @hono/zod-openapi)
**Authentication:** JWT (HMAC-SHA256) for dashboard, HMAC signatures for webhooks (constant-time comparison)
**Secrets Management:** Cloudflare secrets (c.env.SECRET_NAME), all handled via Wrangler config (wrangler.jsonc)
**Rate Limiting:** KV namespace per-IP/per-shop limits (rate-limit.ts middleware)
**Multi-tenancy:** All queries scoped to `org_id` via tenant isolation pattern

---

*Architecture analysis: 2026-01-27*