# System Architecture

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         E-commerce Platforms                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Shopify   │  │ WooCommerce │  │    GHL      │  │   Custom   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
└─────────┼────────────────┼────────────────┼───────────────┼─────────┘
          │                │                │               │
          │ Webhooks       │ Webhooks       │ Webhooks      │ JS Snippet
          ▼                ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AdsEngineer API (Cloudflare Workers)              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Routes Layer                            │    │
│  │  shopify.ts │ woocommerce.ts │ ghl.ts │ admin.ts │ billing.ts│    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│  ┌─────────────────────────▼───────────────────────────────────┐    │
│  │                    Services Layer                            │    │
│  │  google-ads.ts │ billing*.ts │ encryption.ts │ customer*.ts  │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                            │                                         │
│  ┌─────────────────────────▼───────────────────────────────────┐    │
│  │                    Database Layer (D1)                       │    │
│  │  agencies │ leads │ conversion_logs │ custom_events │ billing│    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
          │                                    │
          │ Conversion Upload                  │ Billing
          ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│     Ad Platforms    │              │       Stripe        │
│  Google │ Meta │ TT │              │  Subscriptions      │
└─────────────────────┘              └─────────────────────┘
```

## Architectural Pattern

**Layered Architecture** with clear separation:

1. **Routes Layer** (`src/routes/`)
   - HTTP endpoint handlers
   - Request validation (Zod schemas)
   - Response formatting
   - Delegates to services

2. **Services Layer** (`src/services/`)
   - Business logic
   - External API calls
   - Complex computations
   - Database operations

3. **Middleware Layer** (`src/middleware/`)
   - Authentication (JWT, HMAC)
   - Rate limiting
   - Logging
   - Development guards

4. **Database Layer** (`migrations/`)
   - D1 SQLite schema
   - Prepared statements only

## Data Flow

### Webhook Processing Flow
```
1. Platform sends webhook → Routes (validate signature)
2. Routes → Services (process event)
3. Services → Database (store lead/conversion)
4. Services → Ad Platform API (upload conversion)
5. Routes → Response (success/failure)
```

### Dashboard API Flow
```
1. Frontend sends request → Routes (validate JWT)
2. Routes → Middleware (auth, rate limit)
3. Routes → Services (business logic)
4. Services → Database (CRUD)
5. Routes → Response (JSON)
```

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Worker | `src/index.ts` | Main Hono app, route registration |
| Tracking Snippet | `src/snippet.ts` | Client-side JS generator |

## Key Abstractions

### Bindings (`src/types.ts`)
```typescript
type Bindings = {
  DB: D1Database;           // SQLite database
  RATE_LIMIT_KV: KVNamespace; // Rate limiting
  JWT_SECRET: string;       // Auth
  STRIPE_SECRET_KEY: string; // Billing
  // ... other secrets
};
```

### Auth Context (`src/middleware/auth.ts`)
```typescript
type AuthContext = {
  agencyId: string;
  userId: string;
  role: 'admin' | 'user';
};
```

## Multi-Tenancy

- **Agency-based isolation** - Each agency has separate data
- **Agency credentials** - Per-agency OAuth tokens for ad platforms
- **Subscription tiers** - Starter/Professional/Enterprise

## Error Handling Pattern

```typescript
// Standardized error response
return c.json({
  success: false,
  error: "Human-readable message",
  code: "MACHINE_CODE" // optional
}, 400);
```

## Security Layers

1. **CORS** - Whitelisted origins only
2. **HMAC Verification** - Webhook authenticity
3. **JWT Authentication** - Dashboard access
4. **Rate Limiting** - Per-IP and per-shop limits
5. **Encryption** - Credential storage encryption
6. **Prepared Statements** - SQL injection prevention

## Proposed Architecture: sGTM Hub

```
E-commerce → AdsEngineer → Customer's sGTM → GA4/Ads/Meta/TikTok
                 │
           sgtm-forwarder.ts
           (Measurement Protocol)
```

Strategic shift to use Server-Side GTM as unified integration hub instead of direct platform APIs. See `docs/sgtm-architecture-proposal.md`.
