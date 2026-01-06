# Architecture

High-level system architecture for AdsEngineer - Enterprise conversion tracking SaaS platform.

## Executive Summary

AdsEngineer is a serverless conversion tracking platform built on Cloudflare Workers that bridges the gap between ad clicks (GCLID/FBCLID/MSCLKID) and actual revenue by capturing attribution data at lead capture and syncing conversions to Google Ads and Meta Ads platforms.

**Core Value Proposition:**
- Multi-touch attribution across Google, Meta, and Microsoft Ads
- Lead value scoring for conversion optimization
- Enterprise-grade encryption for API credentials
- GDPR compliance with consent tracking
- Zero-config onboarding with tracking snippet

**Tech Stack:**
- **Runtime:** Cloudflare Workers (V8 Isolates)
- **Framework:** Hono 4.x (lightweight web framework)
- **Database:** Cloudflare D1 (SQLite-based serverless)
- **Language:** TypeScript (ES Modules)
- **IaC:** OpenTofu
- **Secrets:** Doppler

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AD PLATFORMS                                        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐  │
│  │   Google    │   │    Meta     │   │  Microsoft  │   │    GoHighLevel      │  │
│  │    Ads      │   │   Ads/Facebook│  │    Ads      │   │       (GHL)        │  │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────────┬──────────┘  │
│         │                 │                 │                      │              │
│         │   Conversions   │   Conversions   │                      │  Webhooks   │
│         │   Upload        │   Upload        │                      │             │
│         ▼                 ▼                 ▼                      ▼              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CLOUDFLARE WORKERS (Edge)                            │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     AdsEngineer API                              │   │   │
│  │  │  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │   │   │
│  │  │  │   Public    │  │   Protected API     │  │    Admin API    │  │   │   │
│  │  │  │  Endpoints  │  │   (JWT Auth)        │  │  (Admin Token)  │  │   │   │
│  │  │  │  - Webhooks │  │  - Lead CRUD        │  │  - Backup       │  │   │   │
│  │  │  │  - Waitlist │  │  - Analytics        │  │  - Stats        │  │   │   │
│  │  │  │  - GDPR     │  │  - Status           │  │                 │  │   │   │
│  │  │  └──────┬──────┘  └──────────┬──────────┘  └────────┬────────┘  │   │   │
│  │  │         │                    │                       │           │   │   │
│  │  │         ▼                    ▼                       ▼           │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │              MIDDLEWARE LAYER                           │    │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │   │   │
│  │  │  │  │   CORS      │  │  Auth (JWT)     │  │ Rate Limit  │  │    │   │   │
│  │  │  │  │   Logger    │  │  Admin Guard    │  │  (KV)       │  │    │   │   │
│  │  │  │  └─────────────┘  └─────────────────┘  └─────────────┘  │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │   │   │
│  │  │                              │                                   │   │   │
│  │  │                              ▼                                   │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │              BUSINESS LOGIC SERVICES                    │    │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │   │   │
│  │  │  │  │   Lead      │  │  Google Ads     │  │    Meta     │  │    │   │   │
│  │  │  │  │   Processing│  │  Service        │  │  Conversions│  │    │   │   │
│  │  │  │  │  - Scoring  │  │  - Upload       │  │  - Upload   │  │    │   │   │
│  │  │  │  │  - Routing  │  │  - Auth Token   │  │  - Hashing  │  │    │   │   │
│  │  │  │  │  - Dedupe   │  │  - Queue        │  │             │  │    │   │   │
│  │  │  │  └─────────────┘  └─────────────────┘  └─────────────┘  │    │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │   │   │
│  │  │  │  │ Encryption  │  │   Logging &     │  │  API        │  │    │   │   │
│  │  │  │  │   Service   │  │   Monitoring    │  │  Monitor    │  │    │   │   │
│  │  │  │  │  - AES-256  │  │  - Structured   │  │  - Health   │  │    │   │   │
│  │  │  │  │  - GCM      │  │  - Security     │  │  - Version  │  │    │   │   │
│  │  │  │  └─────────────┘  └─────────────────┘  └─────────────┘  │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │   │   │
│  │  │                              │                                   │   │   │
│  │  │                              ▼                                   │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │              DATA LAYER (D1 Database)                   │    │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │   │   │
│  │  │  │  │   Leads     │  │   Agencies      │  │   Audit     │  │    │   │   │
│  │  │  │  │   Table     │  │   Table         │  │   Logs      │  │    │   │   │
│  │  │  │  └─────────────┘  └─────────────────┘  └─────────────┘  │    │   │   │
│  │  │  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  │    │   │   │
│  │  │  │  │ Conversion  │  │   Technology    │  │    GDPR     │  │    │   │   │
│  │  │  │  │   Logs      │  │   Tracking      │  │   Tables    │  │    │   │   │
│  │  │  │  └─────────────┘  └─────────────────┘  └─────────────┘  │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CLIENTS & TRACKING                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │              CLIENT-SIDE TRACKING SNIPPET                        │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │   │   │
│  │  │  │  - GCLID/FBCLID/MSCLKID capture from URL                 │    │   │   │
│  │  │  │  - UTM parameter extraction                              │    │   │   │
│  │  │  │  - Cookie persistence (90 days)                          │    │   │   │
│  │  │  │  - Hidden form field injection                           │    │   │   │
│  │  │  │  - SPA support (MutationObserver)                        │    │   │   │
│  │  │  │  - sendBeacon for reliable delivery                      │    │   │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      CLOUDFLARE                                         │   │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │   Workers   │  │      D1         │  │        KV Namespaces        │  │   │
│  │  │   Routes    │  │   Database      │  │  (Rate Limiting - Pending)  │  │   │
│  │  └─────────────┘  └─────────────────┘  └─────────────────────────────┘  │   │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │  Custom     │  │    Wrangler     │  │      OpenTofu               │  │   │
│  │  │  Domains    │  │   Configuration │  │      IaC                     │  │   │
│  │  └─────────────┘  └─────────────────┘  └─────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL SERVICES                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Doppler (Secrets Management)    │  Stripe (Billing)            │   │   │
│  │  │  - JWT_SECRET                    │  - Subscriptions             │   │   │
│  │  │  - ADMIN_SECRET                  │  - Customer Management       │   │   │
│  │  │  - ENCRYPTION_MASTER_KEY         │  - Webhooks                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Gateway (Hono Router)

