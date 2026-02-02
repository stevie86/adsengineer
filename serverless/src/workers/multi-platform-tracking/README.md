# Multi-Platform Tracking Worker - Phase 1

## Architecture Overview

### Adapter Pattern Implementation

```
Platform Webhooks (Shopify, Custom)
    ↓
Adapters (shopify.ts, general.ts)
    ↓ Convert to
StandardEvent (single contract)
    ↓    ↓
Router → Facebook CAPI Service
```

### Key Design Principle

**Separation of Concerns:**

- **Router (`src/index.ts`)**: Never sees platform-specific data. Only works with `StandardEvent`.
- **Adapters (`src/adapters/`)**: Handle all platform-specific transformation logic.
- **CAPI Service (`src/services/facebook.ts`)**: Only knows `StandardEvent`, never platform internals.

### Contract: StandardEvent

```typescript
interface StandardEvent {
  eventName: string;
  userData: {
    email?: string;
    phone?: string;
    ip?: string;
    fbp?: string;
    fbc?: string;
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

## API Endpoints

### POST `/webhooks/shopify`

**Flow:**
1. Shopify webhook payload received
2. `shopifyAdapter()` converts → `StandardEvent`
3. `sendToFacebookCAPI()` processes
4. Response includes transformed `StandardEvent`

**Example Request:**
```json
{
  "topic": "orders/create",
  "customer": {
    "email": "test@example.com"
  },
  "total_price": "99.99",
  "currency": "USD"
}
```

**Example Response:**
```json
{
  "success": true,
  "platform": "shopify",
  "standardEvent": {
    "eventName": "purchase",
    "userData": {
      "email": "test@example.com"
    },
    "customData": {
      "value": 99.99,
      "currency": "USD"
    }
  }
}
```

### POST `/track/general`

**Flow:**
1. `StandardEvent` payload received (already formatted)
2. `generalAdapter()` validates and passes through
3. `sendToFacebookCAPI()` processes

**Example Request:**
```json
{
  "eventName": "custom_event",
  "userData": {
    "fbp": "fbp-123"
  },
  "customData": {
    "value": 50.0,
    "currency": "EUR"
  }
}
```

## File Structure

```
src/
├── types.ts                 # StandardEvent contract
├── adapters/
│   ├── shopify.ts          # Shopify webhook → StandardEvent
│   └── general.ts          # Pass-through for pre-formatted data
├── services/
│   └── facebook.ts         # Mock CAPI (logs to stdout for Phase 1)
├── index.ts                # Hono router (only sees StandardEvent)
└── test-validation.ts     # Validation tests
```

## Type Safety Guarantees

1. **Router isolation**: Router imports `StandardEvent` but no platform-specific types
2. **Adapter contracts**: All adapters return `AdapterResult<StandardEvent>`
3. **Service contracts**: CAPI service only accepts `StandardEvent`

## Phase 1 Testing

Run validation tests:
```bash
npx tsx src/workers/multi-platform-tracking/test-validation.ts
```

Tests validate:
- ✓ Shopify adapter maps fields correctly
- ✓ General adapter passes data through
- ✓ Error handling graceful degradation
- ✓ Router sees no platform-specific data
- ✓ Mock CAPI logs to stdout

## Safety Protocol Compliance

**Don't mix logic:**
- ✅ Shopify logic is inside `shopifyAdapter` only
- ✅ Router calls adapters but never knows Shopify field names
- ✅ CAPI service doesn't know about Shopify or WooCommerce

**Strict typing:**
- ✅ Router works with `StandardEvent` type only
- ✅ Cannot access `totalPrice` or `lineItems` in router
- ✅ Platform specifics isolated in adapter files

## Next Steps (Beyond Phase 1)

**Phase 2: Real CAPI Integration**
- Replace `sendToFacebookCAPI()` mock with actual Facebook API calls
- Add authentication headers
- Handle CAPI errors and rate limits

**Phase 3: More Platforms**
- Add `woocommerce.ts` adapter
- Add `custom-data-layer.ts` adapter (for dataLayer reading)

**Phase 4: Validation**
- Add Zod schemas for each platform's webhook format
- Validate webhooks in router before calling adapters

## Usage Example

```typescript
// Custom client using general endpoint
fetch('/track/general', {
  method: 'POST',
  body: JSON.stringify({
    eventName: 'custom_event',
    userData: { email: 'user@example.com' },
    customData: { value: 99.99, currency: 'USD' }
  })
});

// Shopify webhook handler
await fetch('/webhooks/shopify', {
  method: 'POST',
  body: JSON.stringify(shopifyWebhookPayload)
});
```

---

*Phase 1 Complete: February 1, 2026*