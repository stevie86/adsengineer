# Data Model: Self-Service Dashboard MVP

**Feature**: Self-Service Dashboard MVP  
**Created**: 2026-01-13  
**Based on**: spec.md

---

## Entity Relationships

```
┌─────────────────────────────────────────┐
│          Customers                   │
│  ┌─────────────────────┐          │
│  │                  │          │
│  └─────────────────────┘          │
│         │ 1                        │
│         │ 1                        │
│         │ 1                        │
│  Agreements                 Subscriptions
│  Sessions                    Sites
│                                   │
│                         Settings       │
│                                   │
└─────────────────────────────────────────┘

Relationship Legend:
── Foreign Key
1  Relationship (one-to-many)
1  Relationship (one-to-many)
─────────────────────────
```

---

## Entities

### Customer

**Description**: Customer account holder with authentication credentials and profile information

**Fields**:
- `id` (TEXT, PRIMARY KEY): Unique customer identifier (UUID)
- `email` (TEXT, NOT NULL, UNIQUE): Customer email address (RFC 5322 format)
- `stripe_customer_id` (TEXT, NULL): Stripe customer identifier
- `first_name` (TEXT, NULL): First name
- `last_name` (TEXT, NULL): Last name
- `phone` (TEXT, NULL): Phone number (E.164 format)
- `company` (TEXT, NULL): Company name
- `website` (TEXT, NULL): Website URL
- `ghl_location_id` (TEXT, NULL): GoHighLevel location identifier
- `plan` (TEXT, DEFAULT 'free'): Subscription plan (free, starter, professional, enterprise)
- `status` (TEXT, DEFAULT 'active'): Account status (active, inactive, suspended)
- `created_at` (TEXT, NOT NULL): Account creation timestamp (ISO 8601)
- `updated_at` (TEXT, NULL): Last update timestamp (ISO 8601)

**Relationships**:
- One-to-many: Agreements (customer → agreements)
- One-to-many: Subscriptions (customer → subscriptions)
- One-to-many: CustomerSettings (customer → customer_settings)
- One-to-many: Sites (customer → sites)

**Validation Rules**:
- `email` must match RFC 5322 format (regex: `^[^@]+@[^@]+\.[^@]+$`)
- `email` must be unique across all customers
- `stripe_customer_id` optional (NULL for free customers)
- `plan` must be one of: free, starter, professional, enterprise
- `status` must be one of: active, inactive, suspended

**Indexes**:
- `idx_customers_email`: Fast lookup by email
- `idx_customers_status`: Query by status
- `idx_customers_stripe_customer_id`: Stripe customer lookups

---

### Subscription

**Description**: Subscription record linking customer to Stripe subscription

**Fields**:
- `id` (TEXT, PRIMARY KEY): Unique subscription identifier (UUID)
- `agency_id` (TEXT, NOT NULL, FOREIGN KEY): Customer ID (references customers.id)
- `stripe_subscription_id` (TEXT, NOT NULL): Stripe subscription identifier
- `stripe_price_id` (TEXT, NOT NULL): Stripe price identifier (pricing_tiers table)
- `status` (TEXT, NOT NULL): Subscription status (active, canceling, canceled)
- `current_period_start` (TEXT, NOT NULL): Billing period start timestamp (ISO 8601)
- `current_period_end` (TEXT, NOT NULL): Billing period end timestamp (ISO 8601)
- `created_at` (TEXT, NOT NULL): Subscription creation timestamp (ISO 8601)
- `cancelled_at` (TEXT, NULL): Cancellation timestamp (ISO 8601)

**Relationships**:
- Many-to-one: Customer (references customers.id)
- Many-to-one: PricingTier (references pricing_tiers.stripe_price_id)

**Validation Rules**:
- `stripe_subscription_id` required (cannot be NULL)
- `status` required
- `status` must be one of: active, canceling, canceled
- If `status = 'canceling'`, `cancelled_at` must NOT be NULL

**Indexes**:
- `idx_subscriptions_agency_id`: Fast lookup by customer
- `idx_subscriptions_stripe_subscription_id`: Stripe subscription lookups

---

### Agreement

**Description**: Legal agreement acceptance record for compliance tracking

**Fields**:
- `id` (TEXT, PRIMARY KEY): Unique agreement identifier (UUID)
- `customer_id` (TEXT, NOT NULL, FOREIGN KEY): Customer ID (references customers.id)
- `agreement_type` (TEXT, NOT NULL): Agreement type (tos, dpa, privacy)
- `agreement_version` (TEXT, NOT NULL): Version identifier (e.g., "1.0", "1.0-dpa")
- `accepted_at` (TEXT, NOT NULL): Acceptance timestamp (ISO 8601)
- `ip_address` (TEXT): IP address at time of acceptance
- `user_agent` (TEXT): User agent string
- `consent_text_hash` (TEXT, NOT NULL): SHA-256 hash of agreement text
- `metadata` (TEXT, NULL): Additional JSON data for compliance audit

