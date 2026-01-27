# Codebase Structure

**Analysis Date:** 2026-01-27

## Directory Layout

```
ads-engineer/                                 # Monorepo root
├── serverless/                              # Core API (Hono/Cloudflare Workers) - MAIN SYSTEM
│   ├── src/
│   │   ├── routes/                          # HTTP endpoints (18 files)
│   │   │   ├── shopify.ts                   # Shopify webhook receivers
│   │   │   ├── ghl.ts                       # GoHighLevel CRM webhooks
│   │   │   ├── tiktok.ts                    # TikTok Events API
│   │   │   ├── billing.ts                   # Stripe subscriptions
│   │   │   ├── custom-events.ts             # Custom event tracking
│   │   │   ├── custom-event-definitions.ts  # Event type definitions
│   │   │   ├── oauth.ts                     # Google/Meta/TikTok OAuth flows
│   │   │   ├── leads.ts                     # Lead CRUD
│   │   │   ├── admin.ts                     # Agency management
│   │   │   ├── analytics.ts                 # Reporting/dashboards
│   │   │   ├── waitlist.ts                  # Landing page signups
│   │   │   └── ...
│   │   ├── services/                        # Business logic (29 modules)
│   │   │   ├── google-ads.ts                # Google Ads Offline Conversions API
│   │   │   ├── meta-conversions.ts          # Meta/Facebook CAPI
│   │   │   ├── tiktok-conversions.ts        # TikTok Events API
│   │   │   ├── conversion-router.ts         # Multi-platform routing
│   │   │   ├── encryption.ts                # AES-256-GCM credential encryption
│   │   │   ├── oauth-storage.ts            # Encrypted OAuth token storage
│   │   │   ├── sgtm-forwarder.ts           # Server-Side GTM Measurement Protocol
│   │   │   ├── lead-scoring.ts              # Lead qualification scoring
│   │   │   └── ...
│   │   ├── middleware/                      # Request processing
│   │   │   ├── auth.ts                      # JWT/HMAC validation
│   │   │   ├── rate-limit.ts               # KV-based rate limiting
│   │   │   └── dev-guard.ts                # Environment-based access control
│   │   ├── database/                        # D1 query abstractors
│   │   │   └── index.ts                    # createDb factory
│   │   ├── workers/                        # Background processing
│   │   │   ├── offline-conversions.ts       # Google Ads upload worker
│   │   │   └── queue-consumer.ts           # Queue processing
│   │   ├── types.ts                        # Cloudflare bindings interface
│   │   ├── snippet.ts                      # Client-side tracking snippet
│   │   ├── openapi.ts                      # Auto-generated OpenAPI spec
│   │   └── index.ts                        # Hono app entry
│   ├── migrations/                          # D1 database schema (numbered SQL)
│   │   ├── 0001_init.sql                   # Initial tables (leads, customers, waitlist)
│   │   ├── 0002_agencies_audit.sql         # Agencies + audit_logs
│   │   ├── 0003_conversion_logs.sql        # Conversion tracking
│   │   ├── 0004_technology_tracking.sql   # Technology detection
│   │   ├── 0005_meta_tracking.sql         # Meta/Facebook tracking
│   │   ├── 0006_gdpr_compliance.sql        # GDPR compliance tables
│   │   ├── 0018_custom_events_definitions.sql # Custom events system
│   │   ├── 0019_billing_system.sql         # Stripe billing
│   │   ├── 0020_sgtm_config.sql            # Server-Side GTM config
│   │   └── 0022_add_agencies_config.sql    # Agencies config column
│   ├── tests/                              # Vitest test suite
│   │   ├── unit/                           # Unit tests for services
│   │   ├── integration/                    # API endpoint tests
│   │   └── e2e/                            # End-to-end flow tests
│   ├── scripts/                            # Utility scripts
│   ├── wrangler.jsonc                      # Cloudflare config (JSONC)
│   ├── package.json                        # Serverless dependencies
│   └── biome.json                          # Linting rules (strict TS)
├── frontend/                               # Dashboard UI (React/Vite)
│   ├── src/
│   │   ├── pages/                          # Route-based pages
│   │   │   ├── Login.tsx                   # Authentication
│   │   │   ├── Signup.tsx                  # Agency signup
│   │   │   ├── Dashboard.tsx              # Main dashboard
│   │   │   └── Admin/                      # Admin pages
│   │   │       ├── Agencies.tsx            # Agency management
│   │   │       └── IntegrationView.tsx    # Platform integrations
│   │   ├── components/                     # Reusable UI components
│   │   ├── services/                       # API service layer
│   │   │   ├── api.ts                      # Axios client
│   │   │   └── agencies.ts                 # Agency-specific API
│   │   └── main.tsx                        # React entry point
│   ├── package.json                        # Frontend dependencies
│   └── vite.config.ts                      # Vite config
├── infrastructure/                          # IaC (OpenTofu)
│   ├── main.tf                             # Cloudflare resources
│   ├── variables.tf                        # Input variables
│   ├── outputs.tf                          # Deployment outputs
│   └── providers.tf                        # Cloudflare provider config
├── shopify-plugin/                          # Shopify webhook proxy (Express)
│   ├── index.js                            # Express server
│   └── package.json
├── landing-page/                           # Marketing site (Astro)
│   ├── astro.config.mjs                    # Astro config
│   └── package.json
├── seo-auditor/                            # SEO tools + Universal SST
│   └── types.ts
├── admin-dashboard/                         # Internal admin UI (WIP)
│   └── src/
├── docs/                                   # Architecture & documentation
│   ├── opentofu-doppler-guide.md          # IaC and secrets management
│   ├── architecture-*.md                  # Architecture docs
│   └── sgtm-*.md                          # sGTM implementation docs
├── .kittify/specs/                         # Feature specifications
│   └── custom-events-database-system/      # Custom events spec
├── tasks/                                  # Kanban task tracking
│   ├── planned/                            # Planned tasks
│   ├── doing/                              # In progress
│   ├── done/                               # Completed
│   └── for_review/                         # Pending review
├── .opencode/                              # OpenCode agent skills
│   └── skill/                              # Platform integration guides
├── .sisyphus/                              # Workflow execution
├── .planning/                              # Planning artifacts (THIS FOLDER)
├── wiki/                                   # Project wiki
└── scripts/                                # Root-level utility scripts
```

