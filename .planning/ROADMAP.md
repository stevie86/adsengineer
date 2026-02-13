# AdsEngineer Phase 1 MVP — Roadmap

**Version:** 1.0  
**Created:** 2026-02-13  
**Last Updated:** 2026-02-13

---

## Overview

This roadmap completes the "last mile" for AdsEngineer — transforming a 6/10 backend into a shippable MVP. The work focuses on three pillars:

1. **Security & GDPR Hardening** — Legal compliance before EU launch
2. **Real-Data Dashboard** — Connect scaffold frontend to working backend
3. **Self-Service Onboarding** — End-to-end signup → tracking → first conversion

**Duration:** 6-8 weeks (1 phase, 32 requirements)  
**Dependencies:** Existing backend (Hono API, 206 tests passing)  
**Target:** First customer enrollment

---

## Phase 1: Foundation & MVP (Weeks 1-8)

**Goal:** A customer can sign up, connect their Google Ads, install tracking, and see their conversion data — end to end, with no manual intervention.

**Philosophy:** Ship what's needed. No more strategy docs, no more planning. Build what makes a customer able to use this product.

### Success Criteria

| # | Criterion | Evidence Required |
|---|-----------|-------------------|
| 1 | User completes signup → email verification → subscription → login in <5 minutes | End-to-end video recording, Stripe test mode transaction |
| 2 | Dashboard shows user's real conversion data (not hardcoded test IDs) | Screenshot with org_id matching JWT payload, no `test-agency-id` in codebase |
| 3 | GDPR endpoints require authentication (email ownership verified) | API test: unauthorized request returns 401, authorized request returns data |
| 4 | Snippet installation page displays live snippet with copy button and verification | User can copy snippet, paste on site, click "Verify" and see success |
| 5 | Google Ads OAuth connection works end-to-end | User connects account, sees "Connected" status, conversions sync |

### Requirements Covered

**Authentication (AUTH):**
- AUTH-01: Email/password signup
- AUTH-02: Email verification (Brevo double opt-in)
- AUTH-03: JWT login session
- AUTH-04: Token refresh (proactive before 24h expiry)
- AUTH-05: Logout functionality
- AUTH-06: Protected routes (React Router guards)
- AUTH-07: Rate limiting on auth endpoints

**Billing (BILL):**
- BILL-01: Stripe Checkout (hosted page)
- BILL-02: 3-tier plan enforcement ($99/$299/$999)
- BILL-03: Stripe webhook subscription activation
- BILL-04: Customer Portal access

**Security & GDPR (SEC):**
- SEC-01: GDPR endpoint authentication
- SEC-02: hCaptcha on landing page (replace reCAPTCHA)
- SEC-03: hCaptcha server-side verification
- SEC-04: Privacy policy rewrite (Brevo disclosure, DPA link)
- SEC-05: ROI calculator disclaimers
- SEC-06: Audit logging
- SEC-07: EU Workers region lock

**Dashboard (DASH):**
- DASH-01: Real auth context (kill test-agency-id)
- DASH-02: Live conversion count
- DASH-03: Sync status indicator
- DASH-04: Conversion list (table)
- DASH-05: Empty states with CTAs

**Onboarding (ONBOARD):**
- ONBOARD-01: Site setup wizard
- ONBOARD-02: Tracking snippet page
- ONBOARD-03: Installation instructions
- ONBOARD-04: Installation verification
- ONBOARD-05: Google Ads OAuth connection

**Landing Page (LAND):**
- LAND-01: Brevo double opt-in
- LAND-02: hCaptcha forms
- LAND-03: Privacy policy rewrite
- LAND-04: Signup CTA to dashboard

### Technical Execution Order

