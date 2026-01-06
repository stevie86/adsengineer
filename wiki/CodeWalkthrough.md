# Code Walkthrough

Comprehensive file-by-file analysis of the AdsEngineer codebase.

## Table of Contents

1. [Entry Point (`serverless/src/index.ts`)](#1-entry-point)
2. [Types (`serverless/src/types.ts`)](#2-types)
3. [API Documentation (`serverless/src/openapi.ts`)](#3-api-documentation)
4. [Routes](#4-routes)
5. [Services](#5-services)
6. [Middleware](#6-middleware)
7. [Database (`serverless/src/database/index.ts`)](#7-database)
8. [Workers (`serverless/src/workers/*.ts`)](#8-workers)
9. [Tracking Snippet (`serverless/src/snippet.ts`)](#9-tracking-snippet)

---

## 1. Entry Point

**File:** `serverless/src/index.ts` (299 lines)

### Overview

The main Hono application entry point that orchestrates all routes, middleware, and configurations.

### Key Components

#### App Initialization
```typescript
const app = new Hono<AppEnv>();
```

Creates a new Hono application with type-safe environment bindings.

#### Global Middleware (Order Matters!)

```typescript
// 1. CORS - Cross-Origin Resource Sharing
app.use(
  '*',
  cors({
    origin: ['https://app.adsengineer.com', 'http://localhost:3000', 'http://localhost:8090'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// 2. Logger - Request/response logging
app.use('*', logger());

// 3. Encryption - Initialize AES-256-GCM service
app.use('*', encryptionMiddleware);

// 4. Database Binding - Inject D1 into context
app.use('*', async (c, next) => {
  c.set('db', c.env.DB);
  return next();
});
```

**Middleware Order Important:**
1. CORS runs first to handle preflight OPTIONS requests
2. Logger logs all incoming requests
3. Encryption initializes before any data processing
4. Database binding makes D1 available to all handlers

#### Health Check Endpoint

```typescript
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});
```

Simple health check that returns system status and environment.

#### Tracking Snippet Endpoint

```typescript
app.get('/snippet.js', async (c) => {
  // Returns minified JavaScript snippet for client-side tracking
  // Snippet captures GCLID, FBCLID, MSCLKID, and UTM parameters
  // Persists click IDs in cookies for 90 days
  // Auto-injects hidden form fields on form submit
});
```

**Snippet Key Features:**
- Reads click IDs from URL query params or cookies
- Stores tracking data in cookies (90-day expiry)
- Exposes `window.ads_tracking` object
- Uses `sendBeacon` for reliable delivery
- MutationObserver for SPA form injection

#### Route Registration

```typescript
// Public routes (no auth required)
app.route('/api/v1/ghl', ghlRoutes);
app.route('/api/v1/shopify', shopifyRoutes);
app.route('/api/v1/gdpr', gdprRoutes);
app.route('/api/v1/waitlist', waitlistRoutes);
app.route('/api/v1/billing', billingRoutes);

// Admin routes (admin token auth)
app.route('/api/v1/admin', adminRoutes);

// Protected routes (JWT auth)
const api = new Hono<AppEnv>();
api.use('*', authMiddleware());
api.route('/leads', leadsRoutes);
api.route('/status', statusRoutes);
api.route('/analytics', analyticsRoutes);
app.route('/api/v1', api);
```

**Registration Pattern:**
1. Public routes registered directly on main app
2. Protected routes use nested Hono app with auth middleware
3. Nested app mounted at `/api/v1`

#### Error Handlers

```typescript
// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Endpoint not found',
      message: 'The requested API endpoint does not exist',
      available: { health: '/health', api: '/api/v1' },
    },
    404
  );
});

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});
```

### Walkthrough Summary

| Aspect | Details |
|--------|---------|
| Framework | Hono 4.x |
| Type Safety | Full TypeScript with `AppEnv` generics |
| Middleware Count | 4 global + route-specific |
| Route Count | 4 public, 3 protected, 1 admin |
| Configuration | Environment-based via `c.env` |

---

## 2. Types

**File:** `serverless/src/types.ts` (38 lines)

### Type Hierarchy

```
AppEnv
├── Bindings (Environment Variables)
│   ├── ENVIRONMENT: string
│   ├── JWT_SECRET: string
│   ├── ADMIN_SECRET: string
│   ├── BACKUP_ENCRYPTION_KEY: string
│   ├── DB: D1Database
│   ├── RATE_LIMIT_KV: KVNamespace
│   ├── ENCRYPTION_MASTER_KEY: string
│   ├── STRIPE_SECRET_KEY: string
│   ├── STRIPE_*_PRICE_ID: string (optional)
│   ├── STRIPE_WEBHOOK_SECRET: string (optional)
│   └── Rate Limiting Config (optional)
│
└── Variables (Context Values)
    ├── auth: AuthContext
    └── db: Database
```

### Binding Categories

**Required Bindings:**
- `ENVIRONMENT` - Environment name
- `JWT_SECRET` - For JWT validation
- `ADMIN_SECRET` - For admin endpoints
- `BACKUP_ENCRYPTION_KEY` - For backup encryption
- `DB` - D1 database binding
- `ENCRYPTION_MASTER_KEY` - For credential encryption

**Optional Bindings:**
- `RATE_LIMIT_KV` - KV namespace for rate limiting
- `STRIPE_*` - Stripe configuration
- Rate limiting windows and max requests

---

## 3. API Documentation

**File:** `serverless/src/openapi.ts` (663 lines)

### OpenAPI Specification Structure

```typescript
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AdsEngineer API',
    version: '1.0.0',
    description: 'Conversion tracking API for GoHighLevel agencies',
  },
  servers: [
    { url: 'https://adsengineer-cloud.adsengineer.workers.dev', description: 'Production' },
    { url: 'http://localhost:8787', description: 'Local development' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'GHL' },
    { name: 'Shopify' },
    { name: 'Waitlist' },
    { name: 'Leads' },
    { name: 'Admin' },
  ],
  paths: { /* ... */ },
  components: { /* security schemes */ },
};
```

### Documented Endpoints

| Path | Methods | Tag | Description |
|------|---------|-----|-------------|
| `/health` | GET | Health | Health check |
| `/api/v1/ghl/webhook` | GET, POST | GHL | GHL webhook receiver |
| `/api/v1/shopify/webhook` | GET, POST | Shopify | Shopify webhook receiver |
| `/api/v1/gdpr/data-request/{email}` | GET | GDPR | Data access request |
| `/api/v1/gdpr/data-export/{email}` | GET | GDPR | Data portability export |
| `/api/v1/gdpr/data-rectify/{email}` | PUT | GDPR | Data rectification |
| `/api/v1/gdpr/data-erase/{email}` | DELETE | GDPR | Right to erasure |
| `/api/v1/gdpr/consent-withdraw/{email}` | POST | GDPR | Consent withdrawal |
| `/api/v1/gdpr/privacy-policy` | GET | GDPR | Privacy policy |
| `/api/v1/waitlist` | POST | Waitlist | Join waitlist |
| `/api/v1/waitlist/count` | GET | Waitlist | Get waitlist count |
| `/api/v1/admin/backup` | GET | Admin | Export encrypted backup |
| `/api/v1/admin/backup/decrypt` | POST | Admin | Decrypt backup |
| `/api/v1/admin/stats` | GET | Admin | Get statistics |

### Documentation Setup

```typescript
export function setupDocs(app: Hono<AppEnv>) {
  app.get('/docs', swaggerUI({ url: '/openapi.json' }));
  app.get('/openapi.json', (c) => c.json(openApiSpec));
}
```

**Access:**
- Swagger UI: `https://api.adsengineer.cloud/docs`
- OpenAPI JSON: `https://api.adsengineer.cloud/openapi.json`

---

## 4. Routes

### 4.1 Leads Route (`serverless/src/routes/leads.ts`)

**Purpose:** CRUD operations for leads with conversion tracking.

**Key Functions:**

```typescript
// POST /api/v1/leads - Create leads
leadsRoutes.post('/', async (c) => {
  // 1. Validate auth
  const auth = c.get('auth');
  if (!auth) return c.json({ error: 'Authentication required' }, 401);

  // 2. Parse body (array or single)
  const body = await c.req.json();
  const leads: Lead[] = Array.isArray(body) ? body : [body];

  // 3. Validate required fields
  for (const lead of leads) {
    if (!lead.email || !lead.site_id) {
      return c.json({ error: 'email and site_id are required' }, 400);
    }
  }

  // 4. Store leads with org_id
  const storedLeads = await Promise.all(
    leads.map((lead) =>
      db.insertLead({
        ...lead,
        org_id: auth.org_id,
        created_at: lead.created_at || new Date().toISOString(),
      })
    )
  );

  // 5. Process GDPR consent
  const validLeads = [];
  const deniedLeads = [];
  for (const lead of storedLeads) {
    const consentValid = await validateGdprConsent(c.env.DB, lead.id);
    consentValid ? validLeads.push(lead) : deniedLeads.push(lead);
  }

  // 6. Queue platform conversions
  let googleAdsQueued = 0;
  let metaQueued = 0;
  if (validLeads.length > 0) {
    // Google Ads processing (stubbed)
    // Meta processing (stubbed)
  }

  // 7. Return response
  return c.json({
    success: true,
    leads_processed: storedLeads.length,
    leads_stored: storedLeads.map((l) => l.id),
    google_ads_queued: googleAdsQueued,
    meta_queued: metaQueued,
  });
});
```

**Lead Interface:**
```typescript
interface Lead {
  id?: string;
  site_id: string;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  external_id?: string | null;
  email: string;
  phone?: string;
  landing_page: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string; };
  technologies?: TechnologyDetection[];
  consent_status?: 'granted' | 'denied' | 'pending' | 'withdrawn';
  consent_timestamp?: string;
  consent_method?: 'cookie_banner' | 'form_checkbox' | 'api_call';
  lead_score?: number;
  base_value_cents?: number;
  adjusted_value_cents?: number;
  value_multiplier?: number;
  status: 'new' | 'qualified' | 'contacted' | 'won' | 'lost';
  vertical?: string;
  created_at?: string;
  updated_at?: string;
}
```

**GET Endpoints:**
- `GET /` - List leads with pagination and filtering
- `GET /:id` - Get single lead by ID

**PUT Endpoint:**
- `PUT /:id` - Update lead fields

### 4.2 GHL Route (`serverless/src/routes/ghl.ts`)

**Purpose:** Handle GoHighLevel webhook payloads.

**POST /webhook Handler:**

```typescript
ghlRoutes.post('/webhook', async (c) => {
  // 1. Parse payload
  const payload: GHLWebhookPayload = await c.req.json();

  // 2. Validate required fields
  if (!payload.email && !payload.contact_id) {
    return c.json({ error: 'email or contact_id required' }, 400);
  }

  // 3. Extract GCLID from custom_fields or UTM
  const gclid = payload.gclid || extractGclidFromUtm(payload);

  // 4. Calculate lead value
  const leadValue = calculateLeadValue(payload);

  // 5. Store lead
  const result = await db.insertLead({
    org_id: payload.location_id || 'default',
    site_id: payload.location_id || 'ghl',
    email: payload.email || '',
    // ... other fields
    lead_score: leadValue.score,
    base_value_cents: leadValue.base_cents,
    adjusted_value_cents: leadValue.adjusted_cents,
    value_multiplier: leadValue.multiplier,
  });

  // 6. Return with conversion readiness
  return c.json({
    success: true,
    lead_id: result.id,
    gclid_captured: !!gclid,
    fbclid_captured: !!fbclid,
    lead_value_cents: leadValue.adjusted_cents,
    conversion_ready: !!gclid,
  });
});
```

**Lead Scoring Algorithm:**
```typescript
function calculateLeadValue(payload): { score, base_cents, adjusted_cents, multiplier } {
  let score = 50;  // Base score
  let multiplier = 1.0;

  if (payload.phone) { score += 10; multiplier += 0.2; }

  if (payload.tags?.includes('qualified') || payload.tags?.includes('hot')) {
    score += 20; multiplier += 0.5;
  }

  if (payload.custom_fields?.budget && parseInt(payload.custom_fields.budget) > 10000) {
    score += 15; multiplier += 0.3;
  }

  if (payload.custom_fields?.company || payload.custom_fields?.business_name) {
    score += 10; multiplier += 0.2;
  }

  const base_cents = 10000;  // $100 base value
  const adjusted_cents = Math.round(base_cents * multiplier);

  return { score: Math.min(score, 100), base_cents, adjusted_cents, multiplier };
}
```

**Vertical Detection:**
```typescript
function detectVertical(payload): string | null {
  const tags = payload.tags?.join(' ').toLowerCase() || '';
  const source = payload.source?.toLowerCase() || '';

  if (tags.includes('real estate') || source.includes('realtor')) return 'real_estate';
  if (tags.includes('dental') || source.includes('dental')) return 'dental';
  if (tags.includes('legal') || source.includes('law')) return 'legal';
  if (tags.includes('hvac') || source.includes('hvac')) return 'hvac';
  if (tags.includes('roofing') || source.includes('roof')) return 'roofing';

  return null;
}
```

### 4.3 Shopify Route (`serverless/src/routes/shopify.ts`)

**Purpose:** Handle Shopify webhook payloads with HMAC validation.

**POST /webhook Handler - Key Steps:**

```typescript
// 1. Get raw body BEFORE parsing (needed for HMAC)
const rawBody = await c.req.text();
const headers = c.req.raw.headers;

// 2. Validate shop domain header
const shopDomain = c.req.header('X-Shopify-Shop-Domain');
if (!shopDomain) {
  return createSecureErrorResponse(c, 'missing_shop_domain', 400);
}

// 3. Get agency by Shopify domain
const webhookAgency = await findAgencyByShopifyDomain(c.get('db'), shopDomain);

// 4. Validate HMAC signature
const validation = validateShopifyWebhook(
  headersRecord,
  rawBody,
  webhookAgency.config.shopify_webhook_secret
);
if (!validation.valid) {
  return createSecureErrorResponse(c, 'invalid_signature', 401);
}

// 5. Parse JSON AFTER validation
const payload = JSON.parse(rawBody);

// 6. Validate payload integrity
const payloadValidation = validateWebhookPayload(payload, topic);
if (!payloadValidation.valid) {
  return createSecureErrorResponse(c, 'invalid_payload', 400);
}

// 7. Process based on topic
switch (topic) {
  case 'customers/create':
  case 'customers/update':
    leadData = processShopifyCustomer(payload, topic);
    break;
  case 'orders/create':
  case 'orders/paid':
    leadData = processShopifyOrder(payload, topic);
    break;
}

// 8. Store lead and queue conversion
const storedLead = await db.insertLead({ /* ... */ });

// 9. Queue Google Ads conversion if configured
if (agencyConfig?.google_ads_config) {
  await queueConversions(c.env, agency.id, conversions);
}
```

**Security Headers Added to Responses:**
```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

**Rate Limiting:**
```typescript
// IP-based: 100 requests per hour
// Shop-based: 1000 requests per hour
export const webhookRateLimit = async (c: Context, next: Next) => {
  // Apply IP rate limiting first
  await webhookIpRateLimit(c, async () => { ipLimitPassed = true; });
  if (!ipLimitPassed) return;

  // Then apply shop domain rate limiting
  return webhookShopRateLimit(c, next);
};
```

### 4.4 Admin Route (`serverless/src/routes/admin.ts`)

**Purpose:** Admin-only operations with ADMIN_SECRET authentication.

**Authentication Middleware:**
```typescript
adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const adminSecret = c.env.ADMIN_SECRET;

  if (!adminSecret) {
    return c.json({ error: 'Admin endpoint not configured' }, 503);
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  if (token !== adminSecret) {
    return c.json({ error: 'Invalid admin token' }, 403);
  }

  await next();
});
```

**GET /backup - Encrypted Backup Export:**
```typescript
adminRoutes.get('/backup', async (c) => {
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  // Fetch all tables
  const [leads, waitlist, triggers] = await Promise.all([
    db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all(),
    db.prepare('SELECT * FROM waitlist ORDER BY created_at DESC').all(),
    db.prepare('SELECT * FROM optimization_triggers ORDER BY created_at DESC').all(),
  ]);

  const backup = {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    tables: {
      leads: leads.results,
      waitlist: waitlist.results,
      optimization_triggers: triggers.results,
    },
    counts: {
      leads: leads.results.length,
      waitlist: waitlist.results.length,
      optimization_triggers: triggers.results.length,
    },
  };

  // Encrypt if key available
  if (encryptionKey) {
    const encrypted = await encryptBackup(JSON.stringify(backup), encryptionKey);
    return c.json({
      encrypted: true,
      exported_at: backup.exported_at,
      counts: backup.counts,
      data: encrypted.ciphertext,
      iv: encrypted.iv,
    });
  }

  // Return unencrypted if no key
  return c.json({ warning: 'BACKUP_ENCRYPTION_KEY not set', ...backup });
});
```

**Encryption Helpers:**
```typescript
async function encryptBackup(plaintext, keyString) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString.padEnd(32, '0').slice(0, 32)),
    'AES-GCM',
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}
```

### 4.5 Billing Route (`serverless/src/routes/billing.ts`)

**Purpose:** Stripe integration for subscription management.

**Pricing Tiers:**
```typescript
const pricingTiers = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9900,  // $99 in cents
    lead_limit: 1000,
    features: ['Basic conversion tracking', 'Google Ads integration', 'Email support'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 29900,  // $299 in cents
    lead_limit: 10000,
    features: ['Multi-platform integration', 'Priority support', 'Custom analytics'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99900,  // $999 in cents
    lead_limit: -1,  // unlimited
    features: ['Unlimited everything', 'Dedicated success manager', 'Custom integrations'],
  },
};
```

**Stripe Webhook Handler:**
```typescript
billing.post('/webhooks/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  try {
    const event = getStripe(c.env).webhooks.constructEvent(
      body,
      signature!,
      c.env.STRIPE_WEBHOOK_SECRET!
    );

    const db = c.get('db');

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update subscription status
        await db.prepare(`
          UPDATE subscriptions SET
            status = ?,
            current_period_start = ?,
            current_period_end = ?,
            updated_at = datetime('now')
          WHERE stripe_subscription_id = ?
        `).bind(/* ... */).run();
        break;

      case 'customer.subscription.deleted':
        // Mark as canceled
        await db.prepare(`
          UPDATE subscriptions SET status = 'canceled'
          WHERE stripe_subscription_id = ?
        `).bind(event.data.object.id).run();
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;
    }

    return c.json({ success: true, received: true });
  } catch (error) {
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});
```

### 4.6 GDPR Route (`serverless/src/routes/gdpr.ts`)

**Purpose:** GDPR compliance endpoints for data subject rights.

**Data Request (Access):**
```typescript
gdprRoutes.get('/data-request/:email', async (c) => {
  const email = c.req.param('email');
  const db = c.get('db');

  // Find all data associated with email
  const leads = await db.prepare('SELECT * FROM leads WHERE email = ?').bind(email).all();
  const conversionLogs = await db.prepare(`
    SELECT cl.* FROM conversion_logs cl
    JOIN leads l ON cl.agency_id = l.org_id
    WHERE l.email = ?
  `).bind(email).all();

  // Sanitize (remove sensitive fields)
  const sanitizedLeads = leads.results?.map((lead) => ({
    id: lead.id,
    email: lead.email,
    created_at: lead.created_at,
    consent_status: lead.consent_status,
    vertical: lead.vertical,
  }));

  return c.json({
    status: 'success',
    data: {
      leads: sanitizedLeads,
      conversion_logs: conversionLogs.results,
      data_portability: {
        export_url: `/api/v1/gdpr/data-export/${email}`,
        last_updated: new Date().toISOString(),
      },
    },
    gdpr_rights: {
      access: 'fulfilled',
      rectification: `/api/v1/gdpr/data-rectify/${email}`,
      erasure: `/api/v1/gdpr/data-erase/${email}`,
    },
  });
});
```

**Data Erasure (Right to be Forgotten):**
```typescript
gdprRoutes.delete('/data-erase/:email', async (c) => {
  const email = c.req.param('email');
  const db = c.get('db');

  // Find all leads for this email
  const leads = await db.prepare('SELECT id FROM leads WHERE email = ?').bind(email).all();

  if (leads.results && leads.results.length > 0) {
    for (const lead of leads.results) {
      // Delete technology associations
      await db.prepare('DELETE FROM lead_technologies WHERE lead_id = ?').bind(lead.id).run();
      // Delete lead
      await db.prepare('DELETE FROM leads WHERE id = ?').bind(lead.id).run();
    }

    // Anonymize conversion logs (for audit purposes)
    await db.prepare(`
      UPDATE conversion_logs
      SET success_count = 0, failure_count = 0,
          errors = 'Anonymized per GDPR Article 17'
      WHERE agency_id IN (SELECT org_id FROM leads WHERE email = ?)
    `).bind(email).run();
  }

  return c.json({
    status: 'success',
    message: 'Data erasure completed per GDPR Article 17',
    deleted_records: leads.results?.length || 0,
    timestamp: new Date().toISOString(),
  });
});
```

### 4.7 Onboarding Route (`serverless/src/routes/onboarding.ts`)

**Purpose:** Customer registration and agreement acceptance.

**POST /register:**
```typescript
onboardingRoutes.post('/register', async (c) => {
  const body = await c.req.json();

  // Validate email
  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  // Validate agreements
  if (!body.accept_tos || !body.accept_dpa || !body.accept_privacy) {
    return c.json({
      error: 'All agreements must be accepted',
      required: ['accept_tos', 'accept_dpa', 'accept_privacy'],
    }, 400);
  }

  // Check for existing registration
  const existing = await db
    .prepare('SELECT id FROM customers WHERE email = ?')
    .bind(body.email.toLowerCase())
    .first();

  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  // Create customer
  const customerId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO customers (id, email, company_name, website, ghl_location_id, plan, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'free', 'active', ?)
  `).bind(customerId, body.email.toLowerCase(), /* ... */).run();

  // Record agreements with consent hashes
  for (const agreement of agreements) {
    if (agreement.accepted) {
      const textHash = await hashText(AGREEMENT_TEXTS[agreement.type]);
      await db.prepare(`
        INSERT INTO agreements (id, customer_id, agreement_type, agreement_version,
                               accepted_at, ip_address, user_agent, consent_text_hash, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(/* ... */).run();
    }
  }

  return c.json({
    success: true,
    customer_id: customerId,
    message: 'Registration successful. Agreements recorded.',
    next_steps: {
      snippet_url: '/api/v1/onboarding/snippet',
      webhook_url: '/api/v1/ghl/webhook',
      docs_url: '/docs',
    },
  });
});
```

**Agreement Hashing:**
```typescript
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 4.8 Analytics Route (`serverless/src/routes/analytics.ts`)

**Purpose:** Technology detection and analytics.

**GET /analytics/technologies:**
```typescript
analyticsRoutes.get('/analytics/technologies', async (c) => {
  const auth = c.get('auth');
  const db = c.get('db');

  // Technology usage by category
  const techByCategory = await db.prepare(`
    SELECT t.category, t.name, COUNT(lt.lead_id) as lead_count,
           AVG(lt.confidence_score) as avg_confidence,
           CASE
             WHEN t.description LIKE '%FULLY SUPPORTED%' THEN 'supported'
             WHEN t.description LIKE '%PARTIALLY SUPPORTED%' THEN 'partial'
             ELSE 'not_supported'
           END as support_status
    FROM technologies t
    LEFT JOIN lead_technologies lt ON t.id = lt.technology_id
    LEFT JOIN leads l ON lt.lead_id = l.id
    WHERE l.agency_id = ?
    GROUP BY t.category, t.name, t.description
    ORDER BY lead_count DESC
  `).bind(auth.org_id).all();

  return c.json({
    success: true,
    analytics: {
      technology_usage: techByCategory.results || techByCategory,
    },
  });
});
```

**POST /detect-technologies:**
```typescript
analyticsRoutes.post('/detect-technologies', async (c) => {
  const body = await c.req.json();
  const { url, html_content, headers } = body;

  const detected = [];

  // Check for common platforms
  if (headers?.['x-shopify-stage'] || html_content?.includes('cdn.shopify.com')) {
    detected.push({ name: 'Shopify', category: 'ecommerce', confidence: 0.9, detected_via: 'analysis' });
  }

  if (html_content?.includes('gohighlevel.com')) {
    detected.push({ name: 'GoHighLevel', category: 'crm', confidence: 0.8, detected_via: 'analysis' });
  }

  if (html_content?.includes('googletagmanager.com') || html_content?.includes('gtag(')) {
    detected.push({ name: 'Google Tag Manager', category: 'analytics', confidence: 0.95, detected_via: 'analysis' });
  }

  return c.json({ success: true, detected_technologies: detected });
});
```

### 4.9 Status Route (`serverless/src/routes/status.ts`)

**Purpose:** Health checks and system metrics.

**GET /status:**
```typescript
statusRoutes.get('/', async (c) => {
  const db = c.env.DB;
  const dbHealth = await checkDatabaseHealth(db);
  const workerHealth = await checkWorkerHealth();

  const overallStatus =
    dbHealth.status === 'healthy' && workerHealth.status === 'healthy'
      ? 'healthy'
      : dbHealth.status === 'degraded' || workerHealth.status === 'degraded'
        ? 'degraded'
        : 'error';

  return c.json({
    status: overallStatus,
    message: overallStatus === 'healthy' ? 'All systems operational' : 'Some issues detected',
    checks: { database: dbHealth, workers: workerHealth, timestamp: new Date().toISOString() },
    version: '1.0.0',
  });
});

async function checkDatabaseHealth(db) {
  const start = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    const responseTime = Date.now() - start;
    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      message: responseTime > 1000 ? 'Database slow' : 'Database connection stable',
      response_time_ms: responseTime,
    };
  } catch (error) {
    return { status: 'error', message: error.message, response_time_ms: Date.now() - start };
  }
}
```

### 4.10 Waitlist Route (`serverless/src/routes/waitlist.ts`)

**Purpose:** Landing page waitlist signup.

**POST /waitlist:**
```typescript
waitlistRoutes.post('/', async (c) => {
  const body: WaitlistSignup = await c.req.json();

  // Validate email
  if (!body.email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Check for existing signup
  const existing = await db
    .prepare('SELECT id FROM waitlist WHERE email = ?')
    .bind(body.email.toLowerCase())
    .first();

  if (existing) {
    return c.json({ success: true, message: 'Already on waitlist', already_registered: true });
  }

  // Insert new signup
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO waitlist (id, email, agency_name, website, monthly_ad_spend, pain_point, referral_source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.email.toLowerCase(), /* ... */).run();

  return c.json({ success: true, message: 'Welcome to waitlist!', id });
});
```

---

## 5. Services

### 5.1 Google Ads Service (`serverless/src/services/google-ads.ts`)

**Purpose:** Google Ads API integration for offline conversion uploads.

**Key Classes and Functions:**

```typescript
export class GoogleAdsError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'GoogleAdsError';
  }
}

export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

export interface ConversionData {
  gclid?: string;
  conversionActionId: string;
  conversionValue: number;
  currencyCode?: string;
  conversionTime: string;
  orderId?: string;
}
```

**Get Access Token:**
```typescript
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new GoogleAdsError(
      `Failed to get access token: ${response.status} ${response.statusText}`,
      'AUTH_ERROR'
    );
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}
```

**Upload Conversion:**
```typescript
export async function uploadConversion(
  credentials: GoogleAdsCredentials,
  conversionData: ConversionData
): Promise<UploadResult> {
  // 1. Get fresh access token
  const accessToken = await getAccessToken(credentials);

  // 2. Construct click conversion payload
  const clickConversion = {
    conversion_action: conversionData.conversionActionId,
    conversion_date_time: conversionData.conversionTime,
    conversion_value: conversionData.conversionValue,
    currency_code: conversionData.currencyCode || 'USD',
    ...(conversionData.gclid && { gclid: conversionData.gclid }),
    ...(conversionData.orderId && { order_id: conversionData.orderId }),
    consent: {
      ad_user_data: 'GRANTED',
      ad_personalization: 'GRANTED',
    },
  };

  // 3. Make API call
  const response = await fetch(
    `https://googleads.googleapis.com/v21/customers/${credentials.customerId}:uploadClickConversions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': credentials.developerToken,
        'login-customer-id': credentials.loginCustomerId || credentials.customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversions: [clickConversion],
        partial_failure: true,
      }),
    }
  );

  // 4. Handle response
  const responseData = await response.json();

  if (!response.ok) {
    // Parse error and create user-friendly message
    const errorMessage = responseData.error?.message || `HTTP ${response.status}`;
    throw new GoogleAdsError(errorMessage, responseData.error?.code, responseData.error);
  }

  // 5. Handle partial failures
  if (responseData.partial_failure_error) {
    return { success: false, errors: [responseData.partial_failure_error.message] };
  }

  return {
    success: true,
    conversionAction: responseData.results?.[0]?.conversion_action,
    uploadDateTime: responseData.results?.[0]?.upload_date_time,
  };
}
```

**Conversion Time Formatting:**
```typescript
export function formatConversionTime(date: Date, timezoneOffset?: number): string {
  const offset = timezoneOffset !== undefined ? timezoneOffset : date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset <= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}${offsetString}`;
}
```

