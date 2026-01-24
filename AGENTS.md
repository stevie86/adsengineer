# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-19
**Branch:** main

## OVERVIEW
AdsEngineer: Enterprise conversion tracking SaaS (Google/Meta/TikTok/Shopify). Server-side tracking with closed-loop attribution.

**Stack:** TypeScript, Hono, Cloudflare Workers, D1, Stripe
**Infra:** OpenTofu (IaC), Doppler (Secrets)
**Package Manager:** pnpm@10.27.0
**Security:** Enterprise (HMAC, Encrypted creds, Rate limiting, JWT)

## STRUCTURE
```
./
├── serverless/           # Core API (Hono/Workers) - SEE serverless/AGENTS.md
│   ├── src/routes/      # Endpoints (18 files)
│   ├── src/services/    # Logic (29 files)
│   ├── src/middleware/  # Auth (2 files)
│   ├── migrations/      # D1 schema (10 files)
│   └── tests/           # Vitest (Unit/Integration/E2E)
├── infrastructure/       # IaC (OpenTofu) - SEE infrastructure/AGENTS.md
├── frontend/             # Dashboard UI (React) - SEE frontend/AGENTS.md
├── landing-page/         # Marketing (Astro) - SEE landing-page/AGENTS.md
├── docs/                 # Architecture/Specs - SEE docs/AGENTS.md
├── seo-auditor/          # SEO tools + Universal SST - SEE seo-auditor/AGENTS.md
├── shopify-plugin/       # Shopify webhook proxy (Express) - SEE shopify-plugin/AGENTS.md
├── admin-dashboard/      # Internal admin UI (Vite/React) - WIP
├── wiki/                 # Project Wiki & Knowledge Base
├── tasks/                # Kanban task tracking (planned/doing/done/for_review)
└── inspiration/          # Reference implementations (read-only) - SEE inspiration/AGENTS.md
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API Dev | `serverless/` | `pnpm dev` (port 8090) |
| Infra | `infrastructure/` | `tofu apply` |
| DB Schema | `serverless/migrations/` | D1 SQL, numbered |
| Auth Logic | `serverless/src/middleware/` | JWT + HMAC |
| Billing | `serverless/src/services/billing*.ts` | Stripe integration |
| Google Ads | `serverless/src/services/google-ads.ts` | Conversion upload |
| Frontend UI | `frontend/` | React + Tailwind |
| Landing Page | `landing-page/` | Astro + Tailwind |
| SEO/SST | `seo-auditor/` | Universal tracking snippet |
| Docs | `docs/` | Strategy, specs, playbooks |
| Admin UI | `admin-dashboard/` | Internal tools (WIP) |

## CONVENTIONS
- **Package Manager:** `pnpm` ONLY. No `npm`/`yarn`.
- **Secrets:** `Doppler` ONLY. No `.env` files in git.
- **Linting:** 
  - Backend (`serverless`): `BiomeJS` (Strict)
  - Frontend (`frontend`): ESLint + Prettier (Legacy)
- **Type Safety:** Strict TypeScript. `noExplicitAny: warn`, `noVar: error`.
- **Formatting:** 2 spaces, single quotes, trailing commas (es5), semicolons.
- **Testing:** Vitest for all packages. Coverage required.
- **API Pattern:** Routes → Services → Database. Never DB in routes.

## COMMANDS
```bash
# Dev (serverless)
cd serverless && doppler run -- pnpm dev

# Dev (landing-page)
cd landing-page && pnpm dev --host

# Test
cd serverless && pnpm test
cd serverless && pnpm test:integration

# Lint/Format
cd serverless && pnpm lint:fix && pnpm format

# Deploy
cd serverless && pnpm deploy
cd infrastructure && tofu apply
cd landing-page && pnpm build && wrangler pages deploy dist/
```

## EXTERNAL INTEGRATIONS
| Platform | Integration Point | Auth |
|----------|-------------------|------|
| Google Ads | `services/google-ads.ts` | OAuth2 + refresh token |
| Stripe | `routes/billing.ts`, `services/billing*.ts` | API key + webhooks |
| Shopify | `routes/shopify.ts`, `shopify-plugin/` | HMAC signature |
| GoHighLevel | `routes/ghl.ts` | Webhook signature |

## SERVER-SIDE GTM ARCHITECTURE (PROPOSED)
**Status:** Proposed pivot - see `docs/sgtm-architecture-proposal.md`

Strategic shift: Use **Server-Side GTM (sGTM)** as single integration hub instead of direct platform APIs.

### Architecture
```
WooCommerce/Shopify → AdsEngineer API → Customer's sGTM → GA4/Ads/Meta/TikTok
                           │
                    sgtm-forwarder.ts
                    (Measurement Protocol)
```

## AI SKILLS (OpenCode Compatible)
Skills provide focused guidance for specific tasks:
```
serverless/.opencode/skill/
├── google-ads/SKILL.md      # Google Ads integration guide
├── meta-conversions/SKILL.md # Meta CAPI integration guide
├── tiktok-conversions/SKILL.md # TikTok Events API guide
└── add-platform/SKILL.md    # Guide for adding new platforms
```

## ANTI-PATTERNS
- Committing secrets (Use Doppler)
- Direct `node_modules` modification
- Bypassing Biome/ESLint rules
- Leaving worktrees unmerged/unremoved
- Hardcoded external API keys
- Database queries in route handlers
- Synchronous operations in workers