**Purpose:** Central HTTP routing and request handling

**Architecture:**
- Single Hono app instance in `src/index.ts`
- Route modules registered via `app.route()` pattern
- Middleware applied globally (CORS, Logger, Encryption)
- Environment-specific bindings injected per-request

**Route Organization:**
```
Public Routes (No Auth):
├── /health                          → Health check
├── /api/v1/ghl/webhook             → GHL webhook receiver
├── /api/v1/shopify/webhook         → Shopify webhook receiver
├── /api/v1/gdpr/*                  → GDPR endpoints (no auth)
├── /api/v1/waitlist                → Waitlist signup
└── /api/v1/billing/pricing         → Public pricing info

Protected Routes (JWT Auth):
├── /api/v1/leads                   → Lead CRUD
├── /api/v1/status                  → System status
└── /api/v1/analytics               → Analytics endpoints

Admin Routes (Admin Token):
├── /api/v1/admin/backup            → Encrypted backup export
├── /api/v1/admin/backup/decrypt    → Backup decryption
└── /api/v1/admin/stats             → Statistics
```

**Request Flow:**
```
Incoming Request
       │
       ▼
┌──────────────────┐
│   CORS Headers   │  ← Global middleware
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Logger        │  ← Request logging
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Encryption Init  │  ← AES-256-GCM service
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  DB Binding      │  ← D1 injection
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Route Handler  │  ← Auth check + Business logic
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Response       │  ← JSON response
└──────────────────┘
```

### 2. Webhook Receivers

#### 2.1 GoHighLevel (GHL) Webhook
**File:** `src/routes/ghl.ts`

**Purpose:** Ingest leads from GHL workflows

**Payload Processing:**
```
GHL Webhook Payload
       │
       ▼
┌──────────────────┐
│ Validation       │  → Check email OR contact_id
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ GCLID Extract    │  → From custom_fields.gclid or UTM
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Lead Scoring     │  → Base score: 50
                   │  +phone: +10, +0.2x multiplier
                   │  +qualified tag: +20, +0.5x multiplier
                   │  +budget>10k: +15, +0.3x multiplier
                   │  +company: +10, +0.2x multiplier
                   │  Max score: 100
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Vertical Detect  │  → Tags + source matching
                   │  (real_estate, dental, legal, etc.)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Lead Storage     │  → Insert to D1 leads table
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Response         │  → success, lead_id, conversion_ready
└──────────────────┘
```

**Example Payload:**
```json
{
  "contact_id": "contact_123",
  "location_id": "loc_456",
  "email": "lead@example.com",
  "phone": "+1234567890",
  "gclid": "CjwKCAtest123",
  "tags": ["qualified", "high-value"],
  "custom_fields": { "budget": "15000" }
}
```

**Example Response:**
```json
{
  "success": true,
  "lead_id": "uuid-here",
  "gclid_captured": true,
  "fbclid_captured": false,
  "lead_value_cents": 15000,
  "conversion_ready": true,
  "message": "Lead captured with GCLID - ready for Google Ads upload"
}
```

