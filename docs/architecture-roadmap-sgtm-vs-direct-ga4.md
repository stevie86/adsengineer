# Architecture Decision: sGTM vs Direct GA4 API

## Question from User

> "Are we building a unified entrypoint bypassing GTM Cloud Run, Google sink hole, and interfacing with GA4 API directly?"

## Current Implementation (sGTM)

**What we just built:**
- `sgtm-forwarder.ts` - forwards events to customer's Server-Side GTM containers
- Customer manages tags in GTM GUI
- Tag vendors handle API versioning
- Single integration point (sGTM)

**Pros:**
- ✅ Self-service debugging via GTM Preview
- ✅ Customers control their own tags
- ✅ We don't maintain platform API integrations
- ✅ Tag vendors (Google, Meta, TikTok) handle versioning

**Cons:**
- ❌ Customer's sGTM runs on Cloud Run (~$45/mo)
- ❌ Data still flows through Google's infrastructure
- ❌ Not truly "server-side only" from customer's perspective
- ❌ Dependent on customer setting up sGTM correctly

## Proposed Alternative (Direct GA4 API)

**What you're suggesting:**
- Direct GA4 Measurement Protocol v2 integration
- Direct uploads to Google Ads, Meta, TikTok APIs
- Bypass GTM entirely
- True "server-side only" - we handle all integrations

**Pros:**
- ✅ Zero customer infrastructure cost
- ✅ True server-side attribution (no Google intermediaries)
- ✅ We control the entire pipeline
- ✅ Can optimize for cost/performance
- ✅ Data ownership (no Google "sink hole")

