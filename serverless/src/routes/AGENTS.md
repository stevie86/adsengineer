# API ROUTES MODULE

Hono route handlers.

## STRUCTURE
```
routes/
├── ghl.ts              # GoHighLevel webhooks
├── shopify.ts          # Shopify webhooks
├── leads.ts            # Lead management
├── admin.ts            # Admin ops
└── billing.ts          # Stripe integration
```

## CONVENTIONS
- **Scope:** One file per domain
- **Pattern:** Hono router instances
- **Validation:** Zod schemas

## ANTI-PATTERNS
- Business logic in routes (Delegate to services)
- Direct DB access
- Unprotected admin endpoints
