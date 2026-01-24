# Codebase Structure

**Analysis Date:** 2026-01-24

## Directory Layout

```
ads-engineer/
├── serverless/                 # Core API (Hono/Cloudflare Workers)
│   ├── src/
│   │   ├── routes/            # API endpoints (18 files)
│   │   ├── services/          # Business logic (29 files)
│   │   ├── middleware/        # Auth, rate limiting (3 files)
│   │   ├── database/          # D1 query functions
│   │   ├── workers/           # Background processing
│   │   ├── utils/             # Utility functions
│   │   ├── types.ts           # Shared TypeScript interfaces
│   │   ├── index.ts           # Hono app entry point
│   │   ├── snippet.ts         # Client tracking code generator
│   │   └── openapi.ts         # Auto-generated OpenAPI spec
│   ├── tests/                 # Vitest test suite
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # API integration tests
│   │   └── e2e/               # End-to-end tests
│   ├── migrations/            # D1 database schema (numbered)
│   ├── scripts/               # Health checks, migration tools
│   └── wrangler.jsonc         # Cloudflare Worker config
├── frontend/                   # Dashboard UI (React/TypeScript)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-based page components
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Frontend utilities
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx            # React app root
│   │   └── main.tsx           # App entry point
│   ├── public/                # Static assets
│   └── dist/                  # Build output
├── infrastructure/             # IaC (OpenTofu/Terraform)
│   ├── main.tf                # Core resource definitions
│   ├── variables.tf           # Input variables
│   ├── outputs.tf             # Output values
│   └── providers.tf           # Cloudflare provider config
├── landing-page/              # Marketing site (Astro)
├── shopify-plugin/            # Shopify webhook proxy (Express)
├── seo-auditor/               # SEO tools and Universal SST
├── admin-dashboard/           # Internal admin tools (Vite/React)
├── docs/                      # Architecture, specs, guides
├── .kittify/specs/            # Feature specifications
├── tasks/                     # Kanban task tracking
├── wiki/                      # Project knowledge base
├── .worktrees/                # Git worktrees for features
└── .planning/                 # Planning and codebase docs
```

## Directory Purposes

**serverless/:**
- Purpose: Core API backend and business logic
- Contains: Hono REST API, platform integrations, database operations
- Key files: `src/index.ts` (API entry), `src/types.ts` (shared interfaces), `wrangler.jsonc` (Worker config)

**frontend/:**
- Purpose: User-facing dashboard for agencies
- Contains: React components, routing, API integration
- Key files: `src/App.tsx` (app root), `src/main.tsx` (entry point)

**infrastructure/:**
- Purpose: Cloud resource provisioning via IaC
- Contains: OpenTofu configuration for Cloudflare Workers, D1, KV
- Key files: `main.tf` (resources), `variables.tf` (configuration)

**migrations/:**
- Purpose: Database schema versioning
- Contains: Numbered SQL migration files for D1
- Key files: `0001_init.sql` (base schema), `0018_custom_events_definitions.sql` (events system)

## Key File Locations

**Entry Points:**
- `serverless/src/index.ts`: Hono API application entry point
- `frontend/src/main.tsx`: React application entry point
- `infrastructure/main.tf`: Infrastructure provisioning entry point

**Configuration:**
- `serverless/wrangler.jsonc`: Cloudflare Worker configuration
- `infrastructure/variables.tf`: Infrastructure variables
- `serverless/src/types.ts`: Global TypeScript interfaces

**Core Logic:**
- `serverless/src/routes/`: HTTP endpoint handlers
- `serverless/src/services/`: Business logic and platform integrations
- `serverless/src/database/`: Database query functions

**Testing:**
- `serverless/tests/`: Backend test suite (unit, integration, e2e)
- `frontend/src/tests/`: Frontend test suite

## Naming Conventions

**Files:**
- Route files: `platform.ts` (e.g., `shopify.ts`, `ghl.ts`)
- Service files: `functionality.ts` or `platform-conversions.ts`
- Migration files: `NNNN_description.sql` (4-digit padded numbers)
- Test files: `*.test.ts` or `*.test.tsx`

**Directories:**
- Plural names for collections (`routes/`, `services/`, `components/`)
- Lowercase with hyphens for multi-word (`landing-page/`, `seo-auditor/`)
- Hidden directories for tools (`.worktrees/`, `.kittify/`)

## Where to Add New Code

**New Feature:**
- Primary code: `serverless/src/services/[feature].ts`
- API endpoints: `serverless/src/routes/[feature].ts`
- Tests: `serverless/tests/unit/[feature].test.ts`, `serverless/tests/integration/[feature].test.ts`
- Frontend: `frontend/src/pages/[Feature]/`, `frontend/src/components/[Component]/`

**New Platform Integration:**
- Service module: `serverless/src/services/[platform]-conversions.ts`
- Webhook handler: `serverless/src/routes/[platform].ts`
- OAuth flow: `serverless/src/routes/oauth.ts` (add to existing)
- Database: `serverless/migrations/NNNN_[platform]_config.sql`

**New UI Component:**
- Implementation: `frontend/src/components/[Component]/`
- Stories/Tests: `frontend/src/components/[Component]/[Component].test.tsx`

**Utilities:**
- Backend helpers: `serverless/src/utils/[functionality].ts`
- Frontend helpers: `frontend/src/utils/[functionality].ts`

## Special Directories

**migrations/:**
- Purpose: Database schema versioning
- Generated: No (manually created SQL)
- Committed: Yes (tracked in git)

**tests/:**
- Purpose: Comprehensive test coverage
- Generated: No (manually written tests)
- Committed: Yes (all test files)

**.worktrees/:**
- Purpose: Git worktrees for parallel feature development
- Generated: Yes (via git worktree commands)
- Committed: No (git worktree metadata)

**dist/ (frontend):**
- Purpose: Build output for deployment
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Package dependencies
- Generated: Yes (via package manager)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-24*