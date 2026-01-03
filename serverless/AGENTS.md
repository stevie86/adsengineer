# SERVERLESS COMPONENT

Cloudflare Worker providing conversion tracking API.

## STRUCTURE
```
serverless/
├── src/
│   ├── routes/         # API endpoints (Hono)
│   ├── services/       # Business logic (Singleton)
│   ├── middleware/     # Auth/validation
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
| API routes | src/routes/ | Hono handlers |
| Database | src/database/ | D1 query functions |
| Auth | src/middleware/ | JWT validation |
| Tests | tests/ | Vitest |

## CONVENTIONS
- **Framework:** Hono (Routing)
- **Validation:** Zod (API inputs)
- **Testing:** Vitest (Unit + Integration)

## ANTI-PATTERNS
- Database queries in routes (Use services)
- Synchronous operations in workers