## Directory Purposes

**serverless/** - Core API system (primary development target)
- Purpose: Hono/Cloudflare Workers API handling all tracking, webhooks, billing
- Contains: API endpoints, business logic, database layer, tests
- Key files: `src/index.ts` (Hono app), `wrangler.jsonc` (Worker config), `package.json` (dependencies)

**frontend/** - Agency dashboard UI
- Purpose: React-based customer-facing dashboard for managing integrations
- Contains: Page components, service layer, authentication flow
- Key files: `src/main.tsx` (React entry), `src/pages/Dashboard.tsx` (main dashboard)

**infrastructure/** - IaC configuration
- Purpose: OpenTofu for provisioning Cloudflare Workers, D1, KV namespaces
- Contains: Worker definitions, database resources, secrets management integration
- Key files: `main.tf` (resources), `variables.tf` (configuration)

**docs/** - Architecture and documentation
- Purpose: Technical specifications, deployment guides, architecture docs
- Contains: Architecture overviews, implementation guides, sGTM proposals
- Key files: `README.md`, `opentofu-doppler-guide.md`

**shopify-plugin/** - Shopify webhook proxy
- Purpose: Express server for Shopify webhook handling (separate from main API)
- Contains: Express app, Shopify auth logic
- Key files: `index.js`

**landing-page/** - Marketing site
- Purpose: Astro-based marketing landing page for waitlist and information
- Contains: Astro components, pages, layouts
- Key files: `astro.config.mjs`

## Key File Locations

**Entry Points:**
- `serverless/src/index.ts` - Hono app entry point, route registration
- `frontend/src/main.tsx` - React app entry point
- `serverless/src/snippet.ts` - Client-side tracking snippet generator
- `infrastructure/main.tf` - OpenTofu infrastructure definition

**Configuration:**
- `serverless/wrangler.jsonc` - Cloudflare Worker configuration (D1 binding, secrets)
- `serverless/biome.json` - BiomeJS linting rules
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/package.json` - Frontend dependencies
- `serverless/package.json` - Serverless dependencies

**Core Logic:**
- `serverless/src/routes/*.ts` - API endpoints per domain (18 files)
- `serverless/src/services/*.ts` - Business logic per platform (29 files)
- `serverless/src/middleware/*.ts` - Auth, rate limiting, dev guard
- `serverless/src/database/index.ts` - D1 query factory (type-safe queries)

**Testing:**
- `serverless/tests/unit/` - Service-level unit tests
- `serverless/tests/integration/` - API endpoint integration tests
- `serverless/tests/e2e/` - End-to-end flow tests
- `frontend/src/tests/` - Frontend component tests

**Database:**
- `serverless/migrations/*.sql` - D1 schema definitions (numbered sequentially)

## Naming Conventions

**Files:**
- Route files: kebab-case with domain name: `shopify.ts`, `custom-events.ts`, `billing.ts`
- Service files: kebab-case with platform name: `google-ads.ts`, `meta-conversions.ts`, `tiktok-conversions.ts`
- Middleware files: Purpose-based: `auth.ts`, `rate-limit.ts`, `dev-guard.ts`
- Migration files: Numbered prefix with description: `0001_init.sql`, `0002_agencies_audit.sql`

**Directories:**
- Lowercase, hyphen-separated: `serverless`, `frontend`, `infrastructure`, `shopify-plugin`

## Where to Add New Code

**New API Endpoint:**
- Primary code: `serverless/src/routes/{domain}.ts` (create new router file if domain doesn't exist)
- Business logic: `serverless/src/services/{platform}.ts`
- Tests: `serverless/tests/integration/{domain}.test.ts`

**New Ad Platform Integration:**
- Service module: `serverless/src/services/{platform}-conversions.ts` (follow interface pattern)
- Routes: Add to `serverless/src/routes/oauth.ts` for OAuth flows
- Migrations: New migration for config column in agencies table
- Tests: `serverless/tests/unit/{platform}.test.ts`

**Database Schema Change:**
- Migration: `serverless/migrations/XXXX_name.sql` (next available number)
- Queries: Add methods to `serverless/src/database/index.ts` (createDb factory)
- Types: Update `serverless/src/types.ts` if bindings change

**Frontend Page/Component:**
- Implementation: `frontend/src/pages/{Component}.tsx` (page) or `frontend/src/components/{Component}.tsx` (reusable)
- Service layer: `frontend/src/services/{domain}.ts` for API calls
- Tests: `frontend/src/tests/{component}.test.tsx`

**New Feature (Spec → Plan → Implementation):**
- Specification: `.kittify/specs/{feature-name}/spec.md`
- Implementation plan: `.kittify/specs/{feature-name}/plan.md`
- Tasks: `.kittify/specs/{feature-name}/tasks.md`

**Utility/Helper Functions:**
- Backend: `serverless/src/utils/{purpose}.ts`
- Frontend: `frontend/src/utils/{purpose}.ts`

## Special Directories

**migrations/** - D1 database schema
- Purpose: SQL schema definitions for Cloudflare D1
- Generated: No (manual creation, numbered sequentially)
- Committed: Yes (tracked in git)

**tests/** - Test suites
- Purpose: Vitest tests for serverless code (unit, integration, e2e)
- Generated: No (manual creation)
- Committed: Yes

**.opencode/skill/** - OpenCode agent skills
- Purpose: AI agent guides for platform integrations
- Generated: No (manual documentation)
- Committed: Yes

**.sisyphus/** - Workflow execution
- Purpose: Workflow orchestration state
- Generated: Yes (by Sisyphus workflow system)
- Committed: Yes

**.planning/** - Planning artifacts
- Purpose: GSD planning documents (structure, architecture, conventions, concerns)
- Generated: No (manual creation by GSD commands)
- Committed: Yes

**tasks/** - Kanban tracking
- Purpose: Task tracking (planned/doing/done/for_review)
- Generated: No (manual creation, automated sync)
- Committed: Yes

**.worktrees/** - Git worktrees
- Purpose: Feature branch worktrees
- Generated: Yes (by git worktree command)
- Committed: No (separate git workspaces)

**customers/** - Customer-specific files
- Purpose: Per-customer configurations and data
- Generated: No (customer-specific)
- Committed: No (customer-specific, not tracked)

---

*Structure analysis: 2026-01-27*