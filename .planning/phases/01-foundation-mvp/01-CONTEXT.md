# Phase 1: Foundation & MVP - Context

**Gathered:** 2026-02-13
**Status:** Ready for planning

---

## Phase Boundary

A user can sign up, pay, connect their Google Ads, install tracking, and see their conversion data — end to end, with no manual intervention. This phase delivers the complete customer journey from landing page to dashboard with real data.

**Scope anchor:** Authentication, billing, security/GDPR, dashboard, onboarding wizard, and landing page updates. No analytics visualizations, no multi-platform OAuth (Google Ads only), no team collaboration.

---

## Implementation Decisions

### Auth & Billing Sequence

- **Paywall timing:** OpenCode discretion — research SaaS activation patterns and decide
- **Email verification order:** OpenCode discretion — research email-first vs plan-first patterns
- **Post-payment landing:** OpenCode discretion — research onboarding vs dashboard first patterns
- **Free functionality level:** OpenCode discretion — research trial vs freemium vs hard paywall patterns

### Dashboard First Impression

- **Layout style:** Single stat hero (large conversion count) + minimal table below
- **Table columns:** Compact 3-column format — Timestamp, Value, Status — with platform shown as icon/badge
- **Sync status display:** Badge + last sync time + "Sync now" manual button
- **Empty state:** Sample data preview with "This is what you'll see" overlay (educational, not blank)

### Onboarding Wizard Steps

- **Structure/ordering:** OpenCode discretion — research activation-first vs setup-first patterns
- **Step skipability:** Core steps required (account/site), extras optional (platform connect can be deferred)
- **Progress display:** OpenCode discretion — research wizard UX patterns
- **Completion experience:** Success screen with summary before dashboard (reinforces accomplishment)

### Landing-to-App Handoff

- **CTA flow:** OpenCode discretion — research direct signup vs pricing page vs modal patterns
- **hCaptcha placement:** All forms have hCaptcha (waitlist, signup, contact) — maximum protection
- **Waitlist flow:** Full nurture sequence via Brevo MCP (API key from Doppler):
  1. DOI confirmation email (immediate)
  2. Reminder(s) if unconfirmed (24-48h later)
  3. Welcome series after confirmation
- **Post-signup redirect:** OpenCode discretion — research email verification prompt vs dashboard vs onboarding patterns

---

## OpenCode's Discretion

Areas where OpenCode has flexibility based on research:

| Decision | Research Focus |
|----------|----------------|
| Paywall timing | SaaS activation patterns, B2B subscription UX |
| Email verification order | Email deliverability, conversion rate data |
| Post-payment landing | Time-to-value metrics, onboarding completion rates |
| Free functionality | Trial vs freemium vs hard paywall outcomes |
| Onboarding structure | Activation-first vs setup-first completion rates |
| Progress display | Wizard UX patterns, mobile considerations |
| CTA flow | Landing page conversion optimization |
| Post-signup redirect | Signup flow completion rates |

---

## Specific Ideas

- **GrepAI MCP integration** — Consider installing [grepai](https://github.com/yoanbernabeu/grepai) for semantic code search during development. 100% local, privacy-first, reduces AI agent token usage. Aligns with our GDPR-first approach.
- **Brevo MCP** — Use Brevo's MCP server with Doppler-stored API key for email sequences. Avoids hardcoding credentials.
- **Sample data preview** — Empty state shows dummy conversion with "This is what you'll see" overlay. Educates user without requiring actual data.

---

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 01-foundation-mvp*
*Context gathered: 2026-02-13*