#### 2.2 Shopify Webhook
**File:** `src/routes/shopify.ts`

**Purpose:** Ingest customers and orders from Shopify

**Supported Topics:**
- `customers/create` → New customer registration
- `customers/update` → Customer updates
- `orders/create` → New order (conversion event)
- `orders/paid` → Order paid (conversion event)

**Security:**
```
Shopify Webhook Request
           │
           ▼
┌──────────────────────┐
│ Extract Raw Body     │  → Need raw for HMAC validation
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Validate Headers     │  → X-Shopify-Topic, X-Shopify-Shop-Domain
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ HMAC Signature       │  → SHA256-HMAC validation
           │           │  → Timing-safe comparison
           ▼           │
┌──────────────────────┐
│ Payload Validation   │  → Required fields check
           │           │  → Timestamp validation (≤24h old)
           ▼           │
┌──────────────────────┐
│ Rate Limiting        │  → IP-based: 100 req/hour
           │           │  → Shop-based: 1000 req/hour
           ▼           │
┌──────────────────────┐
│ Process Payload      │  → Extract UTM from tags
           │           │  → Format: gclid:XXX, utm_source:XXX
           ▼           │
┌──────────────────────┐
│ Lead Storage         │  → Ecommerce vertical
           │           │  → Order value in cents
           ▼           │
┌──────────────────────┐
│ Queue Conversion     │  → Google Ads upload (if configured)
└──────────────────────┘
```

**UTM Extraction from Tags:**
```javascript
// Tags are used when Shopify doesn't preserve UTM through checkout
// Format: "gclid:XXX", "utm_source:google", etc.
function extractUtmFromTags(tags) {
  const utmData = {};
  for (const tag of tags) {
    if (tag.startsWith('gclid:')) utmData.gclid = tag.replace('gclid:', '');
    if (tag.startsWith('fbclid:')) utmData.fbclid = tag.replace('fbclid:', '');
    if (tag.startsWith('utm_source:')) utmData.utm_source = tag.replace('utm_source:', '');
    // ... more patterns
  }
  return utmData;
}
```

### 3. Lead Processing Engine

**File:** `src/routes/leads.ts`

**Lead Schema:**
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,           -- Agency/organization ID
  site_id TEXT NOT NULL,          -- Source site identifier
  gclid TEXT,                     -- Google Click ID
  fbclid TEXT,                    -- Facebook Click ID
  msclkid TEXT,                   -- Microsoft Click ID
  external_id TEXT,               -- External reference
  email TEXT NOT NULL,
  phone TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  lead_score INTEGER DEFAULT 0,   -- 0-100 score
  base_value_cents INTEGER,       -- Base lead value
  adjusted_value_cents INTEGER,   -- After multiplier
  value_multiplier REAL DEFAULT 1.0,
  status TEXT DEFAULT 'new',      -- new, qualified, contacted, won, lost
  vertical TEXT,                  -- Industry vertical
  consent_status TEXT,            -- GDPR consent
  consent_timestamp TEXT,
  consent_method TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
```

**Lead Processing Flow:**
```
POST /api/v1/leads
       │
       ▼
┌──────────────────┐
│ Auth Check       │  → JWT validation
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Payload          │  → Accept array or single lead
│ Validation       │  → Required: email, site_id
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ GDPR Consent     │  → Check consent_status
│ Validation       │  → Filter non-consented leads
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Lead Storage     │  → Batch insert to D1
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Platform Upload  │  → Google Ads (if GCLID present)
│ Processing       │  → Meta Ads (if FBCLID present)
│                  │  → Check agency credentials
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Response         │  → leads_processed, conversion_queued
└──────────────────┘
```

### 4. Conversion Tracking Services

#### 4.1 Google Ads Service
**File:** `src/services/google-ads.ts`

**OAuth Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE ADS AUTHENTICATION                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Refresh Token → Access Token (oauth2.googleapis.com/token)  │
│     POST with: grant_type=refresh_token                         │
│     client_id, client_secret, refresh_token                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Upload Click Conversion                                     │
│     POST googleads.googleapis.com/v21/customers/{customer_id}   │
│     :uploadClickConversions                                     │
│                                                                │
│     Body:                                                      │
│     {                                                          │
│       "conversions": [{                                        │
│         "conversion_action": "customers/XXX/conversionActions/Y│
│         "gclid": "EAIaIQ...",                                   │
│         "conversion_date_time": "2024-01-15 10:30:00+00:00",   │
│         "conversion_value": 150.00,                            │
│         "currency_code": "USD",                                │
│         "consent": {                                           │
│           "ad_user_data": "GRANTED",                           │
│           "ad_personalization": "GRANTED"                      │
│         }                                                      │
│       }],                                                      │
│       "partial_failure": true                                  │
│     }                                                          │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Response Handling                                           │
│     - Success: results[0].conversion_action, upload_date_time  │
│     - Partial failure: Check partial_failure_error.details     │
│     - Full failure: Error with user-friendly message           │
└─────────────────────────────────────────────────────────────────┘
```

