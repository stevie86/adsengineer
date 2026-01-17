# Self-Service Dashboard MVP Specification

**Status**: Draft  
**Created**: 2026-01-13  
**Feature Number**: 002  
**Feature Name**: Self-Service Dashboard MVP

---

## Overview

**Problem Statement**: Customers can currently only access the AdsEngineer platform through manual onboarding processes. This creates operational overhead, limits scalability, and reduces customer satisfaction. Agencies and SMB businesses need a self-service SaaS experience where they can sign up, pay, configure integrations, and manage their subscription without human intervention.

**Solution**: Build a complete self-service dashboard that enables customers to:
- Sign up and create accounts independently
- Authenticate securely and manage their sessions
- Subscribe to plans via Stripe Checkout Sessions
- Manage their subscriptions via Stripe Customer Portal
- Configure platform integrations (Google Ads initially)
- View attribution data and subscription status
- Manage basic account settings

**Success Criteria**:
- Users can complete entire journey (sign up → pay → manage) within 15 minutes
- Stripe checkout conversion rate > 85%
- Dashboard loads in < 3 seconds
- System supports 100 concurrent users
- Google Ads connection rate > 90%
- All dashboard pages accessible within 2 seconds
- Platform uptime > 99.9%

**Timeline**: MVP in 3 weeks, complete in 6 weeks

---

## Business Context

### Target Users

**Primary Segments**:
- Marketing Agencies: Need to manage multiple clients, see attribution across campaigns, prove ROI to clients
- SMB Businesses: Want self-service access to manage their own subscription, track performance
- E-commerce Stores: Need to connect Shopify/WooCommerce for conversion tracking

**User Types**:
- Account Owner: Full access to all features, can manage subscription and billing
- Future: Team Members (admin/editor/viewer) - to be added in Phase 2
- Future: Client Administrators - to be added in Phase 2

### Value Proposition

**For Customers**:
- No waiting for manual onboarding calls or emails
- Instant access to subscription management and plan changes
- Self-service onboarding wizard guides them through setup
- Transparent pricing with instant activation
- Real-time dashboard with live attribution data

**For Business**:
- Reduced customer support burden (fewer manual tasks)
- Scalable acquisition (customers sign up themselves)
- Improved cash flow (Stripe handles payments automatically)
- Better customer retention (self-service control reduces churn)

---

## User Scenarios

### Scenario 1: Customer Registration and Signup

**Description**: New user discovers AdsEngineer through landing page, marketing materials, or word-of-mouth

**Preconditions**:
- User has valid email address
- User accepts Terms of Service, DPA, and Privacy Policy
- User is 18+ years old (GDPR compliant)

**Steps**:
1. User enters email address on signup form
2. User accepts all required legal agreements (ToS, DPA, Privacy)
3. System creates customer account in `customers` table
4. System generates JWT token for authentication
5. System returns customer ID and JWT token
6. User is automatically logged in
7. User is redirected to onboarding wizard

**Expected Outcomes**:
- Customer account created successfully
- User receives JWT token for session management
- Legal agreements recorded in `agreements` table
- User can immediately access authenticated endpoints

---

### Scenario 2: Customer Subscription Checkout

**Description**: Customer wants to subscribe to a paid plan to access full platform features

**Preconditions**:
- Customer is authenticated (valid JWT token)
- Customer has existing customer account (not necessarily active subscription)

**Steps**:
1. Customer selects plan from pricing page (Starter €99/mo, Professional €299/mo, Enterprise €999/mo)
2. Customer clicks "Subscribe" button
3. Frontend calls `/api/v1/billing/checkout-session` endpoint
4. Backend creates Stripe Checkout Session with:
   - Selected price ID
   - Success URL: `https://dashboard.adsengineer.cloud/success`
   - Cancel URL: `https://dashboard.adsengineer.cloud/checkout`
   - Customer email (from JWT context)
