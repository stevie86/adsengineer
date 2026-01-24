# sGTM Multi-Tenant Architecture: Final Analysis

**Date:** 2026-01-17
**Conclusion:** Yes, we can run ONE sGTM on Cloud Run for ALL customers

---

## The Constraint You Identified

You're right:
- **GA4/Ads APIs are not pure server-to-server** - they require sGTM as gateway
- **We cannot eliminate Cloud Run** - Google requires their infrastructure
- **We must forward the charge** - customers need sGTM, we provide it

---

## The Solution: Multi-Tenant sGTM

We run **ONE sGTM container** on Cloud Run that serves **ALL customers**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AdsEngineer                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐         ┌──────────────────────────────────────────┐  │
│  │ Cloudflare      │         │  Our sGTM (Cloud Run)                    │  │
│  │ Workers         │────────▶│  Multi-tenant, single container          │  │
│  │                 │         │                                          │  │
│  │ Event Router    │         │  Receives events with customer context   │  │
│  └─────────────────┘         │  Routes to correct GA4/Ads/Meta based    │  │
│                              │  on Measurement ID in request            │  │
│                              └──────────────────────────────────────────┘  │
│                                              │                              │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                 ┌─────────────────────────────┼─────────────────────────────┐
                 │                             │                             │
                 ▼                             ▼                             ▼
          ┌──────────┐                  ┌──────────┐                  ┌──────────┐
          │Customer A│                  │Customer B│                  │Customer C│
          │GA4 Prop  │                  │GA4 Prop  │                  │GA4 Prop  │
          │G-AAAAA   │                  │G-BBBBB   │                  │G-CCCCC   │
          └──────────┘                  └──────────┘                  └──────────┘
```

---

## How Multi-Tenant Routing Works

### Key Insight from Simo Ahava's Research

sGTM supports **dynamic Measurement ID** - you can override the destination per-request:

> "You just need to create multiple GA4 tags in server-side Google Tag Manager, and override the **Measurement ID** for each tag."

Even better - sGTM **automatically fetches** the correct GA4 configuration (Key Events, consent settings, etc.) based on the overridden Measurement ID.

### Implementation

**Step 1: We send events with customer's Measurement ID**

```http
POST https://sgtm.adsengineer.cloud/g/collect
Content-Type: application/x-www-form-urlencoded

v=2
&tid=G-CUSTOMER123          ← Customer's Measurement ID
&cid=123.456
&en=purchase
&ep.transaction_id=ORD-123
&epn.value=99.99
&ep.currency=USD
```

**Step 2: sGTM Client parses the request**

The GA4 Client in sGTM reads `tid` (Measurement ID) and creates an event.

**Step 3: sGTM Tag routes to correct destination**

The GA4 Tag uses the `tid` from the incoming event to send to the correct GA4 property.

---

## sGTM Container Configuration

### Option A: Single GA4 Tag (Simplest)

One GA4 tag that uses a variable for Measurement ID:

```
Tag: GA4 Event
├── Measurement ID: {{Event Data - tid}}  ← Dynamic from incoming request
├── Event Name: {{Event Name}}
└── Event Parameters: {{Event Data}}
```

This single tag handles ALL customers because the `tid` changes per request.

### Option B: Lookup Table (More Control)

If we need to add customer-specific logic:

```
Variable: Customer Measurement ID
├── Input: {{Event Data - _ae_customer_id}}
├── Lookup Table:
│   ├── customer-123 → G-AAAAA
│   ├── customer-456 → G-BBBBB
│   └── customer-789 → G-CCCCC
└── Default: {{Event Data - tid}}
```

---

## What About Google Ads / Meta / TikTok?

### Google Ads Conversions

Same approach - send customer's Conversion ID with the event:

```http
ep._ae_ads_customer_id=123-456-7890
ep._ae_ads_conversion_action=purchase
ep._ae_ads_conversion_label=ABC123
```

sGTM Google Ads Tag uses these variables.

### Meta CAPI / TikTok

Create custom tags in sGTM that read customer credentials from event parameters:

```http
ep._ae_meta_pixel_id=123456789
ep._ae_meta_access_token=xxxxx
```

Or use Community Templates from sGTM Gallery.

---

## Architecture Summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         Customer's E-commerce Site                         │
│                    (WooCommerce, Shopify, Custom)                          │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │ Webhook (order created)
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     AdsEngineer API (Cloudflare Workers)                   │
│                                                                            │
│  1. Receive webhook                                                        │
│  2. Look up customer config (GA4 ID, Ads ID, Meta token, etc.)            │
│  3. Build event with customer's credentials embedded                       │
│  4. Forward to OUR sGTM                                                    │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │ HTTP POST with credentials in params
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    AdsEngineer sGTM (Google Cloud Run)                     │
│                         https://sgtm.adsengineer.cloud                     │
│                                                                            │
│  Clients:                                                                  │
│  ├── GA4 Client (receives Measurement Protocol requests)                   │
│  └── Custom HTTP Client (for other formats)                                │
│                                                                            │
│  Tags:                                                                     │
│  ├── GA4 Tag (dynamic Measurement ID from event)                           │
│  ├── Google Ads Conversion Tag (dynamic Customer ID from event)            │
│  ├── Meta CAPI Tag (dynamic Pixel ID + Token from event)                   │
│  └── TikTok Events Tag (dynamic Pixel Code from event)                     │
│                                                                            │
│  Triggers:                                                                 │
│  ├── All Events (fires all tags)                                           │
│  └── Or specific: purchase, add_to_cart, lead, etc.                        │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
    ┌──────────┐           ┌──────────┐           ┌──────────┐
    │   GA4    │           │Google Ads│           │   Meta   │
    │(Customer │           │(Customer │           │(Customer │
    │Property) │           │Account)  │           │Pixel)    │
    └──────────┘           └──────────┘           └──────────┘
```

