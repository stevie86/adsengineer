# OpenCode ↔ Kilo.ai Integration Guide

**Project:** AdsEngineer Phase 1 MVP  
**Date:** 2026-02-13  
**Context:** GSD Workflow with Multi-Platform Execution

---

## Executive Summary

You have a complete Phase 1 MVP planned using the **GSD (Get Shit Done)** workflow with 6 executable plans, 32 requirements, and an 8-week roadmap. This document provides integration strategies between **OpenCode** (your current platform) and **Kilo.ai Cloud Agent** for optimal execution.

**Current State:**
- ✅ 6 executable plans created (01-01 through 01-06)
- ✅ 5,404 lines of research completed
- ✅ 32 requirements mapped across AUTH, BILL, SEC, DASH, ONBOARD, LAND
- ✅ Ready for execution

---

## Platform Strengths Analysis

### OpenCode (Current)
**Best For:**
- Backend API development (Cloudflare Workers, Hono, D1)
- Authentication & security (JWT, HMAC, AES-256-GCM)
- Database migrations and queries
- Integration with existing test suite (206 tests)
- Billing webhooks and Stripe integration
- Complex business logic

**Existing Assets:**
- 20 route files, 33 service files
- JWT middleware, encryption service
- Google Ads/Meta/TikTok integrations
- Shopify/WooCommerce webhook handlers
- 14 D1 migrations

### Kilo.ai Cloud Agent
**Best For:**
- Frontend React components
- UI/UX implementation
- Landing page development
- Dashboard visualization
- Responsive design
- Component library creation

**Advantages:**
- Specialized frontend agents
- Cloud-based execution
- Potentially faster UI iteration
- Fresh perspective on design

---

## Integration Strategy Options

### Option 1: GSD as Orchestration Layer (Recommended)

Use your existing GSD workflow to coordinate work between platforms.

```
┌─────────────────────────────────────────────────────────────┐
│                     GSD WORKFLOW                            │
│              (Your .planning/ structure)                    │
├─────────────────────────────────────────────────────────────┤
│  /gsd-plan-phase 1                                          │
│       ↓                                                     │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  OpenCode    │◄────►│  Kilo.ai     │                    │
│  │  (Sisyphus)  │      │  Cloud Agent │                    │
│  └──────────────┘      └──────────────┘                    │
│       ↓                      ↓                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Auth/Billing│      │  Frontend UI │                    │
│  │  (Hono/D1)   │      │  (React)     │                    │
│  └──────────────┘      └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**How It Works:**
1. Keep your existing GSD planning in `.planning/phases/`
2. Use OpenCode for backend/API work
3. Delegate frontend tasks to Kilo.ai via plan specifications
4. Coordinate through PLAN.md files with platform assignments

**Plan Assignments:**

| Plan | Wave | Best Platform | Reasoning |
|------|------|---------------|-----------|
| 01-01 Auth Foundation | 1 | **OpenCode** | Backend auth, JWT, D1 integration |
| 01-02 Security & GDPR | 2 | **OpenCode** | Middleware, audit logging, EU region config |
| 01-03 Billing Integration | 3 | **OpenCode** | Stripe webhooks, race condition handling |
| 01-04 Dashboard Real Data | 4 | **Hybrid** | OpenCode: API, Kilo.ai: React components |
| 01-05 Onboarding Wizard | 5 | **Hybrid** | OpenCode: endpoints, Kilo.ai: UI flow |
| 01-06 Landing Page Updates | 6 | **Kilo.ai** | Astro components, hCaptcha integration |

---

### Option 2: Task-Level Delegation

Export specific tasks from PLAN.md files to the appropriate platform.

**Example - Plan 01-04 (Dashboard):**

```yaml
# OpenCode handles:
- task 04-02: Create useDashboardData hook
  platform: opencode
  reason: Needs API integration, JWT context

- task 04-03: Implement analytics dashboard endpoint  
  platform: opencode
  reason: D1 queries, org_id filtering

# Kilo.ai handles:
- task 04-04: Create ConversionTable component
  platform: kilo.ai
  reason: Pure React, styling, responsive design
  
- task 04-05: Create SyncStatus component
  platform: kilo.ai
  reason: UI state management, visual design

- task 04-06: Create SampleDataPreview component
  platform: kilo.ai
  reason: Educational UI, empty states
```

**Export Format for Kilo.ai:**

```markdown
## Task Export: Dashboard Components

### Context
- Project: AdsEngineer Phase 1 MVP
- Backend API: GET /api/v1/analytics/dashboard
- Auth: JWT with 24h expiry, org_id in token
- Tech Stack: React 18, Tailwind CSS, React Router 7

