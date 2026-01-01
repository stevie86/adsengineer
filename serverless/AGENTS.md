# SERVERLESS COMPONENT

Cloudflare Worker providing conversion tracking API.

## STRUCTURE
```
serverless/
├── src/                 # TypeScript source (15 files)
│   ├── routes/         # API endpoints (6 files)
│   ├── services/       # Business logic (2 files)
│   ├── middleware/     # Auth/validation (1 file)
│   ├── database/       # D1 queries (1 file)
│   ├── workers/        # Background jobs (1 file)
│   ├── index.ts        # Hono app entry
│   ├── types.ts        # TypeScript definitions
│   ├── openapi.ts      # API documentation
│   └── snippet.ts      # Tracking code
├── tests/              # Unit/integration tests
├── migrations/         # D1 schema changes
├── scripts/            # Deployment utilities
├── package.json        # Dependencies & scripts
└── wrangler.jsonc      # Cloudflare config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API routes | src/routes/ | Hono route handlers |
| Database | src/database/ | D1 query functions |
| Auth | src/middleware/ | JWT/signature validation |
| Tests | tests/ | Vitest test files |

## CONVENTIONS
- Hono framework for routing
- Zod for API validation
- TypeScript strict mode
- Wrangler for deployment

## ANTI-PATTERNS
- No direct database queries in routes
- No environment variables in source code
- No synchronous operations in workers