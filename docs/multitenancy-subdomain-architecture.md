# Multitenancy & Subdomain Architecture

## Overview

AdsEngineer supports multitenancy through subdomain-based routing. Each tenant (customer or agency) gets an isolated subdomain with optional white-label configuration.

---

## Domain Structure

### Root Domains

| Domain | Purpose | Use Case |
|---------|-----------|-----------|
| **`adsengineer.cloud`** | Main product domain | Public facing, documentation, pricing |
| **`app.adsengineer.cloud`** | Direct customer login | Self-service customers |
| **`*.adsengineer.cloud`** | Agency subdomains | White-label agency portals |
| **`partner.adsengineer.cloud`** | Enterprise partners | Dedicated infrastructure |

### Subdomain Pattern

```
┌────────────────────────────────────────────────────┐
│                                             │
│  adsengineer.cloud (Root)                 │
│         │                                    │
│         ├── app.adsengineer.cloud              │ [Direct customers]
│         ├── api.adsengineer.cloud              │ [API endpoints]
│         ├── docs.adsengineer.cloud             │ [Documentation]
│         │                                    │
│         ├── agency-1.adsengineer.cloud        │
│         ├── agency-2.adsengineer.cloud        │ [Agency portals]
│         ├── agency-name-1.adsengineer.cloud  │ [Custom subdomains]
│         ├── ...                                │
│         └── partner.adsengineer.cloud       │ [Enterprise]
│                                             │
└─────────────────────────────────────────────────────┘
```

---

## Tenant Database Schema

### Tenants Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  account_type ENUM('direct', 'agency') NOT NULL DEFAULT 'direct',
  billing_plan ENUM('standard', 'premium', 'agency') NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Brand Configuration (for agencies)
  brand_config JSONB, -- { logo_url, primary_color, custom_css, hide_adsengineer_branding }
  custom_domain VARCHAR(255), -- e.g., "agency.com"

  -- Agency-Specific
  agency_parent_id UUID REFERENCES tenants(id), -- For sub-accounts
  reseller_margin_percent DECIMAL(5,2), -- Revenue share model

  -- Constraints
  CHECK (
    (account_type = 'agency' AND reseller_margin_percent IS NOT NULL) OR
    (account_type = 'direct')
  )
);

-- Indexes
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_account_type ON tenants(account_type);
CREATE INDEX idx_tenants_parent ON tenants(agency_parent_id);
```

---

## Tenant Isolation

### Database Isolation Strategy

```typescript
// Middleware: tenant-isolation.ts
export async function tenantMiddleware(req: Request, res: Response, next: Next) {
  // Extract subdomain from hostname
  const hostname = req.headers.get('host');
  const subdomain = hostname.split('.')[0];

  // Look up tenant
  const tenant = await db.tenants.findBySubdomain(subdomain);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Inject tenant into context
  req.tenant = {
    id: tenant.id,
    subdomain: tenant.subdomain,
    account_type: tenant.account_type,
    billing_plan: tenant.billing_plan,
    brand_config: tenant.brand_config
  };

  // Row-level security
  res.setHeader('X-Tenant-ID', tenant.id);

  return next();
}

// Database queries automatically filter by tenant_id
db.tenants.findById(req.tenant.id);
db.sites.where({ tenant_id: req.tenant.id });
```

### Application-Level Isolation

```typescript
// Each query MUST include tenant_id
const sites = await db.sites.findMany({
  where: {
    tenant_id: req.tenant.id, // REQUIRED in all queries
    deleted_at: null
  }
});
```

---

## Subdomain Routing

### DNS Configuration

```bash
# Cloudflare DNS setup
*.adsengineer.cloud   A   192.0.2.123    (Workers load balancer)
*.adsengineer.cloud   CNAME app.adsengineer.cloud

