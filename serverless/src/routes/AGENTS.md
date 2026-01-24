# ROUTES KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** API Endpoints (Hono Routes)

## OVERVIEW
HTTP API endpoints. Routes validate input, call services, return JSON.

## STRUCTURE
```
routes/
├── index.ts              # Route registration (imports all routers)
│
├── # WEBHOOKS (HMAC validated)
├── shopify.ts            # Shopify order/customer webhooks
├── ghl.ts                # GoHighLevel CRM webhooks
├── tiktok.ts             # TikTok Events API webhooks
│
├── # OAUTH (Platform connections)
├── oauth.ts              # Google, Meta, TikTok OAuth flows
│
├── # CORE API (JWT protected)
├── leads.ts              # Lead CRUD
├── custom-events.ts      # Custom event tracking
├── custom-event-definitions.ts  # Event type definitions
├── analytics.ts          # Reporting/dashboards
│
├── # BILLING (Stripe)
├── billing.ts            # Subscriptions, webhooks, portal
│
├── # PUBLIC
├── tracking.ts           # Tracking snippet delivery
├── waitlist.ts           # Landing page signups
├── status.ts             # Health check
│
├── # ADMIN
├── admin.ts              # Agency management
├── onboarding.ts         # Customer onboarding
├── evaluate.ts           # Prospect evaluation
└── gdpr.ts               # Data deletion requests
```

## WHERE TO LOOK
| Task | File | Auth |
|------|------|------|
| Add Shopify webhook | `shopify.ts` | HMAC signature |
| Add GHL webhook | `ghl.ts` | HMAC signature |
| Add TikTok webhook | `tiktok.ts` | HMAC signature |
| Connect Google Ads | `oauth.ts` | OAuth2 |
| Connect Meta | `oauth.ts` | OAuth2 |
| Connect TikTok | `oauth.ts` | OAuth2 |
| Stripe billing | `billing.ts` | Webhook signature |
| Custom events | `custom-events.ts` | JWT |
| Site setup + sGTM config | `onboarding.ts` | None (public) |

## SITE SETUP ENDPOINTS

Configure customer sites with tracking and sGTM:

```
POST /api/v1/onboarding/site-setup
  Body: { customer_id, website, sgtm_container_url?, measurement_id?, client_tier? }
  Returns: tracking snippet, webhook URLs, sGTM/GA4 setup instructions

GET /api/v1/onboarding/site-setup/:customerId
  Returns: current site configuration (website, sgtm_config, client_tier)
```

## ROUTE PATTERN
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();

const InputSchema = z.object({
  field: z.string(),
});

router.post('/endpoint', zValidator('json', InputSchema), async (c) => {
  const data = c.req.valid('json');
  // Call service, NOT direct DB
  const result = await myService(c.env.DB, data);
  return c.json({ success: true, data: result });
});

export { router as myRouter };
```

## CONVENTIONS
- **One domain per file.** Export named router.
- **Zod validation** on all inputs
- **Services layer** for business logic
- **Consistent response:** `{ success: boolean, data?: any, error?: string }`

## ANTI-PATTERNS
- Business logic in routes → Use services
- Direct DB queries → Use services
- Missing Zod validation
- Unprotected admin endpoints
