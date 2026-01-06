# SERVERLESS KNOWLEDGE BASE

**Generated:** 2026-01-05
**Domain:** Core API (Hono/Cloudflare Workers)

## OVERVIEW
Enterprise conversion tracking API built with Hono framework on Cloudflare Workers.

## STRUCTURE
```
serverless/
├── src/
│   ├── routes/         # API endpoints (13 files)
│   ├── services/       # Business logic (10 files)
│   ├── middleware/     # Auth/validation (2 files)
│   ├── database/       # D1 queries
│   ├── workers/        # Background jobs
│   ├── openapi.ts      # API documentation
│   └── snippet.ts      # Tracking code
├── tests/              # Vitest (Unit/Integration)
├── migrations/         # D1 schema
└── wrangler.jsonc      # Cloudflare config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API Endpoints | src/routes/ | 13 route files, Hono handlers |
| Business Logic | src/services/ | 10 service files, core integrations |
| Database | src/database/ | D1 query functions |
| Auth | src/middleware/ | JWT validation, HMAC guards |
| Tests | tests/ | Vitest, unit/integration |
| Schema | migrations/ | D1 SQL migrations |
| Local Dev | `pnpm dev` | Wrangler local server |

## CONVENTIONS
- **Framework:** Hono (Routing) + TypeScript (strict)
- **Validation:** Zod (API inputs)
- **Testing:** Vitest (Unit + Integration)
- **Database:** D1 with prepared statements
- **Auth:** JWT + HMAC webhook validation
- **Deployment:** `pnpm deploy` to Cloudflare Workers

## ANTI-PATTERNS (SERVERLESS)
- Database queries in routes (Use services)
- Synchronous operations in workers
- Missing validation middleware
- Direct D1 queries without prepared statements
- Unhandled async errors in routes
- Hardcoded external API keys
