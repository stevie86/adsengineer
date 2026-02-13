# Requirements: AdsEngineer Phase 1 MVP

**Defined:** 2026-02-13
**Core Value:** A customer can sign up, connect their Google Ads, install tracking, and see their conversion data — end to end, with no manual intervention

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup (Brevo double opt-in)
- [ ] **AUTH-03**: User can log in with email/password and stay logged in
- [ ] **AUTH-04**: JWT session persists with automatic token refresh (proactive before 24h expiry)
- [ ] **AUTH-05**: User can log out from any page
- [ ] **AUTH-06**: Protected routes redirect to login if unauthenticated
- [ ] **AUTH-07**: Auth endpoints have rate limiting (brute-force protection)

### Billing (BILL)

- [ ] **BILL-01**: User can complete Stripe Checkout (hosted page) for subscription
- [ ] **BILL-02**: 3-tier plan enforcement: Starter $99 / Professional $299 / Enterprise $999
- [ ] **BILL-03**: Stripe webhook confirms subscription activation (race-condition-free)
- [ ] **BILL-04**: User can access Stripe Customer Portal to manage subscription

### Security & GDPR (SEC)

- [ ] **SEC-01**: GDPR endpoints require JWT authentication with email ownership check
- [ ] **SEC-02**: hCaptcha replaces reCAPTCHA on all landing page forms
- [ ] **SEC-03**: hCaptcha server-side verification on signup/login endpoints
- [ ] **SEC-04**: Privacy policy discloses Brevo as data processor with DPA link
- [ ] **SEC-05**: ROI calculator includes required business data disclaimers
- [ ] **SEC-06**: Audit logging for sensitive actions (admin, GDPR, billing)
- [ ] **SEC-07**: Cloudflare Workers default to EU region (per-customer override available)

### Dashboard (DASH)

- [ ] **DASH-01**: Dashboard connects to real auth context (no hardcoded test-agency-id)
- [ ] **DASH-02**: Live conversion count from /api/v1/analytics/
- [ ] **DASH-03**: Sync status indicator showing last sync time and connection health
- [ ] **DASH-04**: Conversion list (table) with platform, timestamp, value
- [ ] **DASH-05**: Empty states with guided CTAs when no data exists

### Onboarding (ONBOARD)

- [ ] **ONBOARD-01**: Site setup wizard allows user to add domain via /api/v1/onboarding/site-setup
- [ ] **ONBOARD-02**: Tracking snippet page displays generated snippet with copy button
- [ ] **ONBOARD-03**: Installation instructions are clear and platform-specific
- [ ] **ONBOARD-04**: Installation verification button confirms snippet is firing
- [ ] **ONBOARD-05**: Google Ads OAuth connection flow is functional

### Landing Page (LAND)

- [ ] **LAND-01**: Waitlist form uses Brevo doubleOptin: true
- [ ] **LAND-02**: All forms use hCaptcha instead of reCAPTCHA
- [ ] **LAND-03**: Privacy policy rewritten with GDPR compliance
- [ ] **LAND-04**: Signup CTAs connect to dashboard signup flow

## v2 Requirements (Deferred)

### Dashboard Enhancements

- **DASH-06**: Basic line chart (conversions over 7d/30d)
- **DASH-07**: Platform pie chart (Google/Meta/TikTok breakdown)
- **DASH-08**: Multi-site management (agencies tracking multiple clients)

### Onboarding Enhancements

- **ONBOARD-06**: Multi-step wizard with progress indicator
- **ONBOARD-07**: Setup persistence (resume if user leaves mid-setup)
- **ONBOARD-08**: Meta/TikTok OAuth connection flows
- **ONBOARD-09**: Installation video walkthroughs (60s Loom per platform)

### Platform Integrations

- **INTEG-01**: Shopify app integration (one-click install)
- **INTEG-02**: WooCommerce plugin integration
- **INTEG-03**: Server-side GTM forwarding

### Notifications

- **NOTIF-01**: First conversion celebration email
- **NOTIF-02**: Sync failure error notifications
- **NOTIF-03**: Weekly digest reports

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom analytics dashboards | Scope explosion, delays launch — defer to v2 |
| White-label / rebrand | Complex licensing, support burden — not core value |
| Built-in A/B testing | Different product category — defer indefinitely |
| Heatmaps / session replay | Massive storage costs, privacy nightmare — never build |
| Predictive analytics | Requires massive dataset, overpromises — defer to v3+ |
| Real-time WebSocket updates | Overkill for MVP — start with polling, upgrade if needed |
| Team collaboration / roles | Retention feature, not activation — defer to v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| BILL-01 | Phase 1 | Pending |
| BILL-02 | Phase 1 | Pending |
| BILL-03 | Phase 1 | Pending |
| BILL-04 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 1 | Pending |
| SEC-07 | Phase 1 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 1 | Pending |
| DASH-03 | Phase 1 | Pending |
| DASH-04 | Phase 1 | Pending |
| DASH-05 | Phase 1 | Pending |
| ONBOARD-01 | Phase 1 | Pending |
| ONBOARD-02 | Phase 1 | Pending |
| ONBOARD-03 | Phase 1 | Pending |
| ONBOARD-04 | Phase 1 | Pending |
| ONBOARD-05 | Phase 1 | Pending |
| LAND-01 | Phase 1 | Pending |
| LAND-02 | Phase 1 | Pending |
| LAND-03 | Phase 1 | Pending |
| LAND-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32 (Phase 1)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after scoping with user*
