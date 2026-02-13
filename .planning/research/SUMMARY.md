# Project Research Summary

**Project:** AdsEngineer Phase 1 MVP  
**Domain:** SaaS conversion tracking — last mile completion  
**Researched:** 2026-02-13  
**Confidence:** HIGH

## Executive Summary

AdsEngineer is a brownfield project at the critical "last mile" — backend is 6/10 complete (100+ tests passing, solid architecture), frontend is scaffolded, but zero customers exist. This research identifies the path from working prototype to shippable MVP.

**The Core Challenge:** Not what to build, but what NOT to build. With deep backend infrastructure already in place (JWT middleware, Stripe routes, D1 migrations, Google Ads integration), the MVP requires **integration and polish** more than new features.

**Critical Insight from Research:** 75% of SaaS users churn in the first week due to onboarding friction. The biggest risks are not missing features, but:
1. **Auth integration gaps** - Frontend has login forms but Dashboard.tsx hardcodes `test-agency-id`
2. **Stripe webhook race conditions** - Payment succeeds but subscription doesn't activate
3. **GDPR compliance holes** - Data export endpoint is unauthenticated
4. **Onboarding abandonment** - Users install snippet but never see first conversion

**Recommended Approach:** Ship a focused 3-pillar MVP in 6-8 weeks:
- **Pillar 1: Security/GDPR** - hCaptcha, double opt-in, authenticated endpoints, EU compliance
- **Pillar 2: Real-data dashboard** - Fix hardcoded test IDs, implement proper JWT auth flow, show actual user data
- **Pillar 3: Self-service onboarding** - Multi-step wizard, snippet installation with verification, first-conversion guidance

---

## Key Findings

### From STACK.md: Recommended Technologies

**Core Integrations for MVP:**
- **hCaptcha** (GDPR-compliant CAPTCHA replacing reCAPTCHA) - Frontend: `@hcaptcha/react-hcaptcha`, Backend: siteverify API
- **Stripe Checkout** (Hosted payment page) - `stripe` SDK for Workers, avoid custom forms (PCI complexity)
- **Brevo** (Double opt-in email) - `@getbrevo/brevo` SDK with `CreateDoiContact` for GDPR compliance
- **React Auth Context** (JWT state management) - Built-in Context API + axios interceptors, no Redux needed
- **React Router 7** (Protected routes) - Latest stable with nested route support via `<Outlet />`

**Critical Stack Decision:** Use Stripe's **hosted Checkout page** (redirect pattern), not custom payment forms. Custom forms require PCI certification ($10K-50K/year) and 2-3 weeks of development. Hosted checkout is battle-tested and takes 2 hours.

**Version Requirements:**
- React 18+ for concurrent features
- Stripe API `2024-12-18.acacia` (latest stable)
- TypeScript 5.0+ for improved inference
- Node.js 18+ for Workers compatibility

---

### From FEATURES.md: Expected Features vs Differentiators

**Table Stakes (Non-Negotiable for MVP):**
| Feature | Why Expected | User Expects This Because |
|---------|--------------|---------------------------|
| Email/password signup | Standard SaaS pattern | Every SaaS has this |
| Stripe subscription billing | Users won't trust manual invoicing | Industry standard |
| Tracking snippet code display | Core value delivery | Can't track conversions without it |
| Real-time conversion list | Proof system is working | Users need validation |
| Platform OAuth connection | Industry standard for Google/Meta | Competitors all have it |
| Dashboard with basic metrics | Users expect visual summaries | SaaS baseline expectation |
| Email verification | Security/anti-spam requirement | Prevents abuse |
| GDPR data export | Legal requirement in EU | Law mandates this |
| Installation verification | Users need confidence snippet works | Reduces support burden |

**Differentiators (Competitive Advantage):**
| Feature | Value Proposition | When to Build |
|---------|-------------------|---------------|
| Test event sender | Validate platform setup without real traffic | Phase 1.5 (quick win) |
| Installation video walkthroughs | Reduce onboarding friction by 40%+ | Phase 1.5 (record videos) |
| Server-side GTM forwarding | Bypass iOS tracking limitations | Phase 2 (architecture exists) |
| Real-time snippet health monitoring | Proactive error detection | Phase 2 (requires heartbeat) |
| Multi-site management | Agencies track multiple properties | Phase 2 (backend supports this) |