### 5.2 Meta Conversions Service (`serverless/src/services/meta-conversions.ts`)

**Purpose:** Meta/Facebook Conversions API integration.

**Key Features:**
- SHA-256 hashing of PII (email, phone)
- Event deduplication
- Privacy-compliant data handling

```typescript
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class MetaConversionsAPI {
  constructor(private accessToken: string, private pixelId: string) {}

  async uploadConversions(conversions: MetaConversionData[]): Promise<{
    success: boolean;
    events_received?: number;
    events_processed?: number;
    errors?: Array<{ code: number; message: string }>;
  }> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;

    // Hash user data and prepare payload
    const data = await Promise.all(
      conversions.map(async (conversion) => ({
        event_name: conversion.event_name,
        event_time: conversion.event_time,
        custom_data: { value: conversion.value, currency: conversion.currency || 'EUR' },
        user_data: {
          ...(conversion.user_data?.email && { em: [await hashData(conversion.user_data.email)] }),
          ...(conversion.user_data?.phone && { ph: [await hashData(conversion.user_data.phone)] }),
        },
        ...(conversion.fbclid && { fbclid: conversion.fbclid }),
      }))
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: this.accessToken, data }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, errors: result.error ? [result.error] : [] };
    }

    return { success: true, events_received: result.events_received, events_processed: result.events_processed };
  }
}
```

