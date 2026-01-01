# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-01
**Commit:** HEAD
**Branch:** main

## OVERVIEW
AdsEngineer: Cloudflare Worker providing conversion tracking for GoHighLevel agencies. Handles multi-step funnels, lead value scoring, failure alerts.

**Stack:** TypeScript, Hono, Cloudflare Workers, D1
**Package Manager:** pnpm@10.27.0

## STRUCTURE
```
./
├── serverless/     # Cloudflare Worker (20+ TS files)
├── docs/          # Strategy docs (23+ MD files)
├── wp-content/    # WordPress themes/plugins
└── AGENTS.md      # Root knowledge base
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Cloudflare Worker dev | serverless/ | pnpm dev, wrangler deploy |
| API docs | docs/ | Strategy, architecture docs |
| WordPress themes | wp-content/themes/ | TwentyTwentyFive, etc. |
| Deployment | .github/workflows/ | CI/CD pipelines |

## CODE MAP
No LSP available - project <10 files threshold.

## CONVENTIONS
- pnpm@10.27.0 pinned in package.json
- serverless/ uses Hono framework
- TypeScript strict mode
- Cloudflare Workers runtime

## ANTI-PATTERNS (THIS PROJECT)
- No direct node_modules manipulation
- No npm/yarn commands (pnpm only)
- No untyped JavaScript files

## UNIQUE STYLES
- Conversion tracking with GCLID persistence
- Multi-step funnel handling
- Google Ads offline conversions

## COMMANDS
```bash
cd serverless
pnpm install
pnpm dev              # Local dev
pnpm deploy           # Deploy
pnpm types:check      # TypeScript check
```

## NOTES
- D1 Database: advocate-db
- Worker: advocate-cloud
- URL: https://advocate-cloud.adsengineer.workers.dev