5. Frontend redirects user to Stripe Checkout URL
6. User completes payment on Stripe-hosted page
7. Stripe redirects user back to success URL with session ID
8. Frontend confirms session status and activates subscription
9. Stripe webhook fires (`customer.subscription.created`) to create/update subscription in database
10. User can access full platform features

**Expected Outcomes**:
- Subscription activated in Stripe
- Subscription record created in `subscriptions` table
- Customer can access paid features immediately
- Payment confirmation email sent by Stripe
- Webhook ensures data consistency between Stripe and database

---

### Scenario 3: Subscription Management (Customer Portal)

**Description**: Customer wants to upgrade, downgrade, or cancel their subscription without contacting support

**Preconditions**:
- Customer is authenticated
- Customer has active subscription in Stripe and database

**Steps**:
1. Customer clicks "Manage Subscription" in dashboard
2. Frontend calls `/api/v1/billing/portal-session` endpoint
3. Backend creates Stripe Customer Portal session with:
   - Customer ID
   - Return URL: `https://dashboard.adsengineer.cloud/settings/billing`
4. Frontend redirects user to Stripe-hosted portal
5. User completes desired action:
   - Upgrade to higher plan
   - Downgrade to lower plan
   - Cancel subscription (immediate or end of period)
   - Update payment method
   - View invoices
   - Download receipts
6. Stripe processes the action
7. Stripe webhook fires (`customer.subscription.updated` or `customer.subscription.deleted`)
8. Backend updates `subscriptions` table
9. Frontend refreshes to show updated subscription status

**Expected Outcomes**:
- Subscription updated according to user action
- Billing changes reflected in dashboard immediately
- User receives confirmation email from Stripe
- Data consistency maintained via webhooks

---

### Scenario 4: Platform Integration (Google Ads)

**Description**: Customer wants to connect their Google Ads account to enable offline conversion tracking

**Preconditions**:
- Customer is authenticated
- Customer has active subscription (required for integrations)
- Customer has Google Ads account

**Steps**:
1. Customer clicks "Connect Google Ads" in dashboard
2. System redirects to Google OAuth consent URL
3. Customer grants permissions to AdsEngineer app
4. Google redirects to callback URL with authorization code
5. Backend exchanges code for access and refresh tokens
6. Backend stores encrypted tokens in `agency_settings.google_ads_config`
7. Connection status updated to "Connected"
8. Customer can view connection status and manage OAuth tokens

**Expected Outcomes**:
- Google Ads connection active
- OAuth tokens stored securely in database
- Backend can upload offline conversions to Google Ads
- Connection status visible in dashboard

---

### Scenario 5: Dashboard Overview

**Description**: Customer logs in to dashboard and views their subscription status, attribution data, and connected platform status

**Preconditions**:
- Customer is authenticated
- Customer has active subscription (free users see limited view)

**Steps**:
1. User navigates to `https://dashboard.adsengineer.cloud`
2. Frontend validates JWT token
3. Dashboard loads subscription status from `/api/v1/billing/subscriptions/:agency_id`
4. Dashboard loads platform connection status (Google Ads, Meta, TikTok, etc.)
5. Dashboard displays attribution metrics:
   - Conversions tracked today
   - Revenue this month
   - Attribution accuracy rate
   - Active plan and features
6. Dashboard displays usage statistics (if applicable):
   - Conversions tracked
   - API calls made
   - Storage used
   - Lead limit

**Expected Outcomes**:
- User sees complete picture of their subscription and usage
- Data loads in < 2 seconds
- User can identify which platforms need attention
- User can make informed decisions about plan usage

---

### Scenario 6: Account Settings

**Description**: Customer wants to update their profile and account preferences

**Preconditions**:
- Customer is authenticated
- Customer has customer account

**Steps**:
1. Customer navigates to account settings page
2. Frontend loads current profile data from profile endpoint
3. Customer updates fields:
   - First name, last name
   - Company name
   - Phone number
   - Industry