### 5.3 Encryption Service (`serverless/src/services/encryption.ts`)

**Purpose:** AES-256-GCM encryption for sensitive data.

**EncryptionService Class:**

```typescript
export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private keyCache = new Map<string, EncryptionKey>();
  private readonly config: EncryptionConfig = {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 16,
    tagLength: 128,
  };

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initialize(masterKeySecret: string): Promise<void> {
    const keyData = Uint8Array.from(atob(masterKeySecret), (c) => c.charCodeAt(0));
    this.masterKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    console.log('Encryption service initialized');
  }

  async encrypt(plainText: string, context?: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: this.config.tagLength },
      this.masterKey!,
      encoder.encode(plainText)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, -16);
    const tag = encryptedArray.slice(-16);

    return {
      encrypted: btoa(String.fromCharCode(...ciphertext)),
      iv: btoa(String.fromCharCode(...iv)),
      tag: btoa(String.fromCharCode(...tag)),
      algorithm: this.config.algorithm,
      timestamp: new Date().toISOString(),
    };
  }

  async decrypt(encryptedData: EncryptedData, context?: string): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
    const tag = encryptedData.tag ? Uint8Array.from(atob(encryptedData.tag), (c) => c.charCodeAt(0)) : null;

    const fullEncrypted = new Uint8Array(encrypted.length + (tag?.length || 0));
    fullEncrypted.set(encrypted);
    if (tag) fullEncrypted.set(tag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: this.config.tagLength },
      this.masterKey!,
      fullEncrypted
    );

    return new TextDecoder().decode(decrypted);
  }
}
```

