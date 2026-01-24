# Sprint 3: Migration Tooling

**Dates:** Week 3
**Sprint Goal:** Provide seamless migration path from sGTM to Direct Mode with verification tools

---

## Sprint Overview

**What we're building:**
- One-click migration script (sGTM → Direct)
- Side-by-Side mode (run both for comparison)
- Verification dashboard (compare data accuracy)
- Rollback mechanism (instant switch back to sGTM)

**Why this sprint:**
- Builds trust with customers before full migration
- Validates Direct Mode data accuracy
- Reduces migration risk
- Provides confidence to switch

---

## User Stories

### US-3.1: One-Click Migration
> **As a customer**, I want to migrate from sGTM to Direct Mode with one click so that I don't have to manually reconfigure my site.

**Acceptance Criteria:**
- [ ] Migration script reads existing sGTM config
- [ ] Auto-populates GA4 credentials (if detectable)
- [ ] Migrates site to `attribution_mode = 'direct'`
- [ ] Preserves historical event data
- [ ] Shows migration progress and completion

### US-3.2: Side-by-Side Mode
> **As a customer**, I want to run both sGTM and Direct modes simultaneously so that I can verify data accuracy before switching.

**Acceptance Criteria:**
- [ ] Site supports `attribution_mode = 'hybrid'`
- [ ] Events sent to both sGTM and Direct
- [ ] Deduplication prevents double-counting
- [ ] Dashboard shows comparison metrics

### US-3.3: Verification Dashboard
> **As a customer**, I want to compare sGTM vs Direct data side-by-side so that I can trust the migration.

**Acceptance Criteria:**
- [ ] Dashboard shows event counts from both modes
- [ ] Dashboard shows conversion counts from both modes
- [ ] Calculates delta (Direct - sGTM)
- [ ] Highlights anomalies (>5% difference)
- [ ] Export comparison data (CSV)

### US-3.4: Instant Rollback
> **As a customer**, I want to instantly switch back to sGTM if Direct Mode has issues so that my tracking isn't interrupted.

**Acceptance Criteria:**
- [ ] Rollback changes `attribution_mode` back to 'sgtm'
- [ ] No data loss during rollback
- [ ] sGTM resumes within 10s
- [ ] Audit log tracks mode changes
- [ ] Automatic rollback on error threshold (optional)

---

## Tasks Breakdown

### T3.1: Migration Script
**File:** `serverless/scripts/migrate-to-direct.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** One-click sGTM → Direct migration

**Implementation Checklist:**
- [ ] Create `migrateSite()` function
- [ ] Read sGTM config from site table
- [ ] Extract GA4 measurement_id from sGTM container URL
- [ ] Generate GA4 API secret (or prompt customer)
- [ ] Update site `attribution_mode` to 'direct'
- [ ] Add migration audit log entry
- [ ] Validate Direct Mode config before committing
- [ ] Handle errors (missing sGTM config, invalid credentials)

**Migration Flow:**
```typescript
interface MigrationResult {
  success: boolean;
  site_id: string;
  old_mode: 'sgtm';
  new_mode: 'direct';
  migrated_at: string;
  warnings: string[];
}

async function migrateSite(
  db: D1Database,
  siteId: string,
  ga4ApiSecret?: string
): Promise<MigrationResult> {
  // 1. Get current site config
  const site = await getSiteConfig(db, siteId);

  // 2. Extract sGTM config
  const sgtmConfig = site.sgtm_config;
  if (!sgtmConfig) throw new Error('No sGTM config found');

  // 3. Detect or set GA4 credentials
  const measurementId = extractMeasurementId(sgtmConfig.container_url);
  const apiSecret = ga4ApiSecret || await generateApiSecret(db, siteId);

  // 4. Update to Direct Mode
  await db.prepare(`
    UPDATE sites
    SET attribution_mode = 'direct',
        ga4_measurement_id = ?,
        ga4_api_secret = ?
    WHERE id = ?
  `).bind(measurementId, apiSecret, siteId).run();

  // 5. Audit log
  await logMigration(db, siteId, 'sgtm', 'direct');

  return { success: true, site_id: siteId, ... };
}
```

---

### T3.2: Side-by-Side Mode
**File:** `serverless/src/services/hybrid-mode.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Run both sGTM and Direct simultaneously

**Implementation Checklist:**
- [ ] Add 'hybrid' to `attribution_mode` ENUM
- [ ] Implement `sendHybrid()` method
- [ ] Forward to sGTM forwarder
- [ ] Forward to Direct uploaders
- [ ] Use deduplication to prevent double-counting
- [ ] Track sent events (sgtm_count, direct_count)

**Hybrid Logic:**
```typescript
async function sendHybrid(
  env: AppEnv['Bindings'],
  siteId: string,
  event: NormalizedEvent
): Promise<HybridResult> {
  const results = await Promise.allSettled([
    forwardToSGTM(env, siteId, event),
    uploadToDirect(env, siteId, event)
  ]);

  const sgtmResult = results[0];
  const directResult = results[1];

  // Log both results
  await logEventResult(env.DB, siteId, event.id, {
    sgtm_success: sgtmResult.status === 'fulfilled',
    direct_success: directResult.status === 'fulfilled',
    sgtm_error: sgtmResult.reason,
    direct_error: directResult.reason
  });

  return {
    sgtm_sent: sgtmResult.status === 'fulfilled',
    direct_sent: directResult.status === 'fulfilled'
  };
}
```

