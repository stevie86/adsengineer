# Server-Side GTM Architecture Proposal

**Created:** 2026-01-17
**Status:** Proposal
**Author:** AI Analysis
**Sources:** Google Tag Platform Documentation

---

## Executive Summary

Pivot from direct platform API integrations (Google Ads, Meta CAPI, TikTok) to **Server-Side Google Tag Manager (sGTM) as the single integration hub**. This simplifies maintenance, improves extensibility, and gives customers control over their tracking configuration via the standard GTM web interface.

**Key insight from docs:** sGTM uses a **Client** model - clients receive data, transform it into events, and tags process those events. We can send data to a customer's sGTM container, and their configured tags handle the rest.

---

## How Server-Side GTM Works

### Architecture (From Official Docs)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        User's Browser / Device                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  gtag.js / GTM Web Container                                        │ │
│  │  - Configured with: server_container_url: 'https://gtm.example.com' │ │
│  └───────────────────────────────┬─────────────────────────────────────┘ │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Server Container (Cloud Run / GCP)                     │
│                    URL: https://gtm.example.com                           │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                                                     │
│  │    CLIENTS      │  Receive HTTP requests, transform to events         │
│  │  - GA4 Client   │  (Pre-installed: GA4 Client)                        │
│  │  - MP Client    │  (Measurement Protocol Client for server-to-server) │
│  └────────┬────────┘                                                     │
│           │ Events                                                       │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │   TRIGGERS      │  Fire when event_name matches conditions            │
│  │  - purchase     │                                                     │
│  │  - add_to_cart  │                                                     │
│  └────────┬────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │     TAGS        │  Send data to destinations                          │
│  │  - GA4 Tag      │  → Google Analytics 4                               │
│  │  - Google Ads   │  → Google Ads Conversions                           │
│  │  - Meta CAPI    │  → Facebook Conversions API                         │
│  │  - TikTok       │  → TikTok Events API                                │
│  └─────────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Client** | Adapter that receives HTTP requests and transforms them into events. GA4 Client is pre-installed. |
| **Measurement Protocol Client** | For server-to-server data (our use case) |
| **Event** | Standardized data structure passed to triggers/tags |
| **Tag** | Sends event data to a destination (GA4, Google Ads, Meta, etc.) |
| **Trigger** | Fires tags based on event conditions |

---

## Two Integration Options

### Option A: Client-Side → sGTM (Standard)

Customer's website uses gtag.js configured to send to their sGTM container:

```javascript
gtag('config', 'G-XXXXXXX', {
  server_container_url: 'https://gtm.customer.com',
});
```

**Flow:**
```
Browser (gtag.js) → sGTM Container → GA4/Ads/Meta/TikTok
```

### Option B: Server-to-Server → sGTM (Our Use Case)

Our backend sends events directly to customer's sGTM container using **Measurement Protocol**:

```http
POST /collect HTTP/1.1
Host: gtm.customer.com
Content-Type: application/x-www-form-urlencoded

v=2&tid=G-XXXXXXX&cid=123.456&en=purchase&ep.transaction_id=ORD-123&ep.value=99.99&ep.currency=EUR
```

**Flow:**
```
WooCommerce → Our API → Customer's sGTM Container → GA4/Ads/Meta/TikTok
```

**Key:** Customer configures a **Measurement Protocol Client** in their sGTM to receive our server-to-server requests.

---

## Common Event Data Schema

From Google's official documentation - the event data structure sGTM expects:

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `client_id` | string | `123.456789` | Anonymously identifies user/device |
| `event_name` | string | `purchase` | Name of the event |
| `currency` | string | `EUR` | ISO 4217 currency code |
| `value` | number | `99.99` | Monetary value of event |
| `user_id` | string | `user_123` | Known user identifier |
| `page_location` | string | `https://shop.com/checkout` | Full page URL |
| `page_referrer` | string | `https://google.com` | Referrer URL |
| `ip_override` | string | `1.2.3.4` | User's IP address |
| `user_agent` | string | `Mozilla/5.0...` | Browser user agent |
| `user_data.email_address` | string | `foo@example.com` | User's email |
| `user_data.sha256_email_address` | string | (hashed) | Hashed email for privacy |
| `user_data.phone_number` | string | `+15551234567` | User's phone |
| `user_data.address.*` | object | `{city, region, postal_code, country}` | Address data |

---

## Implementation Plan

### Phase 1: sGTM Forwarder Service

**Location:** `serverless/src/services/sgtm-forwarder.ts`

