# Research: Self-Service Dashboard MVP

**Feature**: Self-Service Dashboard MVP  
**Created**: 2026-01-13  
**Spec**: spec.md

---

## Unknowns & Clarifications

### Email Service Provider Selection

**Decision**: Use **SendGrid** for MVP

**Rationale**:
- Proven reliability and deliverability for transactional emails
- Excellent documentation and community support
- Easy integration with existing Cloudflare Workers environment
- Scalable for high-volume sending
- Reasonable pricing for startups (~$0.01/1000 emails)

**Alternatives Considered**:
- **Resend**: Modern DX, excellent API, good pricing
- **Mailgun**: Established, but pricing has become complex
- **Postmark**: Best deliverability, but higher cost

**Conclusion**: SendGrid provides the best balance of reliability, documentation, and ease of integration for our MVP needs.

---

### Frontend Framework Selection

**Decision**: Use **Vite** for build tool + **React Router** for routing

**Rationale**:
- Vite provides faster development server and Hot Module Replacement (HMR)
- Simpler configuration than Create React App
- Better TypeScript support than CRA
- Easier deployment to Cloudflare Pages
- Industry standard for modern React projects

**Alternatives Considered**:
- **Next.js**: More complex for our use case, adds routing overhead
- **Create React App**: Not suitable for multi-page SPA
- **Webpack**: Slower build times, more configuration

**Conclusion**: Vite + React Router provides optimal development experience and deployment simplicity.

---

### Authentication Flow Design

**Decision**: JWT-based stateless authentication

**Rationale**:
- Aligns with existing Cloudflare Workers architecture
- No session storage needed (stateless by design)
- Easy to scale across multiple regions
- Existing JWT middleware can be reused

**Implementation Details**:
- Token generated on registration/login
- Stored in localStorage: `token`, `user_id`, `role`
- Attached to all API requests via `Authorization: Bearer <token>`
- 24-hour expiration (configurable)
- Logout clears tokens and redirects to login page

---

### Stripe Integration Strategy

**Decision**: Hybrid approach - two parallel flows coexist

**Current Flow (Admin)**:
- Server-side subscription creation: `/api/v1/billing/subscriptions`
- Used for manual onboarding by you/admin API

**New Flow (Customer Self-Service)**:
- Checkout Sessions: `/api/v1/billing/checkout-session`
- Customer Portal: `/api/v1/billing/portal-session`

**Why Both Work**:
- Different use cases (admin onboarding vs customer self-management)
- Existing webhooks support both flows without changes
- No migration or refactoring needed
- Better UX for customers (self-service control)

**Implementation**:
- Keep existing `/api/v1/billing/subscriptions` endpoint
- Add new `/api/v1/billing/checkout-session` endpoint
- Add new `/api/v1/billing/portal-session` endpoint
- Same `subscriptions` table supports both creation methods
- Stripe webhooks automatically handle both flow types

---

### Dashboard Data Display Strategy

**Decision**: React Context for global state management

**Rationale**:
- Simplifies data flow across components
- Avoids prop drilling for deep component trees
- Centralized data fetching logic
- Easy to implement auto-refresh (30s intervals)

**State Structure**:
```typescript
interface DashboardState {
  subscription: Subscription | null;
  platformConnections: PlatformConnections;
  conversions: Conversion[];
  isLoading: boolean;
  error: Error | null;
  lastRefresh: number;
}

interface PlatformConnections {
  googleAds: { connected: boolean, lastSync: string };
  meta: { connected: boolean };
  tiktok: { connected: boolean };
}
```

**Refresh Strategy**:
- Use `useEffect` to fetch data on mount
- Implement `refreshData()` action to trigger manual refresh
- Auto-refresh every 30 seconds with `setInterval`
- Show last refresh timestamp in UI

---

### Testing Strategy

**Decision**: Manual E2E testing + automated unit tests

**E2E Scenarios**:
1. Registration flow (email validation, agreement acceptance)
2. Login/logout flow (token storage, invalidation)
3. Password reset flow (email delivery, token validation)
4. Subscription checkout (Stripe Session creation, redirect)
5. Customer Portal (session creation, manage subscription)
6. Dashboard overview (data loading, status display)
7. Settings updates (profile, notifications, privacy)
8. Google Ads OAuth (initiation, callback, connection)

**Unit Test Coverage**:
- All authentication endpoints
- All billing endpoints
- All dashboard endpoints
- JWT token generation and validation
- Stripe service methods (Checkout Sessions, Customer Portal)

**Integration Tests**:
- Backend API integration tests (real Stripe API calls mocked)
- End-to-end flows from signup to dashboard

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|-----------|--------|-----------|
| Email Service | SendGrid | Reliability + ease of integration |
| Frontend Build | Vite + React Router | Fast HMR + simple deployment |
| Auth | JWT stateless | Aligns with Cloudflare Workers |
| Stripe | Hybrid flows | Best UX for customers + admin flexibility |
| State Management | React Context | Simplifies data flow across app |
| Testing | Manual E2E + Vitest | Ensure quality coverage |

---

## Open Questions (For Implementation Phase)

### Frontend Deployment
- Which platform for hosting frontend? (Vercel recommended, but can use Cloudflare Pages)
- Should we use a UI library? (shadcn/ui popular, but custom components faster for MVP)

### Email Service
- Is SendGrid account set up? API keys ready?
- Should we implement email templates in database or filesystem?

### Domain
- Is dashboard.adsengineer.cloud registered?
- DNS configured?
- SSL certificate in place?

---

**END OF RESEARCH**