4. Customer saves changes
5. Backend updates `customers` table
6. Success message displayed

**Expected Outcomes**:
- Profile updated in database
- Changes reflected across dashboard
- Success confirmation displayed

---

## Functional Requirements

### Authentication and Authorization

**FR-001**: User Registration and Login
- System shall provide endpoint `POST /api/v1/auth/register` for new user registration
- System shall validate email format (RFC 5322) before registration
- System shall check for duplicate email addresses during registration
- System shall store legal agreements (ToS, DPA, Privacy) with version tracking
- System shall generate JWT token upon successful registration
- System shall provide endpoint `POST /api/v1/auth/login` for existing user login
- System shall validate email and password credentials
- System shall provide endpoint `POST /api/v1/auth/logout` for secure session termination
- System shall invalidate JWT tokens on logout
- System shall use secure password hashing (bcrypt or similar) with salt
- System shall implement rate limiting on authentication endpoints

**FR-002**: Session Management
- System shall implement JWT-based session management with expiration
- System shall validate JWT signature on each authenticated request
- System shall reject expired tokens (check `exp` claim)
- System shall reject tampered tokens (signature verification)
- System shall set reasonable token expiration (24-48 hours)

**FR-003**: Role-Based Access Control (Foundation for Future Team RBAC)
- System shall support single account owner role initially
- System shall define roles in JWT payload: 'owner', 'admin', 'member', 'viewer'
- System shall store role in session context for each request
- System shall validate role in authorization decisions
- Data model prepared for future team member additions (no migration needed)

---

### Billing and Subscription Management

**FR-004**: Stripe Checkout Sessions
- System shall provide endpoint `POST /api/v1/billing/checkout-session` for creating checkout sessions
- System shall accept `price_id`, `success_url`, `cancel_url` in request body
- System shall create Stripe Checkout Session with `mode: 'subscription'`
- System shall include customer email in checkout session (for pre-filling)
- System shall use Stripe API v14 with API version '2023-10-16'
- System shall handle Stripe errors gracefully and return user-friendly messages
- System shall log all checkout session creation attempts for debugging

**FR-005**: Stripe Customer Portal
- System shall provide endpoint `POST /api/v1/billing/portal-session` for creating portal sessions
- System shall use customer ID from JWT context (if authenticated)
- System shall configure return URL to dashboard billing settings
- System shall use Stripe Customer Portal API for session creation

**FR-006**: Subscription Status Display
- System shall provide endpoint `GET /api/v1/billing/subscriptions/:agency_id` for retrieving subscription status
- System shall return subscription details including:
  - Plan name (Starter, Professional, Enterprise)
  - Monthly price
  - Current period (start/end dates)
  - Status (active, canceling, canceled)
  - Lead limit
  - Features list
- System shall return usage statistics for current billing period:
  - Conversions tracked this month
  - Revenue this month
  - Percentage of lead limit used
- System shall calculate percentage of lead limit used for display

**FR-007**: Subscription Cancellation
- System shall provide endpoint `POST /api/v1/billing/subscriptions/:subscription_id/cancel` for canceling subscriptions
- System shall support optional `cancel_at_period_end` parameter
- System shall validate subscription ownership before allowing cancellation
- System shall call Stripe to cancel subscription
- System shall update `subscriptions` table with cancellation status
- System shall update `cancelled_at` timestamp

**FR-008**: Stripe Webhook Integration
- System shall provide endpoint `POST /api/v1/billing/webhooks/stripe` for Stripe events
- System shall verify Stripe webhook signature using webhook secret
- System shall handle `customer.subscription.created` event
- System shall handle `customer.subscription.updated` event
- System shall handle `customer.subscription.deleted` event
- System shall handle `invoice.payment_succeeded` event
- System shall handle `invoice.payment_failed` event
- System shall update `subscriptions` table on webhook events
- System shall log all webhook events for audit trail

---

### Dashboard Core Features