```typescript
import { hashSHA256 } from './crypto';

interface SGTMConfig {
  container_url: string;      // e.g., https://gtm.customer.com
  measurement_id: string;     // G-XXXXXXX
  api_secret?: string;        // Optional for enhanced measurement
}

interface EventData {
  client_id: string;
  event_name: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
  user_data?: {
    email_address?: string;
    phone_number?: string;
    address?: {
      first_name?: string;
      last_name?: string;
      street?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
    };
  };
  page_location?: string;
  page_referrer?: string;
  ip_override?: string;
  user_agent?: string;
}

export class SGTMForwarder {
  constructor(private config: SGTMConfig) {}

  async sendEvent(event: EventData): Promise<{ success: boolean; error?: string }> {
    // Build Measurement Protocol payload
    const params = new URLSearchParams();
    params.append('v', '2');
    params.append('tid', this.config.measurement_id);
    params.append('cid', event.client_id);
    params.append('en', event.event_name);

    // Add event parameters with 'ep.' prefix (event parameter)
    if (event.currency) params.append('ep.currency', event.currency);
    if (event.value) params.append('epn.value', event.value.toString()); // epn = numeric
    if (event.transaction_id) params.append('ep.transaction_id', event.transaction_id);
    
    // Add user data with hashing
    if (event.user_data?.email_address) {
      params.append('ep.user_data.sha256_email_address', 
        await hashSHA256(event.user_data.email_address.toLowerCase().trim()));
    }

    // Add IP and user agent for geo/device attribution
    if (event.ip_override) params.append('ep.ip_override', event.ip_override);
    if (event.user_agent) params.append('ep.user_agent', event.user_agent);

    // Add items for e-commerce
    if (event.items) {
      params.append('ep.items', JSON.stringify(event.items));
    }

    try {
      const response = await fetch(`${this.config.container_url}/g/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPurchase(order: {
    order_id: string;
    total: number;
    currency: string;
    customer_email?: string;
    customer_ip?: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
  }): Promise<{ success: boolean }> {
    return this.sendEvent({
      client_id: this.generateClientId(),
      event_name: 'purchase',
      transaction_id: order.order_id,
      value: order.total,
      currency: order.currency,
      user_data: order.customer_email ? { email_address: order.customer_email } : undefined,
      ip_override: order.customer_ip,
      items: order.items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }

  private generateClientId(): string {
    // Generate GA4-compatible client_id
    const timestamp = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 2147483647);
    return `${random}.${timestamp}`;
  }
}
```

### Phase 2: Database Schema

**Location:** `serverless/migrations/0020_sgtm_config.sql`

```sql
-- Add sGTM configuration to agencies/sites
ALTER TABLE agencies ADD COLUMN sgtm_config TEXT;
-- JSON: {"container_url": "https://gtm.example.com", "measurement_id": "G-XXX"}

-- Add client tier/label support  
ALTER TABLE sites ADD COLUMN client_tier TEXT DEFAULT 'standard';
-- Values: 'internal', 'tier1', 'tier2', 'tier3', 'vip'

-- Index for quick lookups
CREATE INDEX idx_sites_client_tier ON sites(client_tier);
```

### Phase 3: Customer sGTM Setup

Customer needs to:

1. **Create Server Container** in GTM (tagmanager.google.com)
2. **Deploy to Cloud Run** (~$45/month for 2 instances)
3. **Configure Measurement Protocol Client:**
   - Go to Clients → New
   - Select "Measurement Protocol" client type
   - Set Activation Path to `/collect` or custom path
4. **Add Tags:**
   - GA4 Tag (auto-configured from events)
   - Google Ads Conversion Tag
   - Meta CAPI Tag (community template)
   - TikTok Events Tag (community template)

### Phase 4: WooCommerce Test Flow

For `stefan.mastersmarket.eu`:

```
1. WooCommerce order placed
   ↓
2. Our SST snippet captures purchase event (or webhook)
   ↓
3. Event sent to AdsEngineer API
   ↓
4. API looks up customer's sgtm_config
   ↓
5. SGTMForwarder.sendPurchase() → customer's sGTM
   ↓
6. sGTM Measurement Protocol Client receives event
   ↓
7. Trigger fires on event_name = 'purchase'
   ↓
8. Tags fire:
   - GA4 Tag → Google Analytics
   - Google Ads Tag → Conversion tracking
```

---

## Customer GUI Experience

**They keep full GTM access at tagmanager.google.com:**

| Feature | Available |
|---------|-----------|
| Create/edit tags | ✅ Yes |
| Create/edit triggers | ✅ Yes |
| Create/edit variables | ✅ Yes |
| Preview/debug mode | ✅ Yes |
| Version history | ✅ Yes |
| User permissions | ✅ Yes |
| Workspaces | ✅ Yes |

**What they see:**
- Server container alongside their web container
- Same tag/trigger/variable UI
- Preview debugger shows incoming events
- Full control over which platforms receive data

---

## Cost Comparison

### Current (Direct APIs)
| Item | Cost |
|------|------|
| Our development | 3+ services to maintain |
| API changes | We handle all updates |
| Customer setup | We configure everything |

### sGTM Approach
| Item | Cost |
|------|------|
| Customer Cloud Run | ~$45/month (2 instances minimum) |
| Our development | 1 service (sgtm-forwarder) |
| API changes | Tag vendors handle updates |
| Customer setup | They control their tags |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Customer doesn't have GCP | Provide setup guide or managed option |
| sGTM misconfigured | Validation endpoint + debug instructions |
| Extra cost for customers | ~$45/month is minimal vs. enterprise value |
| Learning curve | Templates + documentation |

---

## Next Steps

1. [ ] Build `sgtm-forwarder.ts` service
2. [ ] Create migration for `sgtm_config` and `client_tier` fields
3. [ ] Set up test sGTM container for `stefan.mastersmarket.eu`
4. [ ] Configure GA4 + Measurement Protocol Client
5. [ ] Test WooCommerce → sGTM → GA4 flow end-to-end
6. [ ] Document customer setup process

---

## References

- [Server-side tagging intro](https://developers.google.com/tag-platform/tag-manager/server-side/intro)
- [Send data to sGTM](https://developers.google.com/tag-platform/tag-manager/server-side/send-data)
- [Cloud Run setup guide](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide)
- [Common event data schema](https://developers.google.com/tag-platform/tag-manager/server-side/common-event-data)
- [Measurement Protocol client](https://developers.google.com/tag-platform/tag-manager/server-side/send-data#server-to-server-apps)