**Consent Requirements (Google Ads):**
- `ad_user_data`: Must be "GRANTED" for conversion upload
- `ad_personalization`: Must be "GRANTED" for enhanced conversions
- These are hardcoded as "GRANTED" in current implementation

#### 4.2 Meta Conversions API
**File:** `src/services/meta-conversions.ts`

**Privacy Compliance:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    META PRIVACY REQUIREMENTS                    │
└─────────────────────────────────────────────────────────────────┘

Data Hashing (SHA-256, lowercase, trim):
┌─────────────────────────────────────────────────────────────────┐
│  Email: "JOHN@EXAMPLE.COM" → hash → "a1b2c3..."                │
│  Phone: "+1234567890" → hash → "d4e5f6..."                      │
└─────────────────────────────────────────────────────────────────┘

Deduplication:
┌─────────────────────────────────────────────────────────────────┐
│  Event ID Format:                                               │
│  "advocate_{order_id}_{timestamp}"                              │
│                                                                │
│  Prevents duplicate processing of same conversion               │
└─────────────────────────────────────────────────────────────────┘

Event Names:
┌─────────────────────────────────────────────────────────────────┐
│  Purchase → Standard Meta event for conversions                 │
│  (Could be customized for Lead, CompleteRegistration, etc.)     │
└─────────────────────────────────────────────────────────────────┘
```

**API Call:**
```
POST graph.facebook.com/v18.0/{pixel_id}/events

{
  "access_token": "{access_token}",
  "data": [{
    "event_name": "Purchase",
    "event_time": 1705315800,
    "user_data": {
      "em": ["hash_email"],
      "ph": ["hash_phone"]
    },
    "custom_data": {
      "value": 150.00,
      "currency": "EUR",
      "order_id": "order_123"
    },
    "fbclid": "XXX"
  }]
}
```

### 5. Encryption Service

**File:** `src/services/encryption.ts`

**Purpose:** Encrypt sensitive API credentials (Google Ads, Meta, Stripe) at rest using AES-256-GCM.

**Encryption Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    ENCRYPTION SERVICE                           │
└─────────────────────────────────────────────────────────────────┘

Initialization:
┌─────────────────────────────────────────────────────────────────┐
│  Master Key Import (from ENCRYPTION_MASTER_KEY env)             │
│  └── Import raw bytes into CryptoKey (AES-GCM, 256-bit)        │
│                                                                      │
│  Note: Single instance pattern (singleton)                       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Encryption (AES-256-GCM)                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Generate random 12-byte IV                           │   │
│  │  2. Encrypt plaintext with AES-GCM                       │   │
│  │  3. Split: ciphertext (body) + auth tag (16 bytes)       │   │
│  │  4. Encode: Base64 for JSON storage                      │   │
│  │                                                          │   │
│  │  Output:                                                 │   │
│  │  {                                                        │   │
│  │    "encrypted": "base64_ciphertext...",                  │   │
│  │    "iv": "base64_iv...",                                 │   │
│  │    "tag": "base64_auth_tag...",                          │   │
│  │    "algorithm": "AES-GCM",                               │   │
│  │    "timestamp": "2024-01-15T..."                         │   │
│  │  }                                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Decryption                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. Decode base64 to bytes                               │   │
│  │  2. Concatenate: ciphertext + auth tag                   │   │
│  │  3. Decrypt with AES-GCM                                 │   │
│  │  4. Verify auth tag (tampering detection)                │   │
│  │  5. Decode bytes to plaintext                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Credential Storage in D1:**
```sql
-- Agencies table stores encrypted config
CREATE TABLE agencies (
  id TEXT PRIMARY KEY,
  google_ads_config TEXT,  -- Encrypted JSON
  meta_config TEXT,        -- Encrypted JSON
  stripe_config TEXT,      -- Encrypted JSON
  ...
);

-- Example stored value (encrypted):
-- {"encrypted":"a1b2c3...","iv":"xYz123...","tag":"abc123...","algorithm":"AES-GCM","timestamp":"..."}
```

### 6. GDPR Compliance

**File:** `src/routes/gdpr.ts`

**Data Subject Rights Implemented:**

| Right | Endpoint | Description |
|-------|----------|-------------|
| Access | `GET /data-request/{email}` | View all stored personal data |
| Rectification | `PUT /data-rectify/{email}` | Correct inaccurate data |
| Erasure | `DELETE /data-erase/{email}` | Delete all personal data |
| Restriction | `POST /restrict-processing/{email}` | Stop processing |
| Portability | `GET /data-export/{email}` | Download data as JSON |
| Withdraw Consent | `POST /consent-withdraw/{email}` | Withdraw consent |

**GDPR Data Flow:**
```
GDPR Request
       │
       ▼