**FR-009**: Dashboard Overview
- System shall display subscription status prominently on dashboard homepage
- System shall display active plan name and price
- System shall display current billing period dates
- System shall display usage statistics card
- System shall show connection status indicators for each platform (Google Ads, Meta, TikTok)
- System shall show attribution metrics:
  - Conversions tracked today
  - Revenue tracked this month
  - Attribution accuracy rate
- System shall load data in < 3 seconds
- System shall refresh data automatically every 30 seconds

**FR-010**: Platform Connection Status
- System shall display Google Ads connection status (Connected/Not Connected/Pending)
- System shall display connection timestamp
- System shall display OAuth token status (Active/Expired)
- System shall provide "Reconnect" button for expired/disconnected tokens
- System shall show connection status for future platforms (Meta, TikTok) as "Coming Soon"

**FR-011**: Recent Conversions Table
- System shall display table of recent conversions (last 20)
- System shall show conversion details:
  - Conversion ID
  - Platform source (Google Ads, Meta, Shopify, webhook)
  - Conversion value
  - Timestamp
  - Customer information (if available)
- System shall support filtering by date range (today, week, month)
- System shall support sorting by timestamp or value

**FR-012**: Usage Statistics
- System shall display monthly usage statistics for paid plans:
  - Total conversions tracked
  - API calls made
  - Storage used (if applicable)
  - Percentage of lead limit used
- System shall show visual progress bars for usage limits

---

### Platform Integration

**FR-013**: Google Ads OAuth
- System shall provide endpoint `GET /api/v1/oauth/google-ads/init` to initiate OAuth flow
- System shall use Google OAuth 2.0 endpoints with appropriate scopes
- System shall generate state parameter for CSRF protection
- System shall set redirect URI to `https://dashboard.adsengineer.cloud/oauth/google-ads/callback`
- System shall handle OAuth callback at `POST /api/v1/oauth/google-ads/callback`
- System shall validate `state` parameter for security
- System shall exchange authorization code for access and refresh tokens
- System shall store encrypted tokens in `agency_settings.google_ads_config`
- System shall redirect to success URL after successful connection
- System shall handle OAuth errors (access denied, invalid grant, etc.)

**FR-014**: Google Ads Offline Conversions
- Backend shall have existing service to upload conversions to Google Ads
- System shall extend integration to support customer-configured conversion uploads
- Conversion uploads triggered by:
  - Webhook from customer's website (GHL, Shopify, etc.)
  - Server-side trigger from dashboard
- System shall map conversion value to Google Ads currency (EUR/USD conversion)
- System shall handle Google Ads API errors and retry logic

---

### Settings and Preferences

**FR-015**: Account Profile Management
- System shall provide endpoints for reading and updating customer profile
- System shall validate email format on profile update
- System shall store profile fields: first name, last name, phone, company, industry
- System shall support updating individual fields without requiring full profile resubmission

**FR-016**: Notifications Configuration
- System shall allow customers to configure email notifications
- System shall allow customers to configure SMS notifications (future)
- System shall allow customers to configure push notifications (future)
- System shall allow customers to enable/disable conversion alerts
- System shall store notification preferences in `customer_settings` table (migration required)

**FR-017**: Privacy Settings
- System shall allow customers to export their data (GDPR right to data portability)
- System shall allow customers to opt out of marketing communications
- System shall allow customers to opt in to analytics sharing (future)
- System shall store privacy settings in `customer_settings` table (migration required)

---

### Email Service Integration

**FR-018**: Transactional Email Service
- System shall integrate with email service provider (SendGrid, Mailgun, Resend, or Postmark)
- System shall send welcome email upon successful registration
- System shall send password reset email with secure reset token
- System shall send email verification email (if implemented)
- System shall send subscription confirmation email (via Stripe or custom)
- System shall send subscription cancellation confirmation email
- System shall send password reset link with expiration (1 hour)

