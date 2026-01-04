# Customer Login System Design

## Overview

AdsEngineer supports multiple account types through a unified authentication system with multitenancy.

---

## Account Types

### 1. Direct Business Accounts
**Target Users:**
- Small businesses (dental, legal, HVAC)
- Solo practitioners
- Technical founders managing their own ads
- Companies with 1-5 employees

**Characteristics:**
```
✅ Self-service onboarding (5-10 min setup)
✅ Credit card billing (Stripe)
✅ Documentation-driven support
✅ Fixed pricing (no contracts)
❌ No hand-holding or strategy calls
❌ No dedicated account manager
```

**Login Experience:**
- Domain: `app.adsengineer.cloud`
- Auth: Email/password or SSO (Google, Microsoft)
- 2FA: Available for all accounts
- Recovery: Self-service password reset
- Dashboard: Single-brand view, connect their own data sources

**Support Model:**
- Ticket-based (async response within 24h)
- Knowledge base documentation
- Video tutorials for setup
- Community forum (future)

---

### 2. Agency Accounts
**Target Users:**
- Marketing agencies (5-20 employees)
- Agencies managing 1-5 clients
- Agencies wanting to own their solution
- High-touch enterprise accounts

**Characteristics:**
```
✅ Multi-client dashboard (view all sites from one place)
✅ White-label under agency brand
✅ Agency manages billing to their clients
✅ Agency provides implementation/integration
✅ Agency handles support
✅ Sub-account management for clients
❌ Self-service (requires agency sales process)
```

**Login Experience:**
- Domain: `agency-name.adsengineer.cloud` (or custom domain)
- Auth: Agency credential authentication
- Switch: Toggle between agency view and impersonation
- Impersonation: Log in as client for support (with audit trail)
- Dashboard: Multi-site overview, client billing

**Support Model:**
- Dedicated account manager
- Slack/Zoom access for priority support
- Monthly strategy calls (Premium/Agency tiers)
- Onboarding assistance for clients

---

## Authentication Flow

```
┌─────────────────────────────────────────────┐
│         User lands on adsengineer.cloud        │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
          ┌─────────────────────┐
          │ Login Screen      │
          └──────────┬──────────┘
                     │
          ┌────────────────────────┐
          │ Choose Account Type  │
          └────┬───────────────────┘
               │        │
        ┌─────────┴─────────┐
        │ [Direct] [Agency] │
        └─────┬─────────┬─────┘
              │         │
              │         │
        ┌─────▼     └─────▼─────┐
        │                         │
[Direct Account]         [Agency Dashboard]
        │                         │
        └─────────────┬───────────┘
                     │
                     ▼
              ┌─────────────────────┐
              │  Application Portal  │
              └─────────────────────┘
```

---

## Login Page UX

### Step 1: Email Input

```html
<form id="login-form">
  <input type="email" placeholder="you@company.com" required />
  <button type="submit">Continue</button>
</form>
```

**Validation:**
- Email format check
- Check if email exists in system
- If agency subdomain detected → redirect to agency login

### Step 2: Password (or SSO)

```html
<form id="password-form">
  <input type="password" placeholder="Enter password" required />
  <button type="submit">Sign In</button>
</form>

<div class="sso-options">
  <button onclick="signInWithGoogle()">
    <img src="/google-logo.svg" />
    Continue with Google
  </button>
  <button onclick="signInWithMicrosoft()">
    <img src="/microsoft-logo.svg" />
    Continue with Microsoft
  </button>
</div>
```

**Security:**
- Rate limiting: 5 attempts per IP per 15 minutes
- Password hashing: Argon2id with pepper
- Session: JWT with 24h expiration
- 2FA: TOTP via Google Authenticator

---

## Account Type Selection (Agency Only)

When user logs into agency account, they see this dashboard:

```
┌──────────────────────────────────────────────────────────┐
│                                                  │
│  ┌───────────────────┐                           │
│  │ Agency Dashboard  │                           │
│  └─────────┬─────────┘                           │
│            │                                     │
│  ┌─────────────────────────────────────────┐         │
│  │ [Switch to Client View]            │         │
│  │ [Manage Sub-Accounts]              │         │
│  │ [Billing & Invoices]              │         │
│  └─────────────────────────────────────────┘         │
│                                                  │
│  Sites Overview:                                │
│  ┌──────┬──────┬──────┬──────┐              │
│  │Site 1│Site 2│Site 3│Add   │              │
│  │  ✅  │  ✅  │  ✅  │  +    │              │
│  └──────┴──────┴──────┴──────┘              │
│                                                  │
└──────────────────────────────────────────────────────────┘
```

---

## Sub-Account Management (Agency Only)

### Create Client Sub-Account

```typescript
interface CreateClientAccount {
  name: string;
  subdomain?: string; // e.g., "clientname.agency-name.adsengineer.cloud"
  billing_model: 'reseller' | 'direct'; // Reseller = agency bills us, Direct = client pays us directly
  pricing_tier: 'standard' | 'premium' | 'agency';
  seats: number; // Number of team members
}

POST /api/agency/sub-accounts
```

### Client Impersonation

```typescript
// Agency admin can log in as any client for support
POST /api/agency/impersonate
{
  client_id: string;
  reason?: string; // Logged for audit trail
}

// All actions are logged with:
{
  actor: 'agency_admin' | 'client_user';
  actual_user: string;
  action: string;
  timestamp: ISO8601;
}
```

### Client Billing

**Models:**

| Model | Flow | Who Bills AdsEngineer |
|--------|------|---------------------|
| **Reseller** | Agency pays us, we bill agency | We collect all from agency, agency bills clients |
| **Direct** | Client pays us directly | We bill client, agency collects from them (or client pays us) |

**Agency Dashboard:**
- View all client invoices
- Pay bulk invoices for clients
- Upgrade/downgrade client accounts
- Track agency reseller margin

---

## Role-Based Access Control

### Direct Account Roles

| Role | Permissions |
|-------|-------------|
| **Owner** | Full access to billing, team members, integrations, delete account |
| **Admin** | Manage team members, integrations, analytics |
| **Member** | View analytics, manage integrations |
| **Viewer** | Read-only access to analytics |

### Agency Account Roles

| Role | Permissions |
|-------|-------------|
| **Agency Admin** | Full agency management, billing, sub-accounts, all client access |
| **Agency Manager** | Manage assigned clients, impersonate for support, view billing |
| **Agency Member** | View assigned clients only |
| **Client Owner** | Full access to their own account |
| **Client Member** | Access assigned to their client's sites |

---

## SSO Integration

### Google OAuth

**Flow:**
1. User clicks "Continue with Google"
2. Redirect to Google consent screen
3. Google returns code to AdsEngineer
4. Exchange code for user info and create/link account
5. Log in user automatically

**Configuration:**
```typescript
// Serverless/src/auth/google-oauth.ts
const googleConfig = {
  client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
  client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirect_uri: 'https://app.adsengineer.cloud/auth/google/callback',
  scopes: ['openid', 'email', 'profile']
};
```

### Microsoft OAuth

Similar flow to Google, using Microsoft Identity Platform.

---

## 2FA Implementation

### Time-Based OTP

```typescript
// Serverless/src/auth/totp.ts
export async function generateTOTPSecret(userId: string): Promise<string> {
  const secret = speakeasy.generateSecret();
  await db.users.update(userId, { totp_secret: encrypt(secret) });
  const qrCode = QRCode.toDataURL(secret.otpauth_url);

  return { secret: decrypt(secret), qrCode };
}

export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  const user = await db.users.findById(userId);
  const decryptedSecret = decrypt(user.totp_secret);
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: token,
    window: 2 // 30 second window
  });

  if (verified) {
    await db.users.update(userId, { totp_verified: true });
  }

  return verified;
}
```

**User Experience:**
1. User enables 2FA in settings
2. QR code displayed (scan with Google Authenticator)
3. Backup codes provided (10 one-time codes)
4. Next login requires OTP after password

---

## Session Management