┌──────────────────┐
│ Email Lookup     │  → Find all leads with email
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Audit Log        │  → Record request (required by GDPR)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Data Processing  │  → Access: Return data
                   │  → Rectify: Update fields
                   │  → Erase: Delete records
                   │  → Export: JSON download
         ┌─────────┘
         │
         ▼
┌──────────────────┐
│ Response         │  → Status, affected records
└──────────────────┘
```

### 7. Tracking Snippet

**File:** `src/snippet.ts`

**Purpose:** Client-side JavaScript to capture and persist click IDs.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    TRACKING SNIPPET FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Page Load / URL Change
       │
       ▼
┌──────────────────┐
│ Extract GCLID    │  → From URL ?gclid= OR cookie _gclid
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Extract FBCLID   │  → From URL ?fbclid= OR cookie _fbclid
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Extract MSCLKID  │  → From URL ?msclkid= OR cookie _msclkid
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Extract UTM      │  → source, medium, campaign, term, content
         │         → From URL params OR cookies
         ▼
┌──────────────────┐
│ Persist to       │  → Set cookies (90-day expiry)
│ Cookies          │  → SameSite=Lax for CSRF protection
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Expose to        │  → window.ads_tracking object
│ Window           │  → For manual access if needed
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Inject Form      │  → Find all <form> elements
│ Fields           │  → Add hidden inputs for each click ID
                   │  → Only if not already injected (dataset flag)
         ┌─────────┘
         │
         ▼
┌──────────────────┐
│ SPA Support      │  → MutationObserver watches body
                   │  → Inject into dynamically added forms
└──────────────────┘
```

**Cookie Names:**
- `_adsengineer_gclid` - Google Click ID
- `_adsengineer_fbclid` - Facebook Click ID
- `_adsengineer_msclkid` - Microsoft Click ID
- `_adsengineer_utm_source` - UTM Source
- `_adsengineer_utm_medium` - UTM Medium
- `_adsengineer_utm_campaign` - UTM Campaign
- `_adsengineer_utm_term` - UTM Term
- `_adsengineer_utm_content` - UTM Content

---

## Data Flow Diagrams

### Lead Capture Flow

```
1. User clicks ad (Google/Meta/Bing)
   ↓
2. Platform assigns GCLID/FBCLID/MSCLKID
   ↓
3. User lands on website (landing page)
   ↓
4. Tracking snippet captures click ID from URL
   ↓
5. Snippet stores click ID in cookie (90 days)
   ↓
6. User fills form
   ↓
7. Snippet injects hidden fields with click ID
   ↓
8. Form submitted to CRM (GHL, Shopify, custom)
   ↓
9. CRM sends webhook to AdsEngineer
   ↓
10. AdsEngineer validates webhook signature
    ↓
11. Extract GCLID/FBCLID from payload
    ↓
12. Calculate lead value (scoring algorithm)
    ↓
13. Store lead in D1 with attribution data
    ↓
14. Queue conversion for upload (if GCLID present)
    ↓
15. Return success response
```

### Conversion Upload Flow

```
Conversion Event (Sale/Signup)
          │
          ▼
┌───────────────────────┐
│ Attribution Lookup    │  → Match conversion to original GCLID
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Value Assignment      │  → Apply business rules
│                       │  → Base value + multiplier
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Google Ads Upload     │  → REST API call
│                       │  → OAuth refresh token
│                       │  → Batch up to 2000 conversions
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Meta Conversions API  │  → SHA-256 hash user data
│                       │  → Event deduplication
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Log Results           │  → success_count, failure_count
│                       │  → Error details for debugging
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Alert if Failed       │  → Email/Slack notification
│                       │  → Dead letter queue for manual review
└───────────────────────┘
```

---

## Security Model

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYERS                        │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Admin Routes (ADMIN_SECRET)
┌─────────────────────────────────────────────────────────────────┐
│  Header: Authorization: Bearer {ADMIN_SECRET}                   │
│  Used for: Backup, stats, sensitive operations                  │
│  Source: Cloudflare secrets (Doppler)                           │
└─────────────────────────────────────────────────────────────────┘

