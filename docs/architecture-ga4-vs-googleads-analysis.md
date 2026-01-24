# Architectural Analysis: GA4 vs Google Ads Build Order

**Date:** 2026-01-17
**Question:** Should we build GA4 first and Google Ads later? Can components be reused?

---

## Executive Summary

**Recommendation:** ✅ **Build GA4 first (Sprint 1), Google Ads later (Sprint 2)**

**Why:**
1. GA4 and Google Ads are **DIFFERENT platforms** with **DIFFERENT APIs and purposes**
2. Shared components are limited (timestamp handling, auth - that's it)
3. Event normalization differs significantly between analytics and attribution
4. Sprint ordering in current plan is correct

**Reusability Score:** ~20% (low - mostly utilities)

---

## Platform Comparison

| Aspect | GA4 (Analytics) | Google Ads (Attribution) | Shared? |
|---------|-------------------|-------------------------|----------|
| **Purpose** | Web/app analytics (user behavior) | Ad attribution (conversion tracking) | ❌ No |
| **API** | Measurement Protocol v2 | Offline Conversions API v17 | ❌ No |
| **Endpoint** | google-analytics.com/mp/collect | googleads.googleapis.com/v17 | ❌ No |
| **Data Model** | Events (name, params, items) | Conversions (click_id, value, currency) | ❌ No |
| **Batch Size** | 25 events max | 2000 conversions max | ❌ No |
| **Auth** | OAuth2 (for enhanced ecommerce) | OAuth2 (for conversions) | ⚠️ Yes (token management) |
| **Rate Limits** | 1M events/property/day | Varies by customer | ❌ No |
| **Real-time** | ✅ Yes (≤10s) | ❌ No (async processing) | ❌ No |

---

## What CAN Be Reused

### 1. Event Ingestion Pipeline ✅

**Shared:** Both platforms receive webhooks from same sources (Shopify, WooCommerce, etc.)

```typescript
// Sprint 1 creates:
serverless/src/services/event-normalizer.ts

// Reusable by:
- GA4: Convert to GA4 event format
- Google Ads: Convert to Google Ads conversion format
// But normalization LOGIC is different per platform
```

**Reusability:** 60% (infrastructure shared, conversion logic differs)

---

### 2. Authentication Layer ⚠️

**Shared:** Both use Google OAuth2 flow

```typescript
// EXISTING: serverless/src/services/oauth-storage.ts
// Handles encrypted token storage and refresh

// Reusable by:
- GA4: For enhanced ecommerce features
- Google Ads: For conversion uploads
```

**Reusability:** 80% (token management same, but scopes differ)

---

### 3. Timestamp Normalization ✅

**Shared:** Both platforms need consistent UTC timestamps

```typescript
// ALREADY BUILT: serverless/src/utils/event-time.ts

// Reusable by BOTH:
resolveEventTimeSeconds({
  event_time: number,
  timestamp: string | Date
})

// Already integrated into:
- meta-conversions.ts (uses { timestamp: conv.conversion_time })
- tiktok-conversions.ts (uses { event_time: conversion.event_time })
```

**Reusability:** 100% (exactly what we built)

---

### 4. Site Configuration ✅

**Shared:** Both need platform-specific credentials stored per site

```typescript
// Sprint 1 creates: serverless/migrations/0021_direct_config.sql

// Columns shared:
- site_id
- attribution_mode ('sgtm' | 'direct')

// Platform-specific columns:
// GA4: ga4_measurement_id, ga4_api_secret
// Google Ads: google_ads_config (JSON with client_id, client_secret, etc.)
// Both encrypted in same way
```

**Reusability:** 70% (structure shared, fields differ)

---

## What CANNOT Be Reused

### 1. API Client Implementation ❌

**Different:** Completely different APIs

```typescript
// GA4: Sprint 1
class GA4MeasurementClient {
  async sendEvent(event: GA4Event): Promise<GA4Response> {
    // POST to google-analytics.com/mp/collect
    // Headers: Content-Type: application/json
    // Body: { client_id: 'G-XXX', events: [...] }
  }
}

// Google Ads: Sprint 2
class GoogleAdsOfflineConversions {
  async uploadConversions(conversions: Conversion[]): Promise<UploadResponse> {
    // POST to googleads.googleapis.com/v17/customers/123/conversionUploads
    // Headers: Authorization: Bearer XXX, developer-token: YYY
    // Body: { conversions: [...], partial_failure: true }
  }
}
```

**Reusability:** 0% (no code sharing possible)

---

### 2. Event Data Transformation ❌

**Different:** Data models don't map 1:1

```typescript
// Shopify webhook → GA4 event:
{
  name: 'purchase',
  params: {
    currency: 'USD',
    value: 99.99,
    items: [{ item_id, item_name, price, quantity }],
    user_id: 'user@example.com'
  }
}

// Shopify webhook → Google Ads conversion:
{
  conversion_action: 'customers/123456789/conversionActions/987654321',
  gclid: 'EAIaIQv3...',
  conversion_date_time: '2026-01-17 20:00:00+00:00',
  conversion_value: 99.99,
  currency_code: 'USD',
  user_identifiers: { email_hash: 'sha256hash...' }
}
```

**Reusability:** 10% (both extract same fields from webhook, but output differs)

---

### 3. Batching Logic ❌

**Different:** Different constraints and retry behaviors

```typescript
// GA4: Max 25 events, simple batching
async function sendBatch(events: GA4Event[]): Promise<void> {
  // Chunk into groups of 25
  // Parallel requests (up to 4 concurrent)
  // No rate limiting (1M events/day = high limit)
}

// Google Ads: Max 2000 conversions, complex batching
async function uploadBatch(conversions: Conversion[]): Promise<void> {
  // Chunk into groups of 2000
  // Exponential backoff on 429 (rate limit)
  // Handle partial failures (upload successful, retry failed)
}
```

**Reusability:** 20% (chunking logic similar, but limits/retry differ)

---

### 4. Error Handling ❌

**Different:** Different error codes and retry strategies

```typescript
// GA4 errors:
// 400: Bad request (invalid event format)
// 413: Payload too large (>1MB)
// Retry: No (events rejected permanently)

// Google Ads errors:
// 400: Validation failed (invalid GCLID format)
// 429: Rate limit exceeded
// 401: Unauthorized (expired token)
// Retry: Yes (429 and 401 with exponential backoff)
```

**Reusability:** 10% (try/catch structure, but error handling differs)

---

## Sprint Order Analysis

### Current Plan: GA4 First ✅

**Sprint 1 (GA4):**
```
Event Sources
    ↓
Event Normalizer (NEW)
    ↓
GA4 Measurement Client (NEW)
    ↓
GA4 API
```

**Sprint 2 (Google Ads):**
```
Event Sources (reusing from Sprint 1)
    ↓
Conversion Router (NEW - mode-aware)
    ↓
Google Ads Batch Uploader (NEW)
    ↓
Google Ads API
```

**Why This Order is CORRECT:**
1. Event normalizer built once (reusable by both)
2. Conversion router adds mode switching (sGTM vs Direct)
3. Each platform gets dedicated service (clean separation)
4. Natural progression: Analytics → Attribution

---

### Alternative: Google Ads First ❌

**Problems with this order:**
1. Event normalizer would need Google Ads format first
2. Would need to refactor for GA4 later
3. More complex to reason about "Direct Mode" (missing GA4)
4. No clear end-to-end story until Sprint 2

**Why This Order is WRONG:**
1. Direct Mode would feel incomplete (no analytics, only attribution)
2. Refactor heavy for GA4 later
3. Harder to test (no GA4 to validate event flow)
4. Customer onboarding confusing (what's Direct Mode without GA4?)

---

## Architecture Recommendation

### Approach: Shared Foundation + Platform-Specific Services

```
┌─────────────────────────────────────────────────┐
│          EVENT INGESTION LAYER              │
│  (reusable by ALL platforms)              │
│                                          │
│  • Shopify webhook handler                   │
│  • WooCommerce webhook handler               │
│  • Custom event handler                    │
│  • JWT authentication                     │
│  • Rate limiting                           │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────────┐
    ▼                     ▼
┌─────────────┐   ┌──────────────────┐
│ Event       │   │ Conversion      │
│ Normalizer │   │ Router (NEW)   │
└──────┬──────┘   └────┬─────────────┘
       │                │
  ┌────┴───────────────┴────────┐
  ▼                                  ▼
┌─────────────┐         ┌──────────────────┐
│  GA4        │         │  Google Ads     │
│  MPv2 Client│         │  Conversions    │
└──────┬──────┘         └────┬───────────┘
       │                      │
  ┌────┴────────────┐        │
  ▼                  ▼       ▼
┌─────────┐   ┌─────────┐ ┌─────────┐
│  GA4    │   │ Google  │ │  Meta   │ │ TikTok  │
│  API    │   │ Ads API │ │  CAPI   │ │  API    │
└─────────┘   └─────────┘ └─────────┘ └─────────┘
```

**Key Principles:**
1. Event ingestion is **shared foundation** (build once)
2. Event normalizer is **shared foundation** (build once, multiple transforms)
3. Platform services are **independent modules** (build separately)
4. Conversion router is **orchestrator** (mode-aware routing)

---

## Implementation Recommendations

### Sprint 1 (GA4) - Build As Planned ✅

**Do NOT defer Sprint 1.** Reasons:
1. Provides complete Direct Mode story (analytics + GA4)
2. Builds reusable event normalizer
3. Customer onboarding makes sense (Direct Mode = GA4)
4. Natural foundation for Sprint 2

**What Sprint 1 Builds:**
```
✅ GA4 Measurement Protocol v2 client
✅ Event normalizer (platform-agnostic foundation)
✅ Site configuration for Direct Mode
✅ Onboarding flow for GA4 credentials
```

### Sprint 2 (Google Ads) - Build As Planned ✅

**Reuses from Sprint 1:**
```
✅ Event normalizer (adds Google Ads transformation)
✅ Site configuration (adds Google Ads fields)
✅ OAuth token management
```

**What Sprint 2 Adds:**
```
✅ Conversion router (mode-aware)
✅ Google Ads batch uploader
✅ Deduplication layer
```

### Sprint 3 & 4 - Continue As Planned ✅

Both will build on Sprint 1+2 foundation.

---

## Conclusion

**Build Order:** ✅ **GA4 First (Sprint 1), Google Ads Later (Sprint 2)**

**Reasoning:**
1. GA4 and Google Ads are different platforms with different purposes
2. Reusability is limited (mostly utilities: timestamp, auth)
3. Sprint ordering is logical (analytics → attribution)
4. Event normalizer is foundation for both (build once, multiple transforms)
5. Refactoring risk minimal (correct order)
6. Customer onboarding coherent (Direct Mode has clear meaning)

**Confidence:** High (90%)

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| Building GA4 first creates unused infrastructure | Medium | Low | Event normalizer is reusable, Google Ads uses same foundation |
| Refactoring needed later for Google Ads | Medium | Low | Platform services are independent, conversion router adds mode switching |
| Sprint 2 delayed by GA4 issues | High | Low | GA4 MPv2 is stable, well-documented |
| Customer confusion about Direct Mode without Google Ads | Medium | Low | Clear communication: Direct Mode = Analytics, Attribution = Google Ads |

---

## Decision Matrix

| Decision | GA4 First | Google Ads First | Together |
|----------|-------------|------------------|-----------|
| **Reusability** | ⭐⭐⭐ Good | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Best |
| **Refactoring Risk** | ⭐⭐ Low | ⭐⭐⭐ High | ⭐⭐ Medium |
| **Customer Story** | ⭐⭐⭐⭐ Coherent | ⭐⭐ Confusing | ⭐⭐⭐⭐ Coherent |
| **Sprint Risk** | ⭐⭐ Low | ⭐⭐⭐ High | ⭐⭐ Medium |
| **Testability** | ⭐⭐⭐ Good | ⭐⭐ Medium | ⭐⭐⭐⭐ Best |
| **TOTAL** | **⭐⭐⭐ 12/15** | **⭐ 9/15** | **⭐⭐⭐ 12/15** |

**Winner:** **GA4 First** (or Together, but riskier)

---

## Final Recommendation

**Build Sprint 1 as planned** (GA4 Measurement Protocol + Event Normalizer).

**Do NOT defer Sprint 1** until after Google Ads is built.

**Why:**
- Sprint 1 builds critical foundation (event normalizer)
- Sprint 2 reuses foundation cleanly (minimal refactoring)
- Customer onboarding makes sense (Direct Mode = GA4 analytics)
- Natural progression (analytics → attribution)
- Low refactoring risk

**Proceed with current sprint plan.** ✅