**Anti-Features (Deliberately NOT Built):**
- Custom analytics dashboards - Scope explosion, delays launch
- White-label/rebrand - Complex licensing, support burden
- Built-in A/B testing - Different product category
- Heatmaps/session replay - Massive storage costs, privacy nightmare
- Predictive analytics - Requires massive dataset, overpromises

**Critical Customer Journey Insight:**  
Users expect to go from signup → first conversion tracked in <15 minutes. The Phase 1 onboarding wizard MUST optimize for this timeline.

---

### From ARCHITECTURE.md: How to Wire React to Hono

**Standard Integration Pattern:**
```
Frontend (React 18)
  ↓ axios with interceptors (attach JWT)
  ↓ Authorization: Bearer <token>
Backend (Hono/Workers)
  ↓ authMiddleware verifies JWT
  ↓ sets c.get('auth', { user_id, org_id })
Routes access auth context
  ↓ query D1 with org_id filter
```

**6 Core Architectural Patterns:**
1. **JWT Auth Flow** - Login generates token → Frontend stores in localStorage → Axios interceptor attaches to all requests → Backend verifies
2. **React Auth Context** - Centralized state with `useAuth()` hook, no Redux needed
3. **API Service Layer** - Single axios instance with global error handling (401 → logout, 500 → error toast)
4. **Protected Routes** - `<ProtectedRoute>` wrapper checks `isAuthenticated` before rendering children
5. **Stripe Checkout Integration** - Frontend calls `/billing/create-checkout-session` → Backend creates session → Redirect to Stripe → Webhook updates DB
6. **Multi-Step Wizard** - Parent component manages `step` state and accumulated `data`, child components receive `onNext(stepData)`