**Hono Middleware:**
```typescript
export const encryptionMiddleware = async (c: Context, next: any) => {
  const encryptionKey = c.env.ENCRYPTION_MASTER_KEY;
  if (!encryptionKey) {
    console.warn('ENCRYPTION_MASTER_KEY not found - encryption disabled');
    return next();
  }

  try {
    await initializeEncryption(encryptionKey);
  } catch (error) {
    console.error('Encryption middleware initialization failed:', error);
  }

  return next();
};
```

### 5.4 Logging Service (`serverless/src/services/logging.ts`)

**Purpose:** Structured logging with security event handling.

```typescript
export class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  log(level: LogEntry['level'], message: string, context?: Record<string, any>, c?: Context): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      requestId: this.extractRequestId(c),
      ip: this.extractIp(c),
      userAgent: c?.req.header('User-Agent'),
    };
    this.writeLog(entry);
  }

  security(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = { ...event, timestamp: new Date().toISOString() };
    console.warn(`[SECURITY-${event.severity}] ${event.eventType}: ${event.message}`, securityEvent.details);
  }

  logWebhookSignatureFailure(c: Context, shopDomain: string, error: string): void {
    this.security({
      level: 'WARN',
      message: `Webhook signature validation failed for shop: ${shopDomain}`,
      eventType: 'webhook_signature_failure',
      severity: 'HIGH',
      source: 'webhook',
      details: { error, shopDomain, ipAddress: this.extractIp(c), requestId: this.extractRequestId(c) },
    });
  }

  logRateLimitExceeded(c: Context, key: string, limit: number, windowMs: number): void {
    this.security({
      level: 'WARN',
      message: `Rate limit exceeded for key: ${key}`,
      eventType: 'rate_limit_exceeded',
      severity: 'MEDIUM',
      source: 'webhook',
      details: { limit, windowMs, ipAddress: this.extractIp(c), shopDomain: c.req.header('X-Shopify-Shop-Domain') },
    });
  }

  private extractRequestId(c?: Context): string {
    return c?.req.header('X-Request-ID') || c?.req.header('CF-RAY') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractIp(c?: Context): string {
    return c?.req.header('CF-Connecting-IP') || c?.req.header('X-Forwarded-For')?.split(',')[0] || 'unknown';
  }

  private redactSensitiveHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    const redacted: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'x-shopify-hmac-sha256', 'x-shopify-access-token', 'stripe-signature', 'cookie'];
    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (value) {
        redacted[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    }
    return redacted;
  }
}
```

