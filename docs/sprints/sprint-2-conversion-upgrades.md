# Sprint 2: Conversion Upgrades

**Dates:** Week 2
**Sprint Goal:** Replace sGTM for ad platforms with direct uploads via optimized batch processing

---

## Sprint Overview

**What we're building:**
- Conversion router with `attribution_mode` routing
- Optimized batch uploaders for Google Ads, Meta, TikTok
- Deduplication layer to prevent duplicate conversions
- Unified conversion queue system

**Why this sprint:**
- Enables Direct Mode for ad platforms (not just GA4)
- Reduces API costs via efficient batching
- Improves data accuracy with deduplication
- Foundation for attribution engine (Sprint 3)

---

## User Stories

### US-2.1: Mode-Aware Conversion Routing
> **As a system**, I want to route conversions to sGTM or Direct mode based on site configuration so that customers can choose their integration approach.

**Acceptance Criteria:**
- [ ] Conversion router checks `attribution_mode` for each site
- [ ] `attribution_mode = 'sgtm'` forwards to sGTM forwarder
- [ ] `attribution_mode = 'direct'` sends to platform APIs
- [ ] Mode switching happens seamlessly without data loss
- [ ] Mode mismatch logged for monitoring

### US-2.2: Batch Google Ads Uploads
> **As a customer**, I want conversions uploaded in batches to Google Ads so that API costs are minimized and rate limits are respected.

**Acceptance Criteria:**
- [ ] Batch size configurable (default 100 conversions)
- [ ] Automatic retry on rate limit errors (429)
- [ ] Exponential backoff (1s, 2s, 4s, 8s)
- [ ] Partial failure handling (upload successful conversions)
- [ ] Conversion status tracking (pending/sent/failed)

### US-2.3: Batch Meta CAPI Uploads
> **As a customer**, I want conversions uploaded in batches to Meta CAPI so that API costs are minimized and delivery is reliable.

**Acceptance Criteria:**
- [ ] Batch size configurable (default 1000 events)
- [ ] Duplicate event ID deduplication per request
- [ ] SHA-256 hashing for PII compliance
- [ ] Error handling for invalid events
- [ ] Batch status tracking

### US-2.4: Batch TikTok Event Uploads
> **As a customer**, I want events uploaded in batches to TikTok Events API so that API costs are minimized.

**Acceptance Criteria:**
- [ ] Batch size configurable (default 100 events)
- [ ] Event type grouping (purchase, lead, etc.)
- [ ] Error handling with specific event IDs
- [ ] Job status polling (TikTok is async)

### US-2.5: Cross-Platform Deduplication
> **As a customer**, I want the same conversion not counted twice across different ad platforms so that my attribution data is accurate.

**Acceptance Criteria:**
- [ ] Deduplication key based on order_id + site_id + event_type
- [ ] Time window: 24 hours from first event
- [ ] Redis or D1-based dedupe store
- [ ] Configurable deduplication rules
- [ ] Dedupe metrics tracked in dashboard

---

## Tasks Breakdown

### T2.1: Conversion Router Refactor
**File:** `serverless/src/services/conversion-router.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Add `attribution_mode` routing logic

**Implementation Checklist:**
- [ ] Read site configuration for `attribution_mode`
- [ ] If `sgtm`: forward to `sgtm-forwarder.ts`
- [ ] If `direct`: route to platform batch uploaders
- [ ] Add error handling for missing mode
- [ ] Log routing decisions for debugging
- [ ] Add metrics (events_routed_sgtm, events_routed_direct)

**Code Structure:**
```typescript
export async function routeConversion(
  env: AppEnv['Bindings'],
  siteId: string,
  conversion: ConversionData
): Promise<RouteResult> {
  const site = await getSiteConfig(env.DB, siteId);
  const mode = site.attribution_mode || 'sgtm';

  if (mode === 'sgtm') {
    return forwardToSGTM(site, conversion);
  }

  return uploadToPlatformAPI(site, conversion);
}
```

---

### T2.2: Google Ads Batch Uploader
**File:** `serverless/src/services/google-ads-batch.ts`
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** Optimized batch uploads for Google Ads

**Implementation Checklist:**
- [ ] Create `GoogleAdsBatchUploader` class
- [ ] Implement `uploadBatch()` method (up to 100 conversions)
- [ ] Implement `checkRateLimit()` method
- [ ] Implement `retryWithBackoff()` method
- [ ] Handle partial failures (upload successful, mark failed)
- [ ] Add status tracking (pending → sent → confirmed/failed)
- [ ] Implement queue drain (process all pending on cron)

**Rate Limiting:**
```typescript
const BATCH_SIZE = 100;
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000, 8000];

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempt: number = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error.code === 429 && attempt < MAX_RETRIES) {
      await sleep(BACKOFF_MS[attempt]);
      return retryWithBackoff(fn, attempt + 1);
    }
    throw error;
  }
}
```

---

### T2.3: Meta CAPI Batch Uploader
**File:** `serverless/src/services/meta-batch.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Optimized batch uploads for Meta Conversions API

