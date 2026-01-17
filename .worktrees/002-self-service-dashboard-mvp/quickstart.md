# Quick Start: Self-Service Dashboard MVP

**Purpose**: Get started with implementation quickly

**Status**: Planning Complete ✅  
**Last Updated**: 2026-01-13

---

## Prerequisites

### Environment Setup

```bash
# 1. Set up environment variables
cd serverless
cp wrangler.toml.example wrangler.toml

# 2. Install dependencies (if needed)
pnpm install

# 3. Set environment variables
doppler run -- pnpm exec -- wrangler secret put SENDGRID_API_KEY "your-sendgrid-key"
doppler run -- pnpm exec -- wrangler secret put STRIPE_SECRET_KEY "your-stripe-secret"
doppler run -- pnpm exec -- wrangler secret put STRIPE_WEBHOOK_SECRET "your-webhook-secret"
doppler run -- pnpm exec -- wrangler secret put FROM_EMAIL "no-reply@adsengineer.cloud"
doppler run -- pnpm exec -- wrangler secret put FROM_NAME "AdsEngineer"

# 4. Validate setup
pnpm dev
curl http://localhost:8090/api/v1/status
```

### Verify Existing Infrastructure

```bash
# Check Stripe is configured
curl -s https://api.stripe.com/v1/products | grep -q "adsengineer"

# Check Google Ads credentials exist
doppler run -- pnpm exec -- wrangler secret list | grep google_ads_config

# Check database migrations exist
ls serverless/migrations/*.sql
```

---

## Project Structure Overview

```
serverless/
├── src/
│   ├── routes/
│   │   ├── auth.ts                 ← NEW (login, logout, password reset)
│   │   ├── email.ts                ← NEW (transactional emails)
│   │   ├── billing.ts              ← UPDATE (Checkout Sessions, Customer Portal)
│   │   └── dashboard.ts           ← NEW (dashboard overview, settings)
│   ├── services/
│   │   └── billing-extended.ts     ← NEW (checkout sessions, portal sessions)
│   ├── migrations/
│   │   ├── 0002_customer_settings.sql
│   │   ├── 0003_sites.sql
│   │   └── 0004_universal_sst_sessions.sql
│   └── templates/
│       └── email/                ← NEW (email templates)
├── wrangler.toml
└── package.json
```

---

## Development Workflow

### Week 1: Authentication & Stripe

**Day 1-2**: Backend Authentication
```bash
# Create auth routes
mkdir -p serverless/src/routes/auth
touch serverless/src/routes/auth/login.ts
touch serverless/src/routes/auth/logout.ts
touch serverless/src/routes/auth/reset-password.ts

# Create email service
mkdir -p serverless/src/routes/email
touch serverless/src/routes/email/welcome.ts
touch serverless/src/routes/email/password-reset.ts

# Implement login/logout
# Copy JWT generation logic from existing middleware
# Add password hashing with bcrypt
```

**Day 3-4**: Stripe Integration
```bash
# Add Stripe Checkout Sessions endpoint to billing.ts
# Add Stripe Customer Portal endpoint to billing.ts
# Create billing-extended service module

# Test with Stripe test keys
doppler run --env test -- pnpm test billing
```

### Week 2: Dashboard Core

**Day 5-7**: Dashboard Routes
```bash
# Create dashboard routes
touch serverless/src/routes/dashboard/index.ts
touch serverless/src/routes/dashboard/settings/profile.tsx
touch serverless/src/routes/dashboard/settings/notifications.tsx
touch serverless/src/routes/dashboard/settings/privacy.tsx

# Implement dashboard endpoints
# Aggregate data from billing, conversions, platforms
# Return subscription status overview
```

**Day 8-10**: Frontend Setup
```bash
# Setup frontend project
cd frontend
npm create vite@latest
npm install react react-dom react-router-dom @lucide-react/icons
npm install tailwindcss
npm install zod

# Create directory structure
mkdir -p src
mkdir -p src/pages/auth
mkdir -p src/pages/billing
mkdir -p src/pages/dashboard
mkdir -p src/pages/settings
mkdir -p src/contexts
mkdir -p src/lib
mkdir -p src/components/ui

# Set up API client
touch src/lib/api.ts
```

**Day 11-14**: Testing
```bash
# Write unit tests
# Write integration tests
# Run test suite

# Test Stripe Checkout flow end-to-end
# Test OAuth flows
```

---

## First Tasks

### Backend