**Relationships**:
- Many-to-one: Customer (references customers.id)

**Validation Rules**:
- `customer_id` required (foreign key)
- `agreement_type` must be one of: tos, dpa, privacy
- `consent_text_hash` must be SHA-256 hash
- `accepted_at` required

**Indexes**:
- `idx_agreements_customer_id`: Fast lookup by customer
- `idx_agreements_type`: Query by agreement type
- `idx_agreements_accepted_at`: Time-based queries

---

### CustomerSettings

**Description**: Customer profile preferences and notification settings (NEW TABLE)

**Fields**:
- `id` (TEXT, PRIMARY KEY): Unique settings identifier (UUID)
- `customer_id` (TEXT, NOT NULL, UNIQUE, FOREIGN KEY): Customer ID (references customers.id)
- `first_name` (TEXT, NULL): First name
- `last_name` (TEXT, NULL): Last name
- `phone` (TEXT, NULL): Phone number
- `company` (TEXT, NULL): Company name
- `industry` (TEXT, NULL): Industry classification
- `notification_email` (BOOLEAN, DEFAULT false): Email notification enabled
- `notification_sms` (BOOLEAN, DEFAULT false): SMS notification enabled (future)
- `notification_push` (BOOLEAN, DEFAULT false): Push notification enabled (future)
- `notification_conversion_alerts` (BOOLEAN, DEFAULT true): Conversion alert emails enabled
- `privacy_data_export` (BOOLEAN, DEFAULT true): Allow data export (GDPR)
- `privacy_marketing_opt_in` (BOOLEAN, DEFAULT true): Opted into marketing communications
- `privacy_analytics_access` (BOOLEAN, DEFAULT true): Third-party analytics sharing enabled
- `created_at` (TEXT, NOT NULL): Settings creation timestamp (ISO 8601)
- `updated_at` (TEXT, NOT NULL): Last update timestamp (ISO 8601)

**Relationships**:
- Many-to-one: Customer (references customers.id)

**Validation Rules**:
- `customer_id` required (foreign key)
- All boolean fields default to FALSE (user explicitly opts in)
- `privacy_data_export` defaults to TRUE (GDPR compliance)

**Indexes**:
- `idx_customer_settings_customer_id`: Fast lookup by customer

---

### Session

**Description**: Universal SST tracking session (NEW TABLE for Self-Service Dashboard)

**Fields**:
- `session_id` (TEXT, PRIMARY KEY): Unique session identifier (UUID)
- `site_id` (TEXT, NOT NULL, FOREIGN KEY): Site identifier (references sites.site_id)
- `customer_id` (TEXT, NULL): Customer ID (if authenticated)
- `user_id` (TEXT, NULL): User identifier (if authenticated)
- `expires_at` (TEXT, NOT NULL): Expiration timestamp (ISO 8601)
- `created_at` (TEXT, NOT NULL): Session creation timestamp (ISO 8601)
- `user_agent` (TEXT): User agent string at creation
- `ip_address` (TEXT): IP address at creation

**Relationships**:
- Many-to-one: Site (references sites.site_id)
- Optional: Customer (if authenticated)
- Optional: User (if authenticated)

**Validation Rules**:
- `site_id` required (foreign key)
- `expires_at` required (sessions must have expiration)
- Session expires after 24 hours (configured in universal-tracking-snippet.js)

**Indexes**:
- `idx_sessions_site_id`: Fast lookup by site
- `idx_sessions_expires_at`: Cleanup expired sessions
- `idx_sessions_customer_id`: Customer session queries

---

### Site

**Description**: Customer website tracking site (NEW TABLE for multi-site support)

**Fields**:
- `site_id` (TEXT, PRIMARY KEY): Unique site identifier (UUID)
- `customer_id` (TEXT, NOT NULL, FOREIGN KEY): Owner customer ID (references customers.id)
- `domain` (TEXT, NOT NULL): Domain name (e.g., "example.com")
- `url` (TEXT, NOT NULL): Full website URL (e.g., "https://example.com")
- `name` (TEXT, NULL): Site display name
- `status` (TEXT, DEFAULT 'active'): Site status (active, inactive, suspended)
- `last_activity` (TEXT, NULL): Last activity timestamp (ISO 8601)
- `created_at` (TEXT, NOT NULL): Site registration timestamp (ISO 8601)
- `updated_at` (TEXT, NULL): Last update timestamp (ISO 8601)

