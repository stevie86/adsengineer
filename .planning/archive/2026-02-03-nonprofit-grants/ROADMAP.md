# AdsEngineer Nonprofit Grants Compliance Add-On - Roadmap

**Version:** 1.0  
**Created:** 2026-02-10  
**Last Updated:** 2026-02-10

---

## Overview

This roadmap outlines the phased development of the Nonprofit Grants Compliance Add-On for AdsEngineer. Each phase builds upon the previous, delivering incremental value while maintaining a stable, compliant system.

**Approach:** Research-first, then implementation in vertical slices  
**Estimated Duration:** 8-12 weeks (depending on team velocity)  
**Dependencies:** AdsEngineer core platform (existing)

---

## Phase Structure

### Phase 1: Research & Architecture
**Goal:** Establish technical foundation and detailed planning  
**Duration:** 1-2 weeks  
**Deliverable:** Phase 1 PLAN.md with architecture decisions

**Objectives:**
1. Document detailed Grants compliance requirements and scoring algorithm
2. Design GTM container JSON parser architecture
3. Define database schema extensions for compliance tracking
4. Design compliance scoring algorithm (weighted factors)
5. Plan API endpoints and data models
6. Design alert/notification system architecture
7. Define nonprofit dashboard UX requirements

**Success Criteria:**
- [ ] Compliance scoring algorithm documented
- [ ] GTM analyzer technical design complete
- [ ] Database schema designed
- [ ] API contract defined
- [ ] Architecture review completed

---

### Phase 2: Core Compliance Engine
**Goal:** Build Google Ads Grants compliance monitoring system  
**Duration:** 2-3 weeks  
**Dependencies:** Phase 1 completion

**Objectives:**
1. **Google Ads API Integration**
   - Extend existing google-ads.ts service
   - Add compliance metrics fetching (CTR, conversion count, account structure)
   - Implement OAuth scope for compliance data access

2. **Compliance Monitoring Service**
   - Create `grants-compliance.ts` service
   - CTR monitoring (5% threshold tracking)
   - Account structure validation
   - Policy violation detection
   - Historical compliance data storage

3. **Scoring Engine**
   - Implement weighted compliance scoring algorithm
   - Risk level classification (critical/warning/info)
   - Trend analysis and forecasting
   - Compliance health score calculation

4. **Alert System**
   - Threshold-based alerting (CTR drops, violations detected)
   - Alert severity classification
   - Alert history tracking
   - Multi-channel notifications (email, dashboard)

**Success Criteria:**
- [ ] Compliance metrics successfully fetched from Google Ads API
- [ ] CTR monitoring tracks 5% threshold accurately
- [ ] Account structure validator identifies violations
- [ ] Compliance scores calculated correctly
- [ ] Alerts triggered on threshold breaches
- [ ] Unit tests pass (>80% coverage)

---

### Phase 3: GTM Container Analyzer
**Goal:** Build client-side GTM container analysis tool  
**Duration:** 2-3 weeks  
**Dependencies:** Phase 2 completion (or can be parallel)

**Objectives:**
1. **GTM JSON Parser**
   - Parse GTM container export JSON format
   - Extract tags, triggers, variables, folders
   - Build relationship graph (tag → trigger → variable)

2. **Orphaned Element Detection**
   - Identify tags with no firing triggers
   - Find triggers not assigned to any tags
   - Detect unused variables
   - Identify empty folders
   - Recursive dependency analysis

3. **Duplicate Detection**
   - Compare trigger configurations for duplicates
   - Find identical variable definitions
   - Detect duplicate tag configurations
   - Report redundant elements

4. **Custom HTML Analysis**
   - Parse Custom HTML tag content
   - Detect dangerous patterns (document.write, eval, etc.)
   - Identify deprecated GTM macros
   - Check for best practice violations
   - Security risk assessment

5. **GA4 Setup Validation**
   - Extract all GA4 events from tags
   - Validate Measurement ID consistency
   - Check parameter usage patterns
   - Identify duplicate event tracking
   - Server-side tagging validation

6. **Client-Side Tool**
   - Browser-based analyzer (no data sent to servers)
   - JSON paste/upload interface
   - Visual report generation
   - Exportable findings report
   - Actionable recommendations

**Success Criteria:**
- [ ] GTM JSON parser handles all standard container formats
- [ ] Orphaned detection finds 100% of unused elements
- [ ] Duplicate detection identifies identical configurations
- [ ] Custom HTML analysis flags dangerous code
- [ ] GA4 validation catches setup inconsistencies
- [ ] Tool runs entirely client-side (no external data transmission)
- [ ] Report is actionable and clear

---

### Phase 4: Website Health Monitoring
**Goal:** Implement website conversion health checks  
**Duration:** 2-3 weeks  
**Dependencies:** Phase 2 completion

**Objectives:**
1. **Tracking Presence Validation**
   - GTM container detection on nonprofit websites
   - AdsEngineer tracking snippet verification
   - Google Ads conversion tracking validation
   - GA4 property presence check