**Migration for hybrid mode:**
```sql
-- Update ENUM to include 'hybrid'
-- Note: SQLite doesn't support ALTER ENUM, recreate table needed
```

---

### T3.3: Verification Dashboard
**File:** `serverless/src/routes/verification.ts`
**Effort:** 4 hours
**Status:** ⏳ Not Started

**Description:** Compare sGTM vs Direct data accuracy

**Implementation Checklist:**
- [ ] Create `GET /api/v1/verification/:siteId` endpoint
- [ ] Query event counts from sGTM (audit logs)
- [ ] Query event counts from Direct (audit logs)
- [ ] Calculate delta and percentage difference
- [ ] Highlight anomalies (>5% variance)
- [ ] Add time range filter (last 24h, 7d, 30d)
- [ ] Add CSV export endpoint
- [ ] Add pagination for large datasets

**API Response:**
```typescript
interface VerificationData {
  site_id: string;
  time_range: { start: string; end: string };
  sgtm: { events_sent: number; conversions: number };
  direct: { events_sent: number; conversions: number };
  delta: { events: number; events_pct: number; conversions: number; conversions_pct: number };
  anomalies: Array<{ metric: string; difference: number; severity: 'low' | 'medium' | 'high' }>;
}
```

**Query for comparison:**
```sql
SELECT
  mode,
  COUNT(*) as event_count,
  COUNT(CASE WHEN event_type IN ('purchase', 'conversion') THEN 1 END) as conversion_count
FROM event_audit_log
WHERE site_id = ? AND created_at BETWEEN ? AND ?
GROUP BY mode;
```

---

### T3.4: Rollback Mechanism
**File:** `serverless/src/routes/attribution-mode.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Instant switch back to sGTM with audit

**Implementation Checklist:**
- [ ] Create `POST /api/v1/sites/:siteId/mode` endpoint
- [ ] Validate mode is valid ('sgtm', 'direct', 'hybrid')
- [ ] Update site `attribution_mode`
- [ ] Log mode change with timestamp
- [ ] Send confirmation email (optional)
- [ ] Add automatic rollback on error threshold

**Rollback Flow:**
```typescript
interface ModeChangeRequest {
  mode: 'sgtm' | 'direct' | 'hybrid';
  reason?: string;
  auto_rollback_on_error?: boolean; // Optional
}