### 5.5 Crypto Service (`serverless/src/services/crypto.ts`)

**Purpose:** HMAC signature validation for webhooks.

```typescript
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';

export function validateHmacSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = hmac(sha256, secret, payload);
    const expectedHex = Buffer.from(expectedSignature).toString('hex');
    const expectedFullSignature = `sha256=${expectedHex}`;
    return timingSafeEqual(signature, expectedFullSignature);
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function validateShopifyWebhook(
  headers: Record<string, string | undefined>,
  body: string,
  secret: string
): { valid: boolean; error?: string } {
  const signature = headers['x-shopify-hmac-sha256'];
  if (!signature) return { valid: false, error: 'Missing HMAC signature header' };
  if (!secret) return { valid: false, error: 'Webhook secret not configured' };

  const isValid = validateHmacSignature(body, signature, secret);
  if (!isValid) return { valid: false, error: 'Invalid HMAC signature' };

  return { valid: true };
}
```

### 5.6 API Monitor (`serverless/src/services/api-monitor.ts`)

**Purpose:** Monitor API health and deprecation status.

```typescript
export class ApiMonitor {
  private statusCache: Map<string, ApiHealthStatus> = new Map();

  async checkGoogleAdsHealth(): Promise<ApiHealthStatus> {
    const status: ApiHealthStatus = { service: 'Google Ads API', status: 'healthy', version: '', lastChecked: new Date().toISOString(), issues: [], recommendations: [] };

    try {
      const versionCheck = await this.checkGoogleAdsVersion();
      status.version = versionCheck.version;

      if (versionCheck.deprecated) {
        status.status = 'deprecated';
        status.issues.push(`Google Ads API v${versionCheck.version} is deprecated`);
      }

      const connectivityTest = await this.testGoogleAdsConnectivity();
      if (!connectivityTest.success) {
        status.status = 'degraded';
        status.issues.push(connectivityTest.error);
      }

      const quotaCheck = await this.checkGoogleAdsQuota();
      if (quotaCheck.usage > 80) {
        status.status = 'degraded';
        status.issues.push(`High quota usage: ${quotaCheck.usage}%`);
      }
    } catch (error) {
      status.status = 'offline';
      status.issues.push(`Connection failed: ${error.message}`);
    }

    this.statusCache.set('google-ads', status);
    return status;
  }

  private async checkGoogleAdsVersion(): Promise<{ version: string; deprecated: boolean; deprecationDate?: string }> {
    // Fetches release notes and checks deprecation status
    // Returns version info for Google Ads API
    return { version: 'v21.0', deprecated: false };
  }
}
```