**FR-019**: Email Templates
- System shall use email templates for consistent branding
- System shall support HTML email templates
- System shall include unsubscribe/opt-out links in all marketing emails
- System shall use customer's first name in personalized emails

---

## Key Entities

### Customer
- `id` (TEXT, PRIMARY KEY): Unique customer identifier
- `email` (TEXT, NOT NULL, UNIQUE): Customer email address
- `stripe_customer_id` (TEXT, NULL): Stripe customer ID
- `first_name` (TEXT, NULL): First name
- `last_name` (TEXT, NULL): Last name
- `phone` (TEXT, NULL): Phone number
- `company` (TEXT, NULL): Company name
- `website` (TEXT, NULL): Website URL
- `ghl_location_id` (TEXT, NULL): GoHighLevel location ID
- `plan` (TEXT, DEFAULT 'free'): Subscription plan (free, starter, professional, enterprise)
- `status` (TEXT, DEFAULT 'active'): Account status (active, inactive, suspended)
- `created_at` (TEXT, NOT NULL): Account creation timestamp
- `updated_at` (TEXT, NOT NULL): Last update timestamp

### Subscription
- `id` (TEXT, PRIMARY KEY): Unique subscription identifier
- `agency_id` (TEXT, NOT NULL, FOREIGN KEY): Customer ID
- `stripe_subscription_id` (TEXT, NOT NULL): Stripe subscription ID
- `stripe_price_id` (TEXT, NOT NULL): Stripe price ID
- `status` (TEXT, DEFAULT 'active'): Subscription status (active, canceling, canceled)
- `current_period_start` (TEXT, NOT NULL): Billing period start (ISO 8601)
- `current_period_end` (TEXT, NOT NULL): Billing period end (ISO 8601)
- `created_at` (TEXT, NOT NULL): Subscription creation timestamp
- `cancelled_at` (TEXT, NULL): Cancellation timestamp

### Agreement
- `id` (TEXT, PRIMARY KEY): Unique agreement record ID
- `customer_id` (TEXT, NOT NULL, FOREIGN KEY): Customer ID
- `agreement_type` (TEXT, NOT NULL): Type (tos, dpa, privacy)
- `agreement_version` (TEXT, NOT NULL): Version identifier
- `accepted_at` (TEXT, NOT NULL): Acceptance timestamp
- `ip_address` (TEXT): IP address of acceptance
- `user_agent` (TEXT): User agent string
- `consent_text_hash` (TEXT): SHA-256 hash of agreement text
- `metadata` (TEXT, NULL): Additional JSON data

### Session
- `session_id` (TEXT, PRIMARY KEY): SST session ID
- `site_id` (TEXT, NOT NULL, FOREIGN KEY): Customer site ID
- `expires_at` (TEXT, NOT NULL): Expiration timestamp
- `created_at` (TEXT, NOT NULL): Session creation timestamp
- `user_id` (TEXT, NULL): Associated user ID (if authenticated)
- `user_agent` (TEXT): User agent string
- `ip_address` (TEXT): IP address

### Site
- `site_id` (TEXT, PRIMARY KEY): Unique site identifier
- `customer_id` (TEXT, NOT NULL, FOREIGN KEY): Owner customer ID
- `domain` (TEXT, NOT NULL): Domain name
- `url` (TEXT, NOT NULL): Full URL
- `name` (TEXT, NOT NULL): Site display name
- `status` (TEXT, DEFAULT 'active'): Site status (active, inactive, suspended)
- `last_activity` (TEXT, NOT NULL): Last activity timestamp
- `created_at` (TEXT, NOT NULL): Creation timestamp

---

## Data Model Changes

### New Tables Required

#### customer_settings
```sql
CREATE TABLE IF NOT EXISTS customer_settings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  industry TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

**Purpose**: Store customer profile and notification preferences separately from main customer record.

#### sites
```sql
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  domain TEXT,
  url TEXT,
  name TEXT,
  status TEXT DEFAULT 'active',
  last_activity TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

