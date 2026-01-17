# MIDDLEWARE KNOWLEDGE BASE

**Generated:** 2026-01-13
**Domain:** Request Processing & Security

## OVERVIEW
Auth and rate limiting middleware. Applied via Hono middleware chain.

## FILES
| File | Purpose |
|------|---------|
| `auth.ts` | JWT validation, HMAC webhook verification |
| `rate-limit.ts` | Multi-tier rate limiting (uses KV) |

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

## CONVENTIONS
- Middleware injects user/agency via `c.set()`
- Routes access via `c.get('user')`, `c.get('agency')`
- Fail closed on auth errors (401/403)
- Rate limits stored in KV namespace

## ANTI-PATTERNS
- Auth bypass logic
- Hardcoded rate limits (use config)
- Blocking on rate limit check (use KV)