---

## 6. Middleware

### 6.1 Auth Middleware (`serverless/src/middleware/auth.ts`)

**Purpose:** JWT token validation for protected routes.

```typescript
export interface JWTPayload {
  sub: string;      // user_id
  iss: string;      // issuer
  aud: string;      // audience
  exp: number;      // expiration timestamp
  tenant_id?: string;
  org_id?: string;
  role?: string;
}

export interface AuthContext {
  user_id: string;
  org_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

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

export const authMiddleware = (options: { requireAuth?: boolean } = { requireAuth: true }) => {
  return async (c: Context, next: Next) => {
    if (options.requireAuth === false) return next();

    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = decodeJWT(token);

    if (!payload) {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return c.json({ error: 'Token expired' }, 401);
    }

    c.set('auth', {
      user_id: payload.sub,
      org_id: payload.org_id || payload.tenant_id || payload.sub,
      tenant_id: payload.tenant_id || payload.sub,
      role: (payload.role || 'member') as AuthContext['role'],
    });

    return next();
  };
};
```

### 6.2 Rate Limit Middleware (`serverless/src/middleware/rate-limit.ts`)

**Purpose:** Request rate limiting using Cloudflare Workers KV.

```typescript
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const key = config.keyGenerator(c);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const kv = c.env.RATE_LIMIT_KV;
    if (!kv) {
      console.warn('RATE_LIMIT_KV not bound, skipping rate limiting');
      return next();
    }

    const rateLimitKey = `rate_limit:${key}`;
    const existingData = await kv.get(rateLimitKey);

    let requests: number[] = [];
    if (existingData) {
      try { requests = JSON.parse(existingData); } catch (e) { console.error('Parse error'); }
    }

    requests = requests.filter((timestamp) => timestamp > windowStart);

    const result = {
      allowed: requests.length < config.maxRequests,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - requests.length),
      resetTime: Math.ceil((windowStart + config.windowMs) / 1000),
    };

    if (!result.allowed) {
      const oldestRequest = Math.min(...requests);
      result.retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
    }

    if (result.allowed) {
      requests.push(now);
      await kv.put(rateLimitKey, JSON.stringify(requests), {
        expirationTtl: Math.ceil(config.windowMs / 1000) + 60,
      });
    }

    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', result.resetTime.toString());

    if (!result.allowed) {
      return c.json({ error: 'rate_limit_exceeded', retry_after: result.retryAfter }, 429);
    }

    return next();
  };
};
```

