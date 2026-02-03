# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
./
├── serverless/              # Core API (Hono/Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts         # Hono app entry, route registration
│   │   ├── types.ts         # Global TypeScript types, Bindings
│   │   ├── openapi.ts       # Generated OpenAPI spec
│   │   ├── snippet.ts       # Client-side tracking snippet generator
│   │   ├── routes/          # API endpoints (18 files)
│   │   ├── services/        # Business logic (34 files)
│   │   ├── middleware/      # Auth, rate limiting, dev-guard
│   │   ├── database/        # D1 query functions
│   │   ├── workers/         # Background processing
│   │   ├── types/           # Additional type definitions
│   │   └── utils/           # Utility functions (gclid, event-time)
│   ├── migrations/          # D1 schema (15 migration files)
│   ├── tests/               # Vitest test suites
│   │   ├── unit/            # Service/utility tests (23 files)
│   │   ├── integration/     # API endpoint tests
│   │   ├── e2e/             # End-to-end flows
│   │   └── utils/           # Test utilities
│   ├── scripts/             # Health checks, migration tools
│   └── wrangler.jsonc       # Cloudflare Workers config
│
├── frontend/                # Agency Dashboard (React/TypeScript)
│   ├── src/
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Root component with routing
│   │   ├── pages/           # Route pages (Admin, Dashboard, Login, Signup)
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API client services
│   │   └── utils/           # Helper functions
│   └── package.json         # Vite, React, Tailwind, Stripe deps
│
├── landing-page/            # Marketing Site (Astro)
│   ├── src/
│   │   ├── pages/           # Astro pages (index, about, privacy-policy)
│   │   ├── components/      # Astro components
│   │   ├── layouts/         # Page layouts
│   │   └── content/         # Content collections
│   └── package.json         # Astro, Tailwind deps
│
├── shopify-plugin/          # Shopify Webhook Bridge (Express)
│   ├── index.js             # Express app entry
│   ├── package.json         # Express, Shopify API deps
│   └── public/              # Static status page
│
├── woocommerce-plugin/      # WooCommerce Plugin
│   └── adsengineer-woocommerce/  # WordPress plugin files
│
├── infrastructure/          # IaC (OpenTofu/Terraform)
│   ├── main.tf              # Cloudflare resources
│   ├── variables.tf         # Environment config
│   ├── outputs.tf           # Deployment outputs
│   └── providers.tf         # Cloud providers
│
├── seo-auditor/             # SEO Tools + Universal SST
│   └── (node_modules)       # SEO analysis tools
│
├── admin-dashboard/         # Internal Admin UI (WIP)
│   ├── src/                 # Vite/React admin interface
│   └── tests/               # Admin dashboard tests
│
├── docs/                    # Documentation
│   ├── sgtm-architecture-proposal.md
│   ├── api-documentation.md
│   └── sprints/             # Sprint planning docs
│
├── tasks/                   # Kanban Task Tracking
│   ├── planned/             # Backlog tasks
│   ├── doing/               # In-progress tasks
│   ├── done/                # Completed tasks
│   └── for_review/          # Code review tasks
│
├── inspiration/             # Reference Implementations (read-only)
│   └── ads_engineer_planner/
│
├── archives/                # Legacy documentation
│   ├── completed-specs/
│   ├── legacy-docs/
│   └── outdated-specs/
│
├── wiki/                    # Project Wiki & Knowledge Base
├── scripts/                 # Deployment/utility scripts
├── gtag/                    # Google Tag snippets
├── customers/               # Customer-specific files
├── .opencode/skill/         # AI Skill Documentation
│   ├── google-ads/SKILL.md
│   ├── meta-conversions/SKILL.md
│   ├── tiktok-conversions/SKILL.md
│   └── add-platform/SKILL.md
└── .planning/codebase/      # Codebase documentation (this file)
```

## Directory Purposes

### serverless/
**Purpose:** Core serverless API on Cloudflare Workers
**Contains:** All backend logic, routes, services, database queries
**Key Files:**
- `serverless/src/index.ts` - Main Hono application
- `serverless/src/types.ts` - Environment bindings (D1, KV, secrets)
- `serverless/wrangler.jsonc` - Cloudflare deployment config

**Deployment:** `doppler run -- pnpm deploy`

### serverless/src/routes/
**Purpose:** HTTP API endpoints
**Contains:** 18 route files organized by domain
**Key Files:**
- `index.ts` - Route registration hub
- `shopify.ts` - Shopify webhook handlers
- `ghl.ts` - GoHighLevel webhook handlers
- `billing.ts` - Stripe subscription endpoints
- `oauth.ts` - Platform OAuth flows
- `custom-events.ts` - Custom event tracking
- `admin.ts` - Admin management endpoints
- `onboarding.ts` - Customer onboarding
- `tracking.ts` - Tracking snippet delivery
- `waitlist.ts` - Landing page signups
- `analytics.ts` - Reporting endpoints
- `gdpr.ts` - Data deletion requests
- `tiktok.ts` - TikTok Events API
- `woocommerce.ts` - WooCommerce webhooks
- `gtm.ts` - GTM compiler endpoints
- `demo.ts` - Demo/test endpoints

### serverless/src/services/
**Purpose:** Business logic and external integrations
**Contains:** 34 service modules
**Key Files:**
**Platform Integrations:**
- `google-ads.ts` - Google Ads API client (v21)
- `meta-conversions.ts` - Meta CAPI
- `tiktok-conversions.ts` - TikTok Events API
- `conversion-router.ts` - Platform routing logic
- `sgtm-forwarder.ts` - Server-Side GTM forwarder

**Core Services:**
- `billing.ts` - Stripe subscription logic
- `encryption.ts` - AES-256-GCM encryption
- `crypto.ts` - Crypto utilities
- `oauth-storage.ts` - Encrypted OAuth storage
- `logging.ts` - Structured logging

**Analytics & Scoring:**
- `lead-scoring.ts` - Lead qualification
- `customer-scoring.ts` - Customer value scoring
- `advanced-analytics.ts` - Analytics aggregation
- `confidence-scorer.ts` - Attribution confidence

**Analysis & Detection:**
- `technology-detector.ts` - Tech stack detection
- `tech-stack-analyzer.ts` - Detailed tech analysis
- `ecommerce-analysis.ts` - E-commerce platform analysis
- `waste-detector.ts` - Ad spend waste detection
- `competitive-analysis.ts` - Competitor analysis

**CRM & Outreach:**
- `customer-crm.ts` - CRM operations
- `outreach-orchestration.ts` - Multi-channel outreach
- `email-sequence-generator.ts` - Email campaigns
- `linkedin-sales-navigator.ts` - LinkedIn integration

### serverless/src/middleware/
**Purpose:** Cross-cutting request processing
**Contains:** 3 middleware files
**Key Files:**
- `auth.ts` - JWT validation and HMAC verification
- `rate-limit.ts` - KV-based rate limiting
- `dev-guard.ts` - Development environment access control

### serverless/src/database/
**Purpose:** D1 database queries
**Contains:** 1 database module
**Key Files:**
- `index.ts` - All database queries and prepared statements

### serverless/src/workers/
**Purpose:** Background job processing
**Contains:** 4 worker modules
**Key Files:**
- `offline-conversions.ts` - Google Ads upload queue
- `queue-consumer.ts` - Queue consumer logic
- `multi-platform-tracking/` - Shopify/WooCommerce adapters
- `universal-engine/` - Universal tracking snippet

### serverless/migrations/
**Purpose:** D1 database schema migrations
**Contains:** 15 numbered migration files
**Naming:** `NNNN_description.sql`
**Key Files:**
- `0001_init.sql` - Initial schema
- `0004_technology_tracking.sql` - Tech detection tables
- `0018_custom_events_definitions.sql` - Custom event system
- `0019_billing_system.sql` - Stripe subscriptions
- `0020_sgtm_config.sql` - sGTM configuration
- `0022_add_agencies_config.sql` - Agency settings

### serverless/tests/
**Purpose:** Test suites (Vitest)
**Contains:** 3 test categories
**Structure:**
- `unit/` - 23 unit test files (services, utilities)
- `integration/` - API endpoint integration tests
- `e2e/` - End-to-end workflow tests
- `utils/` - Test helpers and fixtures

### frontend/
**Purpose:** Agency dashboard React application
**Contains:** React components, pages, services
**Key Files:**
- `src/main.tsx` - React entry
- `src/App.tsx` - Root with React Router
- `src/pages/Admin.tsx` - Admin dashboard
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/Signup.tsx` - Multi-step signup with Stripe
- `src/pages/Login.tsx` - Authentication
- `src/pages/GTMCompiler.tsx` - GTM container compiler
- `src/components/Layout.tsx` - Page layout component
- `src/services/` - Axios API clients

