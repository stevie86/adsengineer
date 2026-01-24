# MIDDLEWARE KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** Request Processing & Security

## OVERVIEW
Auth and rate limiting middleware. Applied via Hono middleware chain.

## FILES
| File | Purpose |
|------|---------|
| `auth.ts` | JWT validation, HMAC webhook verification |
| `rate-limit.ts` | Multi-tier rate limiting (uses KV) |
| `dev-guard.ts` | Environment-based access control for non-production |

## USAGE PATTERN
```typescript
import { jwtAuth, hmacAuth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';

// JWT protected route
app.use('/api/v1/*', jwtAuth());

// Webhook with HMAC validation
app.post('/webhook', hmacAuth('X-Signature'), handler);

// Rate limited endpoint
app.use('/api/v1/*', rateLimit({ tier: 'standard' }));
```

## AUTH TYPES
| Type | Use Case | Header |
|------|----------|--------|
| JWT | Dashboard API | `Authorization: Bearer <token>` |
| HMAC | Webhooks (Shopify, GHL) | Platform-specific signature header |
| API Key | Admin operations | `X-Admin-Token` |

## DEV GUARD MIDDLEWARE

Blocks unauthenticated requests in non-production (dev/staging) environments.

| Path Type | Behavior |
|-----------|----------|
| Public (`/health`, `/snippet.js`, `/waitlist`) | Always allowed |
| Webhooks (`/shopify/webhook`, `/ghl/webhook`) | Allowed (HMAC auth) |
| All other paths | Requires `Authorization: Bearer` header |

Production environment passes through (route-level auth handles it).

```typescript
import { devGuardMiddleware, devLoggingMiddleware } from './middleware/dev-guard';

app.use('*', devLoggingMiddleware());  // Optional request logging
app.use('*', devGuardMiddleware());    // Access control
```

## CONVENTIONS
- Middleware injects user/agency via `c.set()`
- Routes access via `c.get('user')`, `c.get('agency')`
- Fail closed on auth errors (401/403)
- Rate limits stored in KV namespace

## ANTI-PATTERNS
- Auth bypass logic
- Hardcoded rate limits (use config)
- Blocking on rate limit check (use KV)