Layer 2: JWT Tokens (JWT_SECRET)
┌─────────────────────────────────────────────────────────────────┐
│  Header: Authorization: Bearer {JWT_TOKEN}                      │
│  Claims:                                                         │
│  {                                                              │
│    "sub": "user_id",                                            │
│    "org_id": "agency_id",                                       │
│    "role": "owner|admin|member|viewer",                         │
│    "exp": 1234567890                                            │
│  }                                                              │
│  Used for: Lead CRUD, analytics, status                         │
└─────────────────────────────────────────────────────────────────┘

Layer 3: Webhook Signatures
┌─────────────────────────────────────────────────────────────────┐
│  Shopify: X-Shopify-Hmac-Sha256 (SHA256-HMAC)                   │
│  GHL: Custom secret (HMAC-based)                                │
│  Stripe: Stripe-Signature (HMAC-SHA256)                         │
└─────────────────────────────────────────────────────────────────┘

Layer 4: Rate Limiting (KV-based, pending)
┌─────────────────────────────────────────────────────────────────┐
│  IP-based: 100 requests/hour                                    │
│  Shop-based: 1000 requests/hour                                 │
│  API-based: 60 requests/minute                                  │
│  Admin: 30 requests/minute                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Protection

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PROTECTION                              │
└─────────────────────────────────────────────────────────────────┘

At Rest:
┌─────────────────────────────────────────────────────────────────┐
│  • Credentials: AES-256-GCM encryption                          │
│  • Lead data: Plaintext (for conversion upload)                 │
│  • Personal data: Minimized collection                          │
│  • GDPR: Consent tracking, data deletion                        │
└─────────────────────────────────────────────────────────────────┘

In Transit:
┌─────────────────────────────────────────────────────────────────┐
│  • TLS 1.3 (Cloudflare edge)                                    │
│  • HSTS headers (max-age=31536000)                              │
│  • CORS with strict origin list                                 │
└─────────────────────────────────────────────────────────────────┘

Access Control:
┌─────────────────────────────────────────────────────────────────┐
│  • Role-based access (owner/admin/member/viewer)                │
│  • Org isolation (leads scoped to org_id)                       │
│  • Audit logging of all operations                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```
leads
├── id (PK)                  UUID
├── org_id                   NOT NULL
├── site_id                  NOT NULL
├── gclid, fbclid, msclid    Nullable
├── email                    NOT NULL
├── phone, landing_page      Nullable
├── utm_* fields             Nullable
├── lead_score               INTEGER (0-100)
├── base_value_cents         INTEGER
├── adjusted_value_cents     INTEGER
├── value_multiplier         REAL
├── status                   TEXT (new/qualified/contacted/won/lost)
├── vertical                 TEXT (industry)
├── consent_status           TEXT (granted/denied/pending/withdrawn)
├── consent_timestamp        TEXT
├── consent_method           TEXT
├── created_at               NOT NULL
└── updated_at               TEXT

agencies
├── id (PK)                  UUID
├── name                     NOT NULL
├── customer_id              NOT NULL (Google Ads Customer ID)
├── google_ads_config        Encrypted JSON
├── meta_config              Encrypted JSON
├── stripe_config            Encrypted JSON
├── conversion_action_id     TEXT
├── status                   TEXT
├── created_at               NOT NULL
└── updated_at               TEXT

audit_logs
├── id (PK)                  UUID
├── agency_id                NOT NULL
├── action                   TEXT
├── result                   TEXT (success/failed/partial_failure)
├── error                    TEXT
├── details                  JSON
└── created_at               NOT NULL

conversion_logs
├── id (PK)                  UUID
├── job_id                   NOT NULL
├── agency_id                NOT NULL
├── batch_size               INTEGER
├── success_count            INTEGER
├── failure_count            INTEGER
├── retry_count              INTEGER
├── errors                   JSON array
├── processing_time          INTEGER
└── created_at               NOT NULL

gdpr_audit_log
├── id (PK)                  AUTOINCREMENT
├── email                    NOT NULL
├── action                   TEXT (access/rectify/erase/restrict/withdraw)
├── timestamp                NOT NULL
├── ip_address               TEXT
├── user_agent               TEXT
└── details                  JSON

technologies
├── id (PK)                  AUTOINCREMENT
├── name                     NOT NULL UNIQUE
├── category                 NOT NULL (ecommerce/crm/ads/analytics/etc)
├── description              TEXT
└── created_at               NOT NULL

lead_technologies
├── id (PK)                  AUTOINCREMENT
├── lead_id                  NOT NULL
├── technology_id            NOT NULL
├── detected_at              NOT NULL
├── confidence_score         REAL (0.0-1.0)
└── UNIQUE(lead_id, technology_id)
```

---

## Technology Stack Details

### Runtime Environment

