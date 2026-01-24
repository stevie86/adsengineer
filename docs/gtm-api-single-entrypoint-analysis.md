# GTM API as Single Entrypoint: Analysis

**Date:** 2026-01-17
**Question:** Can we use a single GTM API interface instead of maintaining separate platform integrations?

---

## The Core Problem

You want:
```
AdsEngineer → [Single API] → GA4, Google Ads, Meta, TikTok
```

Not:
```
AdsEngineer → GA4 API
           → Google Ads API  
           → Meta API
           → TikTok API
```

---

## The Reality: There Is No "GTM API" for Sending Events

### What GTM APIs Actually Do

| API | Purpose | Can Send Events? |
|-----|---------|------------------|
| **GTM Management API** | CRUD tags, triggers, variables | ❌ No |
| **sGTM Server** | Receives events, routes to platforms | ✅ Yes, but requires Docker/Cloud Run |
| **Measurement Protocol** | Send events to GA4 only | ⚠️ GA4 only |

**There is no hosted GTM endpoint that accepts events and routes to multiple platforms.**

---

## How sGTM Actually Works

The sGTM "single entrypoint" requires **you to host the server**:

```
Your Server (Cloud Run)
├── Receives HTTP request
├── Parses with "Client" (GA4 Client, Measurement Protocol Client)
├── Creates internal event
├── Routes to Tags based on Triggers
│   ├── GA4 Tag → google-analytics.com
│   ├── Google Ads Tag → googleads.g.doubleclick.net
│   ├── Meta CAPI Tag → graph.facebook.com
│   └── TikTok Tag → analytics.tiktok.com
```

**The routing logic runs on YOUR infrastructure, not Google's.**

---

## Your Options

### Option 1: Host sGTM on Cloud Run (Original Plan)
❌ **You rejected this** - defeats Cloudflare Workers advantage

### Option 2: Build Our Own Router on Workers
✅ **We become the "single entrypoint"**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AdsEngineer Workers                          │
│                  (Our Own Event Router)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer sends ONE event to us:                                │
│  POST /api/v1/events                                            │
│  {                                                              │
│    "event": "purchase",                                         │
│    "order_id": "ORD-123",                                       │
│    "value": 99.99,                                              │
│    "currency": "USD",                                           │
│    "email": "user@example.com"                                  │
│  }                                                              │
│                                                                 │
│  We route to ALL configured platforms:                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     GA4      │  │  Google Ads  │  │     Meta     │          │
│  │  Forwarder   │  │  Forwarder   │  │  Forwarder   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
    GA4 Server        Google Ads        Meta Server
```

**This IS the single entrypoint - we just build it ourselves.**

### Option 3: Cloudflare Zaraz
⚠️ Only works if customer uses Cloudflare

### Option 4: Use Third-Party sGTM Hosting (Stape.io)
❌ External dependency, defeats purpose

---

## Recommendation: Option 2 - Build Our Own Router

### What We Already Have

| Component | Status | File |
|-----------|--------|------|
| GA4 Measurement Protocol | ✅ Built | `sgtm-forwarder.ts` (rename to `ga4-forwarder.ts`) |
| Google Ads Offline Conversions | ✅ Built | `google-ads.ts` |
| Meta Conversions API | ✅ Built | `meta-conversions.ts` |
| TikTok Events API | ✅ Built | `tiktok-conversions.ts` |

### What We Need to Build

**A unified event router** that:
1. Accepts ONE event format
2. Transforms to each platform's format
3. Sends to all configured platforms in parallel
4. Returns aggregated results

### Proposed Architecture

```typescript
// Customer sends ONE request
POST /api/v1/events
{
  "site_id": "customer-123",
  "event_name": "purchase",
  "event_data": {
    "transaction_id": "ORD-123",
    "value": 99.99,
    "currency": "USD",
    "items": [...]
  },
  "user_data": {
    "email": "user@example.com",
    "phone": "+1234567890",
    "ip": "1.2.3.4",
    "user_agent": "Mozilla/5.0..."
  }
}

// We route to all platforms configured for this site
// Returns:
{
  "success": true,
  "results": {
    "ga4": { "success": true },
    "google_ads": { "success": true },
    "meta": { "success": true },
    "tiktok": { "success": false, "error": "Not configured" }
  }
}
```

### Customer Configuration (in DB)

```json
{
  "site_id": "customer-123",
  "platforms": {
    "ga4": {
      "enabled": true,
      "measurement_id": "G-XXXXXXX",
      "api_secret": "xxxxx"
    },
    "google_ads": {
      "enabled": true,
      "customer_id": "123-456-7890",
      "conversion_action_id": "12345"
    },
    "meta": {
      "enabled": true,
      "pixel_id": "123456789",
      "access_token": "xxxxx"
    },
    "tiktok": {
      "enabled": false
    }
  }
}
```

---

## Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| **Single entrypoint** | Customer sends ONE event, we handle routing |
| **Runs on Workers** | No Cloud Run, no Docker, no external infra |
| **We control** | We maintain the integrations, not customer |
| **Customer simplicity** | Just provide API credentials once |
| **Parallel execution** | Send to all platforms simultaneously |
| **Unified logging** | One place to see all platform results |

---

## Comparison: sGTM vs Our Router

| Feature | sGTM (Cloud Run) | Our Router (Workers) |
|---------|------------------|----------------------|
| Single entrypoint | ✅ | ✅ |
| No customer infra | ❌ Customer hosts | ✅ We host |
| Customer controls tags | ✅ GTM UI | ❌ We control |
| Runs on Cloudflare | ❌ | ✅ |
| Cost to customer | ~$45/mo | $0 (included) |
| Setup complexity | High | Low (just credentials) |

---

## Action Items

1. **Rename** `sgtm-forwarder.ts` → `ga4-forwarder.ts`

2. **Create** `src/services/event-router.ts`:
   - Unified event format
   - Routes to all configured platforms
   - Parallel execution with `Promise.all`
   - Aggregated results

3. **Create** `src/routes/events.ts`:
   - `POST /api/v1/events` endpoint
   - Validates event format
   - Calls event router

4. **Update** database schema:
   - Store platform configs per site
   - Migration for `platform_configs` table

5. **Delete** sGTM-related docs:
   - `docs/sgtm-architecture-proposal.md`
   - `docs/sgtm-vs-gateway.md`

---

## Summary

**There is no GTM API that does what you want.** sGTM requires you to host infrastructure.

**But we can BUILD exactly what you want:**
- Single event endpoint
- Routes to all platforms
- Runs entirely on Cloudflare Workers
- Zero customer infrastructure

We just become our own "server-side tag manager" - which is actually simpler and gives us more control.

Want me to build this unified event router?
