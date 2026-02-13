# AdsEngineer Phase 1 MVP

## What This Is

AdsEngineer is an enterprise conversion tracking SaaS for e-commerce platforms (Shopify, WooCommerce, custom sites). The backend has genuine engineering depth — billing, Google Ads upload, multi-platform support, encryption, queue management — but there is no usable product a customer can touch. This project completes the last mile: connecting backend to frontend into a shippable, revenue-generating product.

## Core Value

A customer can sign up, connect their Google Ads, install tracking, and see their conversion data — end to end, with no manual intervention.

## Requirements

### Validated

- ✓ Hono API on Cloudflare Workers with 20 route files, 33 services — existing
- ✓ Google Ads conversion upload with OAuth2, retry mechanism — existing (`serverless/src/services/google-ads.ts`)
- ✓ Stripe billing with 3 tiers (Starter $99, Professional $299, Enterprise $999) — existing (`serverless/src/routes/billing.ts`)
- ✓ JWT auth middleware + HMAC webhook validation — existing (`serverless/src/middleware/auth.ts`)
- ✓ AES-256-GCM credential encryption — existing (`serverless/src/services/encryption.ts`)
- ✓ Multi-platform support (Google Ads, Meta CAPI, TikTok Events, sGTM) — existing
- ✓ Shopify + WooCommerce webhook handlers — existing
- ✓ D1 database with 14 migrations — existing
- ✓ 206 test cases across 38 test files — existing
- ✓ Landing page with waitlist, ROI calculator, cookie consent, i18n — existing (`landing-page/`)
- ✓ Onboarding site-setup backend endpoint — existing (`/api/v1/onboarding/site-setup`)
- ✓ Analytics backend endpoint — existing (`/api/v1/analytics/`)
- ✓ GDPR endpoints — existing (but unauthenticated)
- ✓ Brevo email integration — existing (but single opt-in)
- ✓ CI/CD with 11 GitHub Actions workflows — existing

### Active

- [ ] Security & GDPR hardening (auth on GDPR endpoints, double opt-in, privacy policy rewrite, hCaptcha)
- [ ] Real-data dashboard (kill test-agency-id, connect to live auth context and analytics)
- [ ] Self-service onboarding (Stripe checkout flow, site setup wizard, tracking snippet page)
- [ ] Replace reCAPTCHA with hCaptcha across all forms
- [ ] UI-to-Backend mapping documentation in MkDocs
- [ ] Lock Cloudflare Workers to EU region by default (per-customer override for non-EU)

### Out of Scope

- Analytics charts / fancy visualizations — basic counts and status first
- Admin panel — not needed for customer-facing MVP
- GTM compiler UI — existing tool is broken on real containers, defer
- Mobile app — web-first
- Additional platform integrations beyond what exists — ship what we have
- Error alerting / PagerDuty / status page — Phase 2 operational concern
- Machine learning / anomaly detection — future
- Nonprofit Grants Compliance add-on — archived to `.planning/archive/`

## Context

- Backend is rated 6/10 in readiness assessment — strongest part of the product
- Frontend dashboard is 2/10 — scaffold with hardcoded test data
- Overall product readiness is 3/10 — 0 of 7 customer journey steps are functional end-to-end
- No customer has ever used this product; `test-agency-id` is hardcoded in Dashboard.tsx
- The ratio of planning-to-shipping has been very high — 100+ docs covering strategy but no usable product
- Readiness assessment: `docs/readiness-assessment-2026-02-13.md`
- Codebase map: `.planning/codebase/`
- Previous project (Nonprofit Grants) archived: `.planning/archive/2026-02-03-nonprofit-grants/`

## Constraints

- **Tech Stack**: Cloudflare Workers, Hono, D1, React, Tailwind, pnpm — no new stack decisions
- **Security**: Must use existing JWT + HMAC + AES-256-GCM patterns — no shortcuts
- **GDPR**: EU-compliant — hCaptcha (not reCAPTCHA), double opt-in, Brevo DPA disclosure
- **Testing**: Must maintain 206 existing test cases, all new features must pass CI/CD
- **Data Residency**: Cloudflare Workers locked to EU region by default (`placement = { mode = "smart" }` with EU hint, or `wrangler.jsonc` region config). Per-customer override if they want global.
- **No New Dependencies**: Prefer existing libraries. The stack is complete.
- **Documentation**: All UI-to-Backend mappings must be documented in MkDocs folder

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| hCaptcha over Friendly Captcha | Free tier available, privacy-focused, wider adoption | — Pending |
| Security/GDPR first | Can't launch without compliance, especially in EU market | — Pending |
| Kill test-agency-id, use real auth | Hardcoded IDs mask integration bugs — must use real auth flow | — Pending |
| Skip admin panel for MVP | No customers yet — admin tooling is premature | — Pending |
| Archive nonprofit project | Focus on core product first, revisit add-ons post-revenue | — Pending |
| EU-default Workers region | GDPR data residency — process data in EU unless customer opts out | — Pending |

---
*Last updated: 2026-02-13 after initialization*
