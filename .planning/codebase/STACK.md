# Technology Stack

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Languages & Runtime

| Component | Language | Runtime |
|-----------|----------|---------|
| Core API | TypeScript 5.x | Cloudflare Workers |
| Frontend Dashboard | TypeScript/React 18 | Vite (browser) |
| Landing Page | TypeScript/Astro 5 | Cloudflare Pages |
| Shopify Plugin | JavaScript/Express | Node.js |
| Infrastructure | HCL | OpenTofu |

## Frameworks

### Backend (`serverless/`)
- **Hono v4** - Edge-native web framework
- **@hono/zod-openapi** - OpenAPI + validation
- **Zod** - Schema validation
- **Stripe SDK v14** - Payment processing
- **google-ads-api v21** - Conversion upload

### Frontend (`frontend/`)
- **React 18** with TypeScript
- **React Router v7** - Routing
- **Tailwind CSS v3** - Styling
- **Axios** - HTTP client
- **@stripe/react-stripe-js** - Payment UI

### Landing Page (`landing-page/`)
- **Astro 5** - Static site generator
- **Tailwind CSS** - Styling

## Database & Storage

| Service | Type | Purpose |
|---------|------|---------|
| Cloudflare D1 | SQLite | Primary database |
| Cloudflare KV | Key-Value | Rate limiting, sessions |

## Package Management

- **pnpm v10.27.0** - Package manager (enforced via `packageManager` field)
- **npm** - Used only in `shopify-plugin/`

## Build & Dev Tools

| Tool | Purpose | Location |
|------|---------|----------|
| Wrangler | CF Workers CLI | `serverless/` |
| Vite | Frontend bundler | `frontend/` |
| Vitest | Testing framework | All packages |
| BiomeJS | Linting/formatting | `serverless/` |
| ESLint + Prettier | Linting/formatting | `frontend/` |

## Key Dependencies

### Production
```
hono@4.11.3           # Web framework
stripe@14.25.0        # Payment processing
google-ads-api@21.0.1 # Google Ads integration
zod@3.25.76           # Schema validation
@noble/hashes@1.4.0   # Cryptography (HMAC)
```

### Development
```
vitest@4.0.16         # Testing
typescript@5.9.3      # Type checking
@biomejs/biome@2.3.10 # Linting (backend)
wrangler@4.59.1       # CF Workers CLI
playwright@1.40.0     # E2E testing
```

## Configuration Files

| File | Purpose |
|------|---------|
| `serverless/wrangler.jsonc` | CF Workers config, D1 binding |
| `serverless/biome.json` | Linting rules (strict TS) |
| `serverless/tsconfig.json` | TypeScript config |
| `frontend/.eslintrc.json` | ESLint config |
| `infrastructure/*.tf` | OpenTofu IaC |

## Secrets Management

- **Doppler** - Secrets injection at runtime
- **Cloudflare Secrets** - Worker environment variables
- No `.env` files committed

## Deployment Targets

| Package | Target | URL |
|---------|--------|-----|
| `serverless/` | Cloudflare Workers | `adsengineer-cloud.adsengineer.workers.dev` |
| `frontend/` | Cloudflare Pages | TBD |
| `landing-page/` | Cloudflare Pages | `adsengineer.com` |
| `infrastructure/` | Cloudflare (via OpenTofu) | N/A |
