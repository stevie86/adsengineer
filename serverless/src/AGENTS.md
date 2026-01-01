# SOURCE CODE MODULE

TypeScript implementation of AdsEngineer API.

## STRUCTURE
```
src/
├── index.ts           # Hono app setup
├── types.ts           # Shared interfaces
├── openapi.ts         # API schema (11k lines)
├── snippet.ts         # Tracking code generation
├── routes/            # API endpoints (6 files)
├── services/          # Business logic (2 files)
├── middleware/        # Request processing
├── database/          # D1 interactions
└── workers/           # Background processing
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Route handlers | routes/ | Hono route definitions |
| Business logic | services/ | API implementations |
| Data access | database/ | D1 queries/writes |
| Background jobs | workers/ | Offline conversions |

## CONVENTIONS
- One route per file
- Service layer for logic
- Middleware for cross-cutting concerns
- Environment-agnostic code

## ANTI-PATTERNS
- No route logic in index.ts
- No database calls in routes
- No hardcoded secrets