**Relationships**:
- Many-to-one: Customer (references customers.id)
- One-to-many: Sessions (site → sessions)

**Validation Rules**:
- `customer_id` required (foreign key)
- `domain` must be unique across all sites
- `url` must be valid URL format (http/https)
- `status` must be one of: active, inactive, suspended

**Indexes**:
- `idx_sites_customer_id`: Fast lookup by customer
- `idx_sites_domain`: Domain lookups
- `idx_sites_status`: Query by status

---

## Data Access Patterns

### Reading Data

**Customer Profile**:
```typescript
const result = await db.prepare(
  'SELECT first_name, last_name, phone, company, industry FROM customer_settings WHERE customer_id = ?'
).bind(customerId).first();
```

**Subscription Status**:
```typescript
const subscription = await db.prepare(`
  SELECT s.*, p.name as plan_name, p.features, p.lead_limit
  FROM subscriptions s
  JOIN pricing_tiers p ON s.stripe_price_id = p.stripe_price_id
  WHERE s.agency_id = ? AND s.status = 'active'
  ORDER BY s.created_at DESC LIMIT 1
`).bind(agencyId).first();
```

**Recent Conversions**:
```typescript
const conversions = await db.prepare(`
  SELECT id, platform, conversion_value, currency, created_at
  FROM conversions
  WHERE org_id = ?
  ORDER BY created_at DESC LIMIT 20
`).bind(orgId).all();
```

### Writing Data

**Creating Customer**:
```typescript
await db.prepare(
  'INSERT INTO customers (id, email, stripe_customer_id, plan, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
).bind(customerId, email, stripeCustomerId, 'starter', 'active', now, now).run();
```

**Updating Customer Profile**:
```typescript
await db.prepare(
  'UPDATE customer_settings SET first_name = ?, last_name = ?, phone = ?, company = ?, industry = ?, updated_at = datetime("now") WHERE customer_id = ?'
).bind(firstName, lastName, phone, company, industry, now, customerId).run();
```

**Creating Subscription**:
```typescript
await db.prepare(
  'INSERT INTO subscriptions (id, agency_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))'
).bind(subscriptionId, agencyId, stripeSubscriptionId, priceId, 'active', periodStart, periodEnd, now).run();
```

---

## Migration Strategy

### Migration 0002_customer_settings.sql

```sql
-- Create customer_settings table for storing profile and preferences
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

**Purpose**: Separates customer profile and preferences from main customer record for better organization and privacy controls.

### Migration 0003_sites.sql

```sql
-- Create sites table for multi-site support
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
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

**Purpose**: Support multiple websites per customer with separate configuration and tracking per site.

### Migration 0004_universal_sst_sessions.sql

```sql
-- Create sessions table for Universal SST tracking
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  customer_id TEXT,
  user_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_site_id ON sessions(site_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_customer_id ON sessions(customer_id);
```

**Purpose**: Track Universal SST sessions for authentication and rate limiting per site.

---

## Relationships Summary

```
Customer (1) ─── (N) Agreements
Customer (1) ─── (N) Subscriptions (N)
Customer (1) ─── (N) CustomerSettings (1) ← NEW
Customer (1) ─── (N) Sites (1) ← NEW
         │                  └── (1) Sessions (N) ← NEW
Subscription (N) ─── PricingTier (1)
```

---

## Data Integrity Rules

### Cascade Deletes
- Customer deletion: Cascades to Agreements, Subscriptions, CustomerSettings, Sites, Sessions
- Site deletion: Cascades to Sessions

### Foreign Key Constraints
- All foreign keys use `ON DELETE CASCADE` to maintain referential integrity

### Uniqueness Constraints
- Customer.email: UNIQUE across all customers
- CustomerSettings.customer_id: UNIQUE per customer (one settings record per customer)
- Sites.domain: No uniqueness constraint (same domain for multiple customers allowed)
- Subscription.id: PRIMARY KEY ensures uniqueness

---

## GDPR Compliance

### Data Export
- Customer can request full data export via `/api/v1/dashboard/privacy/data-export`
- Export format: JSON or CSV
- Includes: conversions, subscription history, settings, agreements

### Right to Deletion
- `/api/v1/dashboard/privacy/delete-account` endpoint (future feature)
- Requires authentication and verification (password re-entry)
- All data deleted within 30 days

### Marketing Opt-Out
- Customer can opt out of marketing communications
- Stored in `customer_settings.privacy_marketing_opt_in`
- Respected across all email campaigns

---

**END OF DATA MODEL**