### Component Requirements

#### ConversionTable Component
- **Location:** frontend/src/components/ConversionTable.tsx
- **Props:** conversions[] (from API)
- **Columns:** Platform (icon), Timestamp (relative), Value (currency)
- **Platforms:** Google Ads, Meta, TikTok, Shopify, WooCommerce
- **Empty State:** Show SampleDataPreview component

#### SyncStatus Component  
- **Location:** frontend/src/components/SyncStatus.tsx
- **Props:** last_sync_at, status, onSync()
- **Status Badge Colors:**
  - Green: synced < 1 hour ago
  - Yellow: synced 1-24 hours ago
  - Red: synced > 24 hours ago or error
- **Features:** "Sync Now" button with loading state

### API Contract
```typescript
GET /api/v1/analytics/dashboard
Headers: Authorization: Bearer <jwt>
Response: {
  conversion_count: number,
  conversions: [
    { platform: string, timestamp: string, value: number, order_id: string }
  ],
  last_sync_at: string,
  sync_status: 'synced' | 'syncing' | 'error'
}
```

### Design Guidelines
- Use existing Tailwind classes
- Follow existing component patterns in frontend/src/components/
- Mobile-first responsive design
- Loading states with skeleton screens
```

---

### Option 3: Hybrid Execution with Nia Context Sharing

Leverage both platforms simultaneously with Nia for context synchronization.

**Synchronization Points:**

1. **API Contracts** - Both platforms read from PLAN.md
2. **Auth Context** - JWT structure shared via Nia
3. **Database Schema** - D1 migrations shared via Nia
4. **Test Requirements** - Verification criteria in plans

**Nia Context Save (OpenCode):**
```javascript
nia_context({
  action: "save",
  title: "AdsEngineer Auth Context",
  content: `
    JWT Structure: { user_id, org_id, email, plan_id, subscription_status }
    Token Lifetime: 24 hours
    Refresh: Proactive at 23 hours
    Storage: localStorage (httpOnly not available in Workers)
  `,
  tags: ["adsengineer", "auth", "jwt"],
  memory_type: "episodic"
})
```

**Nia Context Retrieve (Kilo.ai):**
```javascript
nia_context({
  action: "retrieve",
  context_id: "<saved-context-id>"
})
```

---

## Recommended Execution Plan

### Phase 1: Foundation (Weeks 1-3)

**Execute entirely in OpenCode** - these are backend-critical:

1. **Plan 01-01: Auth Foundation**
   - JWT implementation
   - Brevo double opt-in
   - Protected routes
   - Rate limiting

2. **Plan 01-02: Security & GDPR**
   - hCaptcha server-side verification
   - GDPR endpoint authentication
   - Audit logging
   - EU region locking

3. **Plan 01-03: Billing Integration**
   - Stripe Checkout
   - Webhook handling with idempotency
   - Customer Portal
   - Plan limits enforcement

### Phase 2: UI Development (Weeks 4-6)

**Hybrid approach** - export frontend tasks to Kilo.ai:

4. **Plan 01-04: Dashboard Real Data**
   - OpenCode: API endpoints, data hooks
   - Kilo.ai: Table components, status badges, empty states

5. **Plan 01-05: Onboarding Wizard**
   - OpenCode: Site setup endpoints, OAuth flow
   - Kilo.ai: Wizard UI, step indicators, form components

### Phase 3: Polish (Weeks 7-8)

**Kilo.ai heavy** - UI polish and landing page:

6. **Plan 01-06: Landing Page Updates**
   - Kilo.ai: hCaptcha forms, privacy policy layout
   - OpenCode: Brevo integration, form handlers

---

## Cross-Platform Communication Protocol

### 1. API Contracts First

Before any frontend work, finalize the API contract in OpenCode:

```typescript
// serverless/src/routes/analytics.ts
// Document thoroughly - this is the contract
app.get('/api/v1/analytics/dashboard', async (c) => {
  // Extract from JWT
  const { org_id } = c.get('auth')
  
  // Query D1
  const conversions = await db.query(`
    SELECT platform, timestamp, value, order_id 
    FROM conversions 
    WHERE org_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 10
  `, [org_id])
  
  return c.json({
    conversion_count: conversions.length,
    conversions,
    last_sync_at: getLastSync(org_id),
    sync_status: getSyncStatus(org_id)
  })
})
```

### 2. Export Format

When exporting to Kilo.ai, include:

```markdown
## Task Package for Kilo.ai

### Prerequisites
- [ ] API endpoint implemented (link to commit/PR)
- [ ] JWT auth context documented
- [ ] Test data available

