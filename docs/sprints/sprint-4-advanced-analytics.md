# Sprint 4: Advanced Analytics

**Dates:** Week 4
**Sprint Goal:** Build independent attribution model and revenue dashboard, completing Direct Mode platform

---

## Sprint Overview

**What we're building:**
- Touchpoint tracking system
- Attribution model (last-click, data-driven)
- Revenue dashboard with real-time attribution
- Export API for data ownership

**Why this sprint:**
- Eliminates dependency on GA4 for attribution
- Provides true server-side analytics
- Gives customers data ownership
- Completes Direct Mode platform

---

## User Stories

### US-4.1: Touchpoint Tracking
> **As a customer**, I want to track all user interactions across channels so that I have complete attribution data.

**Acceptance Criteria:**
- [ ] Track web touchpoints (page views, clicks, forms)
- [ ] Track ad touchpoints (gclid, fbclid, ttclid)
- [ ] Track CRM touchpoints (email opens, clicks)
- [ ] Link touchpoints to user_id for cross-session attribution
- [ ] Store touchpoints with timestamps
- [ ] Optional: IP and device fingerprinting

### US-4.2: Attribution Model
> **As a customer**, I want to choose attribution models (last-click, data-driven) so that I can optimize my marketing.

**Acceptance Criteria:**
- [ ] Support last-click attribution
- [ ] Support data-driven attribution (ML-based, if feasible)
- [ ] Support linear attribution (simple weighted)
- [ ] Configure attribution model per site
- [ ] Calculate attribution scores per touchpoint
- [ ] Re-calculate on configuration change

### US-4.3: Revenue Dashboard
> **As a customer**, I want a real-time dashboard showing revenue attribution so that I can measure ROI by channel.

**Acceptance Criteria:**
- [ ] Dashboard shows total revenue by channel
- [ ] Dashboard shows conversion counts by channel
- [ ] Dashboard shows attributed revenue per touchpoint
- [ ] Real-time updates (≤10s latency)
- [ ] Date range filter (today, 7d, 30d, custom)
- [ ] Export to CSV/JSON

### US-4.4: Export API
> **As a customer**, I want to export my attribution data so that I own my data and can do custom analysis.

**Acceptance Criteria:**
- [ ] Export endpoint accepts filters (date range, channel, attribution model)
- [ ] Export in CSV format (compatible with Excel)
- [ ] Export in JSON format (for data pipelines)
- [ ] Large export supports pagination (1000 rows/page)
- [ ] Export is rate-limited (1 per 5min per site)
- [ ] Export includes all touchpoints and conversions

---

## Tasks Breakdown

### T4.1: Touchpoint Tracker
**File:** `serverless/src/services/touchpoint-tracker.ts`
**Effort:** 5 hours
**Status:** ⏳ Not Started

**Description:** Track all user interactions across channels

**Implementation Checklist:**
- [ ] Define `Touchpoint` interface
- [ ] Implement `recordWebTouchpoint()` (page views, clicks)
- [ ] Implement `recordAdTouchpoint()` (gclid, fbclid, ttclid)
- [ ] Implement `recordCRMTouchpoint()` (email, etc.)
- [ ] Implement `getTouchpointsByUser()` (for attribution)
- [ ] Implement `getTouchpointsByConversion()` (path analysis)
- [ ] Add D1 schema for touchpoints table
- [ ] Add cleanup job (delete >90 days)

**Touchpoint Schema:**
```typescript
interface Touchpoint {
  id: string;
  user_id?: string;
  site_id: string;
  channel: 'web' | 'google_ads' | 'meta' | 'tiktok' | 'email';
  type: 'page_view' | 'click' | 'form_submit' | 'ad_impression';
  click_id?: string; // gclid, fbclid, ttclid
  url?: string;
  referrer?: string;
  timestamp: number; // Unix epoch
  conversion_id?: string; // Link to conversion
  attribution_score?: number; // 0-1
}
```