```typescript
interface Session {
  user_id: string;
  tenant_id: string;
  account_type: 'direct' | 'agency' | 'agency_sub';
  created_at: ISO8601;
  expires_at: ISO8601;
  ip_address: string;
  user_agent: string;
  mfa_verified: boolean;
}

// Serverless/src/auth/session.ts
export class SessionManager {
  async createSession(user: User, req: Request): Promise<Session> {
    const session = {
      user_id: user.id,
      tenant_id: user.tenant_id,
      account_type: user.account_type,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.ip,
      user_agent: req.headers.get('user-agent'),
      mfa_verified: user.mfa_enabled ? false : true // Requires 2FA if enabled
    };

    await db.sessions.create(session);

    return this.signJWT(session);
  }

  async validateSession(token: string): Promise<Session | null> {
    const decoded = await this.verifyJWT(token);

    if (!decoded || decoded.expires_at < new Date().toISOString()) {
      return null;
    }

    const session = await db.sessions.findById(decoded.session_id);

    if (!session || !session.mfa_verified && session.user.mfa_enabled) {
      return null;
    }

    return session;
  }
}
```

---

## Password Reset Flow

```
User Request Reset
       │
       ▼
[Email with reset link] → User clicks link
       │
       ▼
[Set New Password Form] → User enters new password
       │
       ▼
Password Updated → User logged in automatically
       │
       ▼
[Email Confirmation] → Security notification sent
```

**Security:**
- Reset link expires in 1 hour
- Rate limiting: 3 requests per email per hour
- Password strength requirements enforced
- Invalidate all existing sessions on reset

---

## Analytics & Tracking

### Login Events to Track

```typescript
enum LoginEvent {
  'login_success',
  'login_failed',
  'password_reset_requested',
  'password_reset_completed',
  'mfa_enabled',
  'mfa_failed',
  'account_type_selected',
  'role_assigned',
  'impersonation_started',
  'impersonation_ended'
}

interface AnalyticsEvent {
  event: LoginEvent;
  user_id: string;
  tenant_id: string;
  account_type: 'direct' | 'agency';
  metadata?: Record<string, any>;
  timestamp: ISO8601;
}
```

### Metrics to Monitor

| Metric | Target | Alert Threshold |
|---------|---------|-----------------|
| **Conversion rate** | > 50% | Below industry average (UX issue) |
| **Failed login rate** | > 10% | Potential brute force attack |
| **Password reset requests** | > 3/hour/email | Possible abuse |
| **Agency impersonations** | Any | Review quarterly (security) |
| **Sub-account churn** | > 20%/mo | Agency support opportunity |

---

## Migration Path (From Single-Site Plugin to Platform)

**Scenario:** User installed WordPress plugin on their own site, now wants multi-site management.

### Onboarding Flow

1. **Detect existing plugin installation**
   - User logs in with email
   - System detects `wordpress_sites` table entry

2. **Offer platform upgrade**
   - "Manage all your WordPress sites from one dashboard"
   - "Get agency features (white-label, billing)"

3. **Migrate credentials**
   - Import existing Google Ads API keys
   - Import existing GHL webhooks
   - Preserve historical data

4. **Create agency account** (optional)
   - "Want to manage client sites? Create agency account"

---

## Implementation Priorities

### Phase 1: Foundation (Month 1)
- [ ] Login page with email/password
- [ ] JWT session management
- [ ] Single-tenant database schema
- [ ] Direct account dashboard

### Phase 2: Multitenancy (Month 2)
- [ ] Tenant database isolation
- [ ] Subdomain routing logic
- [ ] Agency account type
- [ ] Sub-account management

### Phase 3: SSO & Security (Month 3)
- [ ] Google OAuth integration
- [ ] Microsoft OAuth integration
- [ ] TOTP 2FA implementation
- [ ] Role-based access control
- [ ] Impersonation with audit trail

### Phase 4: Agency Features (Month 4)
- [ ] Multi-client dashboard
- [ ] White-label configuration (logo, CSS, domain)
- [ ] Sub-account creation/management
- [ ] Agency billing (reseller + direct models)
- [ ] Client impersonation

### Phase 5: Analytics (Month 5)
- [ ] Login event tracking
- [ ] Security monitoring dashboards
- [ ] Alerting system
- [ ] Churn analytics
