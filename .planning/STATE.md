# AdsEngineer Nonprofit Grants Compliance Add-On - State

**Last Updated:** 2026-02-10  
**Current Phase:** 1 - Research & Architecture  
**Status:** In Progress

---

## Current Position

**Project Phase:** Phase 1 - Research & Architecture  
**Phase Status:** Active  
**Active Task:** Research Grants compliance requirements and GTM analyzer features  
**Next Action:** Complete Phase 1 planning document

---

## Progress Summary

### ✅ Completed

| Item | Date | Details |
|------|------|---------|
| PROJECT.md created | 2026-02-03 | Requirements defined, including GTM analyzer feature |
| Codebase documentation | 2026-02-03 | STRUCTURE.md, CONCERNS.md, ARCHITECTURE.md, INTEGRATIONS.md, TESTING.md, STACK.md, CONVENTIONS.md |
| PROJECT_ANALYSIS.md | 2026-02-10 | Comprehensive project analysis with recommendations |
| Research: Grants compliance | 2026-02-10 | CTR 5% minimum, account structure requirements, policy rules |
| Research: GTM analyzer | 2026-02-10 | JSON structure, orphaned detection, duplicate finder, GA4 validation |

### 🔄 In Progress

| Item | Started | ETA |
|------|---------|-----|
| STATE.md | 2026-02-10 | Now |
| ROADMAP.md | 2026-02-10 | Now |
| Phase 1 planning | 2026-02-10 | After roadmap |

### ⏳ Pending

| Item | Blocked By | ETA |
|------|-----------|-----|
| Phase 1 execution | Phase 1 planning | TBD |
| Core compliance engine | Phase 1 complete | TBD |
| GTM analyzer implementation | Phase 1 complete | TBD |

---

## Key Decisions Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-02-03 | Add-on to AdsEngineer | Leverages existing conversion and Ads integrations | Confirmed |
| 2026-02-03 | Hybrid service model | Combine automation with expert review for trust | Confirmed |
| 2026-02-03 | Subscription pricing tiers | Fits monitoring + advisory value over time | Pending implementation |
| 2026-02-10 | Include GTM Container Analyzer | Client-side tool for nonprofits to audit tracking setup | Added to requirements |
| 2026-02-10 | Complete planning structure first | Reduces risk, enables systematic execution | In progress |

---

## Research Findings

### Google Ads Grants Compliance

**Critical Metrics:**
- **CTR Requirement:** 5% account-wide minimum (rolling 30-day average)
- **Consequence:** Account suspension until requirement met
- **Monitoring:** Weekly checks recommended

**Account Structure Requirements:**
- Proper geo-targeting (specific locations)
- Single account only (no multiples)
- Valid billing setup (no credit card promos)
- Meaningful conversion tracking (1+ conversion/month)

**Policy Rules:**
- No single-word keywords (except branded)
- No overly generic keywords
- Keywords must be mission-specific
- Proper sitelinks and ad assets required

### GTM Container Analyzer Features

**Core Capabilities (based on Analytrix CheckUp Helper):**

1. **Orphaned Element Detection (recursive)**
   - Tags with no triggers
   - Triggers not used by any tags
   - Variables not referenced
   - Empty folders

2. **Custom HTML Analysis**
   - Dangerous script detection
   - Deprecated code patterns
   - Best practice violations

3. **Duplicate Detection**
   - Identical triggers
   - Identical variables
   - Duplicate tag configurations

4. **GA4 Setup Validation**
   - GA4 event list generation
   - Parameter consistency
   - Server-side configuration
   - Measurement ID validation

5. **Privacy/Compliance Checks**
   - Consent mode implementation
   - GDPR/CCPA indicators

---

## Blockers & Issues

### Active Blockers

None currently.

### Potential Concerns

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Google Ads API changes | High | Abstract API client, monitor changelogs |
| Grants policy updates | Medium | Build policy as configuration |
| GTM JSON schema changes | Low | GTM API is stable |

---

## Environment

**Mode:** YOLO (fast iteration, accept risks)  
**Profile:** Balanced (planning: glm-4.7-free, execution: minimax-m2.1-free)  
**Workflow:** Research + Plan Check + Verifier enabled

---

## Notes

- Codebase documentation is comprehensive and current (2026-02-03)
- Existing AdsEngineer platform provides strong foundation
- GTM analyzer should be client-side (no data sent to servers) as requested
- Phase 1 should focus on: compliance scoring algorithm design, GTM parser architecture, and technical planning

---

*Next Update: After ROADMAP.md creation and Phase 1 planning*
