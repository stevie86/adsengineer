# Research Summary: Frontend-Backend Integration

**Domain:** SaaS frontend-backend integration (React 18 + Hono/Cloudflare Workers)
**Researched:** 2026-02-13
**Overall Confidence:** HIGH

## Executive Summary

The research reveals a well-established architectural pattern for connecting React 18 SPAs to Hono/Cloudflare Workers backends. The existing codebase already has critical foundation pieces in place (JWT auth middleware, route structure, Vite proxy configuration), requiring primarily frontend implementation to complete the integration.

**Current State:**
- ✅ Backend JWT auth middleware fully implemented (custom HMAC-based verification)
- ✅ Backend routes structure established (20 route files)
- ✅ Vite dev proxy configured (forwards `/api` to port 8090)
- ❌ Frontend auth context missing
- ❌ Frontend API service layer missing
- ❌ Protected routes implementation incomplete (uses basic localStorage check)

**Integration Complexity:** Medium. Standard patterns with comprehensive documentation available. No major architectural decisions needed - follow established best practices.

## Key Findings

### Stack Recommendations

**Frontend Stack (Already Chosen):**
- React 18 with TypeScript ✅
- React Router 7 for routing ✅
- Tailwind CSS for styling ✅
- Axios for HTTP client ✅
- Vite for build tooling ✅

**Additional Libraries Needed:**
- `react-syntax-highlighter` - Code snippet display with syntax highlighting
- `@types/react-syntax-highlighter` - TypeScript types
- `axios-retry` (optional) - Automatic retry for failed requests

