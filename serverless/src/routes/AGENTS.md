# ROUTES KNOWLEDGE BASE

**Generated:** 2026-01-05
**Domain:** API Endpoints (Hono Routes)

## OVERVIEW
All HTTP API endpoints implementing AdsEngineer functionality with proper authentication and validation.

## STRUCTURE
```
routes/
├── ghl.ts              # GoHighLevel webhooks
├── shopify.ts          # Shopify webhooks
├── leads.ts            # Lead management
├── admin.ts            # Admin ops
└── billing.ts          # Stripe integration
```

## WHERE TO LOOK
| Endpoint Type | Location | Notes |
|---------------|----------|-------|
| Webhook receivers | `ghl.ts`, `shopify.ts` | External integrations |
| Lead management | `leads.ts` | CRUD operations |
| Admin operations | `admin.ts` | Agency management |
| Billing | `billing.ts` | Stripe webhooks |

## CONVENTIONS
- **Scope:** One file per domain
- **Pattern:** Hono router instances
- **Validation:** Zod schemas on all inputs
- **Error handling:** Consistent JSON format

## ANTI-PATTERNS (ROUTES)
- Business logic in routes (Delegate to services)
- Direct DB access from routes
- Unprotected admin endpoints
- Missing input validation