### Deliverables
- [ ] Component files created
- [ ] TypeScript types defined
- [ ] Responsive design verified
- [ ] Loading states implemented
- [ ] Error handling added

### Verification
Run these checks before marking complete:
1. Component renders with mock data
2. Loading skeleton displays correctly
3. Error boundary catches API failures
4. Responsive on mobile (< 640px)
5. Accessible (keyboard navigation, ARIA labels)
```

### 3. Integration Testing

Before merging Kilo.ai work:

```bash
# In OpenCode
pnpm test:integration  # Ensure backend tests pass
cd frontend && pnpm test  # Run frontend tests

# Manual verification
# 1. Login with test user
# 2. Navigate to dashboard
# 3. Verify real data loads
# 4. Test sync button
# 5. Check empty state
```

---

## Context Sharing via Nia

### Recommended Contexts to Save

1. **API Contracts** - All endpoint signatures and response shapes
2. **Auth Context** - JWT structure, auth flow, protected routes
3. **Database Schema** - D1 tables relevant to frontend
4. **Plan Limits** - Feature restrictions by tier
5. **Component Library** - Existing UI patterns to follow

### Context Tags

Use consistent tags for easy retrieval:

- `adsengineer` - Project identifier
- `phase-1` - Current phase
- `api-contract` - Backend interfaces
- `auth` - Authentication patterns
- `ui-pattern` - Frontend conventions
- `plan-01-04` - Specific plan reference

---

## Risk Mitigation

### Risk 1: Auth Context Misalignment

**Problem:** Kilo.ai implements frontend auth differently than OpenCode backend expects.

**Mitigation:** 
- Document JWT structure explicitly
- Provide working auth hook example
- Share test JWT for development

### Risk 2: API Contract Drift

**Problem:** OpenCode changes API after Kilo.ai builds frontend.

**Mitigation:**
- Version APIs (/api/v1/...)
- Lock contracts at export time
- Communicate changes immediately

### Risk 3: Data Format Mismatches

**Problem:** Frontend expects different field names than backend returns.

**Mitigation:**
- Use TypeScript interfaces as source of truth
- Generate types from backend
- Share Zod schemas

---

## Quick Start Commands

### Starting Execution

```bash
# In OpenCode - Start Phase 1
/gsd-execute-phase 1

# Or specific plan
/gsd-execute-plan 01-01
```

### Exporting to Kilo.ai

```bash
# Review plan first
cat .planning/phases/01-foundation-mvp/01-04-PLAN.md

# Save API context to Nia
# (Document the specific API endpoints)

# Export task descriptions for Kilo.ai
# Copy relevant task sections from PLAN.md
```

### Verifying Integration

```bash
# Backend tests
cd serverless && pnpm test

# Frontend tests
cd frontend && pnpm test

# Integration tests
cd serverless && pnpm test:integration

# Type checking
cd serverless && pnpm type-check
cd frontend && pnpm type-check
```

---

## Decision Matrix

| Scenario | Recommended Approach | Rationale |
|----------|---------------------|-----------|
| Backend-heavy plan (auth, billing) | OpenCode only | Needs D1, Workers expertise |
| Frontend-heavy plan (landing page) | Kilo.ai only | Specialized UI agents |
| Mixed plan (dashboard, onboarding) | Hybrid | Optimize for each platform's strengths |
| Tight deadline | OpenCode only | Single context, faster iteration |
| High UI complexity | Hybrid + Kilo.ai | Fresh design perspective |
| Security-critical | OpenCode only | Existing security patterns |

---

## Appendix: GSD Workflow Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/gsd-new-project` | Initialize new project | Starting fresh |
| `/gsd-discuss-phase N` | Discuss gray areas | Before planning |
| `/gsd-plan-phase N` | Generate executable plans | After discussion |
| `/gsd-execute-phase N` | Run all plans in phase | Ready to build |
| `/gsd-execute-plan XX-NN` | Run specific plan | Selective execution |
| `/gsd-status` | Check project state | Anytime |

---

## Summary

**Best Approach for Your Project:**

1. **Start with OpenCode** for Plans 01-01, 01-02, 01-03 (backend foundation)
2. **Export Plans 01-04, 01-05 to Kilo.ai** for frontend components
3. **Use Nia** to share API contracts and auth context
4. **Finish Plan 01-06 in Kilo.ai** (landing page polish)
5. **Verify integration** with existing test suite

This leverages OpenCode's backend expertise and existing codebase while tapping into Kilo.ai's frontend specialization for faster UI delivery.

---

*Generated: 2026-02-13*  
*Next Review: After Plan 01-03 completion*