**Implementation Checklist:**
- [ ] Create `MetaBatchUploader` class
- [ ] Implement `uploadBatch()` method (up to 1000 events)
- [ ] Implement `dedupeEvents()` method (remove duplicate event_ids)
- [ ] Implement `hashPII()` method (email, phone, etc.)
- [ ] Handle field normalization (Meta schema quirks)
- [ ] Add error handling with per-event error details
- [ ] Implement batch status tracking

**Deduplication:**
```typescript
function dedupeEvents(events: MetaConversion[]): MetaConversion[] {
  const seen = new Set<string>();
  return events.filter(event => {
    if (seen.has(event.event_id)) return false;
    seen.add(event.event_id);
    return true;
  });
}
```

---

### T2.4: TikTok Batch Uploader
**File:** `serverless/src/services/tiktok-batch.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Optimized batch uploads for TikTok Events API

**Implementation Checklist:**
- [ ] Create `TikTokBatchUploader` class
- [ ] Implement `uploadBatch()` method (up to 100 events)
- [ ] Implement `groupByEventType()` method
- [ ] Implement `pollJobStatus()` method (TikTok is async)
- [ ] Handle job failures with retry
- [ ] Add event-level error reporting
- [ ] Implement status polling queue

**Async Job Handling:**
```typescript
async function uploadBatch(events: TikTokEvent[]): Promise<JobResult> {
  const response = await tiktokAPI.upload(events);
  const jobId = response.job_id;

  // Poll job status
  while (true) {
    const status = await tiktokAPI.getJobStatus(jobId);
    if (status.state === 'completed') return status;
    if (status.state === 'failed') throw new Error(status.error);
    await sleep(5000); // Poll every 5s
  }
}
```

---

### T2.5: Deduplication Layer
**File:** `serverless/src/services/deduplication.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Prevent duplicate conversions across platforms

**Implementation Checklist:**
- [ ] Define `DedupeKey` interface
- [ ] Implement `generateDedupeKey()` (order_id + site_id + event_type)
- [ ] Implement `checkDuplicate()` method
- [ ] Implement `markDeduped()` method
- [ ] Add time window logic (24 hours from first event)
- [ ] Add Redis fallback (if KV available) or D1-based store
- [ ] Add metrics (dedupe_count, dedupe_rate)

**Deduplication Logic:**
```typescript
interface DedupeKey {
  site_id: string;
  order_id: string;
  event_type: string;
  timestamp: number; // First occurrence
}

async function checkDuplicate(
  db: D1Database,
  key: DedupeKey,
  timeWindowMs: number = 86400000 // 24h
): Promise<boolean> {
  const cutoff = Date.now() - timeWindowMs;

  const existing = await db.prepare(`
    SELECT * FROM conversion_dedupes
    WHERE site_id = ? AND order_id = ? AND event_type = ?
      AND timestamp > ?
  `).bind(key.site_id, key.order_id, key.event_type, cutoff).first();

  return !!existing;
}

async function markDeduped(
  db: D1Database,
  key: DedupeKey
): Promise<void> {
  await db.prepare(`
    INSERT INTO conversion_dedupes (site_id, order_id, event_type, timestamp)
    VALUES (?, ?, ?, ?)
  `).bind(key.site_id, key.order_id, key.event_type, Date.now()).run();
}
```

**Migration for dedupe table:**
```sql
CREATE TABLE conversion_dedupes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, order_id, event_type, timestamp)
);
CREATE INDEX idx_dedupe_key ON conversion_dedupes(site_id, order_id, event_type, timestamp);
CREATE INDEX idx_dedupe_timestamp ON conversion_dedupes(timestamp);
```

---

### T2.6: Integration Tests
**File:** `serverless/tests/integration/conversion-router.test.ts`
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** End-to-end conversion tests

**Implementation Checklist:**
- [ ] Test sGTM mode routing
- [ ] Test Direct mode routing to Google Ads
- [ ] Test Direct mode routing to Meta
- [ ] Test Direct mode routing to TikTok
- [ ] Test deduplication (prevent duplicate)
- [ ] Test rate limiting (retry on 429)
- [ ] Test partial failures (upload successful conversions)
- [ ] Test mode switching (no data loss)
- [ ] Test error handling (invalid credentials, malformed events)

