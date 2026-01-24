# sGTM on Cloudflare Workers: Analysis & Recommendation

**Date:** 2026-01-17
**Question:** Can we avoid Cloud Run and run everything on Cloudflare Workers?

---

## TL;DR

**No, we cannot run Google's sGTM Docker container on Cloudflare Workers.** 

But we have **two better options**:

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **A. Cloudflare Zaraz** | Cloudflare's native server-side tag manager | ✅ Best option |
| **B. Direct API Integration** | We send directly to GA4/Ads/Meta APIs | ✅ Already built |

---

## Why sGTM Docker Can't Run on Workers

Google's sGTM is:
- A **Node.js server** inside a **Docker container**
- Requires **persistent server** (not serverless)
- Needs **preview server** (exactly 1 instance, no autoscaling)
- Designed for **Cloud Run / App Engine / VM**

Cloudflare Workers:
- **Serverless** (stateless, ephemeral)
- **No Docker support**
- **No Node.js runtime** (V8 isolates only)
- Max execution time: **30 seconds** (paid), **10ms CPU** (free)

**Conclusion:** Architecturally incompatible. Cannot port sGTM to Workers.

---

## Option A: Cloudflare Zaraz (Recommended)

### What is Zaraz?

Cloudflare acquired Zaraz in 2021. It's a **server-side tag manager built on Workers** - exactly what we need.

### How Zaraz Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Browser   │────▶│ Cloudflare Edge  │────▶│  GA4 / Ads /    │
│  (minimal JS)   │     │ (Zaraz Worker)   │     │  Meta / TikTok  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Instead of:
- Browser loads GTM → GTM loads analytics.js → analytics.js sends to GA4

Zaraz does:
- Browser sends minimal event to Zaraz → Zaraz (on edge) sends to GA4/Ads/Meta

### Zaraz Benefits

| Feature | sGTM (Cloud Run) | Zaraz (Workers) |
|---------|------------------|-----------------|
| Infrastructure | Customer manages | Cloudflare manages |
| Cost | ~$45/month per customer | Included in CF plan |
| Setup | Complex (Docker, DNS, SSL) | 1-click in dashboard |
| Latency | Single region | Global edge |
| Maintenance | Customer updates Docker | Auto-updated |

### Zaraz Supports

- ✅ Google Analytics 4
- ✅ Google Ads Conversions
- ✅ Meta/Facebook Pixel
- ✅ TikTok Pixel
- ✅ LinkedIn Insight Tag
- ✅ 50+ other tools
- ✅ Custom HTTP endpoints

### How We'd Use Zaraz

**Option A1: Customer uses Zaraz directly**
- Customer enables Zaraz in their Cloudflare dashboard
- We provide configuration instructions
- Customer's site → Zaraz → GA4/Ads/Meta

**Option A2: We integrate with Zaraz API**
- We send events to customer's Zaraz endpoint
- Zaraz handles forwarding to all platforms

```
WooCommerce → AdsEngineer API → Customer's Zaraz → GA4/Ads/Meta/TikTok
```

### Zaraz Limitation

⚠️ **Requires customer to use Cloudflare** for their domain.

If customer doesn't use Cloudflare, they can't use Zaraz.

---

## Option B: Direct API Integration (Current Implementation)

### What We Already Built

Our `sgtm-forwarder.ts` sends directly to GA4 Measurement Protocol:

```
WooCommerce → AdsEngineer API → GA4 Measurement Protocol
                             → Meta Conversions API
                             → TikTok Events API
                             → Google Ads API
```

### This Works Without sGTM

We don't actually need sGTM or Zaraz. We can send directly to each platform's server-side API:

| Platform | Server-Side API | We Support? |
|----------|-----------------|-------------|
| GA4 | Measurement Protocol | ✅ Built |
| Google Ads | Offline Conversions API | ✅ Built |
| Meta | Conversions API (CAPI) | ✅ Built |
| TikTok | Events API | ✅ Built |

### Direct API Benefits

- **Zero customer setup** - they just give us credentials
- **Full control** - we manage everything
- **Runs on our Workers** - no external infrastructure
- **Works for any customer** - no Cloudflare requirement

### Direct API Drawbacks

- We maintain 4+ platform integrations
- API changes require our updates
- Customer can't customize tag logic

---

## Recommendation

### Primary Path: Direct API Integration

We already have this built. Customer provides:
1. GA4 Measurement ID + API Secret
2. Google Ads Customer ID + Conversion Action
3. Meta Pixel ID + Access Token
4. TikTok Pixel Code + Access Token

We handle all server-side forwarding on our Workers.

### Secondary Path: Zaraz Integration (for Cloudflare customers)

For customers already on Cloudflare:
1. They enable Zaraz
2. We send events to their Zaraz endpoint
3. They configure destinations in Zaraz UI

### Abandon: sGTM Approach

The sGTM architecture requires Cloud Run. Since we want to stay on Cloudflare Workers, we should **not** pursue the sGTM approach.

---

## Updated Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AdsEngineer                              │
│                   (Cloudflare Workers)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WooCommerce/Shopify  ──────┐                                   │
│       Webhook               │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  Event Router   │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    GA4      │    │ Google Ads  │    │    Meta     │         │
│  │ Measurement │    │  Offline    │    │   CAPI      │         │
│  │  Protocol   │    │ Conversions │    │             │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                   │                │
└─────────┼──────────────────┼───────────────────┼────────────────┘
          │                  │                   │
          ▼                  ▼                   ▼
    ┌──────────┐      ┌──────────┐       ┌──────────┐
    │   GA4    │      │Google Ads│       │   Meta   │
    │  Server  │      │  Server  │       │  Server  │
    └──────────┘      └──────────┘       └──────────┘
```

---

## Action Items

1. **Keep `sgtm-forwarder.ts`** - Rename to `ga4-forwarder.ts` (it sends to GA4 Measurement Protocol, not sGTM)

2. **Update documentation** - Remove references to sGTM/Cloud Run setup

3. **Simplify customer onboarding**:
   - GA4: Measurement ID + API Secret
   - Google Ads: Customer ID + Conversion Action ID + OAuth
   - Meta: Pixel ID + Access Token
   - TikTok: Pixel Code + Access Token

4. **Consider Zaraz integration** - For customers already on Cloudflare

5. **Delete `docs/sgtm-architecture-proposal.md`** - Superseded by this analysis

---

## References

- [Cloudflare Zaraz](https://developers.cloudflare.com/zaraz/)
- [Zaraz Blog Post](https://blog.cloudflare.com/zaraz-use-workers-to-make-third-party-tools-secure-and-fast/)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Google Ads Offline Conversions](https://developers.google.com/google-ads/api/docs/conversions/upload-clicks)
- [Meta Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [TikTok Events API](https://business-api.tiktok.com/portal/docs?id=1741601162187777)
