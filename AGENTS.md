# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-17
**Commit:** f15987d
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
├── tasks/                # Kanban task tracking (planned/doing/done/for_review)
└── inspiration/          # Reference implementations (read-only)
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

## CONVENTIONS
- **Package Manager:** `pnpm` ONLY. No `npm`/`yarn`.
- **Secrets:** `Doppler` ONLY. No `.env` files in git.
- **Linting:** `BiomeJS` (replaces ESLint/Prettier). Run `pnpm lint:fix`.
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

## WORKTREE MANAGEMENT
```bash
git worktree list                              # List all
git worktree remove .worktrees/<feature>       # Remove after merge
git worktree remove --force .worktrees/<name>  # Force if build artifacts
git worktree prune                             # Clean up stale
```

## EXTERNAL INTEGRATIONS
| Platform | Integration Point | Auth |
|----------|-------------------|------|
| Google Ads | `services/google-ads.ts` | OAuth2 + refresh token |
| Stripe | `routes/billing.ts`, `services/billing*.ts` | API key + webhooks |
| Shopify | `routes/shopify.ts`, `shopify-plugin/` | HMAC signature |
| GoHighLevel | `routes/ghl.ts` | Webhook signature |

## POTENTIAL INTEGRATIONS
- **GTM API for LLMs** ([paolobietolini/gtm-api-for-llms](https://github.com/paolobietolini/gtm-api-for-llms)): Structured GTM API docs for AI. Could enable automated tag/trigger management for customers.

## SERVER-SIDE GTM ARCHITECTURE (PROPOSED)
**Status:** Proposed pivot - see `docs/sgtm-architecture-proposal.md`

Strategic shift: Use **Server-Side GTM (sGTM)** as single integration hub instead of direct platform APIs.

### sGTM vs Google Tag Gateway

| Feature | Google Tag Gateway | Server-Side GTM |
|---------|-------------------|-----------------|
| **Purpose** | Proxy scripts from YOUR domain | Process events on YOUR server |
| **What it does** | First-party script serving | Tag/trigger/variable processing |
| **Runs on** | CDN/Load balancer | Cloud Run (~$45/mo) |
| **Our integration** | N/A (client-side) | **Server-to-server events** |

**Key insight:** Gateway is complementary (client-side), sGTM is our focus (server-side).

### Architecture
```
WooCommerce/Shopify → AdsEngineer API → Customer's sGTM → GA4/Ads/Meta/TikTok
                           │
                    sgtm-forwarder.ts
                    (Measurement Protocol)
```

### Benefits
- 1 service to maintain (vs 3+ platform APIs)
- Customer controls tags in GTM GUI
- Tag vendors handle API versioning
- Self-service debugging via sGTM Preview

### Key Docs
- `docs/sgtm-architecture-proposal.md` - Full technical proposal
- `docs/sgtm-vs-gateway.md` - Comparison explanation

## MODULAR PLATFORM ARCHITECTURE
Ad platforms are **modular** - each is a separate service module:

| Platform | Service | Click ID | Config Field |
|----------|---------|----------|--------------|
| Google Ads | `google-ads.ts` | `gclid` | `google_ads_config` |
| Meta/Facebook | `meta-conversions.ts` | `fbclid` | `meta_config` |
| TikTok | `tiktok-conversions.ts` | `ttclid` | `tiktok_config` |

**Adding new platform?** See `serverless/.opencode/skill/add-platform/SKILL.md`

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
- Bypassing Biome rules (`@ts-ignore`, `as any`)
- Leaving worktrees unmerged/unremoved
- Hardcoded external API keys
- Missing validation middleware (use Zod)
- Database queries in route handlers (use services)
- Empty catch blocks
- Synchronous operations in workers