---

## Cost Analysis

| Component | Cost | Who Pays |
|-----------|------|----------|
| Cloudflare Workers | ~$5/mo (included in plan) | Us |
| Cloud Run (sGTM) | ~$45-100/mo (depends on traffic) | Us |
| **Total** | ~$50-105/mo | **Us** |

**Business Model Options:**
1. Include in subscription price
2. Usage-based pricing (per event)
3. Tiered pricing (Starter: 10K events, Pro: 100K events, etc.)

---

## Implementation Steps

### Phase 1: Deploy Our sGTM Container

1. Create Server container at `tagmanager.google.com`
2. Deploy to Cloud Run (automated via GTM)
3. Configure custom domain: `sgtm.adsengineer.cloud`
4. Add SSL certificate

### Phase 2: Configure sGTM Tags

1. **GA4 Client** - Default, receives Measurement Protocol
2. **GA4 Tag** - Use `{{Event Data - tid}}` for dynamic Measurement ID
3. **Google Ads Tag** - Use event params for Customer ID, Conversion Action
4. **Meta CAPI Tag** - Community template + event params
5. **TikTok Tag** - Community template + event params

### Phase 3: Update Workers Code

1. Rename `sgtm-forwarder.ts` (keep it - sends to OUR sGTM)
2. Update to include customer credentials in event params
3. Add endpoint to receive customer's platform credentials
4. Store credentials in DB (encrypted)

### Phase 4: Customer Onboarding

Customer provides ONCE:
- GA4 Measurement ID + API Secret
- Google Ads Customer ID + Conversion Action
- Meta Pixel ID + Access Token  
- TikTok Pixel Code + Access Token

We store, we forward, we handle everything.

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Single entrypoint** | One sGTM serves all customers |
| **Customer simplicity** | Just provide credentials once |
| **We control infra** | No customer Cloud Run needed |
| **Unified billing** | We pay Cloud Run, charge customers |
| **GTM ecosystem** | Use community templates, transformations |
| **Future-proof** | New platforms = new tag in sGTM |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cloud Run cost at scale | Monitor usage, implement tiered pricing |
| sGTM container limits | Scale Cloud Run instances (auto-scaling) |
| Credential security | Encrypt in DB, never log tokens |
| Google changes sGTM | We control the container, can adapt |

---

## Next Steps

1. **Create sGTM container** in GTM (takes 5 minutes)
2. **Deploy to Cloud Run** via GTM auto-provisioning
3. **Configure tags** for multi-tenant routing
4. **Update Workers** to send to our sGTM
5. **Test end-to-end** with your test site

Want me to proceed with implementation?