- [ ] Create `serverless/src/routes/auth/` directory
- [ ] Create `serverless/src/routes/auth/login.ts` - Login endpoint
- [ ] Create `serverless/src/routes/auth/logout.ts` - Logout endpoint
- [ ] Create `serverless/src/routes/auth/reset-password.ts` - Password reset
- [ ] Create `serverless/src/routes/auth/reset-password-confirm.ts` - Token verification
- [ ] Add JWT password hashing with bcrypt (min 12 rounds)
- [ ] Create `serverless/src/routes/email/` directory
- [ ] Create `serverless/src/routes/email/welcome.ts` - Welcome email endpoint
- [ ] Create `serverless/src/routes/email/password-reset.ts` - Password reset email sending
- [ ] Create `serverless/src/services/billing-extended.ts` - Checkout Sessions and Customer Portal
- [ ] Add Stripe Checkout Session creation to billing.ts
- [ ] Add Stripe Customer Portal session creation to billing.ts
- [ ] Create `serverless/src/routes/dashboard/index.ts` - Dashboard overview
- [ ] Create `serverless/src/routes/dashboard/settings/profile.tsx` - Profile management
- [ ] Create `serverless/src/routes/dashboard/settings/notifications.tsx` - Notification settings
- [ ] Create `serverless/src/routes/dashboard/settings/privacy.tsx` - Privacy settings
- [ ] Create email templates directory `serverless/templates/email/`
- [ ] Create welcome email template
- [ ] Create password reset email template

### Database

- [ ] Create migration `0002_customer_settings.sql` - Customer settings table
- [ ] Create migration `0003_sites.sql` - Multi-site support
- [ ] Create migration `0004_universal_sst_sessions.sql` - Universal SST sessions

### Frontend

- [ ] Initialize React project with Vite
- [ ] Install dependencies (react, react-router-dom, tailwindcss, lucide-react, zod)
- [ ] Create `src/contexts/AuthContext.tsx` - Auth context
- [ ] Create `src/contexts/DashboardContext.tsx` - Dashboard state
- [ ] Create `src/lib/api.ts` - API client with fetch wrapper
- [ ] Create `src/lib/auth.ts` - JWT storage utilities
- [ ] Create `src/pages/auth/login.tsx` - Login page
- [ ] Create `src/pages/auth/register.tsx` - Registration page
- [ ] Create `src/pages/auth/reset-password.tsx` - Password reset page
- [ ] Create `src/pages/billing/pricing.tsx` - Pricing page
- [ ] Create `src/pages/billing/checkout.tsx` - Checkout redirect handler
- [ ] Create `src/pages/billing/success.tsx` - Payment success page
- [ ] Create `src/pages/billing/cancel.tsx` - Payment canceled page
- [ ] Create `src/pages/index.tsx` - Dashboard overview
- [ ] Create UI components (Card, Button, Input, StatusBadge, Table)

### Testing

- [ ] Write unit tests for all new auth endpoints
- [ ] Write unit tests for billing endpoints
- [ ] Write unit tests for dashboard endpoints
- [ ] Configure Vitest for testing
- [ ] Write E2E test scenarios
- [ ] Test Stripe Checkout flow with test keys

---

## Common Patterns

### API Response Format

```typescript
// Success response
{
  success: true,
  data: { /* response data */ }
}

// Error response
{
  success: false,
  error: "Human-readable error message"
}
```

### Error Handling

```typescript
try {
  // Business logic
} catch (error) {
  console.error('Endpoint error:', error);
  return c.json({ success: false, error: 'User-friendly message' }, 500);
}
```

### Database Query Pattern

```typescript
const result = await db.prepare('SELECT * FROM table WHERE id = ?')
  .bind(id)
  .first();

if (!result) {
  return c.json({ error: 'Not found' }, 404);
}
```

---

## Running the Dev Server

```bash
cd serverless
doppler run -- pnpm dev

# Server runs on http://localhost:8090
# Access dashboard at http://localhost:5173
```

---

## Key Commands

```bash
# Database migrations
cd serverless
doppler run -- pnpm wrangler d1 execute migrations/0002_customer_settings.sql
doppler run -- pnpm wrangler d1 execute migrations/0003_sites.sql
doppler run -- pnpm wrangler d1 execute migrations/0004_universal_sst_sessions.sql

# Deploy to staging
doppler run -- pnpm deploy --env preview

# Deploy to production
doppler run -- pnpm deploy --env production
```

---

## Notes

- Universal SST is already deployed and working (no changes needed for MVP)
- Google Ads OAuth flow is already implemented (reuse existing code)
- Stripe webhooks are already configured (no changes needed)
- Focus new development on authentication, customer-facing billing, and dashboard UI

**Getting Help**:
- Technical decisions documented in `plan.md`
- Data model documented in `data-model.md`
- API contracts documented in `contracts/`
- Checklists available in `checklists/requirements.md`

---

**END OF QUICK START**
