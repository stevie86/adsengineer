# SOURCE CODE KNOWLEDGE BASE

**Generated:** 2026-01-05
**Domain:** Core API Logic (TypeScript/Hono)

## OVERVIEW
Main TypeScript implementation of AdsEngineer API with routes, services, middleware, and tracking.

## STRUCTURE
```
src/
├── index.ts           # Hono app setup
├── types.ts           # Shared interfaces
├── openapi.ts         # API schema (11k lines)
├── snippet.ts         # Tracking code generation
├── routes/            # API endpoints (13 files)
├── services/          # Business logic (10 files)
├── middleware/        # Request processing (2 files)
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