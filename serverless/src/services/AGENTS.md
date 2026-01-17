# SERVICES KNOWLEDGE BASE

**Generated:** 2026-01-13
**Domain:** Business Logic Layer

## OVERVIEW
Core business logic. **MODULAR platform architecture** - each ad platform is a separate service module.

## STRUCTURE
```
services/
├── # PLATFORM MODULES (modular - each platform separate)
├── google-ads.ts           # Google Ads Offline Conversions API
├── meta-conversions.ts     # Meta/Facebook Conversions API (CAPI)
├── tiktok-conversions.ts   # TikTok Events API
├── conversion-router.ts    # Routes conversions to correct platform
│
├── # CORE SERVICES
├── encryption.ts           # AES-256-GCM credential encryption
├── jwt.ts                  # JWT token generation/validation
├── oauth-storage.ts        # Encrypted OAuth token storage
├── crypto.ts               # Crypto utilities
├── sgtm-forwarder.ts       # Server-Side GTM Measurement Protocol forwarder
│
├── # ANALYTICS & SCORING
├── lead-scoring.ts         # Lead qualification scoring
├── customer-scoring.ts     # Customer value scoring
├── confidence-scorer.ts    # Attribution confidence
├── advanced-analytics.ts   # Analytics aggregation
│
├── # DETECTION & ANALYSIS
├── technology-detector.ts  # Tech stack detection
├── tech-stack-analyzer.ts  # Detailed tech analysis
├── ecommerce-analysis.ts   # E-commerce platform analysis
├── waste-detector.ts       # Ad spend waste detection
├── competitive-analysis.ts # Competitor analysis
│
├── # CRM & OUTREACH
├── customer-crm.ts         # Customer relationship management
├── customer-portal.ts      # Portal service layer
├── outreach-orchestration.ts # Multi-channel outreach
├── email-sequence-generator.ts # Email campaigns
├── linkedin-sales-navigator.ts # LinkedIn integration
│
├── # OTHER
├── api-monitor.ts          # Health checks
├── logging.ts              # Structured logging
├── market-research.ts      # Market analysis
└── adsengineer-onboarding.ts # Customer onboarding flow
```

## MODULAR PLATFORM DESIGN

### Adding a New Ad Platform
1. Create `services/{platform}-conversions.ts`
2. Implement interface: `{ uploadConversions(data): Promise<Result> }`
3. Add to `conversion-router.ts` routing logic
4. Add config field to agencies table (migration)
5. Add OAuth flow in `routes/oauth.ts`

### Platform Module Pattern
```typescript
// Each platform module follows this pattern:
export interface {Platform}ConversionData {
  click_id?: string;      // Platform-specific click ID
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  user_data?: { email?: string; phone?: string };
}

export class {Platform}ConversionsAPI {
  constructor(accessToken: string, ...platformSpecificParams) {}
  
  async uploadConversions(conversions: {Platform}ConversionData[]): Promise<Result> {
    // Platform-specific API call
  }
  
  async validateCredentials(): Promise<boolean> {
    // Credential validation
  }
}
```

### Click ID Routing
| Platform | Click ID | Config Field |
|----------|----------|--------------|
| Google Ads | `gclid` | `google_ads_config` |
| Meta/Facebook | `fbclid` | `meta_config` |
| TikTok | `ttclid` | `tiktok_config` |

## sGTM FORWARDER

Single integration hub using Server-Side GTM as destination for all platforms.

### Usage
```typescript
import { createSGTMForwarder } from './services/sgtm-forwarder';

const forwarder = createSGTMForwarder({
  container_url: 'https://gtm.customer.com',
  measurement_id: 'G-XXXXXXX',
  api_secret: 'optional',
});

await forwarder.sendPurchase({
  order_id: 'ORD-123',
  total: 99.99,
  currency: 'USD',
  customer_email: 'user@example.com',
  items: [{ id: 'SKU-1', name: 'Product', price: 99.99, quantity: 1 }],
});
```

### Available Methods
| Method | Event Name | Use Case |
|--------|------------|----------|
| `sendEvent()` | Custom | Generic event |
| `sendPurchase()` | `purchase` | Order completion |
| `sendAddToCart()` | `add_to_cart` | Cart additions |
| `sendBeginCheckout()` | `begin_checkout` | Checkout start |
| `sendLead()` | `generate_lead` | Form submissions |

## CONVENTIONS
- **Platform modules:** Stateless classes with async methods
- **Error handling:** Throw typed errors, catch in router
- **Credentials:** Always encrypted in DB, decrypt at runtime
- **Hashing:** PII (email, phone) SHA-256 hashed before sending

## ANTI-PATTERNS
- Direct platform API calls from routes (use services)
- Unencrypted credential storage
- Synchronous network calls
- Missing error handling on external APIs
- Hardcoded API versions (use class properties)
