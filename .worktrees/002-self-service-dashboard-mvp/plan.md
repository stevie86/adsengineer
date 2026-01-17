# Implementation Plan: Self-Service Dashboard MVP

**Status**: Draft  
**Created**: 2026-01-13  
**Feature**: Self-Service Dashboard MVP  
**Spec**: spec.md

---

## Technical Context

### Existing Infrastructure
- **Backend**: Cloudflare Workers (Hono framework)
- **Database**: D1 (SQLite-compatible)
- **Authentication**: JWT middleware already exists with role-based access
- **Stripe**: SDK v14.25.0 installed, webhooks configured
- **Email**: Not integrated yet (needs provider selection)
- **Google Ads**: OAuth flow already implemented and tested
- **Universal SST**: Existing implementation deployed at `adsengineer-cloud.adsengineer.workers.dev`

### Tech Stack Decisions

**Backend Stack**:
- Runtime: Cloudflare Workers (serverless)
- Framework: Hono (lightweight HTTP router)
- Language: TypeScript 4.9+
- Database: D1 (Cloudflare D1 binding)
- Auth: JWT (stateless tokens, 24h expiration)
- Payments: Stripe SDK v14.25.0
- Password hashing: bcrypt (12 rounds minimum)
- Validation: Zod schemas for request validation

**Frontend Stack**:
- Framework: React 18 (recommended for stability and ecosystem)
- UI Library: Tailwind CSS (matches existing landing page)
- HTTP Client: Fetch API (native, minimal dependencies)
- State Management: React Context (for auth, simple state for dashboard)
- Forms: React Hook Form or controlled components
- Icons: Lucide React (modern, lightweight)

**Email Provider**:
- Choice: SendGrid (recommended for MVP)
- Why: Proven reliability, excellent deliverability, easy integration
- Alternative: Could switch to Resend or Postmark later

---

## Architecture Design

