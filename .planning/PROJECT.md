# WooCommerce Plugin for AdsEngineer

## What This Is

A WordPress/WooCommerce plugin that enables one-click onboarding of WooCommerce stores to AdsEngineer. The plugin installs the universal tracking snippet (SST), captures GCLID from URL parameters, stores it with orders, and sends complete conversion data (order + customer enhanced data) to AdsEngineer API for Google Ads attribution.

## Core Value

**GCLID capture and forwarding must work reliably** — every order from a Google Ad click must be attributed correctly. If nothing else works, this must.

## Requirements

### Validated

(From existing AdsEngineer codebase)

- ✓ Google Ads conversion upload API — existing
- ✓ WooCommerce webhook receiver route — existing (`serverless/src/routes/woocommerce.ts`)
- ✓ Multi-tenant agency model — existing
- ✓ JWT authentication for dashboard — existing
- ✓ Encryption for stored credentials — existing

### Active

- [ ] WordPress plugin that installs on WooCommerce sites
- [ ] Universal tracking snippet (SST) auto-installation on all pages
- [ ] GCLID capture from URL parameters on landing page
- [ ] GCLID storage in session/cookie (survives checkout flow)
- [ ] GCLID attachment to WooCommerce order metadata
- [ ] Customer enhanced data capture (email, phone, address)
- [ ] Conversion data sent to AdsEngineer API on order completion
- [ ] Plugin settings page (API key configuration)
- [ ] One-click setup experience

### Out of Scope

- Native WordPress admin dashboard analytics — AdsEngineer dashboard handles this
- Direct Google Ads API calls from plugin — plugin only sends to AdsEngineer
- Shopify support — separate plugin exists
- Meta/TikTok pixel installation — future enhancement
- WooCommerce Blocks checkout support — classic checkout first

## Context

**Existing Infrastructure:**
- AdsEngineer API runs on Cloudflare Workers (Hono framework)
- WooCommerce webhook route exists at `serverless/src/routes/woocommerce.ts`
- Universal tracking snippet (SST) exists at `seo-auditor/` directory
- Shopify plugin pattern exists at `shopify-plugin/` for reference

**Test Environment:**
- Test WooCommerce site: `stefan.mastersmarket.eu`
- Can test full flow: Ad click → Landing → Checkout → Order → Conversion

**Problem Being Solved:**
- Manual GCLID capture is failing/unreliable
- No automated way to onboard WooCommerce sites
- Losing time debugging instead of testing

## Constraints

- **Tech Stack**: WordPress/PHP plugin (standard WooCommerce patterns)
- **Compatibility**: WooCommerce 7.0+, WordPress 6.0+, PHP 7.4+
- **No JS Frameworks**: Vanilla JS for tracking snippet, PHP for plugin
- **GDPR**: Must work with cookie consent managers
- **Performance**: Tracking snippet must not block page load

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| WordPress plugin (not external service) | Simplest install, full WooCommerce integration | — Pending |
| GCLID stored in cookie + order meta | Survives multi-page checkout, persists with order | — Pending |
| Enhanced conversions data included | Better match rates, Google Ads best practice | — Pending |

---
*Last updated: 2026-01-27 after initialization*