---

## 7. Database

**File:** `serverless/src/database/index.ts` (395 lines)

**Purpose:** D1 query functions for all database operations.

### Key Functions

```typescript
export function createDb(d1: D1Database) {
  return {
    // Lead operations
    async insertLead(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1.prepare(`
        INSERT INTO leads (id, org_id, site_id, gclid, fbclid, external_id, email, phone, landing_page,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          lead_score, base_value_cents, adjusted_value_cents, value_multiplier, status, vertical, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, data.org_id, data.site_id, /* ... */).run();
      return { id };
    },

    async getLeadsByOrg(orgId: string, options: { status?: string; vertical?: string; limit?: number; offset?: number } = {}): Promise<any[]> {
      let query = 'SELECT * FROM leads WHERE org_id = ?';
      const params: any[] = [orgId];
      if (options.status) { query += ' AND status = ?'; params.push(options.status); }
      if (options.vertical) { query += ' AND vertical = ?'; params.push(options.vertical); }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(options.limit || 50, options.offset || 0);
      const result = await d1.prepare(query).bind(...params).all();
      return result.results || [];
    },

    async getLeadById(id: string, orgId: string): Promise<any | null> {
      const result = await d1.prepare('SELECT * FROM leads WHERE id = ? AND org_id = ?').bind(id, orgId).first();
      return result || null;
    },

    async updateLead(id: string, orgId: string, data: Record<string, any>): Promise<boolean> {
      const fields: string[] = [];
      const values: any[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'id' && key !== 'org_id') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (fields.length === 0) return false;
      values.push(id, orgId);
      const result = await d1.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND org_id = ?`).bind(...values).run();
      return result.meta.changes > 0;
    },

    // Agency operations
    async insertAgency(data: Record<string, any>): Promise<{ id: string }> {
      const id = crypto.randomUUID();
      await d1.prepare(`
        INSERT INTO agencies (id, name, customer_id, google_ads_config, conversion_action_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, data.name, data.customer_id, data.google_ads_config, /* ... */).run();
      return { id };
    },

    // Credential encryption
    async updateAgencyCredentials(agencyId: string, credentials: {
      googleAds?: any;
      meta?: any;
      stripe?: any;
    }): Promise<boolean> {
      const encryptedCredentials: Record<string, string> = {};
      for (const [platform, creds] of Object.entries(credentials)) {
        if (creds) {
          encryptedCredentials[platform] = JSON.stringify(
            await encryptCredential(JSON.stringify(creds), `agency-${agencyId}-${platform}`)
          );
        }
      }
      await d1.prepare(`
        UPDATE agencies SET google_ads_config = ?, meta_config = ?, stripe_config = ?, updated_at = ? WHERE id = ?
      `).bind(encryptedCredentials.googleAds || null, encryptedCredentials.meta || null, encryptedCredentials.stripe || null, new Date().toISOString(), agencyId).run();
      return true;
    },

    async getAgencyCredentials(agencyId: string): Promise<{
      googleAds?: any;
      meta?: any;
      stripe?: any;
    } | null> {
      const result = await d1.prepare('SELECT google_ads_config, meta_config, stripe_config FROM agencies WHERE id = ?').bind(agencyId).first();
      if (!result) return null;
      // Decrypt each credential type...
      return credentials;
    },
  };
}
```

---

## 8. Workers

### 8.1 Queue Consumer (`serverless/src/workers/queue-consumer.ts`)

**Purpose:** Handle Cloudflare Queue messages (currently disabled).

```typescript
// Queue consumer disabled - requires paid Cloudflare plan
export default {
  async queue(batch: any, env: any) {
    // Queues require paid plan - not available on free tier
    console.log('Queue processing disabled - requires paid Cloudflare plan');
  },
};
```

**Note:** This file is currently a placeholder. Queue processing is stubbed and uses synchronous processing instead.

---

## 9. Tracking Snippet

**File:** `serverless/src/snippet.ts` (148 lines)

**Purpose:** Client-side JavaScript for click ID capture.

### Minified Version

```typescript
export const gclidSnippet = `
<script>
(function(){
  var w=window,d=document,s='ads_tracking',e=encodeURIComponent;
  
  function gc(n){var m=d.cookie.match('(^|;)\\s*'+n+'=([^;]*)');return m?decodeURIComponent(m[2]):null}
  function sc(n,v,days){var ex=new Date();ex.setTime(ex.getTime()+(days*864e5));d.cookie=n+'='+e(v)+';expires='+ex.toUTCString()+';path=/;SameSite=Lax'}
  function gp(n){var u=new URL(w.location.href);return u.searchParams.get(n)}
  
  var gclid=gp('gclid')||gc('_gclid');
  var fbclid=gp('fbclid')||gc('_fbclid');
  var msclkid=gp('msclkid')||gc('_msclkid');
  var utm={s:gp('utm_source')||gc('_utm_source'),m:gp('utm_medium')||gc('_utm_medium'),c:gp('utm_campaign')||gc('_utm_campaign'),t:gp('utm_term')||gc('_utm_term'),n:gp('utm_content')||gc('_utm_content')};
  
  if(gclid)sc('_gclid',gclid,90);
  if(fbclid)sc('_fbclid',fbclid,90);
  if(msclkid)sc('_msclkid',msclkid,90);
  if(utm.s)sc('_utm_source',utm.s,90);
  if(utm.m)sc('_utm_medium',utm.m,90);
  if(utm.c)sc('_utm_campaign',utm.c,90);
  if(utm.t)sc('_utm_term',utm.t,90);
  if(utm.n)sc('_utm_content',utm.n,90);
  
  w[s]={gclid:gclid||gc('_gclid'),fbclid:fbclid||gc('_fbclid'),msclkid:msclkid||gc('_msclkid'),utm_source:utm.s||gc('_utm_source'),utm_medium:utm.m||gc('_utm_medium'),utm_campaign:utm.c||gc('_utm_campaign'),utm_term:utm.t||gc('_utm_term'),utm_content:utm.n||gc('_utm_content')};
  
  function injectHiddenFields(){
    var forms=d.querySelectorAll('form');
    forms.forEach(function(f){
      if(f.dataset.adsInjected)return;
      f.dataset.adsInjected='1';
      var t=w[s];
      for(var k in t){if(t[k]){var i=d.createElement('input');i.type='hidden';i.name=k;i.value=t[k];f.appendChild(i);}}
    });
  }
  
  if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',injectHiddenFields)}else{injectHiddenFields()}
  
  var mo=new MutationObserver(function(m){m.forEach(function(r){if(r.addedNodes.length)injectHiddenFields()})});
  mo.observe(d.body||d.documentElement,{childList:true,subtree:true});
})();
</script>
`;
```

### Key Features

| Feature | Implementation |
|---------|----------------|
| Click ID Capture | Reads from URL params (`?gclid=`) or cookies |
| Cookie Persistence | 90-day expiry, SameSite=Lax |
| UTM Parameters | source, medium, campaign, term, content |
| Form Injection | Auto-adds hidden fields to all forms |
| SPA Support | MutationObserver watches for dynamic forms |
| SendBeacon | Reliable delivery (commented in code) |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Files Analyzed | 20+ |
| Total Lines of Code | ~4,000+ |
| Route Handlers | 10 |
| Service Classes | 6 |
| Middleware | 2 |
| Database Tables | 10+ |
| API Endpoints | 30+ |

---

**Last Updated:** 2024-01-15