**Cons:**
- ❌ Must maintain ALL platform integrations ourselves
- ❌ Tag vendors change APIs → we must update
- ❌ No self-service debugging (customer can't modify tags)
- ❌ Higher development/maintenance burden

## Architecture Comparison

### sGTM Approach (Built)
```
┌─────────────────┐
│  Event Source   │ (Shopify, WooCommerce, etc.)
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  AdsEngineer API  │ (Hono/Cloudflare Workers)
└────────┬───────────┘
         │
         ▼
┌─────────────────────┐
│ sgtm-forwarder.ts  │ (Forward to customer's sGTM)
└────────┬───────────┘
         │
         ▼
┌──────────────────────────┐
│ Customer's sGTM (GCR) │ (Google Cloud Run, ~$45/mo)
└────────┬──────────────┘
         │
    ┌────┴────┬────────┬─────────┐
    ▼          ▼        ▼         ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐
│  GA4   │ │Google  │ │ Meta │ │ TikTok │
│  API   │ │  Ads   │ │ CAPI │ │  API   │
└────────┘ └────────┘ └──────┘ └────────┘
```

### Direct API Approach (Proposed)
```
┌─────────────────┐
│  Event Source   │ (Shopify, WooCommerce, etc.)
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  AdsEngineer API  │ (Hono/Cloudflare Workers)
└────────┬───────────┘
         │
    ┌────┴────────────────────────┐
    ▼                          ▼
┌─────────────────┐      ┌──────────────────┐
│ GA4 Measurement │      │  Conversion     │
│  Protocol v2   │      │    Router      │
└────────┬────────┘      └────┬───────────┘
         │                    │
         ▼                    ▼
┌────────┐         ┌───────┬────────┬────────┐
│  GA4   │         │Google │  Meta  │ TikTok │
│  API   │         │  Ads  │  CAPI  │  API   │
└────────┘         └───────┴────────┴────────┘
```

## Recommendation: Hybrid Approach

Build BOTH with toggleable configuration:

1. **sGTM Mode** (built) - For customers who want self-service
2. **Direct Mode** (to build) - For customers who want pure server-side

```typescript
interface SiteConfig {
  attribution_mode: 'sgtm' | 'direct';
  sgtm_config?: {
    container_url: string;
    measurement_id: string;
  };
  direct_config?: {
    ga4_measurement_id: string;
    ga4_api_secret: string;
    google_ads_config: {...};
    meta_config: {...};
    tiktok_config: {...};
  };
}
```

---

# Implementation Roadmap

## Phase 1: Core Direct GA4 (Priority: HIGH)

**Goal:** Replace GA4 event forwarding with direct MPv2 calls

| Task | Effort | File | Description |
|------|---------|-------|-------------|
| GA4 MPv2 Service | 4h | `services/ga4-measurement.ts` | Implement Measurement Protocol v2 client |
| Event Normalizer | 3h | `services/event-normalizer.ts` | Convert incoming events to GA4 format |
| Site Config Update | 1h | `migrations/0021_direct_config.sql` | Add `attribution_mode` and `direct_config` columns |
| Onboarding Update | 2h | `routes/onboarding.ts` | Add "Direct Mode" option with API key inputs |
| Tests | 3h | `tests/unit/ga4-measurement.test.ts` | Unit tests for MPv2 integration |

**Total:** ~13 hours

## Phase 2: Unified Conversion Router (Priority: HIGH)

**Goal:** Replace sGTM for ads platforms with direct uploads

| Task | Effort | File | Description |
|------|---------|-------|-------------|
| Router Refactor | 2h | `services/conversion-router.ts` | Add `attribution_mode` routing logic |
| Ads Batch Uploader | 4h | `services/google-ads-batch.ts` | Optimized batch uploads for Google Ads |
| Meta Batch Uploader | 3h | `services/meta-batch.ts` | Optimized batch uploads for Meta CAPI |
| TikTok Batch Uploader | 3h | `services/tiktok-batch.ts` | Optimized batch uploads for TikTok |
| Deduplication Layer | 3h | `services/deduplication.ts` | Prevent duplicate conversions across platforms |
| Tests | 4h | `tests/integration/conversion-router.test.ts` | End-to-end conversion tests |

**Total:** ~19 hours

## Phase 3: Attribution & Analytics (Priority: MEDIUM)

**Goal:** Build our own attribution since we bypass GA4

| Task | Effort | File | Description |
|------|---------|-------|-------------|
| Touchpoint Tracking | 5h | `services/touchpoint-tracker.ts` | Track all user interactions |
| Attribution Model | 6h | `services/attribution-model.ts` | Implement last-click, data-driven attribution |
| Revenue Dashboard | 4h | `routes/analytics.ts` | Real-time revenue attribution |
| Export API | 3h | `routes/attribution-export.ts` | CSV/JSON export for analysis |

**Total:** ~18 hours

## Phase 4: Migration Path (Priority: MEDIUM)

**Goal:** Help customers migrate from sGTM to Direct

| Task | Effort | File | Description |
|------|---------|-------|-------------|
| Migration Tool | 3h | `scripts/migrate-to-direct.ts` | Copy sGTM config to direct config |
| Side-by-Side Mode | 2h | `services/hybrid-mode.ts` | Run both sGTM and Direct for testing |
| Verification Dashboard | 4h | `routes/migration-status.ts` | Compare sGTM vs Direct data |
| Rollback Mechanism | 2h | `routes/attribution-mode.ts` | Instant switch back to sGTM |

**Total:** ~11 hours

---

# What to Build First?

## Recommended Order

### Sprint 1 (Week 1): MVP Direct Mode
1. **GA4 Measurement Protocol v2 Service** - Core of direct mode
2. **Event Normalizer** - Convert any event to GA4 format
3. **Site Config Migration** - Add `attribution_mode` toggle
4. **Basic Tests** - Verify GA4 MPv2 works

**Deliverable:** Customers can choose "Direct" mode and see events in GA4

### Sprint 2 (Week 2): Conversion Upgrades
1. **Conversion Router Update** - Route to sGTM or Direct based on config
2. **Batch Uploaders** - Optimize Google Ads, Meta, TikTok uploads
3. **Deduplication** - Prevent duplicate conversions

**Deliverable:** Direct mode sends conversions to all ad platforms

### Sprint 3 (Week 3): Migration Tooling
1. **Migration Script** - One-click sGTM → Direct migration
2. **Verification Dashboard** - Compare data accuracy
3. **Hybrid Mode** - Run both for confidence

**Deliverable:** Easy migration path for existing customers

### Sprint 4 (Week 4): Advanced Features
1. **Attribution Model** - Replace GA4 attribution
2. **Revenue Dashboard** - Real-time attribution
3. **Export API** - Data ownership

**Deliverable:** Full analytics platform, independent of Google

---

# Decision Framework

When to choose **sGTM Mode**:
- ✅ Customer wants self-service tag management
- ✅ Customer already has sGTM set up
- ✅ Customer values GTM Preview debugging
- ✅ Small customer (<1000 events/day)

When to choose **Direct Mode**:
- ✅ Customer wants zero infrastructure cost
- ✅ Customer wants true server-side attribution
- ✅ High volume customer (>1000 events/day)
- ✅ Customer wants data ownership
- ✅ Customer needs custom attribution models

---

# Next Steps

## Immediate (This Week)
1. **Fix CI/CD** (critical blocker) - Duplicate class definitions
2. **Start GA4 MPv2 Service** - First phase of Direct Mode

## This Month
1. **Complete Phase 1** - GA4 MPv2 + Event Normalizer
2. **Complete Phase 2** - Conversion Router + Batch Uploaders

## Q1 2026
1. **Complete Phase 3** - Attribution & Analytics
2. **Complete Phase 4** - Migration Tooling

---

# Questions to Answer

1. **Do we want to maintain both sGTM and Direct modes long-term?**
   - Yes: Hybrid approach, customer choice
   - No: Pick one and migrate all customers

2. **What's our target customer volume?**
   - <1000 events/day: sGTM is fine
   - >1000 events/day: Direct mode is better

3. **Do we want to build our own attribution?**
   - Yes: Phase 3 (complex, high value)
   - No: Rely on GA4's built-in attribution

4. **Should we deprecate sGTM?**
   - Yes: Migrate all customers to Direct Mode
   - No: Keep as option for self-service customers
