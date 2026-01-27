# Directory Structure

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Root Structure

```
ads-engineer/
├── serverless/           # Core API (Hono/Cloudflare Workers) ★
├── frontend/             # Dashboard UI (React/Vite)
├── landing-page/         # Marketing site (Astro)
├── infrastructure/       # IaC (OpenTofu)
├── shopify-plugin/       # Shopify webhook proxy (Express)
├── admin-dashboard/      # Internal admin UI (WIP)
├── seo-auditor/          # SEO tools + Universal SST
├── docs/                 # Architecture & specs
├── wiki/                 # Project knowledge base
├── tasks/                # Kanban task tracking
├── inspiration/          # Reference implementations (read-only)
├── .planning/            # GSD planning documents
├── .worktrees/           # Git worktrees for features
├── AGENTS.md             # Root knowledge base
└── README.md             # Project overview
```

## Core API (`serverless/`)

```
serverless/
├── src/
│   ├── index.ts          # ★ Hono app entry, route registration
│   ├── types.ts          # ★ Bindings interface (D1, KV, secrets)
│   ├── openapi.ts        # Generated OpenAPI spec (DO NOT EDIT)
│   ├── snippet.ts        # Client-side tracking snippet
│   │
│   ├── routes/           # API Endpoints (18 files)
│   │   ├── admin.ts      # Admin operations
│   │   ├── billing.ts    # Stripe billing
│   │   ├── custom-events.ts      # Event tracking
│   │   ├── custom-event-definitions.ts # Event config
│   │   ├── gdpr.ts       # Privacy compliance
│   │   ├── ghl.ts        # GoHighLevel webhooks
│   │   ├── gtm.ts        # GTM integration
│   │   ├── leads.ts      # Lead management
│   │   ├── oauth.ts      # Google OAuth
│   │   ├── onboarding.ts # Agency onboarding
│   │   ├── shopify.ts    # Shopify webhooks
│   │   ├── status.ts     # System status
│   │   ├── tiktok.ts     # TikTok events
│   │   └── woocommerce.ts # WooCommerce webhooks
│   │
│   ├── services/         # Business Logic (29 files)
│   │   ├── adsengineer-onboarding.ts # Main onboarding flow
│   │   ├── billing*.ts   # Stripe operations
│   │   ├── customer-*.ts # CRM features
│   │   ├── encryption.ts # Credential encryption
│   │   ├── event-normalizer.ts # Platform event normalization
│   │   ├── ga4-measurement.ts  # GA4 Measurement Protocol
│   │   └── google-ads.ts # Conversion upload
│   │
│   ├── middleware/       # Request Processing
│   │   ├── auth.ts       # JWT authentication
│   │   ├── dev-guard.ts  # Development mode guards
│   │   └── rate-limit.ts # Rate limiting
│   │
│   ├── database/         # D1 query functions
│   └── workers/          # Background jobs
│
├── tests/                # Vitest Test Suite
│   ├── unit/             # Service/utility tests (24 files)
│   ├── integration/      # API endpoint tests (8 files)
│   ├── e2e/              # End-to-end flows (2 files)
│   └── utils/            # Test helpers
│
├── migrations/           # D1 Schema (15 files)
│   ├── 0001_init.sql     # Base tables
│   ├── 0018_custom_events_definitions.sql
│   ├── 0019_billing_system.sql
│   └── 0020_sgtm_config.sql
│
├── scripts/              # Maintenance scripts
├── wrangler.jsonc        # ★ CF Workers config
├── biome.json            # ★ Linting config
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Frontend Dashboard (`frontend/`)

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-based pages
│   ├── services/         # API service layer
│   └── types/            # TypeScript definitions
├── public/               # Static assets
├── index.html            # Entry point
├── vite.config.ts        # Build config
├── tailwind.config.js    # Tailwind config
└── package.json
```

## Landing Page (`landing-page/`)

```
landing-page/
├── src/
│   ├── components/       # Astro/UI components
│   ├── pages/            # Route-based pages
│   ├── layouts/          # Page templates
│   └── content/          # Markdown content
├── public/               # Static assets
├── astro.config.mjs      # Astro config
├── wrangler.toml         # CF Pages config
└── package.json
```

## Infrastructure (`infrastructure/`)

```
infrastructure/
├── main.tf               # Cloudflare resources
├── variables.tf          # Environment config
├── outputs.tf            # Deployment outputs
├── providers.tf          # Provider config
└── AGENTS.md             # IaC knowledge base
```

## Key File Locations

| Task | Primary File |
|------|--------------|
| Add new API endpoint | `serverless/src/routes/{domain}.ts` |
| Add business logic | `serverless/src/services/{domain}.ts` |
| Add database table | `serverless/migrations/NNNN_{name}.sql` |
| Add auth logic | `serverless/src/middleware/auth.ts` |
| Add frontend page | `frontend/src/pages/{name}.tsx` |
| Add frontend component | `frontend/src/components/{name}.tsx` |
| Modify infrastructure | `infrastructure/main.tf` |

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Routes | `{domain}.ts` | `billing.ts`, `shopify.ts` |
| Services | `{domain}.ts` or `{domain}-{feature}.ts` | `google-ads.ts`, `customer-crm.ts` |
| Migrations | `NNNN_{description}.sql` | `0019_billing_system.sql` |
| Tests | `{module}.test.ts` | `billing-system.test.ts` |
| Components | `{Name}.tsx` | `Dashboard.tsx` |

## Worktrees (Feature Branches)

```
.worktrees/
├── 002-self-service-dashboard-mvp/   # Dashboard feature
└── feat-marketing-launch-pack/       # Marketing feature
```

Active worktrees for parallel feature development. Each contains full project copy.
