# Code Skeptic

Deep skepticism about the AdsEngineer codebase - hidden traps, edge cases, and "what if" scenarios that will bite you in production.

---

## Table of Contents

1. [Infrastructure Risks](#1-infrastructure-risks)
2. [Security Traps](#2-security-traps)
3. [Data Loss Scenarios](#3-data-loss-scenarios)
4. [Third-Party Dependencies](#4-third-party-dependencies)
5. [GDPR & Compliance](#5-gdpr--compliance)
6. [Concurrency & Race Conditions](#6-concurrency--race-conditions)
7. [Edge Cases](#7-edge-cases)
8. [Business Logic Traps](#8-business-logic-traps)
9. [Hidden Technical Debt](#9-hidden-technical-debt)

---

## 1. Infrastructure Risks

### ❌ What if Cloudflare Workers is unavailable?

**Scenario:** Cloudflare has a major outage.

**Current State:**
- Single-region (Cloudflare edge)
- No failover
- No backup system

**Impact:**
- All webhooks fail
- No lead capture
- No conversions uploaded
- Customers see errors

**Reality Check:** The tracking snippet on customer websites continues working (cookies still set), but no data reaches your API.

**Mitigation Needed:**
1. Implement webhook retry with exponential backoff (CLIENT-SIDE)
2. Store leads temporarily on customer sites (localStorage)
3. Provide fallback webhook URL in different region

---

### ❌ What if D1 Database is down?

**Scenario:** D1 experiences availability issues.

**Current State:**
- D1 is the only database
- No read replicas
- No caching layer

**Impact:**
- All database operations fail
- Cannot store leads
- Cannot retrieve data

**Current Error Handling:**
```typescript
// From status.ts
async function checkDatabaseHealth(db) {
  const start = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    // Returns healthy even if writes will fail
    return { status: 'healthy', message: 'Database connection stable' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

**Problem:** `SELECT 1` doesn't test write capability.

**What Will Break:**
- `POST /api/v1/leads` - Fails to insert
- `POST /api/v1/ghl/webhook` - Cannot store lead
- `POST /api/v1/shopify/webhook` - Cannot store lead
- Admin backup - Cannot read data

---

### ❌ What if KV Namespace for rate limiting is unavailable?

**Scenario:** Rate limiting KV is down or not bound.

**Current State:**
```typescript
// From rate-limit.ts
const kv = c.env.RATE_LIMIT_KV;
if (!kv) {
  console.warn('RATE_LIMIT_KV not bound, skipping rate limiting');
  return next();  // FAIL OPEN!
}
```

**Impact:**
- **FAIL OPEN** - If KV is down, rate limiting is DISABLED
- Malicious actors can spam webhooks
- No protection against DDoS
- Shopify webhook abuse possible

**Critical Security Issue:** Failing open is dangerous. Should fail closed for security.

---

### ❌ What if we exceed D1 limits?

**D1 Limits:**
- 10,000 rows per write batch
- 5MB max row size
- 50 concurrent connections per database

**Current Code:**
```typescript
// From leads.ts - accepts arrays but no limit checking
const leads: Lead[] = Array.isArray(body) ? body : [body];

// No check on array size
const storedLeads = await Promise.all(
  leads.map((lead) => db.insertLead({ ... }))
);
```

**What Happens:**
- Someone sends 50,000 leads
- Promise.all creates 50,000 concurrent DB operations
- D1 connection limit exceeded
- All operations fail
- Possible resource exhaustion

---

## 2. Security Traps

### ❌ JWT Token Verification is Broken

**Current Implementation:**
```typescript
// From auth.ts
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
```

**What's Wrong:**

1. **No signature verification** - Anyone can create a token
2. **No issuer check** - Can use any JWT library
3. **No audience check** - Can use for any API
4. **Token is malleable** - Can modify payload

**Attack Scenario:**
```javascript
// Attacker creates JWT without signature verification
const fakeToken = btoa(JSON.stringify({
  sub: 'victim_user_id',
  org_id: 'victim_org_id',
  role: 'admin',
  exp: 9999999999  // Far future
}) + '.' + btoa('{}') + '.anything_here');

fetch('https://api.adsengineer.cloud/api/v1/admin/backup', {
  headers: { Authorization: `Bearer ${fakeToken}` }
});
// Access granted!
```

**This is a CRITICAL security vulnerability.**

---

### ❌ Webhook Secrets Stored Unencrypted

**Current State:**
```typescript
// From shopify.ts
const webhookAgency = await findAgencyByShopifyDomain(c.get('db'), shopDomain);

if (!webhookAgency?.config?.shopify_webhook_secret) {
  // Secret retrieved from DB - unencrypted!
  console.error(`No webhook secret configured for shop: ${shopDomain}`);
}
```

**Problem:** Webhook secrets (HMAC keys) are stored in plaintext in the agencies table.

**If database is compromised:**
1. Attacker reads all webhook secrets
2. Can forge webhooks for all connected Shopify stores
3. Can inject fake leads
4. Can manipulate conversion data

**Should encrypt webhook secrets with same encryption service.**

---

### ❌ Backup Encryption Key Can Be Empty

**Current Implementation:**
```typescript
// From admin.ts
if (!encryptionKey) {
  return c.json({
    warning: 'BACKUP_ENCRYPTION_KEY not set - returning unencrypted',
    ...backup,
  });
}
```

**Problem:** Returns UNENCRYPTED sensitive data with just a warning.

**What Should Happen:**
1. Log security event
2. Return 503 Service Unavailable
3. Do NOT return unencrypted data

**Current Response Contains:**
- All customer emails
- All leads
- All conversion data
- All internal metrics

**This is a data breach waiting to happen.**

---

### ❌ No Request Signing for Admin Endpoints

**Current Admin Auth:**
```typescript
// From admin.ts
const token = authHeader.substring(7);
if (token !== adminSecret) {  // Simple string comparison
  return c.json({ error: 'Invalid admin token' }, 403);
}
```

**Problems:**
1. Token transmitted in clear (HTTPS only protects in transit)
2. No timestamp - replay attacks possible
3. No nonce - can capture and replay
4. Simple string comparison (timing-safe, but still weak)

**Better Approach:**
- HMAC-signed requests with timestamp and nonce
- Short token expiration
- Request body signing

---

## 3. Data Loss Scenarios

### ❌ What if encryption key is lost?

**Scenario:** `ENCRYPTION_MASTER_KEY` is rotated or lost.

**Current State:**
- Credentials encrypted with master key
- No key rotation mechanism
- No key backup

**What Happens:**
1. All Google Ads credentials become unreadable
2. All Meta credentials become unreadable
3. All Stripe credentials become unreadable
4. Cannot upload conversions
5. Cannot process payments
6. **No recovery path**

**Recovery Process Required:**
1. Decrypt all credentials with old key
2. Re-encrypt with new key
3. Update all agencies
4. During transition, system doesn't work

---

### ❌ What if GDPR erasure is requested?

**Current Implementation:**
```typescript
// From gdpr.ts
gdprRoutes.delete('/data-erase/:email', async (c) => {
  const leads = await db.prepare('SELECT id FROM leads WHERE email = ?').bind(email).all();

  if (leads.results && leads.results.length > 0) {
    for (const lead of leads.results) {
      await db.prepare('DELETE FROM leads WHERE id = ?').bind(lead.id).run();
    }
    // ... anonymize conversion logs
  }
});
```

**Problem Cascade:**
1. Lead deleted from leads table
2. BUT - lead_id referenced in:
   - `lead_technologies` table (orphaned)
   - `conversion_logs` table (orphaned)
   - `audit_logs` table (orphaned)

3. Data integrity broken
4. Analytics become inaccurate
5. Conversion attribution lost

**Should:**
1. Soft delete (mark as deleted, retain data)
2. Cascade delete properly
3. Or use database foreign keys with ON DELETE CASCADE

---

### ❌ What if migration fails mid-way?

**Scenario:** D1 migration interrupted.

**Current Migrations:**
- 0001_init.sql - Core tables
- 0002_agencies_audit.sql - Agencies table
- 0003_conversion_logs.sql - Conversion tracking
- 0004_technology_tracking.sql - Technology detection
- 0005_meta_tracking.sql - Meta/Microsoft Ads
- 0006_gdpr_compliance.sql - GDPR compliance

**If migration 0006 fails:**
- GDPR columns don't exist
- Insert operations with consent fields fail
- Code expects columns that don't exist

**No migration rollback mechanism.**

---

## 4. Third-Party Dependencies

### ❌ What if Google Ads API is down?

**Current State:**
```typescript
// From google-ads.ts
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    // No timeout specified!
    // No retry logic!
  });
}
```

**What Happens:**
1. OAuth endpoint slow/unavailable
2. All conversion uploads fail
3. No retry mechanism
4. Data lost

**Timeout Default:** Browser default (~2 minutes) - too long.

**Retry Logic:** None - single attempt only.

---

### ❌ What if Google deprecates an API version?

**From api-monitor.ts:**
```typescript
const deprecationSchedule = {
  v19: new Date('2026-02-01'),
  v20: new Date('2026-06-01'),
  v21: new Date('2026-08-01'),
  v22: new Date('2026-10-01'),
  v23: new Date('2027-02-01'),
};
```

**Problem:**
- Code uses v21 (`googleads.googleapis.com/v21/`)
- v21 deprecated August 2026
- No automated version update
- No monitoring for deprecation
- System will break silently

**Current Monitoring:**
```typescript
// Scrapes release notes HTML - fragile
const response = await fetch('https://developers.google.com/google-ads/api/docs/release-notes');
const html = await response.text();
const versionMatch = html.match(/v(\d+)\.(\d+)/);
```

**Should:**
1. Use official deprecation API
2. Set up alerts for version changes
3. Automate version updates

---

### ❌ What if Stripe webhook fails?

**Current State:**
```typescript
// From billing.ts
billing.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  try {
    const event = getStripe(c.env).webhooks.constructEvent(
      body,
      signature!,
      c.env.STRIPE_WEBHOOK_SECRET!
    );
    // ... handle event
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 400);  // Returns 400 - Stripe will retry!
  }
});
```

**Problem:**
- Error returns 400, Stripe retries indefinitely
- Could cause infinite retries on bad event
- No dead letter queue
- No alerting on repeated failures

---

### ❌ What if Doppler secrets are unavailable?

**Current State:**
- All secrets from Doppler
- No local fallback
- No caching of secrets

**Scenario:** Doppler API down during deployment.

**What Happens:**
- `doppler run -- pnpm deploy` fails
- Cannot set environment variables
- Worker deployment fails
- Rollback may also fail

**Should:**
1. Cache secrets locally for deployments
2. Have fallback secrets for emergencies
3. Document manual secret setting

---

## 5. GDPR & Compliance

### ❌ What if consent tracking is wrong?

**Current State:**
```typescript
// From leads.ts
const validLeads = [];
const deniedLeads = [];

for (const lead of storedLeads) {
  const consentValid = await validateGdprConsent(c.env.DB, lead.id);
  if (consentValid) {
    validLeads.push(lead);
  } else {
    deniedLeads.push(lead);
  }
}
```

**Problem:**
1. Consent validation happens AFTER storing lead
2. Leads stored even if consent invalid
3. Only filters from conversion upload
4. Database contains potentially non-compliant data

**GDPR Violation Risk:**
- Processing personal data without valid consent
- Stored data that should not exist
- Potential fines up to €20M or 4% of revenue

---

### ❌ What if data subject request volume spikes?

**Current State:**
- GDPR endpoints have no rate limiting
- Full table scans on each request
- No caching of data exports

**Scenario:** Competitor or activist requests data for 10,000 emails.

**What Happens:**
1. Each request triggers full table scan
2. Database CPU spikes
3. All API requests slow down
4. Possible database timeout

**Should:**
1. Rate limit GDPR endpoints
2. Queue requests for async processing
3. Cache recent exports
4. Implement request throttling

---

### ❌ What if consent withdrawal is challenged?

**Current Implementation:**
```typescript
// From gdpr.ts
gdprRoutes.post('/consent-withdraw/:email', async (c) => {
  await db.prepare(
    'UPDATE leads SET consent_status = ?, consent_timestamp = ?, updated_at = ? WHERE email = ?'
  ).bind('withdrawn', new Date().toISOString(), new Date().toISOString(), email).run();
  // Log and return success
});
```

**Problems:**
1. Updates ALL leads for email (batch)
2. No verification of request origin
3. No consent proof required
4. No audit trail of WHO requested

**Challenge Scenario:**
1. Someone finds email in data breach
2. Submits consent withdrawal for that email
3. All leads for that customer deleted from conversion tracking
4. Customer loses all attribution data
5. Customer disputes charges

**Should:**
1. Verify email ownership (send confirmation)
2. Log request IP and user agent
3. Require authentication for consent withdrawal
4. Anonymize instead of delete

---

## 6. Concurrency & Race Conditions

### ❌ What if two requests update the same lead?

**Current State:**
```typescript
// From leads.ts
leadsRoutes.put('/:id', async (c) => {
  const updates = await c.req.json();
  const lead = await db.getLeadById(id, auth.org_id);
  const success = await db.updateLead(id, auth.org_id, { ...updates, updated_at: new Date().toISOString() });
});
```

**Race Condition:**
1. Request A reads lead (status: new)
2. Request B reads lead (status: new)
3. Request A updates (status: qualified)
4. Request B updates (status: won)
5. Last write wins - A's update partially lost

**No optimistic locking or version checking.**

---

### ❌ What if concurrent webhook floods?

**Scenario:** Shopify sends 1000 webhooks/second for a flash sale.

**Current State:**
```typescript
// From shopify.ts
// Rate limiting is commented out (KV not configured)
// Parallel processing of all webhooks
```

**What Happens:**
1. No effective rate limiting (KV disabled)
2. 1000 concurrent database inserts
3. D1 connection limit exceeded (50 concurrent)
4. 950 requests fail
5. Shopify retries failed webhooks
6. Cascading failure

---

### ❌ What if duplicate leads submitted?

**Current State:**
```typescript
// From ghl.ts - no deduplication on insert
const result = await db.insertLead({ ... });
// No check if lead already exists
```

**Scenario:**
1. GHL workflow sends webhook twice
2. Two identical leads inserted
3. Two conversion attributions created
4. Google Ads receives duplicate conversions
5. Google Ads rejects duplicates (wastes API quota)

**Should:**
1. Check for existing lead with same email + org_id + gclid
2. Update existing instead of insert
3. Or use database UNIQUE constraint

---

## 7. Edge Cases

### ❌ What if GCLID format is invalid?

**Current Implementation:**
```typescript
// From ghl.ts
const gclid = payload.gclid || extractGclidFromUtm(payload);

// No validation!
```

**Google Ads GCLID Format:**
- Must match: `^GCLID_[A-Za-z0-9_-]{22,40}$`
- Example: `EAIaIQv3i3m8e7vOZ-1572532743`

**What Happens:**
1. Invalid GCLID captured
2. Lead stored with invalid GCLID
3. Conversion upload attempted
4. Google Ads rejects with error
5. Error logged but no notification
6. Lead marked "conversion_ready: true" incorrectly

**Should Validate:**
```typescript
function isValidGCLID(gclid: string): boolean {
  return /^GCLID_[A-Za-z0-9_-]{22,40}$/.test(gclid);
}
```

---

### ❌ What if lead score calculation overflows?

**Current Implementation:**
```typescript
let score = 50;
if (payload.phone) score += 10;
if (payload.tags?.includes('qualified')) score += 20;
// ... more additions
return { score: Math.min(score, 100) };
```

**Problem:**
- Uses `Math.min` to cap at 100
- But multiplier can exceed:
```typescript
let multiplier = 1.0;
if (payload.phone) multiplier += 0.2;  // 1.2
if (payload.tags?.includes('qualified')) multiplier += 0.5;  // 1.7
// ...
const adjusted_cents = Math.round(base_cents * multiplier);  // Can be very high
```

**What Happens:**
- Lead with many positive signals gets very high value
- Conversion upload with very high value
- Google Ads may reject or flag
- No validation of reasonable value range

---

### ❌ What if timezone is wrong?

**Current Implementation:**
```typescript
// From google-ads.ts
export function formatConversionTime(date: Date, timezoneOffset?: number): string {
  const offset = timezoneOffset !== undefined ? timezoneOffset : date.getTimezoneOffset();
  // ... format
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${offsetString}`;
}
```

**Google Ads Requirement:**
- Must be in account's timezone
- Default uses server timezone (UTC)

**What Happens:**
1. Lead captured at 10:00 PM UTC
2. Converted at server timezone (e.g., PST)
3. Time is wrong
4. Google Ads rejects conversion
5. Or attribution is wrong (outside 90-day window)

**Should:**
1. Store account timezone with agency
2. Convert to account timezone on upload
3. Validate conversion is within 90 days

---

### ❌ What if email format is invalid?

**Current State:**
```typescript
// From waitlist.ts
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(body.email)) {
  return c.json({ error: 'Invalid email format' }, 400);
}
```

**Problem:**
- Regex is basic, misses edge cases
- Doesn't check DNS for domain
- Allows technically invalid TLDs
- No disposable email detection

**Better Validation:**
```typescript
import { z } from 'zod';
const emailSchema = z.string().email({ message: "Invalid email address" });
```

---

## 8. Business Logic Traps

### ❌ What if value scoring is gamed?

**Current Implementation:**
```typescript
if (payload.tags?.includes('qualified') || payload.tags?.includes('hot')) {
  score += 20;
  multiplier += 0.5;
}
```

**Scenario:**
1. Marketing team tags ALL leads as "qualified"
2. ALL leads get high value
3. Conversions uploaded with inflated values
4. Google Ads optimizes for expensive leads
5. Cost per acquisition increases
6. Ad spend wasted

**Should:**
1. Validate tags against allowed list
2. Require tag source verification
3. Anomaly detection for unusual patterns
4. Manual review for high-value leads

---

### ❌ What if vertical detection is wrong?

**Current Implementation:**
```typescript
function detectVertical(payload: GHLWebhookPayload): string | null {
  const tags = payload.tags?.join(' ').toLowerCase() || '';
  const source = payload.source?.toLowerCase() || '';

  if (tags.includes('real estate') || source.includes('realtor')) return 'real_estate';
  // ... few verticals detected
  return null;  // Most leads have no vertical
}
```

**Problem:**
- Only detects 5 verticals
- Everything else returns `null`
- No vertical = no industry benchmarking
- No vertical = generic conversion values
- Poor attribution accuracy

---

### ❌ What if lead values are disputed?

**Current Implementation:**
```typescript
const base_cents = 10000;  // $100
const adjusted_cents = Math.round(base_cents * multiplier);
```

**Problem:**
- Arbitrary base value
- No customer input on value
- No way to override value
- No historical value tracking

**Scenario:**
1. Lead marked as $150 value
2. Actual sale is $1,500
3. Conversion uploaded with wrong value
4. Google Ads optimizes wrong metric
5. Attribution data corrupted

**Should:**
1. Allow manual value override
2. Track actual vs. estimated values
3. Update conversions when sale closes
4. Machine learning for value prediction

---

## 9. Hidden Technical Debt

### ❌ Comments indicate incomplete work

**Throughout codebase:**
```typescript
// TODO: Implement synchronous Google Ads API calls when credentials are set up
// TODO: Check agency settings to see if Google Ads tracking is enabled
// For now, just count potential conversions
// Queue processing disabled - requires paid Cloudflare plan
// Temporarily disabled - KV namespace not created yet
```

**Debt:** 10+ TODO comments, 3 disabled features.

---

### ❌ Test files exist but coverage unknown

```bash
serverless/tests/
├── unit/
├── integration/
├── e2e/
└── utils/
```

**Questions:**
- Are tests passing?
- What's the coverage percentage?
- Are there any failing tests?
- When were tests last run?

**No CI/CD visible that runs tests automatically.**

---

### ❌ No monitoring or alerting

**Current State:**
- Logs to console
- No centralized logging
- No alerting
- No dashboards
- No uptime monitoring

**What Happens When Something Breaks:**
1. Customer notices conversions not uploading
2. Customer files support ticket
3. You discover the issue hours/days later
4. Data already lost

**Should Have:**
1. Error rate alerting (PagerDuty/Slack)
2. Conversion success rate monitoring
3. API latency dashboards
4. Database health checks
5. Webhook failure alerts

---

## Summary: Top 10 Risks

| Rank | Risk | Severity | Likelihood | Impact |
|------|------|----------|------------|--------|
| 1 | JWT no signature verification | CRITICAL | HIGH | Complete auth bypass |
| 2 | Rate limiting fails open | HIGH | HIGH | DDoS vulnerability |
| 3 | Conversion uploads stubbed | HIGH | CERTAIN | Core feature broken |
| 4 | Backup returns unencrypted data | CRITICAL | MEDIUM | Data breach |
| 5 | No webhook retry mechanism | HIGH | CERTAIN | Data loss |
| 6 | KV namespace not configured | HIGH | CERTAIN | No rate limiting |
| 7 | Queue processing disabled | MEDIUM | CERTAIN | No async processing |
| 8 | GDPR consent validation flawed | HIGH | MEDIUM | Compliance violation |
| 9 | No circuit breakers | MEDIUM | MEDIUM | Cascading failures |
| 10 | No monitoring/alerting | HIGH | CERTAIN | Delayed response |

---

## Conclusion

**This codebase is not production-ready.**

The security gaps (especially JWT verification), missing infrastructure (KV, Queues), and stubbed features (conversions) make it unsuitable for live traffic.

**Recommendation:**
- Do NOT deploy to production
- Fix CRITICAL issues first (JWT, encryption, rate limiting)
- Implement stubbed features
- Add comprehensive monitoring
- Conduct security audit

---

**Last Updated:** 2024-01-15