# Wildcard for agencies
agency-name-1.adsengineer.cloud   CNAME agency-1.absorbed-by-adsengineer.cloud
agency-name-2.adsengineer.cloud   CNAME agency-2.absorbed-by-adsengineer.cloud
```

### Workers Routing Logic

```typescript
// Cloudflare Worker: subdomain-router.ts
export default {
  async fetch(request, env) {
    const hostname = new URL(request.url).hostname;
    const subdomain = hostname.split('.')[0];

    // Route to correct origin
    let origin: string;

    switch (subdomain) {
      case 'app':
      case 'api':
        origin = 'https://app.adsengineer.cloud';
        break;

      default:
        // Agency subdomain
        origin = `https://${subdomain}.absorbed-by-adsengineer.cloud`;
    }

    // Proxy request with tenant context
    const modifiedRequest = new Request(origin + request.url, {
      method: request.method,
      headers: {
        ...request.headers,
        'X-Tenant-ID': await getTenantId(subdomain),
        'X-Tenant-Subdomain': subdomain
      },
      body: request.body
    });

    return fetch(modifiedRequest);
  }
}
```

---

## White-Label Configuration

### Tenant Brand Config

```typescript
interface TenantBrandConfig {
  logo_url?: string;           // Custom agency logo
  primary_color?: string;       // Brand color (hex)
  secondary_color?: string;     // Accent color
  custom_css?: string;          // Full CSS override
  custom_domain?: string;        // e.g., "marketing.xyz"
  hide_adsengineer_branding: boolean; // Remove all AdsEngineer references
  support_email?: string;       // Support email for clients
  billing_contact?: string;      // Who to contact for billing
  favicon_url?: string;          // Custom favicon
}

// Example: Agency white-label config
const agencyBrandConfig: TenantBrandConfig = {
  logo_url: 'https://agency-name.com/logo.png',
  primary_color: '#1a5fb4',
  secondary_color: '#7c3aed',
  custom_css: `
    .navbar { background-color: #1a5fb4 !important; }
    .buttons { background-color: #7c3aed !important; }
  `,
  custom_domain: 'agency-marketing.com',
  hide_adsengineer_branding: true,
  support_email: 'support@agency-name.com',
  billing_contact: 'billing@agency-name.com'
};
```

### Dynamic Brand Injection

```typescript
// Middleware: brand-injection.ts
export async function brandInjectionMiddleware(req: Request, res: Response, next: Next) {
  const tenant = req.tenant;
  const brandConfig = tenant.brand_config || {};

  // Inject brand config into HTML response
  if (req.headers.get('accept')?.includes('text/html')) {
    const originalSend = res.send;

    res.send = (content: string) => {
      const brandedContent = injectBrandConfig(content, brandConfig);
      return originalSend.call(res, brandedContent);
    };
  }

  return next();
}

function injectBrandConfig(html: string, config: TenantBrandConfig): string {
  let branded = html;

  if (config.logo_url) {
    branded = branded.replace('{{DEFAULT_LOGO}}', config.logo_url);
  }

  if (config.primary_color) {
    branded = branded.replace('{{PRIMARY_COLOR}}', config.primary_color);
  }

  if (config.custom_css) {
    branded = branded.replace('</head>', `<style>${config.custom_css}</style></head>`);
  }

  if (config.hide_adsengineer_branding) {
    branded = branded.replace(/AdsEngineer/g, 'Agency Platform');
  }

  return branded;
}
```

---

## Agency Sub-Accounts

### Tenant Hierarchy

```sql
CREATE TABLE tenant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255),
  account_type ENUM('direct', 'agency', 'agency_sub') NOT NULL,
  billing_plan ENUM('standard', 'premium', 'agency'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(parent_tenant_id, name)
);