### landing-page/
**Purpose:** Marketing website (Astro)
**Contains:** Astro pages, components, content
**Key Files:**
- `src/pages/index.astro` - Homepage
- `src/pages/about.astro` - About page
- `src/pages/privacy-policy.astro` - Legal page

### shopify-plugin/
**Purpose:** Shopify webhook bridge (Express)
**Contains:** Express app for Shopify integration
**Key Files:**
- `index.js` - Express server
- `public/` - Static status page

### woocommerce-plugin/
**Purpose:** WooCommerce integration
**Contains:** WordPress plugin files
**Key Files:**
- `adsengineer-woocommerce/` - Plugin directory

### infrastructure/
**Purpose:** Infrastructure as Code (OpenTofu)
**Contains:** Terraform configuration
**Key Files:**
- `main.tf` - Cloudflare resources
- `variables.tf` - Environment variables
- `providers.tf` - Provider configuration

### tasks/
**Purpose:** Kanban task tracking
**Contains:** Task files organized by status
**Structure:**
- `planned/` - Backlog
- `doing/` - In progress
- `done/` - Completed
- `for_review/` - Under review

### docs/
**Purpose:** Project documentation
**Contains:** Architecture docs, guides, specs
**Key Files:**
- `sgtm-architecture-proposal.md` - sGTM pivot proposal
- `api-documentation.md` - API reference
- `sprints/` - Sprint planning