**Purpose**: Track multiple websites per customer for multi-site support and site-level configuration.

---

## Dependencies and Assumptions

### Existing Infrastructure
- Stripe SDK v14.25.0 is already installed
- Stripe webhooks are already configured and working
- JWT authentication middleware exists
- Google Ads OAuth flow exists
- Database (D1) is available and accessible
- Cloudflare Workers environment is configured
- Universal SST API (`/api/v1/sst/*`) is already deployed
- Universal SST tracking snippet (`snippet.js`) is already built

### Assumptions
- Email service provider to be selected during implementation (SendGrid recommended)
- Pricing tiers remain hardcoded in code for MVP (Starter €99, Professional €299, Enterprise €999)
- JWT secret and Stripe webhook secret are available via environment variables
- Customer ID from JWT context used as Stripe customer identifier
- Frontend will be React-based (not specified by customer, assumed based on frontend/ directory)
- Dashboard subdomain: `dashboard.adsengineer.cloud`
- Success redirect URL: `success.dashboard.adsengineer.cloud`
- Cancel redirect URL: `cancel.dashboard.adsengineer.cloud`
- All new endpoints will require authentication via JWT middleware

### Technical Decisions Made

**Authentication**: JWT-based authentication chosen for stateless architecture on Cloudflare Workers. Passwords hashed using bcrypt with salt. Token expiration set to 24 hours.

**Stripe Strategy**: Hybrid approach - keep existing server-side subscription creation (for admin/manual onboarding) and add customer-facing Stripe Checkout Sessions and Customer Portal for self-service.

**Database**: Use existing D1 database for all new tables. Add migrations in numeric sequence.

**Email**: SendGrid chosen for MVP due to reliability, deliverability, and ease of integration.

**Extensibility**: Prepared for team RBAC - auth middleware already defines roles, customer_settings table structure supports future team member additions.

---

## Out of Scope

**Not Included in MVP:**
- Team member management (invitations, role assignment)
- Multi-customer admin panel
- Advanced analytics dashboards (charts, graphs)
- Custom event definitions (use built-in event types)
- Platform integrations beyond Google Ads (Meta, TikTok, Shopify coming in Phase 2)
- Universal SST advanced features (custom GTM containers, advanced analytics)
- White-label capabilities for agencies
- API key management for external developers
- File upload/download capabilities
- Advanced reporting and export features
- In-app support chat or help center

**Deferred to Phase 2 (Post-MVP):**
- Team management with invitations
- Role-based permissions (granular access control)
- Meta Ads integration
- TikTok Events API integration
- Shopify webhook integration
- Advanced analytics with charts and graphs
- Invoice history and download
- Payment method management
- White-label dashboard for agencies
- API documentation portal

---

## Non-Functional Requirements

### Performance
- Dashboard pages shall load in under 3 seconds (95th percentile)
- API response time under 200ms (95th percentile)
- Stripe checkout session creation under 500ms
- Support 100 concurrent dashboard users
- Support 10 concurrent Stripe checkout sessions
- Database queries under 50ms for typical dashboard loads

### Security
- All endpoints except `/api/v1/auth/register` shall require JWT authentication
- Passwords shall be hashed with bcrypt (minimum 10 salt rounds)
- JWT tokens shall expire within 24 hours
- Webhook signatures shall be verified for all Stripe events
- OAuth state parameters shall be validated (prevent CSRF)
- Rate limiting applied to all authentication endpoints (100 requests/minute)
- Email reset tokens shall expire in 1 hour
- Sensitive data (tokens, credentials) stored encrypted in database

### Scalability
- System designed for 1,000+ concurrent users
- Cloudflare Workers can handle 10,000+ requests per minute
- D1 database supports read-heavy workloads
- Database connection pooling configured for Cloudflare Workers
- Stripe API supports high-volume payment processing