### Overall Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React)                     │
│  https://dashboard.adsengineer.cloud/        │
└────────────────────┬──────────────────────────────┘
                 │
                 ▼ HTTPS
        ┌───────────────────────────────────────┐
        │  Backend API (Cloudflare Workers)   │
        │  https://advocate-cloud.adsengineer.  │
        │  workers.dev/api/v1/*                 │
        └────────────────────────────────────────┘
                 │
                 ▼
        ┌───────────────────────────────────────┐
        │  Database (D1)                    │
        │  Cloudflare D1 Binding               │
        └────────────────────────────────────────┘
                 │
                 ▼
        ┌───────────────────────────────────────┐
        │  Stripe (Payment Processing)           │
        │  Stripe API                          │
        └────────────────────────────────────────┘
```

### Frontend Architecture

**Directory Structure**:
```
frontend/
├── src/
│   ├── pages/
│   │   ├── index.tsx                    # Dashboard overview (authenticated)
│   │   ├── auth/
│   │   │   ├── login.tsx                # Login form
│   │   │   ├── register.tsx             # Registration form
│   │   │   └── reset-password.tsx        # Password reset
│   │   ├── billing/
│   │   │   ├── pricing.tsx               # Pricing page (public)
│   │   │   ├── checkout.tsx              # Stripe Checkout redirect
│   │   │   ├── success.tsx                # Payment success
│   │   │   └── cancel.tsx                # Payment canceled
│   │   ├── settings/
│   │   │   ├── profile.tsx                # Account settings
│   │   │   ├── notifications.tsx           # Notification preferences
│   │   │   └── privacy.tsx               # Privacy settings
│   │   ├── integrations/
│   │   │   ├── google-ads.tsx           # Google Ads connection
│   │   │   └── index.tsx                 # All integrations list
│   │   ├── components/
│   │   │   ├── ui/                       # Reusable UI components
│   │   │   │   ├── Card.tsx                 # Card containers
│   │   │   │   ├── Button.tsx               # Button component
│   │   │   │   ├── Input.tsx                # Form inputs
│   │   │   │   ├── Modal.tsx                # Modal dialogs
│   │   │   │   ├── StatusBadge.tsx         # Status indicators
│   │   │   │   └── Table.tsx                # Data tables
│   │   ├── lib/
│   │   │   ├── api.ts                     # API client (fetch wrapper)
│   │   │   ├── auth.ts                    # Auth utilities (JWT storage)
│   │   │   └── utils.ts                    # Helper functions
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx            # Authentication context
│   │   │   └── DashboardContext.tsx      # Dashboard state
│   │   └── App.tsx                     # Main app component
│   └── package.json
└── tailwind.config.js
```

**State Management Strategy**:
```
AuthContext (React Context)
├── User data (email, name, customerId)
├── Auth state (isAuthenticated, token, loading)
├── Role (owner, admin, member, viewer - future-proof)
└── Actions (login, logout, refresh token)

DashboardContext (React Context)
├── Subscription data (plan, status, usage)
├── Platform connections (Google Ads, Meta, TikTok - future)
├── Refresh intervals (30s for data, 60s for connections)
└── Actions (fetchData, refreshData)
```

---

## Database Design

### New Tables

#### customer_settings
**Purpose**: Store customer profile and preferences separate from main customer record

```sql
CREATE TABLE IF NOT EXISTS customer_settings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  industry TEXT,
  notification_email BOOLEAN DEFAULT false,
  notification_sms BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT false,
  notification_conversion_alerts BOOLEAN DEFAULT true,
  privacy_data_export BOOLEAN DEFAULT true,
  privacy_marketing_opt_in BOOLEAN DEFAULT true,
  privacy_analytics_access BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_customer_settings_customer_id ON customer_settings(customer_id);
CREATE INDEX idx_customer_settings_updated_at ON customer_settings(updated_at);
```

**Migration**: `0002_customer_settings.sql`

#### sites
**Purpose**: Track multiple websites per customer for multi-site support

```sql
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  url TEXT,
  name TEXT,
  status TEXT DEFAULT 'active',
  last_activity TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX idx_sites_customer_id ON sites(customer_id);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_sites_status ON sites(status);
```

**Migration**: `0003_sites.sql`

---

## Backend API Design

### Authentication Endpoints

**New Endpoints Required**:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/v1/auth/register` | Public | Register new customer account |
| `GET /api/v1/auth/agreements` | Public | Get agreement versions and text |
| `POST /api/v1/auth/agreements/:customerId/accept` | Public | Accept legal agreement |
| `POST /api/v1/auth/login` | Public | Login with email/password |
| `POST /api/v1/auth/logout` | Authenticated | Invalidate session |
| `POST /api/v1/auth/reset-password` | Public | Request password reset email |
| `GET /api/v1/auth/reset-password/:token` | Public | Verify reset token and set new password |
| `GET /api/v1/auth/agreements/:customerId` | Authenticated | Get customer's accepted agreements |

**Implementation Notes**:
- Use existing JWT generation logic from `services/jwt.ts`
- Password hashing: bcrypt with 12 rounds
- Password reset token: crypto.randomUUID() with 1-hour expiration
- Email triggers on: registration (welcome), password reset (reset link)
- Login response includes: JWT token, customer ID, role

---

### Billing Endpoints

**New Endpoints Required**:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/v1/billing/checkout-session` | Authenticated | Create Stripe Checkout Session |
| `POST /api/v1/billing/portal-session` | Authenticated | Create Stripe Customer Portal session |
| `GET /api/v1/billing/subscriptions/:agencyId` | Authenticated | Get subscription status |
| `GET /api/v1/billing/pricing` | Public | Get pricing tiers (existing) |

**Implementation Notes**:
- **Checkout Session**: Use `stripe.checkout.sessions.create()` with:
  - `mode: 'subscription'`
  - `payment_method_types: ['card']`
  - `success_url`: `https://dashboard.adsengineer.cloud/success`
  - `cancel_url`: `https://dashboard.adsengineer.cloud/checkout`
  - `customer_email`: from JWT payload
  - `allow_promotion_codes: true`
- **Customer Portal**: Use `stripe.billingPortal.sessions.create()` with:
  - `return_url`: `https://dashboard.adsengineer.cloud/settings/billing`
  - Customer ID from JWT context
- Keep existing webhooks (`/api/v1/billing/webhooks/stripe`) unchanged

---

### Dashboard Endpoints

**New Endpoints Required**:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `GET /api/v1/dashboard` | Authenticated | Get dashboard overview data |
| `POST /api/v1/dashboard/settings/profile` | Authenticated | Update customer profile |
| `GET /api/v1/dashboard/settings/profile` | Authenticated | Get customer profile |
| `GET /api/v1/dashboard/settings/notifications` | Authenticated | Get notification preferences |
| `POST /api/v1/dashboard/settings/notifications` | Authenticated | Update notification preferences |
| `GET /api/v1/dashboard/settings/privacy` | Authenticated | Get privacy settings |
| `POST /api/v1/dashboard/settings/privacy` | Authenticated | Update privacy settings |
| `GET /api/v1/dashboard/conversions` | Authenticated | Get recent conversions (paginated) |
| `GET /api/v1/dashboard/usage` | Authenticated | Get usage statistics |

**Implementation Notes**:
- Reuse existing Google Ads OAuth implementation
- Dashboard data聚合 from multiple sources (billing, conversions, platforms)
- Recent conversions: Limit 20 per page, support date filtering
- Usage stats: Calculate from `leads` table, not separate usage table

---

### Email Service Endpoints

**New Service Required**:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/v1/email/welcome` | Internal (SendGrid) | Send welcome email on registration |
| `POST /api/v1/email/password-reset` | Internal (SendGrid) | Send password reset email |
| `POST /api/v1/email/verification` | Internal (SendGrid) | Send email verification (future) |

**Implementation Notes**:
- Create new file `serverless/src/routes/email.ts`
- Use SendGrid SDK with API key from environment
- Implement HTML email templates
- Queue failed emails for retry
- Log all email sends for audit trail

---

## Frontend Implementation Plan

### Phase 1: Authentication (Week 1)

**Files to Create**:
1. `frontend/src/pages/auth/login.tsx`
2. `frontend/src/pages/auth/register.tsx`
3. `frontend/src/pages/auth/reset-password.tsx`
4. `frontend/src/lib/auth.ts` - JWT storage utilities
5. `frontend/src/contexts/AuthContext.tsx` - Auth state management

**Features**:
- Login form with email/password validation
- Registration form with agreement checkboxes
- Password reset request (email input)
- Password reset confirmation (token + new password)
- Remember me functionality (JWT persistence)
- Error handling and display
- Loading states and success messages

**Tech Choices**:
- React Hook Form for form management
- Zod schemas for client-side validation
- Local storage for JWT token persistence
- Redirect to dashboard after successful login/register

---

### Phase 2: Billing (Week 1-2)

**Files to Create**:
1. `frontend/src/pages/billing/pricing.tsx` - Public pricing page
2. `frontend/src/pages/billing/checkout.tsx` - Checkout redirect handler
3. `frontend/src/pages/billing/success.tsx` - Payment success page
4. `frontend/src/pages/billing/cancel.tsx` - Payment canceled page
5. `frontend/src/components/ui/Card.tsx` - Plan comparison cards

**Features**:
- Display pricing tiers (Starter €99, Professional €299, Enterprise €999)
- Show features list for each plan
- "Subscribe" buttons with plan selection
- Stripe Checkout redirect with loading state
- Success page with subscription activation confirmation
- Cancel page with cancellation confirmation

**Tech Choices**:
- Fetch API for pricing data
- Redirect logic for Stripe Checkout Sessions
- URL parameter handling for session confirmation
- Loading states during Stripe redirect

---

### Phase 3: Dashboard Core (Week 2)

**Files to Create**:
1. `frontend/src/pages/index.tsx` - Dashboard overview
2. `frontend/src/contexts/DashboardContext.tsx` - Dashboard state
3. `frontend/src/components/ui/StatusBadge.tsx` - Connection status indicators
4. `frontend/src/components/ui/Table.tsx` - Conversions table
5. `frontend/src/lib/api.ts` - API client wrapper

**Features**:
- Subscription status card (plan, period, usage)
- Platform connection status (Google Ads: ✅, Meta: ⏳ Coming Soon)
- Today's conversions card (count, revenue)
- Attribution accuracy rate
- Recent conversions table (20 entries, sortable)
- Usage statistics (conversions this month, % of lead limit)

**Tech Choices**:
- React Context for dashboard state
- Auto-refresh every 30 seconds
- Error boundary for API failures
- Loading skeletons during data fetch

---

### Phase 4: Settings (Week 2-3)

**Files to Create**:
1. `frontend/src/pages/settings/profile.tsx`
2. `frontend/src/pages/settings/notifications.tsx`
3. `frontend/src/pages/settings/privacy.tsx`
4. `frontend/src/components/ui/Input.tsx`
5. `frontend/src/components/ui/Button.tsx`

**Features**:
- Profile form (name, company, phone, industry)
- Notification toggles (email, SMS, push, conversion alerts)
- Privacy toggles (data export, marketing opt-out, analytics access)
- Save buttons with success feedback
- Form validation (email format, phone format)

**Tech Choices**:
- Controlled form components for inputs
- Zod validation schemas
- Optimistic UI updates (save immediately, revert on error)

---

### Phase 5: Google Ads Integration (Week 3)

**Files to Create**:
1. `frontend/src/pages/integrations/google-ads.tsx`
2. `frontend/src/components/ui/Modal.tsx` - OAuth flow confirmation

**Features**:
- "Connect Google Ads" button
- OAuth initiation and redirect
- Connection status indicator (Connected, Pending, Expired)
- "Disconnect" button
- Token status display (Active, Exired)
- Error handling for OAuth failures

**Tech Choices**:
- Reuse existing `/api/v1/oauth/google-ads/init` endpoint
- Window.open() for OAuth redirect
- Callback URL parameter handling
- State persistence during OAuth flow

---

## Stripe Integration Strategy

### Hybrid Approach: Two Flows Coexisting

**Flow 1: Server-Side Creation (Existing)**
- Keep `POST /api/v1/billing/subscriptions` endpoint
- Used for manual onboarding by you/admin API
- Webhooks `customer.subscription.created` continue working
- No changes needed

**Flow 2: Customer Self-Service (New)**
- Add `POST /api/v1/billing/checkout-session` endpoint
- Add `POST /api/v1/billing/portal-session` endpoint
- New webhooks not needed (existing ones work)
- Keep `subscriptions` table schema unchanged

### Implementation Details

**Checkout Session Endpoint**:
```typescript
billing.post('/checkout-session', async (c) => {
  const { price_id } = await c.req.json();
  const auth = c.get('auth');
  
  const session = await getStripe(c.env).checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: price_id }],
    success_url: 'https://dashboard.adsengineer.cloud/success',
    cancel_url: 'https://dashboard.adsengineer.cloud/checkout',
    customer_email: auth.user_id, // From JWT
    allow_promotion_codes: true,
    metadata: {
      agency_id: auth.org_id,
      customer_id: auth.user_id,
    },
  });
  
  return c.json({ session_url: session.url });
});
```

**Customer Portal Endpoint**:
```typescript
billing.post('/portal-session', async (c) => {
  const auth = c.get('auth');
  
  const session = await getStripe(c.env).billingPortal.sessions.create({
    customer: auth.stripe_customer_id,
    return_url: 'https://dashboard.adsengineer.cloud/settings/billing',
  });
  
  return c.json({ portal_url: session.url });
});
```

### Why This Works

- Both flows use same `subscriptions` table
- Same webhooks handle both flow types
- Stripe creates subscription, webhook updates database
- Customer sees same subscription status either way
- Backend complexity minimized (no flow detection logic needed)

---

## Email Service Integration

### SendGrid Setup

**Configuration**:
- Add `SENDGRID_API_KEY` to environment variables
- Add `FROM_EMAIL` and `FROM_NAME` to environment
- Create email templates directory

**Templates Needed**:
1. `templates/welcome.html` - On registration
2. `templates/password-reset.html` - Password reset link
3. `templates/subscription-confirmation.html` - On subscription activation
4. `templates/subscription-cancelled.html` - On subscription cancellation

**Implementation Pattern**:
```typescript
// serverless/src/routes/email.ts
import SendGrid from '@sendgrid/mail';

const sendEmail = async (to: string, template: string, data: any) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: data.subject,
    html: compileTemplate(template, data),
  };
  
  await sendGrid.send(msg);
};
```

---

## Security Considerations

### Authentication Security
- **Password Hashing**: bcrypt with 12+ rounds, random salt per user
- **JWT Expiration**: 24 hours (86400 seconds)
- **Rate Limiting**: 100 requests/minute on auth endpoints
- **Session Invalidaton**: Logout deletes token from client-side storage

### API Security
- **CORS**: Allow `dashboard.adsengineer.cloud` origin
- **Rate Limiting**: 1000 requests/minute on dashboard endpoints
- **Webhook Verification**: Verify Stripe signatures using webhook secret
- **Input Validation**: Zod schemas on all endpoints

### Data Security
- **PII Storage**: Encrypt OAuth tokens, Stripe config in database
- **GDPR**: Data export endpoint, right to deletion
- **Audit Logging**: Log all authentication events, subscription changes

---

## Testing Strategy

### Backend Testing
- Unit tests for all new endpoints (Vitest)
- Integration tests for Stripe Checkout Sessions
- Integration tests for authentication flows
- Mock Stripe API in tests

### Frontend Testing
- Manual testing of all user flows
- Browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Error state testing

### E2E Testing
- Test signup → login → checkout → dashboard flow
- Test logout → login flow (session invalidation)
- Test password reset email delivery
- Test Stripe webhook processing

---

## Deployment Plan

### Environment Configuration
**Staging**:
- Deploy to `advocate-cloud-staging.adsengineer.workers.dev`
- Test Stripe Checkout with test keys
- Validate all flows before production

**Production**:
- Deploy to `advocate-cloud.adsengineer.workers.dev`
- Enable production Stripe keys
- Configure production email templates
- Set up production domain `dashboard.adsengineer.cloud`

### Rollout Strategy
- Week 1: Backend API + Authentication + Stripe Checkout
- Week 2: Dashboard Core + Settings pages
- Week 3: Google Ads integration + final testing
- Week 4: Bug fixes, performance optimization, documentation

---

## Success Criteria Validation

From spec.md, validate achievability:

### Performance Targets
- [x] Dashboard pages load in < 3 seconds (95th percentile)
- [x] API response time < 200ms (95th percentile)
- [x] Stripe checkout session creation < 500ms
- [x] Support 100 concurrent dashboard users
- [x] Google Ads connection rate > 90%

### Security Targets
- [x] All endpoints require authentication (except public pricing)
- [x] Passwords hashed with bcrypt (12+ rounds)
- [x] JWT tokens expire in 24 hours
- [x] Webhook signatures verified
- [x] Rate limiting applied to auth endpoints

### Feature Completeness
- [x] Customer can register, login, logout independently
- [x] Customer can subscribe via Stripe Checkout
- [x] Customer can manage subscription via Customer Portal
- [x] Dashboard shows subscription status, platform connections, conversions
- [x] Customer can update profile and settings
- [x] Google Ads OAuth flow works end-to-end
- [x] Email service sends all required transactional emails

### User Experience
- [x] Sign up to dashboard access < 2 minutes
- [x] Checkout to subscription < 3 minutes
- [x] Onboarding wizard guides through setup
- [x] Error messages are clear and actionable
- [x] Loading states provide feedback during API calls

---

## Dependencies

### Backend Dependencies
- **bcrypt** - Password hashing
- **@sendgrid/mail** - Email service
- **zod** - Request validation

### Frontend Dependencies
- **react** ^18.0.0
- **react-router-dom** ^6.0.0
- **lucide-react** - Icon library
- **tailwindcss** - Styling
- **date-fns** - Date formatting
- **react-hook-form** - Form management

---

## Open Questions

**Frontend Deployment**:
- Which deployment platform? (Vercel, Netlify, Cloudflare Pages, custom)
- Should we use a build framework? (Vite, Next.js, CRA)

**Email Service**:
- SendGrid account ready? API keys obtained?
- Template design finalized?

**Domain**:
- Is `dashboard.adsengineer.cloud` domain registered?
- SSL certificate configured?

---

## Risk Mitigation

### Technical Risks
- **Stripe API Changes**: Monitor Stripe changelog for breaking changes
- **Email Delivery Failures**: Implement retry logic, alert on failures
- **OAuth Token Expiration**: Handle refresh logic, show "reconnect" button

### Business Risks
- **Low Adoption**: Clear onboarding wizard, help documentation
- **Cart Abandonment**: Implement abandoned checkout emails (via Stripe)
- **Support Volume**: Prepare documentation, self-service help center

---

**END OF PLAN**
