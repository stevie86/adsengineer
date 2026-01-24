# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Modular Platform Architecture with Service Layer Separation

**Key Characteristics:**
- **Layered Architecture**: Routes → Services → Database pattern
- **Microservices-style**: Platform-specific modules (Google Ads, Meta, TikTok)
- **Serverless-first**: Cloudflare Workers with D1 database
- **Multi-tenant**: Organization-based isolation
- **API-first**: RESTful API with JWT/HMAC authentication

## Layers

**API Layer (Routes):**
- Purpose: HTTP request handling, validation, authentication
- Location: `serverless/src/routes/`
- Contains: 18 route files for different domains
- Depends on: Services layer, middleware
- Used by: External clients, frontend, webhooks

**Service Layer:**
- Purpose: Business logic, external API integration, data processing
- Location: `serverless/src/services/`
- Contains: 29 service files organized by platform/function
- Depends on: Database layer, external APIs
- Used by: Routes layer, background workers

**Database Layer:**
- Purpose: Data persistence and retrieval
- Location: `serverless/src/database/`, `serverless/migrations/`
- Contains: D1 query functions, SQL schema
- Depends on: Cloudflare D1
- Used by: Services layer

**Middleware Layer:**
- Purpose: Authentication, rate limiting, request processing
- Location: `serverless/src/middleware/`
- Contains: JWT validation, HMAC verification, rate limiting
- Depends on: Cloudflare KV, secrets
- Used by: Routes layer

**Infrastructure Layer:**
- Purpose: Cloud resource provisioning and configuration
- Location: `infrastructure/`
- Contains: OpenTofu IaC, Cloudflare resources
- Depends on: Cloudflare API
- Used by: Deployment pipelines

## Data Flow

**Platform Integration Flow:**

1. External platform (Shopify/GHL/TikTok) sends webhook to `serverless/src/routes/[platform].ts`
2. Middleware validates HMAC signature in `serverless/src/middleware/auth.ts`
3. Route calls platform service in `serverless/src/services/[platform]-conversions.ts`
4. Service processes data and stores in D1 via `serverless/src/database/`
5. Service forwards to ad platforms via `serverless/src/services/conversion-router.ts`

**Client Dashboard Flow:**

1. Frontend (`frontend/src/`) makes API call to `serverless/src/routes/`
2. JWT middleware authenticates in `serverless/src/middleware/auth.ts`
3. Route calls business logic service in `serverless/src/services/`
4. Service queries/updates D1 database
5. Response returns through route to frontend

**State Management:**
- **Database**: Cloudflare D1 for persistent data
- **Cache**: Cloudflare KV for rate limiting, temporary state
- **Session**: JWT tokens for authentication
- **Webhooks**: HMAC signatures for request integrity

## Key Abstractions

**Platform Module:**
- Purpose: Isolate platform-specific integration logic
- Examples: `serverless/src/services/google-ads.ts`, `serverless/src/services/meta-conversions.ts`
- Pattern: Stateless class with `uploadConversions()` method, OAuth credential management

**Conversion Router:**
- Purpose: Route conversions to correct ad platform based on click ID
- Examples: `serverless/src/services/conversion-router.ts`
- Pattern: Analyzes click IDs (gclid, fbclid, ttclid) and forwards to appropriate platform module

**Customer Site:**
- Purpose: Represent customer tracking configuration
- Examples: Sites table in `serverless/migrations/0001_init.sql`
- Pattern: Multi-assignment support (same event with different configs across sites)

**Custom Event System:**
- Purpose: Flexible business event tracking
- Examples: `serverless/src/services/custom-events.ts`, `serverless/migrations/0018_custom_events_definitions.sql`
- Pattern: Event definitions stored in database, assigned per site

## Entry Points

**API Entry Point:**
- Location: `serverless/src/index.ts`
- Triggers: HTTP requests to Cloudflare Worker
- Responsibilities: Route registration, CORS configuration, middleware setup

**Frontend Entry Point:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser access to dashboard
- Responsibilities: React app initialization, routing setup

**Infrastructure Entry Point:**
- Location: `infrastructure/main.tf`
- Triggers: `tofu apply` command
- Responsibilities: Cloudflare resource provisioning

**Webhook Entry Points:**
- Location: `serverless/src/routes/shopify.ts`, `ghl.ts`, `tiktok.ts`
- Triggers: External platform webhook events
- Responsibilities: Event ingestion, validation, processing

## Error Handling

**Strategy:** Hierarchical error handling with typed exceptions

**Patterns:**
- **Service Layer**: Throw typed errors (`GoogleAdsError`, `ValidationError`)
- **Route Layer**: Catch service errors, return standardized JSON responses
- **Global**: Error logging via `serverless/src/services/logging.ts`
- **Client**: Frontend error boundaries and user-friendly messages

## Cross-Cutting Concerns

**Logging:** Structured logging via `serverless/src/services/logging.ts`
**Validation:** Zod schemas in all route handlers
**Authentication:** JWT for dashboard, HMAC for webhooks, API keys for admin
**Rate Limiting:** Multi-tier limits in `serverless/src/middleware/rate-limit.ts`
**Encryption:** AES-256-GCM for credentials in `serverless/src/services/encryption.ts`

---

*Architecture analysis: 2026-01-24*