-- Relationships
-- parent_tenant_id: The agency account
-- tenant_accounts: Client sub-accounts under the agency
```

### Sub-Account Isolation

```typescript
// Each sub-account is also a tenant with parent relationship
interface TenantAccount {
  id: string;                    // This is also a tenant_id
  parent_tenant_id: string;      // Agency account
  name: string;
  subdomain: string;             // e.g., "client-name-1"
  account_type: 'agency_sub';     // Always agency_sub
  brand_config: TenantBrandConfig; // Inherits from parent unless overridden
}
```

---

## Authentication in Multitenancy

### Tenant-Aware Auth

```typescript
// Serverless/src/auth/multitenancy.ts
export class MultitenantAuth {
  async authenticate(credentials: LoginCredentials, req: Request): Promise<Session> {
    // 1. Extract tenant from subdomain
    const subdomain = this.extractSubdomain(req.headers.get('host'));

    // 2. Validate credentials against tenant's database
    const tenant = await db.tenants.findBySubdomain(subdomain);
    const user = await db.users.findByEmailInTenant(credentials.email, tenant.id);

    if (!user || user.tenant_id !== tenant.id) {
      throw new AuthenticationError('Invalid credentials');
    }

    // 3. Check account type permissions
    this.validateAccountTypeAccess(user, tenant);

    // 4. Create session with tenant context
    const session = await sessionManager.createSession(user, req);

    return {
      session,
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        account_type: tenant.account_type,
        brand_config: tenant.brand_config
      }
    };
  }

  private validateAccountTypeAccess(user: User, tenant: Tenant): void {
    // Agency users can't log into direct accounts
    if (user.tenant_id !== tenant.id) {
      throw new ForbiddenError('User does not belong to this account');
    }

    // Direct account users can't log into agency sub-accounts
    if (tenant.account_type === 'agency' && user.account_type !== 'agency_admin') {
      throw new ForbiddenError('Agency sub-accounts only accessible to agency users');
    }
  }
}
```

---

## Billing in Multitenancy

### Billing Models

| Model | Tenant Type | Who Pays AdsEngineer | Flow |
|--------|-------------|---------------------|------|
| **Direct** | Single tenant | Customer pays directly | Invoice to customer |
| **Agency Reseller** | Agency tenant | Agency pays for all | Agency bills customers |
| **Agency Direct** | Sub-accounts | Customer pays directly | Invoice to customer, agency collects from customers |

### Database Schema for Billing

```sql
CREATE TABLE billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'paid', 'overdue', 'cancelled'),
  due_date DATE NOT NULL,
  paid_date DATE,
  billing_model ENUM('direct', 'reseller', 'agency_direct'),
  parent_invoice_id UUID REFERENCES billing_invoices(id), -- If agency paid reseller invoice
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Each tenant sees only their own invoices
-- Resellers see ALL sub-tenant invoices they're responsible for
```

---

## Storage & Quotas

### Per-Tenant Storage Limits

| Billing Plan | Storage | API Calls | Websites | Rate Limit |
|--------------|---------|-----------|----------|------------|
| **Standard** | 1 GB | 10K/month | 1 | 100 req/min |
| **Premium** | 10 GB | 100K/month | 5 | 500 req/min |
| **Agency** | 100 GB | Unlimited | 25 | 1000 req/min |

### Storage Implementation

```typescript
// D1 (Cloudflare D1) with tenant isolation
const query = `SELECT * FROM sites WHERE tenant_id = ? AND deleted_at IS NULL`;

const sites = await db.prepare(query).bind(tenantId).all();

// Count against quota
const currentStorage = await this.calculateStorageUsage(tenantId);
if (currentStorage > tenant.storageLimit) {
  throw new QuotaExceededError(`Storage limit exceeded. Upgrade to ${tenant.nextPlan}`);
}
```

---

## Rate Limiting by Tenant

```typescript
// Rate limiting that respects tenant plans
export class TenantRateLimiter {
  async checkRateLimit(tenantId: string): Promise<boolean> {
    const tenant = await db.tenants.findById(tenantId);
    const key = `rate_limit:${tenantId}`;

    const current = await redis.get(key);
    const limit = tenant.rateLimit;

    if (!current || parseInt(current) < limit) {
      await redis.set(key, parseInt(current) + 1, 'EX', 60);
      return true;
    }

    return false;
  }
}
```

---

## Security in Multitenancy

### Row-Level Security

```sql
-- All tables MUST have tenant_id
CREATE TABLE sites (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255),
  -- Row-level security policy
);

-- Cloudflare D1 RLS automatically filters by tenant_id
```

### Tenant-Specific Secrets

```typescript
// Each tenant has isolated secrets
interface TenantSecrets {
  google_ads_client_id: string;
  google_ads_client_secret: string;
  google_ads_developer_token: string;
  google_ads_customer_id: string;
  ghl_api_key: string;
  shopify_storefront_api_token: string;
  encryption_key: string; // Tenant-specific encryption
}

// Secrets are encrypted with tenant-specific key
function encryptTenantSecrets(secrets: TenantSecrets, tenantKey: string): string {
  return JSON.stringify(secrets); // Simplified for example
}
```

---

## Data Migration Between Tenants

### Sub-Account Creation

```typescript
// When agency creates a client sub-account
export class SubAccountManager {
  async createSubAccount(agencyTenantId: string, config: CreateSubAccountConfig): Promise<TenantAccount> {
    const subAccount = {
      parent_tenant_id: agencyTenantId,
      name: config.name,
      subdomain: config.subdomain,
      account_type: 'agency_sub',
      billing_plan: 'standard', // Inherit or override
      brand_config: agencyTenant.brand_config, // Inherit from parent
      created_at: new Date().toISOString()
    };

    const newTenant = await db.tenants.create(subAccount);

    // Provision tenant infrastructure
    await this.provisionTenantInfrastructure(newTenant);

    return newTenant;
  }
}
```

---

## Tenant Onboarding Flow

```
[Agency Signs Up]
       │
       ▼
