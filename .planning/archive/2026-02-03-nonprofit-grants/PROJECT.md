# AdsEngineer Nonprofit Grants Compliance Add-On

## What This Is

An AdsEngineer add-on for nonprofits that continuously monitors Google Ads Grants compliance and website conversion health. It combines automated checks with optional expert review to keep accounts qualified, fix red flags quickly, and protect ongoing grant status.

## Core Value

Nonprofits stay Grants-compliant with reliable conversions through continuous monitoring and actionable remediation.

## Requirements

### Validated

- ✓ Accurate conversion tracking and attribution via AdsEngineer — existing
- ✓ Google Ads integration with OAuth credential storage — existing
- ✓ Real-time monitoring and alerting infrastructure — existing

### Active

- [ ] Continuous Grants compliance monitoring with account-level alerts (CTR, conversion activity, policy/structure issues)
- [ ] Website conversion health checks (tracking presence, Core Web Vitals, mobile usability, donation flow integrity)
- [ ] Automated red-flag analysis with recommended fixes and prioritization
- [ ] Hybrid workflow: automated alerts + optional expert review/reporting
- [ ] Nonprofit-facing dashboards and scheduled reports tailored to Grants requirements
- [ ] GTM Container Analyzer - Client-side tool (similar to Analytrix GTM CheckUp Helper) that analyzes GTM container exports without sending data to servers, identifies orphaned tags/triggers/variables, detects duplicate elements, validates GA4 setup consistency, analyzes custom HTML for issues

### Out of Scope

- Full-service ad creative management — focus is compliance and conversion health
- Grant application submission services — focus is ongoing qualification and maintenance

## Context

- Existing AdsEngineer platform provides conversion tracking, multi-platform integrations, and monitoring.
- Target audience: nonprofits running Google Ads Grants who need compliance visibility and conversion reliability.
- This add-on is a portfolio expansion, not a separate product.

## Constraints

- **Tech Stack**: Must align with AdsEngineer stack (Cloudflare Workers, Hono, D1, React, pnpm)
- **Security**: Must use existing OAuth + encrypted credential storage patterns
- **Compliance**: Must surface Grants-specific requirements and alert thresholds

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Add-on to AdsEngineer | Leverages existing conversion and Ads integrations | — Pending |
| Hybrid service model | Combine automation with expert review for trust | — Pending |
| Subscription pricing tiers | Fits monitoring + advisory value over time | — Pending |

---
*Last updated: 2026-02-03 after initialization*