### Reliability
- Stripe webhooks handle idempotency (retries configured)
- Failed payment attempts logged for monitoring
- Database transactions support rollback on errors
- Health check endpoint (`/api/v1/status`) monitors system status
- OAuth tokens automatically refreshed on expiration (no user action required)

### Privacy and Compliance
- GDPR right to data export (user can download all their data)
- Legal agreements tracked with versions, IP addresses, and consent hashes
- Email addresses used only for authentication and notifications
- Cookie consent management (future)
- Data retention policy: inactive accounts deleted after 2 years
- Marketing opt-out available for all communications

---

## Success Criteria

### User Adoption
- 50+ customers complete self-service signup within first month
- 30% reduction in manual onboarding requests within first quarter
- Average signup-to-first-action time under 2 minutes
- 85%+ Stripe checkout conversion rate

### System Performance
- Dashboard 99th percentile load time under 3 seconds
- API 99th percentile response time under 200ms
- 99.9% system uptime (measured over 30-day period)
- Stripe webhook processing under 1 second

### Business Impact
- Customer support tickets reduced by 40% (self-service capabilities)
- Time-to-revenue reduced by 7 days (no manual processes)
- Subscription conversion rate increase from 0% to 20% in first quarter
- Customer churn rate reduced by 15% (self-service control)

### Completion Validation
- All authentication endpoints implemented and tested
- All billing endpoints (Checkout Sessions, Customer Portal, webhooks) implemented and tested
- Dashboard core pages (overview, settings) implemented
- Google Ads integration complete and tested
- Email service integrated and tested
- Privacy settings export implemented
- Rate limiting applied and tested
- All user scenarios completed successfully in testing
- No critical or high-priority bugs remaining
- Documentation updated for new features

---

## Risks and Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|-------|------------|--------|------------|
| Email service delivery delays | Medium | High | Implement retry logic with queue, monitor delivery rates, provide alternative providers |
| Stripe API rate limits | Low | Medium | Implement exponential backoff, queue operations, monitor API usage |
| Stripe webhook failures | Low | High | Implement idempotency, retry with exponential backoff, alert on repeated failures |
| Database schema migrations in production | Low | High | Use numbered migrations, test thoroughly, have rollback plan, create migration scripts |
| OAuth token expiration handling | Medium | Medium | Implement automatic token refresh, handle 401 errors gracefully |
| Payment session race conditions | Low | Medium | Use Stripe idempotency keys, implement session timeout handling |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|-------|------------|--------|------------|
| Low initial adoption of self-service | Medium | High | Clear onboarding wizard, provide help documentation, offer customer support during transition |
| Customer confusion about billing flows | Medium | Medium | Clear pricing display, show plan comparison, provide help tooltips, maintain consistent terminology |
| Stripe checkout abandonment | Medium | High | Optimize checkout flow, minimize steps, show progress indicators, send abandoned cart emails |
| Competitor comparison with Stape.io | Low | Medium | Emphasize unique value (closed-loop attribution), focus on ROI and attribution accuracy |

---

## Open Questions

**Email Service Provider Selection**
- Should we use SendGrid, Mailgun, Resend, or Postmark?
- What are our initial volume estimates?

**Dashboard Design**
- Should dashboard follow current landing page dark theme?
- Should we use a specific component library (shadcn/ui, headless-ui)?
- What analytics library should we use (Recharts, Chart.js)?

**Testing Strategy**
- What testing approach for user acceptance testing?
- Load testing requirements?
- Security penetration testing requirements?

---

## Glossary

- **JWT**: JSON Web Token used for stateless authentication
- **Stripe Checkout Session**: Stripe-hosted payment page that collects customer payment details
- **Stripe Customer Portal**: Stripe-hosted page where customers manage subscriptions, payment methods, invoices
- **OAuth**: Open Authorization 2.0 protocol for third-party authorization
- **RBAC**: Role-Based Access Control (Owner, Admin, Member, Viewer)
- **Rate Limiting**: Throttling API requests to prevent abuse
- **Idempotency**: Property of an operation that can be applied multiple times without side effects
- **3DS**: Three Domain Secure payment verification
- **GCLID**: Google Click Identifier used for offline conversion tracking

