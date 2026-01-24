# Sprint 1: MVP Direct GA4 Mode

**Dates:** Week 1
**Sprint Goal:** Enable customers to bypass sGTM and send events directly to GA4 via Measurement Protocol v2

---

## Sprint Overview

**What we're building:**
- Direct GA4 Measurement Protocol v2 client
- Event normalization layer
- Site configuration for Direct Mode
- Onboarding flow updates

**Why this sprint:**
- Foundation for Direct Mode architecture
- Validates that direct GA4 integration is viable
- Provides customer choice (sGTM vs Direct)

---

## User Stories

### US-1.1: Direct Mode Configuration
> **As a customer**, I want to configure my site to use Direct Mode so that I don't need to set up sGTM infrastructure.

**Acceptance Criteria:**
- [ ] Site configuration has `attribution_mode` field with options: 'sgtm' | 'direct'
- [ ] When `attribution_mode = 'direct'`, system uses Direct Mode
- [ ] Direct Mode requires `ga4_measurement_id` and `ga4_api_secret`
- [ ] Site can be switched between modes without data loss

### US-1.2: Event Ingestion
> **As a system**, I want to receive events in any format and convert them to GA4 format so that customers don't need to change their tracking code.

**Acceptance Criteria:**
- [ ] Event normalizer handles: Shopify, WooCommerce, custom webhook formats
- [ ] Normalized events conform to GA4 MPv2 schema
- [ ] Invalid events are rejected with clear error messages
- [ ] Event timestamps are normalized to UTC

### US-1.3: GA4 Forwarding
> **As a customer**, I want my events to appear in GA4 when using Direct Mode so that I can track user behavior.

**Acceptance Criteria:**
- [ ] Events sent via GA4 MPv2 appear in GA4 within 10 seconds
- [ ] Custom parameters are preserved in GA4
- [ ] User ID is tracked for cross-session attribution
- [ ] Events are batched for efficiency (max 25 per request)

---

## Tasks Breakdown

### T1.1: GA4 Measurement Protocol v2 Service
**File:** `serverless/src/services/ga4-measurement.ts`
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** Implement client for GA4 Measurement Protocol v2

**Implementation Checklist:**
- [ ] Create `GA4MeasurementClient` class
- [ ] Implement `sendEvent()` method for single events
- [ ] Implement `sendBatch()` method for batch events (up to 25)
- [ ] Add error handling for API failures
- [ ] Add retry logic (exponential backoff, max 3 retries)
- [ ] Implement request validation (measurement_id, api_secret, event data)
- [ ] Add debug logging (disabled in production)

**Code Structure:**
```typescript
export class GA4MeasurementClient {
  constructor(config: GA4Config) {}

  async sendEvent(event: GA4Event): Promise<GA4Response> {}
  async sendBatch(events: GA4Event[]): Promise<GA4Response> {}
  async validateEvent(event: GA4Event): boolean {}
}
```

---

### T1.2: Event Normalizer
**File:** `serverless/src/services/event-normalizer.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Convert incoming webhook events to GA4 MPv2 format

**Implementation Checklist:**
- [ ] Define `NormalizedEvent` interface
- [ ] Create `normalizeShopifyEvent()` function
- [ ] Create `normalizeWooCommerceEvent()` function
- [ ] Create `normalizeCustomEvent()` function
- [ ] Add field mapping (e.g., order_total → value, email → user_email)
- [ ] Handle missing fields (use defaults, null values)
- [ ] Preserve custom parameters

**Input Formats:**
```typescript
interface ShopifyWebhook {
  id: string;
  topic: 'orders/create' | 'orders/updated';
  created_at: string;
  customer?: { email?: string; phone?: string };
  line_items: Array<{...}>;
  total_price: number;
  currency: string;
}
```

**Output Format:**
```typescript
interface GA4Event {
  name: string; // e.g., 'purchase', 'add_to_cart'
  params: {
    currency: string;
    value: number;
    user_id?: string;
    items: Array<{...}>;
    [custom_params]: any;
  };
}
```

---

### T1.3: Site Configuration Migration
**File:** `serverless/migrations/0021_direct_config.sql`
**Effort:** 1 hour
**Status:** ⏳ Not Started

**Description:** Add database fields for Direct Mode configuration

**Implementation Checklist:**
- [ ] Add `attribution_mode` column (ENUM: 'sgtm', 'direct')
- [ ] Add `ga4_measurement_id` column (VARCHAR, nullable)
- [ ] Add `ga4_api_secret` column (VARCHAR, nullable, encrypted)
- [ ] Add index on `attribution_mode` for performance
- [ ] Set default `attribution_mode = 'sgtm'` (backwards compatible)
- [ ] Add check constraint (if direct, ga4 fields required)

**SQL Schema:**
```sql
ALTER TABLE sites ADD COLUMN attribution_mode TEXT NOT NULL DEFAULT 'sgtm';
ALTER TABLE sites ADD COLUMN ga4_measurement_id TEXT;
ALTER TABLE sites ADD COLUMN ga4_api_secret TEXT;
CREATE INDEX idx_attribution_mode ON sites(attribution_mode);
```

---

### T1.4: Onboarding Update
**File:** `serverless/src/routes/onboarding.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Add Direct Mode option to site registration

