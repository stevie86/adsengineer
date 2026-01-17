# SERVERLESS KNOWLEDGE BASE

**Generated:** 2026-01-13
**Domain:** Core API (Hono/Cloudflare Workers)

## OVERVIEW
Enterprise conversion tracking API. Handles webhooks (Shopify, GHL), billing (Stripe), Google Ads conversion upload, custom events.

## STRUCTURE
```
serverless/
├── src/
│   ├── routes/         # API endpoints (14 files) - SEE src/routes/AGENTS.md
│   ├── services/       # Business logic (28 files) - SEE src/services/AGENTS.md
│   ├── middleware/     # Auth/rate-limit (2 files) - SEE src/middleware/AGENTS.md
│   ├── database/       # D1 queries
│   ├── workers/        # Background jobs
│   ├── index.ts        # Hono app entry
│   ├── types.ts        # Shared interfaces
│   ├── openapi.ts      # OpenAPI schema (auto-generated)
│   └── snippet.ts      # Client-side tracking code
├── tests/
│   ├── unit/           # Service/utility tests
│   ├── integration/    # API endpoint tests
│   └── e2e/            # End-to-end flows
├── migrations/         # D1 schema (numbered: 0001_*.sql)
├── scripts/            # Health checks, migration tools
└── wrangler.jsonc      # Cloudflare config (JSONC format)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add endpoint | `src/routes/` | Create file, register in index.ts |
| Add business logic | `src/services/` | Export functions, import in routes |
| Add DB table | `migrations/` | New numbered file, `wrangler d1 migrations apply` |
| Add webhook handler | `src/routes/shopify.ts`, `ghl.ts` | HMAC validation required |
| Add billing logic | `src/services/billing*.ts` | Stripe SDK integration |
| Add tests | `tests/unit/`, `tests/integration/` | Follow existing patterns |

## CONVENTIONS
- **Framework:** Hono v4 + @hono/zod-openapi for typed routes
- **Validation:** Zod schemas on all inputs. Define in route file.
- **Testing:** Vitest. `pnpm test` (unit), `pnpm test:integration`
- **Database:** D1 with prepared statements. NEVER raw SQL interpolation.
- **Auth:** JWT for dashboard, HMAC for webhooks
- **Secrets:** All via Cloudflare secrets. Access via `c.env.SECRET_NAME`
- **Errors:** Return `{ success: false, error: "message" }` with appropriate HTTP status

## KEY FILES
| File | Purpose |
|------|---------|
| `src/index.ts` | Hono app, route registration, CORS |
| `src/types.ts` | Bindings interface (D1, KV, secrets) |
| `wrangler.jsonc` | Worker config, D1 binding, environments |
| `biome.json` | Linting rules (strict TS) |

## COMMANDS
```bash
pnpm dev                    # Local dev (port 8090)
pnpm test                   # Unit tests
pnpm test:integration       # Integration tests
pnpm lint:fix               # Fix lint issues
pnpm deploy                 # Deploy to production
pnpm deploy:staging         # Deploy to staging
```

## ANTI-PATTERNS
- DB queries in routes → Use services layer
- Sync operations → All async/await
- Raw SQL interpolation → Prepared statements only
- Missing Zod validation → All inputs validated
- `as any`, `@ts-ignore` → Fix types properly
- Hardcoded secrets → Use `c.env`