```
Week 1: Auth Foundation
├── Backend: Auth endpoints with rate limiting
├── Frontend: AuthContext + useAuth hook
├── Frontend: ProtectedRoute component
└── Testing: Auth flow E2E tests

Week 2: Security & GDPR  
├── Backend: GDPR endpoint authentication (SEC-01)
├── Backend: hCaptcha verification middleware
├── Landing: hCaptcha integration (replace reCAPTCHA)
├── Landing: Brevo double opt-in
└── Docs: Privacy policy rewrite

Week 3: Billing Integration
├── Backend: Stripe webhook idempotency fix
├── Frontend: Plan selection page
├── Frontend: Stripe Checkout redirect
├── Frontend: Customer Portal link
└── Testing: Payment flow E2E tests

Week 4: Dashboard Real Data
├── Backend: Ensure analytics endpoints filter by org_id
├── Frontend: Kill test-agency-id, implement JWT auth
├── Frontend: Live conversion count
├── Frontend: Sync status indicator
└── Frontend: Conversion list with empty states

Week 5-6: Onboarding Wizard
├── Frontend: Site setup wizard (stepper)
├── Frontend: Tracking snippet page with copy button
├── Frontend: Installation verification button
├── Frontend: Platform OAuth connection UI
└── Testing: End-to-end onboarding flow

Week 7-8: Polish & Documentation
├── Backend: Audit logging implementation
├── Backend: EU Workers region lock
├── Frontend: Error handling, loading states
├── Frontend: Mobile responsive pass
├── Docs: UI-to-Backend mapping in MkDocs
└── QA: All 206 existing tests passing + new tests
```

### Deliverables

| Deliverable | Location | Definition of Done |
|-------------|----------|-------------------|
| Working auth flow | `frontend/src/context/AuthContext.tsx` | User can signup → verify → login → stay logged in (24h+) |
| Protected dashboard | `frontend/src/pages/Dashboard.tsx` | Shows real data filtered by org_id, no hardcoded IDs |
| GDPR compliance | `serverless/src/routes/gdpr.ts` | All endpoints require JWT + ownership check |
| Stripe billing | `frontend/src/pages/Billing.tsx` | Checkout works, webhook activates subscription, no race conditions |
| Onboarding wizard | `frontend/src/pages/Onboarding/` | 4-step wizard: Account → Site → Snippet → Platform |
| Tracking snippet page | `frontend/src/pages/Snippet.tsx` | Displays snippet, copy button, verification, install guide |
| Privacy policy | `landing-page/src/pages/privacy-policy.astro` | GDPR-compliant, Brevo disclosure, DPA link, disclaimers |
| UI docs | `docs/ui-backend-mapping.md` | All API endpoints mapped to UI components |

### Anti-Goals (What We're NOT Building)

- ❌ Fancy analytics visualizations (line charts, pie charts) — basic counts first
- ❌ Onboarding videos — text instructions only for v1
- ❌ Meta/TikTok OAuth — Google Ads only for v1
- ❌ Team collaboration / multi-user — single user per org
- ❌ Real-time updates via WebSocket — polling is fine
- ❌ Advanced dashboard customization — one view fits all
- ❌ Mobile app — web-first, responsive only
- ❌ White-label / rebrand — not core value
- ❌ A/B testing features — different product

### Risk Mitigation

| Risk | Mitigation | Owner |
|------|------------|-------|
| Stripe webhook race conditions | Idempotency keys + webhook-only writes | Week 3 |
| JWT auth complexity | Use existing backend middleware, match token format | Week 1 |
| GDPR legal exposure | Authenticate ALL endpoints before launch | Week 2 |
| hCaptcha integration failure | Test both frontend widget + backend verification | Week 2 |
| Dashboard empty state confusion | Guided CTAs, not blank screens | Week 4 |
| OAuth flow breakage | Test with real Google Ads account, not mocks | Week 6 |
| Test regression | CI/CD gate, all 206 existing tests must pass | Every week |

### Completion Checklist

- [ ] User can complete full signup flow in <5 minutes
- [ ] Dashboard shows real conversion data (verified against database)
- [ ] GDPR endpoints require authentication (401 test passes)
- [ ] hCaptcha works on all forms (frontend + backend verification)
- [ ] Stripe billing works end-to-end (test mode transaction + webhook)
- [ ] Onboarding wizard guides user to first conversion
- [ ] All 206 existing tests passing
- [ ] New features have >80% test coverage
- [ ] UI-to-Backend mapping documented in MkDocs
- [ ] Privacy policy reviewed and compliant

---

## Post-Phase 1 (Future Work)

**Phase 2: Onboarding UX Polish (2-4 weeks)**
- Multi-step wizard with progress indicator
- Installation verification with real-time test
- Meta/TikTok OAuth connections
- First-conversion celebration email
- Basic analytics charts (line chart, pie chart)

**Phase 3: Growth Features (8-12 weeks)**
- Multi-site management for agencies
- Team collaboration with roles
- Shopify app integration
- Server-side GTM forwarding
- Weekly digest email reports

---

*Roadmap Version 1.0 — Single phase MVP to first customer*