async function changeAttributionMode(
  db: D1Database,
  siteId: string,
  request: ModeChangeRequest
): Promise<void> {
  // 1. Validate
  if (!['sgtm', 'direct', 'hybrid'].includes(request.mode)) {
    throw new Error('Invalid mode');
  }

  // 2. Update site
  await db.prepare(`
    UPDATE sites SET attribution_mode = ? WHERE id = ?
  `).bind(request.mode, siteId).run();

  // 3. Audit log
  await db.prepare(`
    INSERT INTO mode_change_log (site_id, old_mode, new_mode, reason, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(siteId, getOldMode(db, siteId), request.mode, request.reason).run();

  // 4. Set auto-rollback if requested
  if (request.auto_rollback_on_error) {
    await setAutoRollback(db, siteId, 3600); // 1 hour
  }
}
```

**Migration for audit log:**
```sql
CREATE TABLE mode_change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  old_mode TEXT NOT NULL,
  new_mode TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);
CREATE INDEX idx_mode_change_site ON mode_change_log(site_id, created_at);
```

---

### T3.5: Migration Wizard
**File:** `serverless/src/routes/migration.ts`
**Effort:** 2 hours
**Status:** ⏳ Not Started

**Description:** Step-by-step migration wizard

**Implementation Checklist:**
- [ ] Create `POST /api/v1/migration/start` endpoint
- [ ] Create `GET /api/v1/migration/status/:migrationId` endpoint
- [ ] Validate sGTM config exists
- [ ] Detect GA4 measurement_id from sGTM
- [ ] Generate or validate GA4 API secret
- [ ] Run migration in background
- [ ] Return migration ID for status polling
- [ ] Add step-by-step progress updates

**Migration Steps:**
```typescript
interface MigrationStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
}

const MIGRATION_STEPS = [
  { step: 1, name: 'Validating sGTM configuration' },
  { step: 2, name: 'Detecting GA4 credentials' },
  { step: 3, name: 'Setting up Direct Mode' },
  { step: 4, name: 'Sending test event' },
  { step: 5, name: 'Verifying data accuracy' },
  { step: 6, name: 'Completing migration' }
];

async function runMigration(
  env: AppEnv['Bindings'],
  siteId: string
): Promise<string> {
  const migrationId = generateId();

  for (const step of MIGRATION_STEPS) {
    await updateMigrationStatus(env.DB, migrationId, { ...step, status: 'running' });

    try {
      await executeStep(env, siteId, step);
      await updateMigrationStatus(env.DB, migrationId, { ...step, status: 'completed' });
    } catch (error) {
      await updateMigrationStatus(env.DB, migrationId, {
        ...step, status: 'failed', message: error.message
      });
      throw error;
    }
  }

  return migrationId;
}
```

---

### T3.6: Integration Tests
**File:** `serverless/tests/integration/migration.test.ts`
**Effort:** 3 hours
**Status:** ⏳ Not Started

**Description:** End-to-end migration tests

**Implementation Checklist:**
- [ ] Test migration from sGTM to Direct
- [ ] Test migration from Direct to sGTM (rollback)
- [ ] Test hybrid mode (both active)
- [ ] Test verification dashboard accuracy
- [ ] Test migration with missing sGTM config (should fail)
- [ ] Test migration with invalid GA4 credentials (should fail)
- [ ] Test mode switch while events are flowing
- [ ] Test auto-rollback on error

**Coverage Target:** 85%+

---

## Definition of Done

### Code Quality
- [ ] All new code passes `pnpm lint`
- [ ] All new code passes `pnpm types:check`
- [ ] Test coverage ≥85% for migration features
- [ ] No hardcoded migration URLs or keys

### Functionality
- [ ] All user stories acceptance criteria met
- [ ] Migration wizard completes successfully with valid sGTM config
- [ ] Hybrid mode sends events to both sGTM and Direct
- [ ] Verification dashboard accurately compares data
- [ ] Rollback switches modes instantly
- [ ] Mode changes logged for audit trail

### Usability
- [ ] Migration progress is visible in real-time
- [ ] Verification dashboard is easy to understand
- [ ] Rollback is one click
- [ ] Error messages are clear and actionable

### Documentation
- [ ] Migration guide for customers
- [ ] API docs for migration endpoints
- [ ] Verification dashboard usage guide
- [ ] Sprint retrospective notes

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA with real sGTM site
- [ ] Test migration from staging environment

---

## Deliverables

### Code
- [ ] `serverless/scripts/migrate-to-direct.ts`
- [ ] `serverless/src/services/hybrid-mode.ts`
- [ ] `serverless/src/routes/verification.ts`
- [ ] `serverless/src/routes/attribution-mode.ts`
- [ ] `serverless/src/routes/migration.ts`
- [ ] `serverless/migrations/0023_mode_change_log.sql`

### Tests
- [ ] `serverless/tests/unit/migration.test.ts`
- [ ] `serverless/tests/unit/hybrid-mode.test.ts`
- [ ] `serverless/tests/integration/migration.test.ts`

### Documentation
- [ ] AGENTS.md updates (migration, hybrid mode)
- [ ] Customer migration guide (docs/customer-migration-guide.md)
- [ ] API documentation updates
- [ ] Sprint retrospective notes

---

## Dependencies

### Internal
- **Sprint 1:** GA4 Direct Mode ✅ Required for migration
- **Sprint 2:** Conversion Router ✅ Required for hybrid mode
- **Sprint 2:** Deduplication ✅ Required for hybrid mode

### External
- **GA4 MPv2 API:** For test events
- **Customer sGTM:** For migration source

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| Migration fails mid-process | High | Medium | Atomic updates, validation before commit |
| Hybrid mode doubles event count | Medium | High | Deduplication, careful tracking |
| Data accuracy varies >5% | High | Medium | Verification dashboard alerts, manual review |
| Rollback data loss | High | Low | Only change mode, don't delete data |
| Customer confusion | Medium | Medium | Clear UI, step-by-step wizard |

---

## Acceptance Criteria Summary

**Sprint is complete when:**
1. Customer can migrate from sGTM to Direct in one click
2. Hybrid mode runs both sGTM and Direct with deduplication
3. Verification dashboard compares event counts side-by-side
4. Rollback switches modes instantly with audit trail
5. Migration wizard shows real-time progress
6. All integration tests pass with ≥85% coverage
7. Manual QA confirms migration works end-to-end
8. Migration guide is clear and actionable

---

## Success Metrics

| Metric | Target | Measurement |
|--------|---------|-------------|
| Migration success rate | ≥95% | Completed migrations / attempted |
| Hybrid mode accuracy | ≥99% | Deduplication effectiveness |
| Verification dashboard accuracy | 100% | Dashboard vs actual data |
| Rollback success rate | 100% | Mode switches completed |
| Integration test coverage | ≥85% | Vitest coverage report |

---

## Retro Prep (Questions for Sprint Review)

1. Did we achieve our sprint goal?
2. Was migration tool smooth for customers?
3. How accurate was the verification dashboard?
4. Were there any edge cases in hybrid mode?
5. Did customers find rollback easy to use?
6. Are we ready to start Sprint 4?
7. Did we identify any trust issues with customers?

---

## Out of Scope

❌ Attribution model (Sprint 4)
❌ Revenue dashboard (Sprint 4)
❌ Advanced analytics (Sprint 4)
❌ Performance optimization (future sprint)
❌ Multi-tenant enhancements (future sprint)
