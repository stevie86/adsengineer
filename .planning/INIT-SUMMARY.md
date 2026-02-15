# AdsEngineer Phase 1 MVP — Initialization Summary

**Date:** 2026-02-13  
**Session:** Project initialization (`/gsd-new-project`)

---

## What Happened

Archived the previous Nonprofit Grants Compliance project and re-initialized AdsEngineer as a single-phase MVP focused on shipping the product to first customer.

### Previous State
- Backend: 6/10 (20 routes, 33 services, 206 tests)
- Frontend: 2/10 (scaffold, hardcoded test data)
- Overall: 3/10 — 0 of 7 customer journey steps functional
- 100+ strategy docs, 0 customers

### New Direction
Stop planning. Start shipping. Complete the last mile.

---

## Artifacts Created

| File | Lines | Purpose |
|------|-------|---------|
| `.planning/PROJECT.md` | 62 | Project context, core value, constraints, decisions |
| `.planning/config.json` | 38 | Workflow config (YOLO mode, balanced models, all agents) |
| `.planning/REQUIREMENTS.md` | 142 | 32 requirements with REQ-IDs across 6 categories |
| `.planning/ROADMAP.md` | 202 | Single-phase 8-week roadmap with execution order |
| `.planning/STATE.md` | 105 | Current project state, progress tracker |
| `.planning/research/STACK.md` | 1,048 | hCaptcha, Stripe Checkout, Brevo, React auth patterns |
| `.planning/research/FEATURES.md` | 826 | Table stakes vs differentiators for SaaS MVP |
| `.planning/research/ARCHITECTURE.md` | 1,479 | React-to-Hono integration, auth flows, component structure |
| `.planning/research/PITFALLS.md` | 822 | Brownfield shipping mistakes, GDPR gotchas, Stripe races |
| `.planning/research/PATTERNS.md` | 478 | Quick reference integration patterns |
| `.planning/research/SUMMARY.md` | 428 | Unified synthesis with roadmap implications |
| `.planning/archive/` | — | Previous nonprofit project preserved |

**Total research:** 5,404 lines across 7 documents

---

## Three Pillars

### 1. Security & GDPR Hardening
- Auth on GDPR endpoints (currently zero authentication)
- hCaptcha replacing reCAPTCHA (EU-compliant)
- hCaptcha server-side verification
- Brevo double opt-in (currently single)
- Privacy policy rewrite (Brevo disclosure, DPA link, disclaimers)
- Audit logging
- Cloudflare Workers locked to EU region by default

### 2. Real-Data Dashboard
- Kill hardcoded `test-agency-id` in Dashboard.tsx
- Connect to real JWT auth context
- Live conversion count from `/api/v1/analytics/`
- Sync status indicator
- Conversion list table
- Empty states with guided CTAs

### 3. Self-Service Onboarding
- Stripe Checkout (hosted page) for 3 tiers ($99/$299/$999)
- Site setup wizard via `/api/v1/onboarding/site-setup`
- Tracking snippet page with copy button
- Installation verification
- Google Ads OAuth connection

---

## Requirements Summary (32 total)

| Category | Count | Key Items |
|----------|-------|-----------|
| AUTH | 7 | Signup, JWT, protected routes, token refresh, rate limiting |
| BILL | 4 | Stripe Checkout, 3-tier plans, webhooks, Customer Portal |
| SEC | 7 | GDPR auth, hCaptcha, privacy policy, EU Workers, audit log |
| DASH | 5 | Real auth, live analytics, sync status, conversions, empty states |
| ONBOARD | 5 | Site wizard, snippet page, verification, OAuth, instructions |
| LAND | 4 | hCaptcha, double opt-in, privacy rewrite, signup CTAs |

---

## Execution Order (8 Weeks)

```
Week 1    Auth Foundation (JWT, AuthContext, protected routes)
Week 2    Security & GDPR (endpoint auth, hCaptcha, privacy policy)
Week 3    Billing (Stripe Checkout, webhook fix, Customer Portal)
Week 4    Dashboard (kill test data, live analytics, empty states)
Week 5-6  Onboarding (site wizard, snippet page, OAuth, verification)
Week 7-8  Polish & Docs (audit logging, EU region, MkDocs, QA)
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| hCaptcha (not Friendly Captcha) | Free tier, wider adoption |
| EU Workers region default | GDPR data residency |
| Stripe hosted Checkout | Avoid PCI certification ($10K-50K/yr) |
| React Context (not Redux) | Sufficient for JWT auth state |
| Single-phase MVP | "Stop planning. Start shipping." |
| Archived nonprofit project | Focus on core product first |

---

## Top 5 Risks

1. **Auth integration theater** — Dashboard hardcodes test IDs → fix Week 1
2. **Stripe webhook race conditions** — Concurrent writes → idempotency keys Week 3
3. **GDPR endpoint exposure** — Unauthenticated data export → auth middleware Week 2
4. **hCaptcha server-side skip** — Frontend widget without backend verify → fix Week 2
5. **Onboarding abandonment** — 63% churn without wizard → build Weeks 5-6

---

## Model Configuration

| Stage | Model |
|-------|-------|
| Planning | anthropic/claude-sonnet-4-5 |
| Execution | anthropic/claude-sonnet-4 |
| Verification | anthropic/claude-sonnet-4 |

**Profile:** Balanced | **Mode:** YOLO | **Agents:** Research ✓ Plan Check ✓ Verifier ✓

---

## Next Step

```
/gsd-plan-phase 1
```

Start with `/new` for a fresh context window.

---

*Generated: 2026-02-13 after project initialization*