### .opencode/skill/
**Purpose:** AI skill documentation
**Contains:** Integration guides for AI assistants
**Key Files:**
- `google-ads/SKILL.md` - Google Ads integration guide
- `meta-conversions/SKILL.md` - Meta CAPI guide
- `tiktok-conversions/SKILL.md` - TikTok Events API guide
- `add-platform/SKILL.md` - Guide for adding new platforms

## Key File Locations

### Entry Points
- **API:** `serverless/src/index.ts` - Hono app
- **Routes:** `serverless/src/routes/index.ts` - Route registration
- **Frontend:** `frontend/src/main.tsx` - React app
- **Landing Page:** `landing-page/src/pages/index.astro`
- **Shopify Plugin:** `shopify-plugin/index.js`

### Configuration
- **Wrangler:** `serverless/wrangler.jsonc` - Cloudflare config
- **Biome:** `serverless/biome.json` - Linting/formatting
- **Vite (Frontend):** `frontend/vite.config.ts`
- **TypeScript:** `tsconfig.json` (root and per-package)

### Core Logic
- **Types:** `serverless/src/types.ts` - Global TypeScript types
- **Database:** `serverless/src/database/index.ts` - All DB queries
- **Snippet:** `serverless/src/snippet.ts` - Tracking code generator

### Testing
- **Unit Tests:** `serverless/tests/unit/*.test.ts`
- **Integration:** `serverless/tests/integration/*.test.ts`
- **E2E:** `serverless/tests/e2e/*.test.ts`
- **Frontend Tests:** `frontend/src/test/` and `frontend/src/tests/`

## Naming Conventions

### Files
- **Routes:** `[domain].ts` (e.g., `shopify.ts`, `billing.ts`)
- **Services:** `[purpose].ts` (e.g., `google-ads.ts`, `encryption.ts`)
- **Tests:** `[module].test.ts` (e.g., `google-ads.test.ts`)
- **Migrations:** `NNNN_description.sql` (e.g., `0019_billing_system.sql`)

### Directories
- **Kebab-case:** `custom-events/`, `rate-limit/`
- **Domain-named:** `shopify-plugin/`, `admin-dashboard/`

### Exports
- **Routes:** Named export `export { router as domainRoutes }`
- **Services:** Named exports `export async function name()`
- **Types:** Types/Interfaces in PascalCase

## Where to Add New Code

### New API Endpoint
1. **Create route:** `serverless/src/routes/[domain].ts`
2. **Export router:** Named export following existing pattern
3. **Register:** Add to `serverless/src/routes/index.ts`
4. **Add to main:** Import and mount in `serverless/src/index.ts`

### New Business Logic
1. **Create service:** `serverless/src/services/[purpose].ts`
2. **Export functions:** Pure async functions
3. **Import in routes:** Use in route handlers
4. **Add tests:** `serverless/tests/unit/[purpose].test.ts`

### New Database Table
1. **Create migration:** `serverless/migrations/NNNN_description.sql`
2. **Add queries:** `serverless/src/database/index.ts`
3. **Update types:** `serverless/src/types.ts` if needed
4. **Apply:** `wrangler d1 migrations apply adsengineer-db --remote`

### New Platform Integration
1. **Create service:** `serverless/src/services/[platform]-conversions.ts`
2. **Add OAuth route:** Update `serverless/src/routes/oauth.ts`
3. **Add to router:** Update `serverless/src/services/conversion-router.ts`
4. **Add skill doc:** `.opencode/skill/[platform]/SKILL.md`

### New Frontend Page
1. **Create page:** `frontend/src/pages/[Name].tsx`
2. **Add route:** Update `frontend/src/App.tsx` React Router
3. **Add service:** `frontend/src/services/[name].ts` if needed
4. **Add tests:** `frontend/src/test/[name].test.tsx`

### New Utility Function
1. **Create file:** `serverless/src/utils/[name].ts`
2. **Export:** Named export
3. **Import:** Use relative paths in services/routes

## Special Directories

### .worktrees/
**Purpose:** Git worktrees for parallel feature development
**Note:** Ephemeral - created and removed per feature

### archives/
**Purpose:** Historical documentation
**Note:** Read-only reference material

### .kittify/specs/
**Purpose:** Feature specification documents
**Pattern:** One directory per feature with spec.md, plan.md, tasks.md

---

*Structure analysis: 2026-02-03*