**Migration:**
```sql
CREATE TABLE touchpoints (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  site_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  click_id TEXT,
  url TEXT,
  referrer TEXT,
  timestamp INTEGER NOT NULL,
  conversion_id TEXT,
  attribution_score REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (conversion_id) REFERENCES conversions(id)
);
CREATE INDEX idx_touchpoint_user ON touchpoints(user_id, timestamp);
CREATE INDEX idx_touchpoint_site ON touchpoints(site_id, timestamp);
CREATE INDEX idx_touchpoint_conversion ON touchpoints(conversion_id);
```

---

### T4.2: Attribution Model
**File:** `serverless/src/services/attribution-model.ts`
**Effort:** 6 hours
**Status:** ⏳ Not Started

**Description:** Calculate attribution for conversions based on touchpoints

**Implementation Checklist:**
- [ ] Define `AttributionModel` interface
- [ ] Implement `lastClickAttribution()` (100% to last touchpoint)
- [ ] Implement `linearAttribution()` (equal distribution)
- [ ] Implement `timeDecayAttribution()` (newer = higher weight)
- [ ] Implement `dataDrivenAttribution()` (if feasible, use simple ML)
- [ ] Implement `calculateAttribution()` (main orchestrator)
- [ ] Add site config for model selection
- [ ] Re-calculate on model change

**Attribution Logic:**
```typescript
interface AttributionResult {
  conversion_id: string;
  model: AttributionModel;
  touchpoints: Array<{
    touchpoint_id: string;
    channel: string;
    attributed_revenue: number;
    attribution_score: number;
  }>;
}

async function lastClickAttribution(
  touchpoints: Touchpoint[],
  conversionRevenue: number
): Promise<AttributionResult> {
  if (touchpoints.length === 0) {
    return { attribution: [], model: 'last_click' };
  }

  // Sort by timestamp, get most recent
  const lastTouchpoint = touchpoints.sort((a, b) => b.timestamp - a.timestamp)[0];

  return {
    conversion_id: conversion.id,
    model: 'last_click',
    touchpoints: [{
      touchpoint_id: lastTouchpoint.id,
      channel: lastTouchpoint.channel,
      attributed_revenue: conversionRevenue,
      attribution_score: 1.0
    }]
  };
}

async function linearAttribution(
  touchpoints: Touchpoint[],
  conversionRevenue: number
): Promise<AttributionResult> {
  if (touchpoints.length === 0) {
    return { attribution: [], model: 'linear' };
  }

  // Equal distribution
  const revenuePerTouchpoint = conversionRevenue / touchpoints.length;

  return {
    conversion_id: conversion.id,
    model: 'linear',
    touchpoints: touchpoints.map(tp => ({
      touchpoint_id: tp.id,
      channel: tp.channel,
      attributed_revenue: revenuePerTouchpoint,
      attribution_score: 1.0 / touchpoints.length
    }))
  };
}

async function timeDecayAttribution(
  touchpoints: Touchpoint[],
  conversionRevenue: number
): Promise<AttributionResult> {
  if (touchpoints.length === 0) {
    return { attribution: [], model: 'time_decay' };
  }

  // Newer = higher weight (exponential decay)
  const now = Date.now();
  const decayFactor = 86400; // 1 day in ms

  const weights = touchpoints.map(tp => {
    const ageHours = (now - tp.timestamp) / 3600000;
    const weight = Math.exp(-ageHours / 24); // 24h half-life
    return { tp, weight };
  });

  const totalWeight = weights.reduce((sum, { weight }) => sum + weight, 0);

  return {
    conversion_id: conversion.id,
    model: 'time_decay',
    touchpoints: weights.map(({ tp, weight }) => ({
      touchpoint_id: tp.id,
      channel: tp.channel,
      attributed_revenue: (weight / totalWeight) * conversionRevenue,
      attribution_score: weight / totalWeight
    }))
  };
}
```

**Migration for model config:**
```sql
ALTER TABLE sites ADD COLUMN attribution_model TEXT NOT NULL DEFAULT 'last_click';
```

---

### T4.3: Revenue Dashboard
**File:** `serverless/src/routes/analytics.ts` (refactor)
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** Real-time dashboard showing attribution by channel

