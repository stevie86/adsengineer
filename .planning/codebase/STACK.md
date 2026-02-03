# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- **TypeScript** - Used across all packages (ES2022 target)
- **JavaScript** - Used in Shopify plugin (Express.js, Node.js 18+)

**Secondary:**
- **SQL** - D1 database migrations and queries
- **CSS/Tailwind** - Styling (frontend, landing-page)

## Runtime & Platform

**Core Runtime:**
- **Cloudflare Workers** - Serverless execution environment
  - Compatibility date: 2024-08-20
  - Compatibility flags: `nodejs_compat`
  - Live URL: `https://adsengineer-cloud.adsengineer.workers.dev`

**Package Manager:**
- **pnpm** v10.27.0 (specified in packageManager field)
- Lockfile: pnpm-lock.yaml present

## Frameworks

**Backend:**
- **Hono** v4.11.3 - Lightweight web framework for Workers
  - OpenAPI support: `@hono/zod-openapi` v0.18.4
  - Swagger UI: `@hono/swagger-ui` v0.5.3
  - Files: `serverless/src/index.ts`, `serverless/src/routes/*.ts`

**Frontend:**
- **React** v18.3.1 - Dashboard UI
  - React Router v7.11.0 for navigation
  - Files: `frontend/src/App.tsx`, `frontend/src/pages/*.tsx`

**Landing Page:**
- **Astro** v5.16.9 - Static site generator
  - Tailwind integration: `@astrojs/tailwind` v6.0.2
  - Output: static
  - Files: `landing-page/src/pages/*.astro`

**Shopify Plugin:**
- **Express** v4.18.0 - Minimal webhook proxy
  - Node.js v18.0.0+ required
  - Files: `shopify-plugin/index.js`

**Admin Dashboard:**
- **React Admin** v5.13.5 - Internal admin interface
  - API Platform admin: `@api-platform/admin` v4.0.8
  - Files: `admin-dashboard/src/App.jsx`

## Testing

**Framework:**
- **Vitest** v4.0.16 - Test runner (all packages)
  - Coverage: `@vitest/coverage-v8` v4.0.16
  - UI: `@vitest/ui` v4.0.16

**Additional Testing:**
- **Playwright** v1.40.0 - E2E testing
- **Faker** v8.4.1 - Test data generation
- **jsdom** v27.4.0 - Frontend testing environment

**Test Commands:**
```bash
cd serverless && pnpm test           # Unit tests
cd serverless && pnpm test:integration  # Integration tests
cd serverless && pnpm test:e2e       # E2E tests
cd serverless && pnpm test:coverage  # Coverage report
```

## Linting & Formatting

**Backend (serverless):**
- **Biome** v2.3.10 - Strict linting and formatting
  - Configuration: `serverless/biome.json`
  - 2 spaces, single quotes, trailing commas (es5)
  - Semicolons always, line width 100
  - TypeScript rules: `noExplicitAny: warn`, `noVar: error`

**Frontend (frontend):**
- **ESLint** v8.55.0 + **Prettier** v3.7.4 (legacy setup)
  - Configuration: `frontend/eslint.config.js`, `frontend/.prettierrc`
  - React hooks and refresh plugins

## Key Dependencies

**Core API:**
- `google-ads-api` v21.0.1 - Google Ads API integration
- `stripe` v14.25.0 - Payment processing
- `zod` v3.25.76 - Schema validation
- `@paralleldrive/cuid2` v3.0.6 - ID generation
- `@noble/hashes` v1.4.0 - Cryptographic hashing
- `fflate` v0.8.2 - Compression

**Frontend:**
- `@stripe/react-stripe-js` v2.4.0 - Stripe UI components
- `@stripe/stripe-js` v3.0.0 - Stripe client
- `@headlessui/react` v1.7.17 - UI components
- `@heroicons/react` v2.0.18 - Icons
- `lucide-react` v0.294.0 - Additional icons
- `axios` v1.6.0 - HTTP client

**Infrastructure:**
- `wrangler` v4.59.1 - Cloudflare Workers CLI
- `@cloudflare/workers-types` v4.20260101.0 - Type definitions
- OpenTofu (infrastructure/) - IaC

## Configuration Files

**TypeScript:**
- `serverless/tsconfig.json` - ES2022, bundler module resolution
- `frontend/tsconfig.json` - React + DOM types
- `admin-dashboard/tsconfig.json` - React + DOM types

**Build/Dev:**
- `serverless/wrangler.jsonc` - Worker config, D1 binding, environments
- `frontend/vite.config.ts` - Vite + React plugin, proxy to port 8090
- `landing-page/astro.config.mjs` - Static output + Tailwind
- `admin-dashboard/vite.config.js` - Vite + React

## Data Storage

**Primary Database:**
- **Cloudflare D1** - SQLite-compatible edge database
  - Database name: `adsengineer-db`
  - ID: `d262a6f7-a378-45d9-9a74-5f4264304bc6`
  - Binding: `DB`
  - Migrations: `serverless/migrations/*.sql`

**Key-Value Store:**
- **Cloudflare KV** (commented out in config)
  - Namespace: `RATE_LIMIT_KV` (planned for rate limiting)

## Secrets Management

**Doppler** - Centralized secrets management
- Configs: dev, staging, production
- Access: `doppler run -- <command>`
- Template: `doppler-secrets.template`
- Setup: `setup-doppler.sh`

**Critical Secrets:**
- `JWT_SECRET` - API authentication
- `STRIPE_SECRET_KEY` - Payment processing
- `CLOUDFLARE_API_TOKEN` - Infrastructure deployment
- `ENCRYPTION_KEY` - Credential encryption (32 bytes AES-256)
- `GHL_WEBHOOK_SECRET` - GoHighLevel webhook verification

## Platform Requirements

**Development:**
- Node.js 18+
- pnpm 10.27.0
- Doppler CLI
- Wrangler CLI

**Production:**
- Cloudflare Workers (Edge)
- Cloudflare D1
- Custom domain: `api.adsengineer.cloud`

---

*Stack analysis: 2026-02-03*