2. **Core Web Vitals Monitoring**
   - LCP (Largest Contentful Paint) tracking
   - FID (First Input Delay) measurement
   - CLS (Cumulative Layout Shift) monitoring
   - Page speed score tracking
   - Mobile performance assessment

3. **Mobile Usability Checks**
   - Mobile responsiveness validation
   - Viewport configuration check
   - Touch target sizing verification
   - Mobile page speed analysis

4. **Donation Flow Integrity**
   - Conversion funnel tracking validation
   - Payment form field detection
   - Thank-you page tracking verification
   - Conversion pixel firing validation

5. **Health Scoring**
   - Aggregate health score calculation
   - Issue prioritization matrix
   - Historical trend tracking
   - Benchmark comparison

**Success Criteria:**
- [ ] Tracking presence accurately detected
- [ ] Core Web Vitals measured correctly
- [ ] Mobile issues identified
- [ ] Donation flow tracking validated
- [ ] Health scores meaningful and actionable
- [ ] Weekly health reports generated

---

### Phase 5: Dashboard & Reporting
**Goal:** Build nonprofit-facing UI and reporting system  
**Duration:** 2-3 weeks  
**Dependencies:** Phases 2-4 completion

**Objectives:**
1. **Nonprofit Dashboard**
   - Compliance status overview widget
   - Health metrics visualization
   - Alert history and resolution tracking
   - Quick-action recommendations
   - Account connection management

2. **Alert Management Interface**
   - Alert inbox with filtering/sorting
   - Alert detail view with context
   - Alert resolution workflow
   - Escalation rules configuration

3. **GTM Analyzer Interface**
   - Container JSON upload/paste
   - Analysis results visualization
   - Issue categorization and severity
   - Exportable audit reports
   - Historical analysis comparison

4. **Reporting System**
   - Scheduled compliance reports
   - Weekly health summaries
   - Custom report builder
   - PDF/email export options
   - Report delivery automation

5. **Expert Review Workflow**
   - Review request submission
   - Expert assignment interface
   - Review status tracking
   - Review report delivery
   - Feedback loop integration

**Success Criteria:**
- [ ] Dashboard loads in <3 seconds
- [ ] All metrics visualized clearly
- [ ] Alerts manageable and actionable
- [ ] Reports generate successfully
- [ ] Expert workflow functional end-to-end
- [ ] Mobile-responsive design

---

### Phase 6: Integration & Launch
**Goal:** Final integration testing and production launch  
**Duration:** 1-2 weeks  
**Dependencies:** All previous phases

**Objectives:**
1. **Integration Testing**
   - End-to-end workflow testing
   - Google Ads API integration validation
   - GTM analyzer accuracy testing
   - Performance testing under load

2. **Security Audit**
   - OAuth scope review
   - Data encryption validation
   - API endpoint security testing
   - Client-side tool privacy verification

3. **Documentation**
   - User documentation for nonprofits
   - API documentation for developers
   - Admin guide for expert reviewers
   - GTM analyzer user guide

4. **Launch Preparation**
   - Production environment setup
   - Monitoring and alerting configuration
   - Rollback plan preparation
   - Beta user onboarding

**Success Criteria:**
- [ ] All integration tests pass
- [ ] Security audit completed
- [ ] Documentation complete and reviewed
- [ ] Beta users successfully onboarded
- [ ] Production deployment successful

---

## Dependencies & Constraints

### Technical Dependencies
- AdsEngineer core platform (existing)
- Google Ads API v21+ access
- Cloudflare Workers/D1/KV (existing infrastructure)
- React frontend (existing)

### External Dependencies
- Google Ads Grants program policies (may change)
- GTM container JSON format (stable)
- Google PageSpeed Insights API (for Core Web Vitals)

### Constraints
- Must use existing OAuth + encryption patterns
- Must align with AdsEngineer stack
- GTM analyzer must be client-side only (privacy)
- Must handle Google API rate limits gracefully

---

## Risk Mitigation

| Risk | Phase | Mitigation |
|------|-------|-----------|
| Google Ads API changes | 2 | Abstract API client, monitor changelogs |
| Grants policy updates | 2 | Externalize policy rules as configuration |
| Complex scoring algorithm | 1-2 | Prototype first, validate with domain experts |
| GTM JSON complexity | 3 | Comprehensive test suite with real containers |
| Performance issues | 4 | Async processing, caching, rate limiting |

---

## Success Metrics

### Technical Metrics
- Compliance detection accuracy: >95%
- GTM analyzer false positive rate: <5%
- Dashboard load time: <3 seconds
- API response time: <500ms (p95)

### Business Metrics
- Nonprofit adoption rate
- Compliance issue detection rate
- Alert response time
- Expert review utilization
- User satisfaction score (NPS)

---

## Post-Launch

### Phase 7: Iteration & Enhancement (Post-Launch)
- User feedback integration
- Additional platform support (Meta, TikTok compliance)
- Advanced analytics and insights
- Machine learning for anomaly detection
- Integration with other nonprofit tools

---

*Roadmap Version 1.0 - Subject to iteration based on Phase 1 findings*