**Implementation Checklist:**
- [ ] Create `GET /api/v1/analytics/revenue/:siteId` endpoint
- [ ] Query total revenue by channel
- [ ] Query conversion counts by channel
- [ ] Query attributed revenue by touchpoint
- [ ] Add date range filter
- [ ] Add pagination for large datasets
- [ ] Add caching (1min TTL)
- [ ] Calculate ROI (revenue / estimated ad spend)

**API Response:**
```typescript
interface RevenueDashboard {
  site_id: string;
  time_range: { start: string; end: string };
  summary: {
    total_revenue: number;
    total_conversions: number;
    avg_order_value: number;
    channels: number;
  };
  by_channel: Array<{
    channel: string;
    revenue: number;
    conversions: number;
    attributed_revenue: number;
    attribution_score: number;
  }>;
  top_touchpoints: Array<{
    touchpoint_id: string;
    channel: string;
    attributed_revenue: number;
    attribution_score: number;
  }>;
}
```

**Query:**
```sql
SELECT
  channel,
  COUNT(*) as conversions,
  SUM(attributed_revenue) as revenue,
  AVG(attribution_score) as avg_score
FROM touchpoints
WHERE site_id = ? AND timestamp BETWEEN ? AND ?
  AND conversion_id IS NOT NULL
GROUP BY channel
ORDER BY revenue DESC;
```

---

### T4.4: Export API
**File:** `serverless/src/routes/export.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Export attribution data in CSV/JSON

**Implementation Checklist:**
- [ ] Create `GET /api/v1/export/attribution/:siteId` endpoint
- [ ] Support CSV format
- [ ] Support JSON format
- [ ] Add filters (date range, channel, model)
- [ ] Add pagination (1000 rows/page, max 10000)
- [ ] Add rate limiting (1 per 5min)
- [ ] Add background job for large exports
- [ ] Store export in object storage with TTL

**API Request:**
```typescript
interface ExportRequest {
  format: 'csv' | 'json';
  date_range: { start: string; end: string };
  channel?: string;
  attribution_model?: string;
  limit?: number; // Max 10000
  page?: number; // Default 1
}
```

**CSV Format:**
```csv
touchpoint_id,channel,type,timestamp,click_id,conversion_id,attributed_revenue,attribution_score
tp_123,google_ads,ad_impression,1705516800,G-ABC123,conv_456,99.99,1.0
```

---

### T4.5: Data Cleanup Job
**File:** `serverless/src/workers/cleanup.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Periodic cleanup of old touchpoint data

**Implementation Checklist:**
- [ ] Implement `cleanupOldTouchpoints()` function
- [ ] Delete touchpoints >90 days
- [ ] Delete orphan touchpoints (no user_id or conversion_id)
- [ ] Add cron trigger (daily at 2 AM UTC)
- [ ] Log cleanup metrics (rows deleted)

**Cleanup Query:**
```sql
DELETE FROM touchpoints
WHERE created_at < datetime('now', '-90 days')
  AND (user_id IS NULL OR conversion_id IS NULL);
```

---

### T4.6: Unit & Integration Tests
**File:** `serverless/tests/unit/attribution.test.ts`
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** Comprehensive tests for attribution

**Implementation Checklist:**
- [ ] Test last-click attribution
- [ ] Test linear attribution
- [ ] Test time-decay attribution
- [ ] Test attribution with no touchpoints
- [ ] Test attribution re-calculation
- [ ] Test revenue dashboard queries
- [ ] Test export API (CSV, JSON)
- [ ] Test export rate limiting
- [ ] Test pagination
- [ ] Test cleanup job

**Coverage Target:** 85%+

---

## Definition of Done

### Code Quality
- [ ] All new code passes `pnpm lint`
- [ ] All new code passes `pnpm types:check`
- [ ] Test coverage ≥85% for attribution features
- [ ] No hardcoded attribution models

### Functionality
- [ ] All user stories acceptance criteria met
- [ ] Touchpoints tracked for all channels
- [ ] All 3 attribution models work correctly
- [ ] Revenue dashboard shows accurate data
- [ ] Export API returns valid CSV/JSON
- [ ] Cleanup job runs successfully