| Component | Technology | Purpose |
|-----------|------------|---------|
| Serverless | Cloudflare Workers | Edge compute platform |
| Runtime | V8 Isolate | JavaScript execution |
| Framework | Hono 4.x | HTTP routing |
| Language | TypeScript 5.x | Type safety |
| Database | Cloudflare D1 | SQLite-based serverless |

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| hono | ^4.11.3 | Web framework |
| @hono/swagger-ui | ^0.5.3 | API documentation |
| stripe | ^14.25.0 | Payment processing |
| @noble/hashes | ^1.4.0 | SHA-256 for Meta |
| google-ads-api | ^21.0.1 | Google Ads SDK |
| zod | ^3.25.76 | Schema validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| BiomeJS | Linting and formatting |
| Vitest | Testing framework |
| Wrangler | Cloudflare deployment |
| OpenTofu | Infrastructure as code |
| Doppler | Secrets management |

---

## Deployment Architecture

### Environments

```
Development
├── Worker: adsengineer-cloud-dev
├── Domain: adsengineer-cloud-dev.workers.dev
├── Database: adsengineer-db-dev
└── Secrets: Doppler (development)

Staging
├── Worker: adsengineer-cloud-staging
├── Domain: adsengineer-cloud-staging.workers.dev
├── Database: adsengineer-db-staging
└── Secrets: Doppler (staging)

Production
├── Worker: adsengineer-cloud
├── Domain: api.adsengineer.cloud (custom)
├── Database: adsengineer-db (shared)
└── Secrets: Doppler (production)
```

### CI/CD Pipeline

```
Git Push
    │
    ▼
┌─────────────────────────────────────────┐
│  GitHub Actions                          │
│  • Run tests (unit, integration, e2e)   │
│  • TypeScript check                     │
│  • Biome linting                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Deploy to Staging                      │
│  • wrangler deploy --env staging        │
│  • Update D1 migrations                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Manual Promotion to Production          │
│  • Review deployment                    │
│  • wrangler deploy --env production     │
└─────────────────────────────────────────┘
```

---

## Scalability & Performance

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALABILITY DESIGN                           │
└─────────────────────────────────────────────────────────────────┘

Cloudflare Workers automatically:
┌─────────────────────────────────────────────────────────────────┐
│  • Scale to zero when idle                                      │
│  • Scale up to handle traffic spikes                            │
│  • Distribute across global edge locations                      │
│  • No cold starts (near-instant response)                       │
└─────────────────────────────────────────────────────────────────┘

Performance Optimizations:
┌─────────────────────────────────────────────────────────────────┐
│  • Async processing for external API calls                      │
│  • Batch operations for D1 queries                              │
│  • Connection pooling via prepared statements                   │
│  • Rate limiting to prevent abuse                               │
│  • Response compression (gzip) via Cloudflare                   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Performance