**Critical Implementation Detail:**  
Existing auth middleware uses **custom JWT verification** (not Hono's built-in `jwt()` helper). Frontend must match this pattern - token in `Authorization: Bearer <token>` header, payload includes `{ sub: user_id, org_id, exp }`.

**Build Order:**
1. Auth foundation (backend routes + frontend context) - Everything depends on this
2. Protected routes (wrapper component + layout) - Container for features
3. Core features (sites, events, dashboard) - Business value
4. Billing integration (Stripe) - Can be added last

---

### From PITFALLS.md: Critical Mistakes to Avoid

**Top 5 Pitfalls (Ranked by Impact):**

**1. Frontend Auth Integration Theater** (CRITICAL)  
- **Problem:** Dashboard hardcodes `test-agency-id`, JWT never actually used  
- **Warning Signs:** Dashboard shows data when logged out, API calls succeed without Authorization header  
- **Fix:** Implement JWT storage in localStorage, axios interceptor to inject token, CORS testing with production domains  
- **Phase:** Phase 1 (Foundation) - Non-negotiable blocker  
- **Recovery Cost:** 3-5 days pre-launch, 2 weeks if customers affected

**2. Stripe Webhook Race Conditions** (CRITICAL)  
- **Problem:** Checkout redirect writes subscription at same time as webhook → duplicate entries or failed activation  
- **Root Cause:** Two concurrent writes without idempotency key, D1 doesn't support multi-statement transactions  
- **Fix:** Use `stripe_event_id` as deduplication key, checkout redirect should POLL status (not write), add `ON CONFLICT DO NOTHING` clause  
- **Phase:** Phase 1 (Foundation) - Before first paying customer  
- **Recovery Cost:** 1-2 days in testing, 1 week + refunds if live

**3. GDPR Implementation Gaps** (LEGAL BLOCKER)  
- **Problem:** `/api/v1/gdpr/data-request/:email` is unauthenticated - anyone can request anyone's data  
- **Additional Gaps:** No double opt-in (Brevo single opt-in), privacy policy missing third-party processors  
- **Fix:** Require JWT on GDPR endpoints with email ownership check, implement Brevo `CreateDoiContact` for double opt-in  
- **Phase:** Phase 1 (Foundation) - Legal blocker for EU customers  
- **Recovery Cost:** 1 day pre-launch, potential €20M fine (4% revenue) if reported

**4. hCaptcha Integration Mistakes** (SPAM RISK)  
- **Problem:** Frontend loads widget but backend never validates token  
- **Warning Signs:** Forms accept submissions without `h-captcha-response`, no call to hCaptcha siteverify API  
- **Fix:** Server-side verification on ALL signup/login endpoints, token expiry handling with widget reset  
- **Phase:** Phase 1 (Foundation) - Before landing page goes live  
- **Recovery Cost:** 2 hours if caught in testing, spam flood if live

**5. Self-Service Onboarding Abandonment** (UX KILLER)  
- **Problem:** 63% churn because users don't understand setup - sign up → see empty dashboard → close tab → never return  
- **Fix:** Multi-step wizard with visual progress, "Test Installation" button, empty state guidance (not blank screen), setup persistence across sessions  
- **Phase:** Phase 2 (Onboarding UX) - After auth works  
- **Recovery Cost:** 1-2 days if planned, 40-60% activation loss if skipped

**Additional Gotchas:**
- **CORS preflight cache poisoning** - Browser caches CORS for 5s, test in incognito between config changes
- **D1 transaction limitations** - No multi-statement transactions, use batch API instead
- **Token expiry death spiral** - Implement refresh tokens OR proactive re-auth before 401s
- **Missing rate limiting** - Auth endpoints vulnerable to brute force without rate limits

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Foundation (6-8 weeks) - Auth + Billing + GDPR**

**Rationale:** Must ship secure, legally compliant foundation before adding features.

**Delivers:**
- Working JWT auth flow (signup → login → protected routes → token refresh)
- Stripe subscription checkout with webhook-based activation (race-condition-free)
- GDPR compliance (authenticated endpoints, double opt-in, privacy policy)
- hCaptcha on signup/login (prevent spam)
- Basic dashboard showing real user data (not hardcoded test IDs)

**Addresses:**
- Pitfall 1: Auth integration theater
- Pitfall 2: Stripe race conditions
- Pitfall 3: GDPR gaps
- Pitfall 4: hCaptcha validation

**Avoids:**
- Over-engineering features before foundation works
- Launching with legal vulnerabilities
- Payment activation failures with real money

**Features:**
- Email/password signup + verification
- JWT session management with token refresh
- Stripe Checkout integration (hosted page)
- Plan tier enforcement (starter/pro/enterprise)
- Snippet code display with copy button
- Platform-specific installation guides (text-based)
- Protected routes with React Router guards
- User profile settings (edit email/password)
- GDPR data export/deletion triggers
- Privacy policy + Terms of Service pages

**Must-Have Checkpoints:**
- [ ] User can sign up → verify email → select plan → pay → log in
- [ ] Dashboard shows user's actual data (filtered by org_id from JWT)
- [ ] Payment webhook activates subscription (tested with Stripe test mode)
- [ ] GDPR endpoints require authentication and ownership check
- [ ] hCaptcha verified server-side on signup

---

**Phase 2: Onboarding & First Conversion (2-4 weeks) - Self-Service UX**

**Rationale:** Foundation works, now optimize for activation (signup → first conversion).

**Delivers:**
- Multi-step onboarding wizard (site details → snippet → verification → platforms)
- Installation verification ("Test Installation" button shows real-time status)
- Platform connection wizard (Google Ads OAuth with error handling)
- First-conversion email notification (celebration + next steps)
- Activity log (show recent sync events for debugging)

**Addresses:**
- Pitfall 5: Onboarding abandonment
- Pitfall 6: Dashboard "first load" problems (empty states, loading states)

**Avoids:**
- Blank dashboard confusion
- Setup abandonment (no progress tracking)
- Support burden from "snippet not working" tickets

**Features:**
- Multi-step setup wizard with progress indicator
- Snippet installation helpers (copy button + syntax highlighting)
- Test event API + verification UI
- Real-time conversion list (WebSocket/SSE or polling)
- Conversion detail modal (JSON viewer)
- Basic dashboard metrics (conversions/day line chart, platform pie chart)
- Platform connection wizard (Google Ads, Meta, TikTok)
- OAuth flow UI for each platform
- Sync retry UI (manual retry button per conversion)
- Error notifications (toast for sync failures)
- Email notifications (first conversion, errors)
- Installation videos (60-second Loom walkthroughs per platform)

**Success Metrics:**
- Signup → Snippet installed (target: >60%)
- Snippet installed → First conversion (target: >40%)
- First conversion → Active 7 days later (target: >70%)

---

**Phase 3: Growth Features (Future) - Multi-Site, Teams, Advanced**

**Rationale:** Core loop works, now add retention and expansion features.

**Delivers:**
- Multi-site management (agencies track multiple clients)
- Team collaboration (invite users with roles)
- Shopify app integration (one-click install)
- Server-side GTM forwarding (bypass iOS limitations)
- Email digest reports (weekly summaries)

**Research Flags:** 
- Multi-site likely needs minimal research (backend tenant model already supports this)
- Shopify app requires Shopify Partner account setup (new domain)
- sGTM forwarding has architecture proposal in `docs/sgtm-architecture-proposal.md`

**Defer Until:**
- Phase 1 + 2 shipped and validated with real users
- User feedback confirms these are actual pain points

---

### Phase Ordering Rationale

**Why Phase 1 Before Phase 2:**
- Auth is hard dependency for all features (can't track conversions without knowing which user)
- GDPR compliance is legal blocker for EU launch (can't market without privacy policy)
- Stripe race conditions cause support nightmares (must fix before billing goes live)

**Why Phase 2 After Phase 1:**
- Onboarding UX doesn't matter if auth/billing is broken
- Can validate foundation with early adopters before polishing UX
- Wizard complexity justified only after proving core value prop

**Why Phase 3 Is Future:**
- Multi-site/teams are retention features, not activation features
- MVP should prove single-site value before expanding
- Growth features require user feedback to prioritize correctly

---

### Research Flags

**Phases Needing Additional Research:**

| Phase | Research Topic | Reason |
|-------|---------------|--------|
| Phase 1 | ❌ None | All patterns well-documented, existing codebase provides examples |
| Phase 2 | ⚠️ WebSocket/SSE for real-time | Need to choose between WebSocket, SSE, or polling for live updates |
| Phase 3 | ✅ Shopify app setup | Requires Shopify Partner account, app submission process |
| Phase 3 | ✅ sGTM architecture | Proposal exists in `docs/`, needs validation with real implementation |

**Phase 2 Decision Point:** Real-time conversion list
- **Option A:** Polling (simple, works in Workers, 5-10s latency)
- **Option B:** Server-Sent Events (better UX, requires Durable Objects)
- **Option C:** WebSocket (best UX, requires Durable Objects + complex state)
- **Recommendation:** Start with polling, upgrade to SSE post-launch if needed

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Official docs for hCaptcha, Stripe, React Router, Brevo. Real GitHub implementations verified. |
| **Features** | HIGH | 10+ competitor comparisons, SaaS onboarding research from 2025-2026, GDPR templates from official EU sources. |
| **Architecture** | HIGH | React + Hono integration patterns verified in official docs. Existing codebase provides auth middleware reference. |
| **Pitfalls** | HIGH | Real-world sources from 2025-2026 (DEV.to, Medium), GitHub code search for production examples, project codebase audit. |

**Overall Confidence: HIGH**

All recommendations backed by:
- Official documentation (React, Hono, Stripe, GDPR.eu)
- Real-world blog posts from 2025-2026 (not outdated)
- Production code examples from GitHub (Supabase, AutoGPT, etc.)
- Direct inspection of AdsEngineer codebase

**No unresolved ambiguities.** All stack decisions finalized, architecture patterns validated, pitfalls catalogued with fixes.

---

## Gaps to Address

### 1. Token Refresh Strategy (Phase 1.5)

**Current State:** Single JWT with 24h expiration, no refresh token.

**Gap:** Users randomly logged out after 24h with no graceful re-auth.

**Options:**
- **Short-term:** Keep 24h JWTs, add proactive refresh 5 min before expiry (Phase 1.5)
- **Long-term:** Implement refresh token rotation with HttpOnly cookies (Phase 2)

**Recommendation:** Ship Phase 1 with 24h JWTs, add proactive refresh in Phase 1.5 (2 days work).

---

### 2. Webhook Testing Documentation (Phase 1)

**Gap:** No workflow for testing Stripe webhooks locally during development.

**Solution:** Document in Phase 1 tasks:
```bash
# Recommended: Stripe CLI forwarding
stripe listen --forward-to localhost:8090/billing/webhook

# Alternative: Cloudflare Tunnel
cloudflared tunnel --url localhost:8090
```

---

### 3. Rate Limiting on Auth Endpoints (Phase 1)

**Gap:** Backend has `rate-limit.ts` middleware but no explicit auth endpoint rate limiting documented.

**Fix:** Ensure Phase 1 tasks include:
```typescript
app.post('/auth/login', rateLimit({ tier: 'strict' }), loginHandler);
app.post('/auth/signup', rateLimit({ tier: 'strict' }), signupHandler);
```

---

### 4. Empty State Design (Phase 2)

**Gap:** Dashboard currently shows blank screen when no data exists.

**Fix:** Phase 2 must include empty state components:
- "No sites yet" → "Create Your First Site" button
- "No conversions yet" → "Install snippet to start tracking"
- "Platform not connected" → "Connect Google Ads" CTA

---

## Sources Summary

**HIGH Confidence Sources (Official/Authoritative):**
- hCaptcha Official Docs - Context7 `/websites/hcaptcha` (siteverify API)
- Stripe Node SDK - Context7 `/stripe/stripe-node` (49K code snippets)
- React Router v7 - Context7 `/remix-run/react-router` (2034 snippets, v7.9.4 confirmed)
- GDPR Privacy Notice Template - gdpr.eu/privacy-notice (EU Commission-endorsed)
- Brevo Node SDK - GitHub `getbrevo/brevo-node` (official TypeScript SDK)

**MEDIUM Confidence Sources (Real-World Implementations):**
- DEV Community - "Stripe Webhooks Race Conditions" (2026-01-14)
- OneUptime - "React JWT Authentication Guide" (2026-01-15)
- AdoptKit - "SaaS Onboarding Checklist 2026" (2025-11-25)
- Stonly - "B2B SaaS Onboarding Self-Serve" (2025)
- GitHub Code Search - hCaptcha implementations in Supabase, OpenUserJS

**Project Codebase Validation:**
- `serverless/src/middleware/auth.ts` - Custom JWT verification confirmed
- `serverless/src/routes/gdpr.ts` - Unauthenticated endpoints identified
- `frontend/src/pages/Dashboard.tsx` - Hardcoded `test-agency-id` confirmed
- `serverless/src/routes/billing.ts` - Stripe integration patterns reviewed

---

## Ready for Roadmap: YES

Research is comprehensive across all domains:
- ✅ Stack decisions finalized (hCaptcha, Stripe Checkout, Brevo, React Context)
- ✅ Features categorized (table stakes vs differentiators vs anti-features)
- ✅ Architecture patterns validated (6 core patterns with code examples)
- ✅ Pitfalls catalogued (5 critical + recovery strategies)
- ✅ Phase structure suggested (Foundation → Onboarding → Growth)
- ✅ Confidence assessed (HIGH overall, no blockers)
- ✅ Gaps identified (4 items, all addressable in respective phases)

**No additional research needed before roadmap creation.**

---

*Research completed: 2026-02-13*  
*Files: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, PATTERNS.md, SUMMARY-integration.md*  
*Total pages researched: ~3,700 lines across 6 documents*  
*Synthesis ready for Phase 1 task breakdown.*