---

## Appendices

### A: API Endpoints Summary

#### Authentication
- `POST /api/v1/auth/register` - Register new customer
- `GET /api/v1/auth/register` - Get registration agreement versions
- `POST /api/v1/auth/register` - Accept legal agreements
- `GET /api/v1/auth/agreements/:customerId` - Get customer's accepted agreements
- `POST /api/v1/auth/agreements/:customerId/accept` - Accept additional agreement
- `POST /api/v1/auth/login` - Login existing customer
- `POST /api/v1/auth/logout` - Logout customer
- `POST /api/v1/auth/reset-password` - Request password reset (send reset email)
- `GET /api/v1/auth/reset-password/:token` - Verify reset token

#### Billing and Subscription
- `GET /api/v1/billing/pricing` - Get pricing tiers (public, no auth)
- `POST /api/v1/billing/customers` - Create Stripe customer
- `POST /api/v1/billing/subscriptions` - Create subscription (admin/manual)
- `POST /api/v1/billing/checkout-session` - Create Stripe Checkout Session (self-service)
- `POST /api/v1/billing/portal-session` - Create Stripe Customer Portal session (self-service)
- `GET /api/v1/billing/subscriptions/:agency_id` - Get subscription status
- `POST /api/v1/billing/subscriptions/:subscription_id/cancel` - Cancel subscription
- `POST /api/v1/billing/webhooks/stripe` - Stripe webhook endpoint

#### Dashboard
- `GET /api/v1/dashboard` - Get dashboard overview data
- `POST /api/v1/dashboard/settings/profile` - Update customer profile
- `GET /api/v1/dashboard/settings/profile` - Get customer profile
- `POST /api/v1/dashboard/settings/notifications` - Update notification preferences
- `GET /api/v1/dashboard/settings/notifications` - Get notification preferences
- `POST /api/v1/dashboard/settings/privacy` - Update privacy settings
- `GET /api/v1/dashboard/settings/privacy` - Get privacy settings
- `GET /api/v1/dashboard/conversions` - Get recent conversions
- `GET /api/v1/dashboard/usage` - Get usage statistics

#### Platform Integration
- `GET /api/v1/oauth/google-ads/init` - Initiate Google Ads OAuth
- `POST /api/v1/oauth/google-ads/callback` - Handle Google Ads OAuth callback
- `GET /api/v1/oauth/google-ads/status/:agencyId` - Get OAuth connection status
- `POST /api/v1/oauth/google-ads/disconnect` - Disconnect Google Ads account
- `GET /api/v1/sst/auth` - Register site with Universal SST (optional)
- `GET /api/v1/sst/sites/:siteId` - Get site registration status
- `POST /api/v1/sst/sites/:siteId/assign` - Assign site to customer account
- `GET /api/v1/sst/events` - Get available Universal SST events
- `POST /api/v1/sst/events` - Track Universal SST event

### B: Database Schema Changes

See "Data Model Changes" section above for new tables:
- `customer_settings` table
- `sites` table

### C: Technology Stack Notes

- **Backend**: Cloudflare Workers, Hono framework, TypeScript
- **Database**: D1 (SQLite-compatible for Cloudflare Workers)
- **Authentication**: JWT, bcrypt for passwords
- **Payment**: Stripe SDK v14.25.0
- **Frontend**: React (assumed), likely using Tailwind CSS
- **Email**: SendGrid (recommended for MVP)
- **Universal SST**: Existing implementation, optional add-on

### D: Open Decisions Tracker

- [ ] Email service provider selected: TBD
- [ ] Dashboard design system selected: TBD
- [ ] Testing approach defined: TBD
- [ ] Load testing requirements finalized: TBD

---

**END OF SPECIFICATION**