**Backend Stack (Already Chosen):**
- Hono v4 + @hono/zod-openapi ✅
- Cloudflare Workers runtime ✅
- Cloudflare D1 database ✅
- Custom JWT implementation (not Hono's built-in) ✅

### Architecture: 6 Core Patterns

1. **JWT Auth Flow** - Login → Generate JWT → Store in localStorage → Attach to requests → Verify on backend
2. **React Auth Context** - Centralized auth state with Context API + hooks
3. **API Service Layer** - Axios instance with interceptors for token attachment and error handling
4. **Protected Routes** - React Router guards checking auth state before rendering
5. **Stripe Checkout** - Frontend initiates → Backend creates session → Redirect → Webhook confirms
6. **Multi-Step Wizard** - Component state for form progression with step indicators

All patterns have HIGH confidence backing from official documentation (React, React Router, Hono, Stripe).

### Critical Architectural Decision: Token Storage

**Recommended:** `localStorage` for persistent sessions
**Alternative:** `sessionStorage` for single-session (more secure, lost on tab close)
**Anti-pattern:** Cookies (CSRF risk on SPA), URL params (logging exposure)

**Rationale:** SPA architecture requires client-side token storage. localStorage provides best UX (persists across sessions) with acceptable security when paired with short-lived JWTs (24h expiration).

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1: Auth Foundation (Build First)**
- Backend: Create `/auth/login` and `/auth/signup` endpoints
- Frontend: Build AuthContext provider
- Frontend: Build API service layer with axios interceptors
- Frontend: Implement Login/Signup pages
- **Why First:** All protected features depend on working auth

**Phase 2: Protected Routes (Build Second)**
- Frontend: Create ProtectedRoute component
- Frontend: Update App.tsx routing with auth guards
- Frontend: Build Layout component (shared nav/sidebar)
- Frontend: Create Dashboard scaffold
- **Why Second:** Enables building features within protected area

**Phase 3: Core Features (Build Third)**
- Backend: Implement `/api/v1/sites` endpoints (if not exists)
- Frontend: Build sites service + Dashboard UI
- Frontend: Create SnippetDisplay component
- Frontend: Build OnboardingWizard (multi-step form)
- **Why Third:** Core business functionality after auth is working

**Phase 4: Billing Integration (Build Last)**
- Backend: Create `/billing/create-checkout-session` endpoint
- Backend: Implement `/billing/webhook` handler
- Frontend: Build billing service + BillingButton component
- Frontend: Create success/cancel pages
- **Why Last:** Separate concern from core functionality, can be developed/tested independently

### Phase Ordering Rationale

**Sequential Dependencies:**
```
Auth Foundation
    ↓ (requires working auth)
Protected Routes
    ↓ (requires protected area)
Core Features
    ↓ (independent, can be built anytime after Phase 2)
Billing Integration
```

**Why This Order:**
1. Auth is a hard dependency - nothing works without it
2. Protected routes provide the container for all features
3. Core features deliver product value
4. Billing can be added last (MVP can work without payment)

### Research Flags for Phases

| Phase | Research Needed | Reason |
|-------|-----------------|--------|
| Phase 1 | ❌ No | Standard JWT patterns, well-documented |
| Phase 2 | ❌ No | React Router guards are straightforward |
| Phase 3 | ⚠️ Maybe | Depends on tracking snippet generation complexity |
| Phase 4 | ✅ Yes | Stripe webhook testing requires ngrok/cloudflare tunnel setup |

**Phase 4 Note:** Webhook testing requires exposing local backend to internet. Document setup for:
- Cloudflare Tunnel (recommended for Cloudflare Workers)
- ngrok (alternative)
- Stripe CLI webhook forwarding (simplest for dev)

## Confidence Assessment

| Area | Confidence | Reason |
|------|-----------|--------|
| Auth Flow | HIGH | Official React, Hono, and existing codebase patterns |
| Protected Routes | HIGH | React Router official docs + existing implementation |
| API Layer | HIGH | Axios is widely documented, interceptors are standard |
| Stripe Integration | HIGH | Official Stripe docs + webhook verification examples |
| Multi-Step Forms | MEDIUM | No official React pattern, but common in community |
| Code Display | MEDIUM | react-syntax-highlighter is well-maintained library |

**Overall Assessment:** HIGH confidence. All patterns have authoritative documentation and are industry-standard for this stack.

## Gaps to Address

### 1. Refresh Token Implementation (Future Enhancement)

**Current Approach:** Single JWT with 24h expiration
**Gap:** No refresh token mechanism for extending sessions

**Options:**
- **Short-term:** Keep 24h JWTs, require re-login daily (acceptable for MVP)
- **Long-term:** Implement refresh token rotation (add `/auth/refresh` endpoint, HttpOnly cookie for refresh token)

**Recommendation:** Ship MVP with 24h JWTs, add refresh tokens in post-launch iteration.

### 2. Webhook Testing Documentation (Phase 4)

**Gap:** No documented workflow for testing Stripe webhooks locally

**Solution:** Add to Phase 4 research:
```bash
# Option 1: Stripe CLI (simplest)
stripe listen --forward-to localhost:8090/billing/webhook

# Option 2: Cloudflare Tunnel (recommended)
cloudflared tunnel --url localhost:8090

# Option 3: ngrok
ngrok http 8090
```

### 3. Rate Limiting on Auth Endpoints (Security)

**Gap:** No mention of rate limiting on `/auth/login` to prevent brute force

**Current Backend:** Has `rate-limit.ts` middleware
**Action:** Ensure auth endpoints use rate limiting:
```typescript
app.post('/auth/login', rateLimit({ tier: 'strict' }), loginHandler);
```

### 4. CSRF Protection (Future Enhancement)

**Current:** SPA with localStorage = no CSRF risk
**Future:** If adding cookie-based auth (for refresh tokens), implement CSRF tokens

**Recommendation:** Document this as future consideration when adding refresh tokens.

## Ready for Roadmap

Research is complete and comprehensive. All domains investigated:

✅ **Stack:** React 18, Hono, Axios, React Router, Stripe  
✅ **Auth Flow:** JWT generation, storage, verification  
✅ **Protected Routes:** React Router guards with auth context  
✅ **API Layer:** Axios interceptors for token attachment  
✅ **Billing:** Stripe Checkout Session flow  
✅ **UI Patterns:** Multi-step wizards, code display with copy  

**No blockers identified.** Proceed to roadmap creation with 4-phase structure above.

## Phase-Specific Implementation Notes

### Phase 1: Auth Foundation

**Key Files to Create:**
- `frontend/src/contexts/AuthContext.tsx` - Auth state provider
- `frontend/src/services/api.ts` - Axios instance with interceptors
- `frontend/src/services/auth.service.ts` - Login/signup/logout functions
- `serverless/src/routes/auth.ts` - Login and signup endpoints

**Testing Strategy:**
1. Unit test: JWT generation/verification
2. Integration test: Login endpoint with DB
3. E2E test: Full login flow (form → API → redirect)

**Success Criteria:**
- User can log in and receive JWT
- Token stored in localStorage
- Token attached to subsequent requests
- 401 responses trigger logout

### Phase 2: Protected Routes

**Key Files to Create:**
- `frontend/src/components/ProtectedRoute.tsx` - Auth guard wrapper
- `frontend/src/components/Layout.tsx` - Shared nav/sidebar
- Update `frontend/src/App.tsx` - Wrap routes with ProtectedRoute

**Testing Strategy:**
1. Unit test: ProtectedRoute redirects when unauthenticated
2. Integration test: Layout renders nav items based on user role
3. E2E test: Navigate to protected route without auth → redirect to login

**Success Criteria:**
- Unauthenticated users redirected to /login
- After login, redirected to original destination
- Layout displays user info from AuthContext

### Phase 3: Core Features

**Key Files to Create:**
- `frontend/src/services/sites.service.ts` - Site CRUD operations
- `frontend/src/components/OnboardingWizard/` - Multi-step form
- `frontend/src/components/SnippetDisplay/` - Code display
- `serverless/src/routes/sites.ts` - Sites endpoints (if not exists)

**Testing Strategy:**
1. Unit test: Wizard state management (step navigation)
2. Integration test: Site creation API call
3. E2E test: Complete onboarding wizard → site appears in dashboard

**Success Criteria:**
- User can create site via wizard
- Tracking snippet displayed with copy button
- Dashboard shows list of sites

### Phase 4: Billing Integration

**Key Files to Create:**
- `frontend/src/services/billing.service.ts` - Checkout session creation
- `frontend/src/components/BillingButton.tsx` - Subscribe button
- `frontend/src/pages/BillingSuccess.tsx` - Post-payment confirmation
- `serverless/src/routes/billing.ts` - Stripe integration

**Testing Strategy:**
1. Unit test: Webhook signature verification
2. Integration test: Checkout session creation
3. Manual test: Complete payment flow with Stripe test mode
4. Webhook test: Use Stripe CLI to send test events

**Success Criteria:**
- User redirected to Stripe Checkout
- Successful payment updates DB via webhook
- Success page displays after payment
- Webhook signature verified (security)

## Additional Recommendations

### Developer Experience

**Hot Module Replacement (HMR):**
Vite already configured. Ensure backend changes don't require frontend restart (they won't - separate processes).

**Type Safety:**
- Share types between frontend/backend via shared package (future enhancement)
- For now, duplicate API response types in `frontend/src/types/api.types.ts`

**Error Boundaries:**
Add React error boundaries to catch component errors:
```typescript
// frontend/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Standard error boundary implementation
}
```

### Security Checklist

- [ ] JWT secret is strong (min 32 chars, random)
- [ ] CORS origins whitelist production domains only
- [ ] Stripe webhook signature verified on every request
- [ ] Rate limiting applied to auth endpoints
- [ ] HTTPS enforced in production
- [ ] Token expiration validated on backend (already implemented)

### Performance Optimizations

**Code Splitting:**
```typescript
// Lazy load heavy components
const GTMCompilerPage = lazy(() => import('./pages/GTMCompiler'));
const AdminPanel = lazy(() => import('./pages/Admin'));
```

**API Request Caching:**
Use React Query or SWR for automatic caching (post-MVP enhancement).

**Bundle Size:**
`react-syntax-highlighter` is large (~200KB). Consider:
- Dynamic import: `const SyntaxHighlighter = lazy(() => import('./SyntaxHighlighter'))`
- Or lighter alternative: `prismjs` with manual setup

---

**Next Step:** Use this research to create detailed phase plans in roadmap.