### Performance
- [ ] Attribution calculation ≤100ms per conversion
- [ ] Revenue dashboard query ≤1s
- [ ] Export API ≤10s for 1000 rows
- [ ] Touchpoint insertion ≤5ms per event
- [ ] Cleanup job ≤60s

### Data Quality
- [ ] Attribution sums match conversion revenue (±1%)
- [ ] No orphan touchpoints after cleanup
- [ ] Export data matches dashboard data

### Documentation
- [ ] Attribution models documented with examples
- [ ] Dashboard usage guide
- [ ] Export API documentation
- [ ] Sprint retrospective notes

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA with real data
- [ ] Load testing (simulate 10000 conversions/day)

---

## Deliverables

### Code
- [ ] `serverless/src/services/touchpoint-tracker.ts`
- [ ] `serverless/src/services/attribution-model.ts`
- [ ] `serverless/src/routes/analytics.ts` (refactored)
- [ ] `serverless/src/routes/export.ts`
- [ ] `serverless/src/workers/cleanup.ts`
- [ ] `serverless/migrations/0024_touchpoints.sql`
- [ ] `serverless/migrations/0025_attribution_model.sql`

### Tests
- [ ] `serverless/tests/unit/touchpoint-tracker.test.ts`
- [ ] `serverless/tests/unit/attribution-model.test.ts`
- [ ] `serverless/tests/integration/revenue-dashboard.test.ts`
- [ ] `serverless/tests/integration/export.test.ts`

### Documentation
- [ ] `docs/attribution-models-guide.md`
- [ ] `docs/revenue-dashboard-guide.md`
- [ ] `docs/data-export-guide.md`
- [ ] AGENTS.md updates (analytics)
- [ ] Sprint retrospective notes

---

## Dependencies

### Internal
- **Sprint 1:** Direct Mode ✅ Required for attribution
- **Sprint 2:** Conversion Router ✅ Required for linking touchpoints
- **Sprint 3:** Migration Tooling ✅ Required for customer onboarding

### External
- **None** - Attribution is our own implementation

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| Attribution models inaccurate | High | Medium | Support multiple models, customer can choose |
| Performance at scale | Medium | High | Index touchpoints, batch calculations, caching |
| Data privacy (IP tracking) | Low | Medium | Make IP tracking optional, hash identifiers |
| Large export timeouts | Medium | Low | Background jobs, rate limiting, pagination |
| Touchpoint data growth | Medium | High | Cleanup job, retention policy |

---

## Acceptance Criteria Summary

**Sprint is complete when:**
1. Touchpoints tracked for web, ads, and CRM channels
2. Last-click, linear, and time-decay attribution work
3. Revenue dashboard shows accurate attribution by channel
4. Export API returns valid CSV and JSON
5. Attribution sums match conversion revenue
6. Cleanup job removes >90 day touchpoints
7. All tests pass with ≥85% coverage
8. Manual QA confirms dashboard accuracy

---

## Success Metrics

| Metric | Target | Measurement |
|--------|---------|-------------|
| Attribution accuracy | ≥95% | Revenue match vs manual calculation |
| Dashboard query latency | ≤1s | Revenue dashboard load time |
| Export success rate | ≥99% | Export API completion |
| Touchpoint insert rate | ≥200/s | Performance under load |
| Storage growth | ≤10GB/month | Cleanup job effectiveness |

---

## Retro Prep (Questions for Sprint Review)

1. Did we achieve our sprint goal (independent analytics)?
2. How accurate are our attribution models?
3. Is the revenue dashboard performant enough?
4. Are customers using the export API?
5. Did we handle data privacy concerns?
6. Are we ready for production launch?
7. What improvements should we prioritize next?

---

## Out of Scope

❌ ML-based data-driven attribution (future)
❌ Multi-touch attribution beyond 4 touchpoints (future)
❌ Real-time streaming analytics (future)
❌ Predictive analytics (future)
❌ Customer segmentation (future)
