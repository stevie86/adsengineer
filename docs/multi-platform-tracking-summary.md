# Multi-Platform Server-Side Tracking - Summary

## What We Built

**Implementation:** Modular Cloudflare Worker for server-side event tracking using the **Adapter Pattern**.

**Core Concept:** Accepts webhooks from different platforms (Shopify, WooCommerce, Custom), normalizes them into a single `StandardEvent` format, and sends to Facebook CAPI.

## Architecture

### Adapter Pattern

```
Platform Webhooks
    ↓
Adapters (shopify, general, future platforms)
    ↓ Transform to
StandardEvent (single contract)
    ↓
Hono Router → Facebook CAPI Service
```

### Key Design Principle

**Separation of Concerns:**

| Component | Responsibility | Platform Knowledge |
|-----------|---------------|-------------------|
| **Router** (`src/index.ts`) | Route requests to adapters | **None** - only sees `StandardEvent` |
| **Adapters** (`src/adapters/`) | Platform-specific transformation | **Full** - knows platform internals |
| **CAPI Service** (`src/services/`) | Send events to Facebook | **None** - only sees `StandardEvent` |

## The Contract: StandardEvent

```typescript
interface StandardEvent {
  eventName: string;              // purchase, lead, add_to_cart
  userData: {
    email?: string;
    phone?: string;
    ip?: string;
    fbp?: string;                 // Facebook browser cookie
    fbc?: string;                 // Facebook click id
  };
  customData: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
  };
  timestamp?: number;
}
```

**Why this matters:** All code (router, CAPI) depends only on this interface. Adding a new platform means creating a new adapter - no changes to router or CAPI service.

## API Endpoints

### `/webhooks/shopify` (POST)

Handles Shopify webhooks:

**Flow:**
```
Shopify webhook → shopifyAdapter → StandardEvent → Facebook CAPI
```

**Example:**
```json
{
  "topic": "orders/create",
  "customer": { "email": "user@example.com" },
  "total_price": "99.99",
  "currency": "USD"
}
```

**Becomes:**
```json
{
  "eventName": "purchase",
  "userData": { "email": "user@example.com" },
  "customData": { "value": 99.99, "currency": "USD" }
}
```

### `/track/general` (POST)

Pass-through endpoint for pre-formatted data:

**Flow:**
```
StandardEvent → generalAdapter (validation) → StandardEvent → Facebook CAPI
```

**For:** Custom clients who format data correctly upfront.

## File Structure

```
src/
├── types.ts                 # StandardEvent interface
├── adapters/
│   ├── shopify.ts          # Shopify webhook → StandardEvent
│   └── general.ts          # Pass-through adapter
├── services/
│   └── facebook.ts         # Mock CAPI (logs to stdout)
├── index.ts                # Hono router
└── test-validation.ts     # Tests
```

## Type Safety Guarantees

### Router Isolation
Router imports `StandardEvent` but never platform-specific types. TypeScript prevents accessing `total_price`, `line_items`, etc. - only StandardEvent fields.

### Adapter Contracts
All adapters return `AdapterResult<StandardEvent>`:

```typescript
interface AdapterResult<T> {
  success: boolean;
  event?: StandardEvent;
  error?: string;
  originalRequest?: T;
}
```

### Service Contracts
CAPI service only accepts `StandardEvent`. Cannot know about Shopify or WooCommerce structures.

## Validation Tests

Run: `npx tsx src/workers/multi-platform-tracking/test-validation.ts`

Tests validate:
- ✓ Shopify adapter maps webhook fields correctly
- ✓ General adapter passes data through
- ✓ Error handling graceful degradation
- ✓ Router sees no platform-specific data
- ✓ Mock CAPI logs to stdout

## Safety Protocol Compliance

**Don't mix logic:**
- ✅ Shopify logic isolated in `shopifyAdapter`
- ✅ Router never sees Shopify field names
- ✅ Platform specifics hidden behind adapters

**Strict typing:**
- ✅ Router only works with `StandardEvent` type
- ✅ Cannot access platform-specific fields in router
- ✅ Adapter types enforce standard return contract

## Extension Strategy

### Add a New Platform

**Create adapter:**
1. Create `src/adapters/{platform}.ts`
2. Import `StandardEvent` from `../types`
3. Implement: `platformAdapter(payload): AdapterResult`
4. Map platform fields → `StandardEvent` fields
5. Return `{ success: true, event: StandardEvent, originalRequest }`

**Add route:**
1. In `src/index.ts`: `app.post('/webhooks/{platform}')`
2. Call adapter with webhook payload
3. Handle success/error responses

**No changes needed:**
- ✅ Router structure
- ✅ CAPI service
- ✅ StandardEvent contract

## Phase 1 Status

**Completed:**
- ✅ Adapter pattern implemented
- ✅ Shopify adapter working
- ✅ General adapter (pass-through) working
- ✅ Router enforces separation of concerns
- ✅ Mock CAPI service (logs to stdout)
- ✅ Type safety validated
- ✅ All tests passing

**Phase 2:**
- Replace mock CAPI with real Facebook API calls
- Add authentication headers
- Handle CAPI errors and rate limits

**Phase 3:**
- Add WooCommerce adapter
- Add dataLayer reading adapter
- Add Zod validation schemas

## Comparison with Previous Implementation

### What Changed

**GTM Parser Approach:**
- Reads GTM export JSON
- Extracts variable definitions with dataLayer paths
- Generates config.json per customer
- Universal Engine loads configs at runtime

**Adapter Pattern Approach:**
- Accepts webhook payloads directly
- Platform adapters normalize to StandardEvent
- Router/CAPI never see platform specifics
- Mock CAPI for development, easy to swap for real

### Why Adapter Pattern

1. **Simpler deployment** - No GTM export file parsing
2. **Platform-agnostic** - Works with any webhook format
3. **Type-safe** - TypeScript guarantees interfaces match
4. **Extensible** - Add platforms via adapters, no core changes

### Relationship

Both approaches can coexist:
- **GTM Parser:** For customers using GTM with custom dataLayers
- **Adapter Pattern:** For platform webhooks (Shopify, WooCommerce)

## How to Test

```bash
# Run validation tests
cd serverless
npx tsx src/workers/multi-platform-tracking/test-validation.ts

# Expected output:
# Test 1: Shopify Adapter ✓
# Test 2: General Adapter ✓
# Test 3: Error Handling ✓
# Test 4: Type Safety ✓
```

## Next Steps

1. **Deploy worker** to Cloudflare
2. **Test with real Shopify webhook**
3. **Replace mock CAPI** with real Facebook API
4. **Add WooCommerce adapter**
5. **Add Zod validation** for webhooks

---

**Location:** `/home/webadmin/coding/ads-engineer/serverless/src/workers/multi-platform-tracking/`

**Date:** February 1, 2026

**Status:** Phase 1 Complete ✓