[Choose Subdomain]
agency-name-1.adsengineer.cloud
       │
       ▼
[Configure Branding]
Logo, colors, CSS
       │
       ▼
[Tenant Provisioned]
Database, storage, API access
       │
       ▼
[Add First Client Sub-Account]
       │
       ▼
[Agency Ready]
Dashboard, billing, sub-account management
```

---

## Monitoring & Analytics

### Per-Tenant Metrics

```typescript
interface TenantMetrics {
  tenant_id: string;
  period: 'daily' | 'weekly' | 'monthly';

  // Usage
  api_calls_count: number;
  storage_used_gb: number;
  website_count: number;
  conversion_count: number;

  // Billing
  revenue: number;
  invoice_amount: number;

  // Performance
  avg_response_time_ms: number;
  error_rate: number;
  uptime_percentage: number;
}

// Aggregate metrics per tenant for billing and analytics
SELECT
  tenant_id,
  COUNT(*) as api_calls_count,
  SUM(storage_used) / 1024 / 1024 / 1024 as storage_used_gb,
  COUNT(*) as website_count,
  AVG(response_time_ms) as avg_response_time_ms
FROM usage_logs
WHERE tenant_id = ?
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id;
```

---

## Tenant Deactivation

```typescript
// When tenant is cancelled or becomes inactive
export async function deactivateTenant(tenantId: string, reason: string): Promise<void> {
  // 1. Mark tenant as inactive
  await db.tenants.update(tenantId, {
    status: 'inactive',
    deactivated_at: new Date().toISOString(),
    deactivation_reason: reason
  });

  // 2. Revoke all active sessions
  await db.sessions.revokeByTenant(tenantId);

  // 3. Schedule data archival (90 days later)
  await scheduleDataArchive(tenantId, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

  // 4. Delete DNS record
  await cloudflareDNS.deleteRecord(`${subdomain}.adsengineer.cloud`);

  // 5. Send final invoice
  await billingService.generateFinalInvoice(tenantId);
}
```

---

## Implementation Priorities

### Phase 1: Foundation
- [ ] Tenant database schema with tenant isolation
- [ ] Subdomain routing logic in Workers
- [ ] Tenant middleware for all requests
- [ ] Brand config storage and injection

### Phase 2: White-Label
- [ ] Dynamic CSS injection
- [ ] Logo upload and serving
- [ ] Custom domain support
- [ ] Hide AdsEngineer branding option

### Phase 3: Agency Features
- [ ] Sub-account management (create, delete, suspend)
- [ ] Agency billing (reseller + direct models)
- [ ] Impersonation with audit trail
- [ ] Parent-child tenant hierarchy

### Phase 4: Billing & Quotas
- [ ] Per-tenant storage quotas
- [ ] Rate limiting by plan
- [ ] Usage tracking and metrics
- [ ] Invoice generation

### Phase 5: Monitoring
- [ ] Per-tenant analytics dashboard
- [ ] Security monitoring (cross-tenant leakage detection)
- [ ] Performance monitoring
- [ ] Automated alerts

---

## FAQ

**Q: Can I use my own domain?**
A: Yes! Agencies and Enterprise customers can configure a custom domain (e.g., `agency-marketing.com`) that points to our platform.

**Q: Are tenants completely isolated?**
A: Yes. Database queries are filtered by tenant_id, storage is quota-per-tenant, and sessions are scoped to tenant.

**Q: Can I change my subdomain?**
A: Direct customers use `app.adsengineer.cloud` (fixed). Agencies can choose any available subdomain on signup, but changes require DNS reconfiguration.

**Q: What happens if an agency account is cancelled?**
A: All sub-accounts become inaccessible after 90 days. Data is archived and can be restored for 30 days. Invoices for current billing cycle are still due.

**Q: Can I have multiple agency subdomains?**
A: Yes! Each subdomain represents one agency account. We offer volume discounts for 10+ subdomains.

**Q: Is there a way to test white-label config?**
A: Yes. Agencies can use a preview mode to see how their branding looks before going live.
