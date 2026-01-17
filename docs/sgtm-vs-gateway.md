# Server-Side GTM vs Google Tag Gateway

**Created:** 2026-01-17
**Purpose:** Clarify the difference between two Google products that sound similar but serve different purposes.

---

## TL;DR

| Question | Answer |
|----------|--------|
| **Are they the same?** | **No** - completely different products |
| **Do we need both?** | Gateway is optional, sGTM is our focus |
| **Does Gateway affect our architecture?** | **No** - Gateway is client-side only |
| **Which do we integrate with?** | **sGTM** (server-to-server) |

---

## Quick Comparison

| Aspect | Google Tag Gateway | Server-Side GTM (sGTM) |
|--------|-------------------|------------------------|
| **What it is** | A proxy/CDN configuration | A container that runs code |
| **What it does** | Serves Google scripts from YOUR domain | Processes events and fires tags |
| **Purpose** | Bypass ad blockers, first-party cookies | Server-side event processing |
| **Where it runs** | Your CDN/load balancer (Cloudflare, etc.) | Google Cloud Run (~$45/mo) |
| **Processing** | Zero - just forwards requests | Full tag/trigger/variable logic |
| **Setup** | CDN routing rules | GTM container + Cloud Run deployment |
| **GUI** | None (CDN config) | Full GTM interface (tagmanager.google.com) |
| **Our integration** | N/A (client-side concern) | **Yes - server-to-server** |

---

## Visual Architecture

### Without Gateway or sGTM (Traditional)
```
┌─────────────────┐          ┌─────────────────┐
│  User's Browser │──────────│  Google Servers │
│                 │  gtag.js │  (googletagmanager.com)
│  yoursite.com   │──────────│  GA4, Ads, etc. │
└─────────────────┘          └─────────────────┘
      │
      │ ❌ Ad blockers can block google domains
      │ ❌ Third-party cookies
```

### With Google Tag Gateway (Client-Side First-Party)
```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  User's Browser │──────────│  Your CDN       │──────────│  Google Servers │
│                 │          │  (Gateway)      │          │                 │
│  yoursite.com   │  /gtag/* │  yoursite.com   │  proxy   │  googletagmanager│
└─────────────────┘          └─────────────────┘          └─────────────────┘
      │
      │ ✅ Scripts load from YOUR domain
      │ ✅ First-party cookies
      │ ✅ Bypasses some ad blockers
```

### With Server-Side GTM (Server-Side Processing)
```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  User's Browser │──────────│  sGTM Container │──────────│  GA4            │
│  OR             │  events  │  (Cloud Run)    │  tags    │  Google Ads     │
│  Your Server    │──────────│  gtm.yoursite.com│─────────│  Meta CAPI      │
└─────────────────┘          └─────────────────┘          │  TikTok Events  │
      │                              │                    └─────────────────┘
      │                              │
      │ ✅ YOU control what data goes where
      │ ✅ Tags configured in GTM GUI
      │ ✅ Server-to-server (our use case)
```

### With BOTH (Recommended Full Setup)
```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  User's Browser │──────────│  Your CDN       │──────────│  Google Servers │
│                 │  /gtag/* │  (Gateway)      │          │  (script source)│
│  yoursite.com   │          └─────────────────┘          └─────────────────┘
│                 │                  
│                 │──────────┐                            ┌─────────────────┐
│                 │  events  │                            │  GA4            │
└─────────────────┘          │                            │  Google Ads     │
                             ▼                            │  Meta CAPI      │
                    ┌─────────────────┐          tags     │  TikTok Events  │
                    │  sGTM Container │───────────────────│                 │
                    │  gtm.yoursite.com│                  └─────────────────┘
                    └─────────────────┘
                             ▲
                             │ server-to-server
┌─────────────────┐          │
│  Your Backend   │──────────┘
│  (AdsEngineer)  │  Measurement Protocol
└─────────────────┘
```

---

## Google Tag Gateway - Details

### What It Solves
- **Ad blocker bypass**: Scripts load from `yoursite.com` not `googletagmanager.com`
- **First-party context**: Cookies set as first-party
- **Privacy perception**: Data appears to stay on your domain

### How It Works
1. You configure your CDN (Cloudflare, Fastly, Akamai, etc.)
2. Requests to `yoursite.com/gtag/*` proxy to `googletagmanager.com/gtag/*`
3. Browser thinks it's loading from your domain
4. No processing - just forwarding

### Setup Options
- **Automated**: Cloudflare worker template
- **Manual**: CDN routing rules

### Cost
- Just CDN bandwidth costs (minimal)

### Our Involvement
- **None** - this is customer's client-side infrastructure
- We don't need to build anything for Gateway

---

## Server-Side GTM - Details

### What It Solves
- **Server-side processing**: Events processed on YOUR server, not browser
- **Data control**: Decide what data goes to which platform
- **Single integration point**: One place to configure all destinations
- **Server-to-server**: Send events from backend (our use case)

### How It Works
1. Customer creates Server Container in GTM
2. Deploys container to Cloud Run (~$45/month)
3. Configures Clients (GA4 Client, Measurement Protocol Client)
4. Configures Tags (GA4, Google Ads, Meta CAPI, TikTok)
5. Events come in → Clients parse → Triggers fire → Tags send

### Key Components

| Component | Purpose |
|-----------|---------|
| **Client** | Receives HTTP requests, transforms to events |
| **Trigger** | Fires when event matches conditions |
| **Tag** | Sends data to destination |
| **Variable** | Extracts data from events |

### Our Integration Point
We send **server-to-server** requests using the **Measurement Protocol Client**:

```http
POST /collect HTTP/1.1
Host: gtm.customer.com
Content-Type: application/x-www-form-urlencoded

v=2&tid=G-XXXXXXX&cid=123.456&en=purchase&ep.transaction_id=ORD-123&epn.value=99.99
```

### Cost
- ~$45/month for 2 Cloud Run instances (minimum recommended)
- Scales automatically with traffic

---

## Why We Focus on sGTM, Not Gateway

| Reason | Explanation |
|--------|-------------|
| **Server-to-server** | We send events from our backend, not browser |
| **Processing needed** | We need tags to fire to multiple platforms |
| **Customer control** | They manage their tags in familiar GTM GUI |
| **Future-proof** | Add platforms via tags, not code changes |

Gateway is nice-to-have for customers (better client-side tracking), but **sGTM is where our integration happens**.

---

## Customer Recommendation

For best results, customers should use **both**:

1. **Gateway** - For client-side script loading (ad blocker resistance)
2. **sGTM** - For server-side event processing (our integration + their tags)

But if they can only do one: **sGTM is more important** for our use case.

---

## References

- [Server-Side GTM Docs](https://developers.google.com/tag-platform/tag-manager/server-side)
- [Google Tag Gateway Docs](https://developers.google.com/tag-platform/tag-manager/gateway)
- [Send Data to sGTM](https://developers.google.com/tag-platform/tag-manager/server-side/send-data)
- [Measurement Protocol Client](https://developers.google.com/tag-platform/tag-manager/server-side/send-data#server-to-server-apps)
