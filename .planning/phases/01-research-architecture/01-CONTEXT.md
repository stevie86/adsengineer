# Phase 1: Research & Architecture - Context

**Gathered:** 2026-02-10  
**Status:** Ready for planning

---

## Phase Boundary

Establish technical foundation and detailed planning for two **isolated modules**:

1. **GTM Container Analyzer** - Client-side tool for auditing GTM containers (offline capable)
2. **Grants Compliance Engine** - Backend service for monitoring Google Ads Grants compliance

This phase focuses on architecture decisions, technical design, and planning. Implementation happens in subsequent phases.

---

## Implementation Decisions

### Module Architecture
- **GTM Analyzer is an isolated module** - Separate from grant compliance, can be developed and deployed independently
- **Two deployment variants:**
  - Stand-alone browser tool (subdomain + landing page integration)
  - Dashboard-integrated feature (for authenticated users)

### GTM Analyzer - Stand-alone Version
- **Locations:** Both subdomain (gtm.analytics.com) AND landing page section (/tools/gtm-analyzer)
- **Input methods:** JSON paste + file upload (free), GTM API connection (paid only)
- **Privacy:** 100% client-side, no data sent to servers
- **History:** Recent only (7 days, last 10 analyses) for free tier, unlimited with comparison tools for paid

### GTM Analyzer - Tier Structure
- **Configurable JSON structure** for defining tier features (free vs paid)
- **Analysis depth tiers:**
  - Free: Basic scan (orphaned elements, duplicates)
  - Paid: Comprehensive (custom HTML analysis, GA4 validation, consent mode, recommendations)
- **Report formats based on tiers:**
  - Free: Interactive web view only
  - Paid: Interactive + PDF/Markdown/JSON exports

### Grants Compliance Scoring
- **Scoring approach:** Numerical 0-100 with weighted factors
- **Weighting breakdown:**
  - CTR performance: 40%
  - Conversion activity: 20%
  - Account structure: 20%
  - Policy compliance: 20%
- **Graded interpretation:** A (90-100), B (80-89), C (70-79), D (60-69), F (< 60)

### Alert System Design
- **Frequency:** Configurable by user
  - Check frequency: daily/weekly options
  - Report delivery: daily digest / weekly summary / monthly report
  - Immediate alerts: user-defined thresholds for critical issues
- **Severity levels:** Critical (immediate), Warning (digest), Info (monthly)

### Data Model Strategy
- **Compliance data:** Extend existing D1 schema with new tables
- **Historical retention:** 12 months of compliance scores and alerts
- **GTM analysis results:** Client-side only (no server storage for stand-alone), optional cloud save for dashboard users

### Output Formats
- **GTM Analyzer:** Interactive web report (primary), export options based on tier
- **Compliance Reports:** Web dashboard + email delivery (configurable format)

---

## Specific Ideas

- "GTM analyzer should work offline - like Analytrix CheckUp Helper, completely client-side"
- "Make tiers configurable via JSON so we can adjust what's free vs paid without code changes"
- "Two entry points: quick stand-alone tool for anyone, integrated version for dashboard users with history"
- "Compliance scoring should be numerical 0-100, not just pass/fail - nonprofits need to see trends"

---

## Deferred Ideas

### Grant Claims/Applications Framework
- Helping nonprofits apply for Google Ads Grants
- Application submission workflow
- Approval tracking
- **Status:** Future phase (Phase 7 or later) - outside current scope

### Additional Features (Post-Launch)
- Meta/TikTok compliance monitoring (Phase 7)
- Machine learning anomaly detection (Phase 7)
- Integration with other nonprofit tools (Phase 7)

---

## OpenCode's Discretion

- Exact JSON schema for tier configuration
- Visual design of analysis reports
- Specific threshold values for alert triggers (beyond CTR 5%)
- Database table naming conventions
- API endpoint structure (REST vs GraphQL)
- Caching strategy for compliance checks
- Error handling specifics

---

## Phase 1 Deliverables

1. **Architecture Document**
   - Module separation diagram (GTM analyzer vs Compliance engine)
   - Data flow diagrams
   - API contract specifications

2. **Technical Specifications**
   - GTM JSON parser algorithm design
   - Compliance scoring formula with weights
   - Alert system architecture

3. **Database Schema Design**
   - Compliance tracking tables
   - Alert history tables
   - User preference tables

4. **Tier Configuration Schema**
   - JSON structure for feature tiers
   - Free vs paid feature matrix

---

*Phase: 01-research-architecture*  
*Context gathered: 2026-02-10*