**Implementation Checklist:**
- [ ] Add `attribution_mode` field to registration schema
- [ ] Add GA4 configuration fields (conditional on Direct Mode)
- [ ] Add validation (if direct, ga4 fields required)
- [ ] Update response to include configuration details
- [ ] Add "How to setup" instructions for Direct Mode
- [ ] Test both sGTM and Direct Mode flows

**New Fields:**
```typescript
{
  attribution_mode: 'sgtm' | 'direct',
  // Required if direct:
  ga4_measurement_id?: 'G-XXXXXXXXXX',
  ga4_api_secret?: string,
  // Optional:
  client_tier?: 'standard' | 'premium' | 'enterprise'
}
```

---

### T1.5: Unit Tests
**File:** `serverless/tests/unit/ga4-measurement.test.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** Comprehensive tests for GA4 integration

**Implementation Checklist:**
- [ ] Test `sendEvent()` with valid event
- [ ] Test `sendEvent()` with invalid event (should fail)
- [ ] Test `sendBatch()` with multiple events
- [ ] Test retry logic (mock API failure)
- [ ] Test validation errors (missing measurement_id, etc.)
- [ ] Test custom parameters preservation
- [ ] Test user ID tracking
- [ ] Mock GA4 API responses

**Coverage Target:** 90%+

---

## Definition of Done

### Code Quality
- [ ] All new code passes `pnpm lint`
- [ ] All new code passes `pnpm types:check`
- [ ] Test coverage ≥ 90% for new code
- [ ] No `console.log` statements (use logger instead)

### Functionality
- [ ] All user stories acceptance criteria met
- [ ] Manual testing completed for both sGTM and Direct modes
- [ ] Edge cases handled (missing fields, invalid events, API failures)
- [ ] Database migration applies successfully locally
- [ ] Onboarding flow works end-to-end

### Documentation
- [ ] Code comments for complex logic
- [ ] AGENTS.md updated with Direct Mode patterns
- [ ] API docs updated with new configuration fields
- [ ] README.md updated with Direct Mode section

### Testing
- [ ] All unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual QA checklist completed

---

## Deliverables

### Code
- [ ] `serverless/src/services/ga4-measurement.ts`
- [ ] `serverless/src/services/event-normalizer.ts`
- [ ] `serverless/migrations/0021_direct_config.sql`
- [ ] Updated `serverless/src/routes/onboarding.ts`

### Tests
- [ ] `serverless/tests/unit/ga4-measurement.test.ts`
- [ ] `serverless/tests/unit/event-normalizer.test.ts`

### Documentation
- [ ] AGENTS.md updates (services, routes)
- [ ] API documentation updates
- [ ] Sprint retrospective notes

---

## Dependencies

### Internal
- **Event time utility** (`utils/event-time.ts`) - ✅ Built
- **Database schema** (D1) - ✅ Available

### External
- **GA4 Measurement Protocol v2 docs** - Reference available
- **GA4 API secret** - Customer provides

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| GA4 API rate limits | Medium | Medium | Implement batching and retry with backoff |
| Event format incompatibility | High | Low | Use normalizer with extensive field mapping |
| Configuration errors | Medium | High | Validate config on registration, clear error messages |
| GA4 API changes | Low | Low | Use stable v2 endpoint, monitor for announcements |

---

## Acceptance Criteria Summary

**Sprint is complete when:**
1. Customer can register a site with `attribution_mode = 'direct'`
2. Events from Shopify webhooks are normalized to GA4 format
3. Normalized events are sent to GA4 via MPv2
4. Events appear in GA4 real-time dashboard
5. All unit tests pass with ≥90% coverage
6. No regressions in existing sGTM mode

---

## Success Metrics

| Metric | Target | Measurement |
|--------|---------|-------------|
| Event success rate | ≥98% | GA4 API responses |
| Event latency | ≤10s | Time from webhook to GA4 appearance |
| Test coverage | ≥90% | Vitest coverage report |
| Integration success | 100% | Manual QA with test site |

---

## Retro Prep (Questions for Sprint Review)

1. Did we achieve our sprint goal?
2. What went well?
3. What didn't go well?
4. What should we start/stop/continue?
5. Are we ready to start Sprint 2?
6. Did we identify any new risks?

---

## Out of Scope

❌ Google Ads integration (Sprint 2)
❌ Meta CAPI integration (Sprint 2)
❌ TikTok Events API integration (Sprint 2)
❌ Attribution model (Sprint 3)
❌ Customer migration tool (Sprint 3)
❌ Revenue dashboard (Sprint 4)