**Coverage Target:** 85%+

---

## Definition of Done

### Code Quality
- [ ] All new code passes `pnpm lint`
- [ ] All new code passes `pnpm types:check`
- [ ] Test coverage ≥85% for conversion routing
- [ ] No hardcoded credentials or API keys

### Functionality
- [ ] All user stories acceptance criteria met
- [ ] Both sGTM and Direct modes work end-to-end
- [ ] All 3 platforms (Google, Meta, TikTok) upload successfully
- [ ] Deduplication prevents duplicate conversions
- [ ] Rate limiting works correctly (retries on 429)
- [ ] Database migration applies successfully

### Performance
- [ ] Batch upload latency ≤30s for Google Ads
- [ ] Batch upload latency ≤30s for Meta
- [ ] Batch upload latency ≤60s for TikTok (includes polling)
- [ ] Deduplication check ≤10ms per event
- [ ] Rate limit backoff respects API limits

### Documentation
- [ ] Code comments for complex logic
- [ ] AGENTS.md updated with batch upload patterns
- [ ] API docs updated with new routing behavior
- [ ] Deduplication rules documented

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA checklist completed
- [ ] Load testing (simulate 1000 conversions/min)

---

## Deliverables

### Code
- [ ] `serverless/src/services/conversion-router.ts` (refactored)
- [ ] `serverless/src/services/google-ads-batch.ts`
- [ ] `serverless/src/services/meta-batch.ts`
- [ ] `serverless/src/services/tiktok-batch.ts`
- [ ] `serverless/src/services/deduplication.ts`
- [ ] `serverless/migrations/0022_conversion_dedupes.sql`

### Tests
- [ ] `serverless/tests/unit/google-ads-batch.test.ts`
- [ ] `serverless/tests/unit/meta-batch.test.ts`
- [ ] `serverless/tests/unit/tiktok-batch.test.ts`
- [ ] `serverless/tests/unit/deduplication.test.ts`
- [ ] `serverless/tests/integration/conversion-router.test.ts`

### Documentation
- [ ] AGENTS.md updates (services, conversions)
- [ ] API documentation updates
- [ ] Batch upload patterns documented
- [ ] Sprint retrospective notes

---

## Dependencies

### Internal
- **Sprint 1:** GA4 Measurement Service ✅ Required for Direct mode
- **Event normalizer:** ✅ Required for platform-specific formats
- **Database schema:** ✅ Sites table with `attribution_mode`

### External
- **Google Ads API v17:** Documentation available
- **Meta Conversions API:** Documentation available
- **TikTok Events API v1.3:** Documentation available

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| API rate limits block uploads | High | Medium | Implement batching, exponential backoff, queue system |
| Batch failures partial | Medium | High | Upload successful conversions, track failed ones |
| Deduplication false positives | Medium | Medium | Configurable rules, manual override |
| TikTok async job timeouts | Medium | Low | Timeout handling, job status queue |
| Platform API changes | Medium | Low | Monitor announcements, versioned endpoints |

---

## Acceptance Criteria Summary

**Sprint is complete when:**
1. Conversion router switches between sGTM and Direct modes based on site config
2. Google Ads uploads in batches (100 conversions) with retry logic
3. Meta uploads in batches (1000 events) with PII hashing
4. TikTok uploads in batches (100 events) with job status polling
5. Deduplication prevents duplicate conversions within 24h window
6. All integration tests pass with ≥85% coverage
7. No regressions in existing sGTM mode
8. Manual QA confirms both modes work end-to-end

---

## Success Metrics

| Metric | Target | Measurement |
|--------|---------|-------------|
| Conversion upload success rate | ≥95% | Platform API responses |
| Batch efficiency | ≥90% | Successful events / total events in batch |
| Deduplication accuracy | ≥98% | Manual spot checks |
| Rate limit resilience | 100% | All retries succeed after backoff |
| Integration test coverage | ≥85% | Vitest coverage report |

---

## Retro Prep (Questions for Sprint Review)

1. Did we achieve our sprint goal?
2. Was batching efficiency as expected?
3. How did deduplication perform in testing?
4. What challenges did we encounter with async job handling (TikTok)?
5. Are there any edge cases we missed?
6. Are we ready to start Sprint 3?
7. Did we identify any performance bottlenecks?

---

## Out of Scope

❌ Attribution model (Sprint 3)
❌ Revenue dashboard (Sprint 4)
❌ Migration tool (Sprint 3)
❌ Custom event definitions (already exists)
❌ Customer-facing analytics (Sprint 4)
