# Sprint Planning Summary

**Document Location:** `docs/sprints/`
**Total Duration:** 4 weeks
**Goal:** Build Direct Mode alternative to sGTM with full analytics platform

---

## Sprint Overview

| Sprint | Focus | Duration | Effort | Dependencies |
|---------|--------|-----------|-------------|
| **Sprint 1** | MVP Direct GA4 | 1 week | 13h | None |
| **Sprint 2** | Conversion Upgrades | 1 week | 19h | Sprint 1 |
| **Sprint 3** | Migration Tooling | 1 week | 11h | Sprint 1, 2 |
| **Sprint 4** | Advanced Analytics | 1 week | 18h | Sprint 1, 2, 3 |
| **Total** | Full Platform | 4 weeks | **61h** | Sequential |

**Total Implementation Time:** ~61 hours (~2 months at 8h/week)

---

## Sprint Files

| File | Status | Purpose |
|------|--------|---------|
| [sprint-1-mvp-direct-ga4.md](./sprint-1-mvp-direct-ga4.md) | ✅ Created | GA4 MPv2 service, event normalizer, site config |
| [sprint-2-conversion-upgrades.md](./sprint-2-conversion-upgrades.md) | ✅ Created | Conversion router, batch uploaders, deduplication |
| [sprint-3-migration-tooling.md](./sprint-3-migration-tooling.md) | ✅ Created | Migration script, hybrid mode, verification dashboard |
| [sprint-4-advanced-analytics.md](./sprint-4-advanced-analytics.md) | ✅ Created | Attribution models, revenue dashboard, export API |

---

## Critical Path

```
Sprint 1 (13h)
├─ GA4 Measurement Service
├─ Event Normalizer
├─ Site Config Migration
└─ Onboarding Update

Sprint 2 (19h)
├─ Conversion Router
├─ Google Ads Batch Uploader
├─ Meta Batch Uploader
├─ TikTok Batch Uploader
└─ Deduplication Layer

Sprint 3 (11h)
├─ Migration Script
├─ Hybrid Mode
├─ Verification Dashboard
└─ Rollback Mechanism

Sprint 4 (18h)
├─ Touchpoint Tracker
├─ Attribution Model
├─ Revenue Dashboard
└─ Export API
```

---

## Definition of Done (All Sprints)

Each sprint is **complete** when:

### Code Quality
- [ ] All new code passes `pnpm lint`
- [ ] All new code passes `pnpm types:check`
- [ ] Test coverage ≥85% for new code
- [ ] No hardcoded credentials or API keys

### Functionality
- [ ] All user stories acceptance criteria met
- [ ] Manual testing completed
- [ ] Edge cases handled
- [ ] No regressions in existing features

### Documentation
- [ ] Code comments for complex logic
- [ ] AGENTS.md updated
- [ ] API docs updated
- [ ] User-facing guides created (if applicable)

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA checklist completed
- [ ] Load testing performed (if applicable)

---

## Sprint Completion Criteria

### Sprint 1 Complete When:
1. Customer can register site with `attribution_mode = 'direct'`
2. Events from Shopify webhooks normalized to GA4 format
3. Normalized events sent to GA4 via MPv2
4. Events appear in GA4 real-time dashboard
5. All unit tests pass with ≥90% coverage

### Sprint 2 Complete When:
1. Conversion router switches between sGTM and Direct modes
2. Google Ads uploads in batches (100 conversions) with retry
3. Meta uploads in batches (1000 events) with PII hashing
4. TikTok uploads in batches (100 events) with job polling
5. Deduplication prevents duplicate conversions within 24h

### Sprint 3 Complete When:
1. Customer can migrate from sGTM to Direct in one click
2. Hybrid mode runs both sGTM and Direct with deduplication
3. Verification dashboard compares event counts side-by-side
4. Rollback switches modes instantly with audit trail

### Sprint 4 Complete When:
1. Touchpoints tracked for web, ads, and CRM channels
2. Last-click, linear, and time-decay attribution work
3. Revenue dashboard shows accurate attribution by channel
4. Export API returns valid CSV and JSON

---

## Release Readiness

All 4 sprints **complete** when:

### Product
- [ ] Direct Mode fully functional for GA4 + all ad platforms
- [ ] Migration tool enables sGTM → Direct switching
- [ ] Attribution models calculate accurate revenue attribution
- [ ] Revenue dashboard provides real-time analytics

### Technical
- [ ] CI/CD pipeline green (all tests pass)
- [ ] No LSP errors
- [ ] Code coverage ≥85% across all new code
- [ ] Performance targets met (all dashboards ≤1s load)

### Documentation
- [ ] All sprint retrospectives completed
- [ ] API docs updated for all new endpoints
- [ ] User guides created (migration, attribution, export)
- [ ] AGENTS.md updated with all new patterns

### Operations
- [ ] Database migrations applied to production
- [ ] Monitoring/alerts configured for new services
- [ ] Rollback plan documented and tested
- [ ] Support team trained on Direct Mode

---

## Risk Register

| Risk | Impact | Probability | Sprint | Mitigation |
|-------|---------|-----------|------------|
| GA4 API rate limits | Medium | Medium | 1 | Batching, retry with backoff |
| Platform API changes | High | Low | 2 | Monitor, versioned endpoints |
| Attribution inaccuracy | High | Medium | 4 | Multiple models, customer choice |
| Migration data loss | Critical | Medium | 3 | Atomic updates, validation |
| Performance at scale | High | Medium | 4 | Indexing, caching, cleanup |

---

## Success Metrics

**Overall Platform Goals:**

| Metric | Target | Measurement |
|--------|---------|-------------|
| Event success rate | ≥98% | Platform API responses |
| Attribution accuracy | ≥95% | Revenue match vs manual |
| Migration success rate | ≥95% | Completed / attempted |
| Dashboard latency | ≤1s | Revenue dashboard load |
| Export success rate | ≥99% | Export API completion |
| Test coverage | ≥85% | Vitest coverage report |

---

## Next Steps After Sprints

### Phase 5: Production Launch
1. Beta testing with select customers
2. Load testing at scale (10K events/min)
3. Security audit (penetration testing)
4. Performance optimization (caching, batching)
5. Production deployment

### Phase 6: Platform Expansion
1. ML-based data-driven attribution
2. Real-time streaming analytics
3. Predictive analytics (churn, LTV)
4. Customer segmentation engine
5. Multi-touch attribution (beyond 4 touchpoints)

---

## Questions for Kickoff

Before starting Sprint 1, answer:

1. **Have we fixed the CI/CD blocker?** (duplicate class definitions in tiktok-conversions.ts)
2. **Are we using Hybrid or Direct as default?** (recommend Direct for new customers)
3. **What's our target customer volume?** (affects performance requirements)
4. **Do we want to deprecate sGTM long-term?** (or keep as option)
5. **What's our go-live date?** (determines sprint pacing)

---

## Sprint Retrospectives

**After each sprint, document:**

1. **What went well?**
2. **What didn't go well?**
3. **What did we learn?**
4. **What should we start/stop/continue?**
5. **Are we ready for next sprint?**
6. **Did we meet all acceptance criteria?**
7. **What risks emerged?**

---

## Change Log

| Date | Change | Sprint | Author |
|-------|--------|---------|--------|
| 2026-01-17 | Initial sprint planning | All | Sisyphus |

---

## Related Documents

- [Architecture Decision](../architecture-roadmap-sgtm-vs-direct-ga4.md) - sGTM vs Direct comparison
- [Session Summary](../session-summary-2026-01-17.md) - What we built today
- [CI Fix Progress](../ci-fix-progress.md) - Current blocker status