```
┌─────────────────────────────────────────────────────────────────┐
│                    D1 OPTIMIZATION                              │
└─────────────────────────────────────────────────────────────────┘

Indexes:
┌─────────────────────────────────────────────────────────────────┐
│  leads.org_id, leads.status, leads.created_at                   │
│  agencies.customer_id                                           │
│  audit_logs.agency_id, audit_logs.action                        │
│  conversion_logs.job_id, conversion_logs.agency_id              │
└─────────────────────────────────────────────────────────────────┘

Query Optimization:
┌─────────────────────────────────────────────────────────────────┐
│  • Prepared statements for repeated queries                     │
│  • Batch inserts for multiple leads                             │
│  • Pagination with LIMIT/OFFSET                                 │
│  • Filtered queries using indexed columns                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reliability Features

### Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                               │
└─────────────────────────────────────────────────────────────────┘

Request-Level Errors:
┌─────────────────────────────────────────────────────────────────┐
│  • 400 Bad Request - Missing/invalid data                       │
│  • 401 Unauthorized - Missing/invalid auth                      │
│  • 403 Forbidden - Insufficient permissions                     │
│  • 404 Not Found - Resource not found                           │
│  • 429 Rate Limited - Too many requests                         │
│  • 500 Internal Error - Unhandled exception                     │
└─────────────────────────────────────────────────────────────────┘

External API Errors:
┌─────────────────────────────────────────────────────────────────┐
│  Google Ads:                                                    │
│  • AUTH_ERROR - Invalid credentials                             │
│  • RATE_LIMIT_EXCEEDED - Quota exceeded                         │
│  • CONVERSION_TOO_OLD - >90 days                                │
│  • INVALID_GCLID - Malformed click ID                           │
│                                                                │
│  Retry Logic:                                                   │
│  • Exponential backoff (1s, 2s, 4s, 8s, 16s)                    │
│  • Max 5 retries                                                │
│  • Log to conversion_logs table                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monitoring & Alerting

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                             │
└─────────────────────────────────────────────────────────────────┘

Health Checks:
┌─────────────────────────────────────────────────────────────────┐
│  GET /health                                                    │
│  Returns: { status, checks: { database, workers }, version }    │
│                                                                │
│  GET /status/metrics                                            │
│  Returns: { total_sites, leads_today, uptime_percentage, ... }  │
└─────────────────────────────────────────────────────────────────┘

Structured Logging:
┌─────────────────────────────────────────────────────────────────┐
│  Log Levels: DEBUG, INFO, WARN, ERROR                           │
│  Log Fields: timestamp, level, message, requestId, ip, shopDomain │
│  Security Events: Webhook failures, auth failures, rate limits  │
└─────────────────────────────────────────────────────────────────┘

API Monitoring:
┌─────────────────────────────────────────────────────────────────┐
│  GET /status/connection?platform=google_ads                     │
│  GET /status/connection?platform=meta                           │
│  Returns: { status, account, last_used, errors }                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
ads-engineer/
├── serverless/                    # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts              # Hono app entry point
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── openapi.ts            # OpenAPI spec (663 lines)
│   │   ├── snippet.ts            # Client-side tracking snippet
│   │   ├── routes/
│   │   │   ├── leads.ts          # Lead CRUD operations
│   │   │   ├── ghl.ts            # GHL webhook receiver
│   │   │   ├── shopify.ts        # Shopify webhook receiver
│   │   │   ├── admin.ts          # Admin operations
│   │   │   ├── billing.ts        # Stripe integration
│   │   │   ├── gdpr.ts           # GDPR endpoints
│   │   │   ├── onboarding.ts     # Registration & agreements
│   │   │   ├── analytics.ts      # Analytics endpoints
│   │   │   ├── status.ts         # Health & metrics
│   │   │   └── waitlist.ts       # Waitlist signup
│   │   ├── services/
│   │   │   ├── google-ads.ts     # Google Ads API integration
│   │   │   ├── meta-conversions.ts # Meta Conversions API
│   │   │   ├── google-ads-queue.ts # Queue processing
│   │   │   ├── encryption.ts     # AES-256-GCM encryption
│   │   │   ├── api-monitor.ts    # API health monitoring
│   │   │   ├── crypto.ts         # HMAC validation
│   │   │   └── logging.ts        # Structured logging
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authentication
│   │   │   └── rate-limit.ts     # Rate limiting
│   │   ├── database/
│   │   │   └── index.ts          # D1 query functions
│   │   └── workers/
│   │       └── queue-consumer.ts # Queue message handling
│   ├── migrations/
│   │   ├── 0001_init.sql         # Core tables
│   │   ├── 0002_agencies_audit.sql # Agencies & audit
│   │   ├── 0003_conversion_logs.sql # Conversion tracking
│   │   ├── 0004_technology_tracking.sql # Tech detection
│   │   ├── 0005_meta_tracking.sql # Meta & Microsoft Ads
│   │   └── 0006_gdpr_compliance.sql # GDPR compliance
│   ├── tests/
│   │   ├── unit/                 # Unit tests
│   │   ├── integration/          # Integration tests
│   │   ├── e2e/                  # End-to-end tests
│   │   └── utils/                # Test helpers
│   ├── wrangler.jsonc            # Cloudflare config
│   └── package.json              # Dependencies
│
├── infrastructure/                # OpenTofu IaC
│   ├── main.tf                   # Resource definitions
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # Output values
│   └── providers.tf              # Provider config
│
├── frontend/                      # React/Vue frontend (future)
│   └── src/
│
├── landing-page/                  # Astro landing page
│   └── src/
│
├── docs/                          # Documentation
│   ├── architecture.md            # This file
│   ├── deployment.md              # Deployment guide
│   └── ...
│
└── wiki/                          # Wiki documentation
    ├── Architecture.md
    ├── API-Reference.md
    └── ...
```

---

## Future Considerations

### Roadmap Items

1. **Queues (Paid Plan Required)**
   - Async conversion uploads via Cloudflare Queues
   - Better handling of API rate limits
   - Dead letter queue for failed conversions

2. **Additional Integrations**
   - TikTok Ads API
   - LinkedIn Ads API
   - HubSpot CRM
   - Salesforce CRM

3. **UI Dashboard**
   - React/Vue frontend for lead management
   - Analytics dashboards
   - Configuration UI

4. **Advanced Features**
   - Machine learning lead scoring
   - A/B testing attribution
   - Multi-touch attribution models
   - Real-time notifications

### Technical Debt

- Rate limiting KV namespace not yet created
- Queue processing commented out (requires paid plan)
- Some services stubbed (Meta, Google Ads queue)
- Test coverage incomplete

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Next Review:** 2024-04-15
