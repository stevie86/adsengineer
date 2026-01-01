# AdVocate Cloud - SaaS Platform Specification

## Purpose

AdVocate Cloud is the **brain** of the system. It:
- Receives data from all connected WordPress sites
- Connects to Google Ads, Meta, and analytics platforms
- Runs optimization algorithms and AI planning
- Executes budget/bid changes via APIs
- Provides the multi-client dashboard
- Handles billing and access control

## Tech Stack

| Layer | Technology | Reasoning |
|-------|------------|-----------|
| **Runtime** | Node.js 20+ / Bun | Fast, async-native, good API ecosystem |
| **Framework** | Hono | Lightweight, fast, middleware-friendly |
| **Database** | PostgreSQL 15+ | Relational integrity, JSON support, mature |
| **Cache/Queue** | Redis + BullMQ | Fast cache, reliable job queues |
| **Auth** | JWT + API Keys | Stateless, scalable |
| **AI/LLM** | Google Gemini / OpenAI | Strategy generation, recommendations |
| **Hosting** | Railway / Render | Start cheap, easy scaling |

## Project Structure

```
advocate-cloud/
├── src/
│   ├── index.ts                    # Entry point
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── routes/
│   │   ├── sites.ts                # Site registration & management
│   │   ├── leads.ts                # Lead ingestion
│   │   ├── events.ts               # Event ingestion
│   │   ├── status.ts               # Status & health endpoints
│   │   ├── campaigns.ts            # Campaign management
│   │   ├── optimization.ts         # Optimization actions
│   │   ├── reports.ts              # Reporting endpoints
│   │   └── webhooks.ts             # External webhooks
│   ├── services/
│   │   ├── google-ads/
│   │   │   ├── client.ts           # Google Ads API client
│   │   │   ├── conversions.ts      # Conversion upload
│   │   │   ├── campaigns.ts        # Campaign operations
│   │   │   └── reporting.ts        # Pull performance data
│   │   ├── meta/
│   │   │   ├── client.ts           # Meta Marketing API client
│   │   │   ├── capi.ts             # Conversions API
│   │   │   └── campaigns.ts        # Campaign operations
│   │   ├── analytics/
│   │   │   └── ga4.ts              # GA4 Data API
│   │   ├── ai/
│   │   │   ├── planner.ts          # Campaign planning AI
│   │   │   ├── optimizer.ts        # Optimization recommendations
│   │   │   └── insights.ts         # Performance insights
│   │   └── scoring/
│   │       ├── lead-scorer.ts      # Lead scoring algorithm
│   │       └── value-adjuster.ts   # Value multiplier logic
│   ├── workers/
│   │   ├── sync-conversions.ts     # Upload conversions to ad platforms
│   │   ├── pull-performance.ts     # Pull campaign performance
│   │   ├── run-optimization.ts     # Execute optimization rules
│   │   ├── generate-reports.ts     # Build scheduled reports
│   │   └── send-alerts.ts          # Send alert notifications
│   ├── models/
│   │   ├── site.ts
│   │   ├── lead.ts
│   │   ├── campaign.ts
│   │   ├── optimization-action.ts
│   │   └── user.ts
│   ├── middleware/
│   │   ├── auth.ts                 # JWT validation
│   │   ├── rate-limit.ts           # Request rate limiting
│   │   └── tenant.ts               # Multi-tenant context
│   └── utils/
│       ├── encryption.ts
│       ├── hashing.ts
│       └── logger.ts
├── prisma/
│   └── schema.prisma               # Database schema
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Organizations (top-level accounts)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    plan ENUM('starter', 'growth', 'agency', 'enterprise') DEFAULT 'starter',
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    subscription_status ENUM('active', 'past_due', 'canceled', 'trialing'),
    
    -- Limits
    max_sites INT DEFAULT 5,
    max_ad_spend_cents BIGINT DEFAULT 100000000,  -- $1M default
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    
    role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
    
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (WordPress installations)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    
    vertical ENUM('dental', 'legal', 'hvac', 'plumbing', 'roofing', 
                  'realestate', 'fitness', 'restaurant', 'other') DEFAULT 'other',
    
    -- Connection
    api_token_hash VARCHAR(64) NOT NULL,
    connected_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    
    -- Settings
    default_lead_value_cents INT DEFAULT 10000,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Health
    data_integrity_score SMALLINT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, domain)
);

-- Ad Platform Connections
CREATE TABLE ad_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    platform ENUM('google_ads', 'meta', 'microsoft', 'linkedin') NOT NULL,
    
    -- Credentials (encrypted)
    credentials_encrypted TEXT NOT NULL,
    
    -- Account Info
    account_id VARCHAR(255),
    account_name VARCHAR(255),
    
    -- Status
    status ENUM('active', 'expired', 'error') DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, platform, account_id)
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    
    -- External ID from WordPress
    external_id VARCHAR(100),
    
    -- Attribution
    gclid VARCHAR(255),
    fbclid VARCHAR(255),
    msclkid VARCHAR(255),
    
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(255),
    
    -- Scoring
    lead_score SMALLINT DEFAULT 50,
    base_value_cents INT DEFAULT 0,
    adjusted_value_cents INT DEFAULT 0,
    value_multiplier DECIMAL(4,2) DEFAULT 1.00,
    
    -- Status
    status VARCHAR(50) DEFAULT 'new',
    
    -- Sync Status
    google_ads_synced BOOLEAN DEFAULT FALSE,
    google_ads_synced_at TIMESTAMPTZ,
    meta_synced BOOLEAN DEFAULT FALSE,
    meta_synced_at TIMESTAMPTZ,
    
    -- Metadata
    landing_page VARCHAR(500),
    vertical VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_site_created (site_id, created_at),
    INDEX idx_gclid (gclid) WHERE gclid IS NOT NULL,
    INDEX idx_sync_pending (google_ads_synced) WHERE google_ads_synced = FALSE
);

-- Campaigns (mirrored from ad platforms)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES ad_connections(id) ON DELETE CASCADE,
    
    platform ENUM('google_ads', 'meta', 'microsoft', 'linkedin') NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    
    -- Budget
    daily_budget_cents INT,
    total_budget_cents INT,
    
    -- Performance (latest)
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INT DEFAULT 0,
    spend_cents BIGINT DEFAULT 0,
    
    -- Calculated
    ctr DECIMAL(5,4),
    cpc_cents INT,
    cpa_cents INT,
    roas DECIMAL(6,2),
    
    -- Metadata
    last_synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(connection_id, external_id)
);

-- Optimization Actions
CREATE TABLE optimization_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    action_type ENUM('budget_increase', 'budget_decrease', 'pause', 'resume',
                     'bid_increase', 'bid_decrease', 'create', 'alert') NOT NULL,
    
    -- What changed
    target_entity VARCHAR(50),       -- campaign, adgroup, keyword, ad
    target_id VARCHAR(255),
    
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    
    -- Why
    reason TEXT,
    rule_triggered VARCHAR(100),
    
    -- Status
    status ENUM('pending', 'executed', 'failed', 'rolled_back') DEFAULT 'pending',
    executed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization Rules
CREATE TABLE optimization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    applies_to ENUM('all', 'campaign', 'adgroup', 'keyword') DEFAULT 'all',
    platform VARCHAR(50),
    
    -- Condition (JSON)
    conditions JSONB NOT NULL,
    -- Example: {"metric": "cpa_cents", "operator": ">", "value": 5000, "period_days": 7}
    
    -- Action
    action_type VARCHAR(50) NOT NULL,
    action_params JSONB,
    -- Example: {"change_type": "decrease", "change_percent": 20, "min_budget": 1000}
    
    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Performance Snapshots
CREATE TABLE daily_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    conversion_value_cents BIGINT DEFAULT 0,
    spend_cents INT DEFAULT 0,
    
    -- Calculated
    ctr DECIMAL(5,4),
    cpc_cents INT,
    cpa_cents INT,
    roas DECIMAL(6,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, date)
);
```

## API Endpoints

### Authentication

```
POST   /auth/register           # Create organization + user
POST   /auth/login              # Get JWT tokens
POST   /auth/refresh            # Refresh access token
POST   /auth/forgot-password    # Send reset email
POST   /auth/reset-password     # Reset with token
```

### Sites (Plugin Communication)

```
POST   /api/v1/sites/register   # Register new WordPress site
GET    /api/v1/sites/:id/status # Get site status for plugin dashboard
POST   /api/v1/sites/:id/leads  # Receive leads from plugin
POST   /api/v1/sites/:id/events # Receive events from plugin
```

### Dashboard (Web UI)

```
# Organizations
GET    /api/v1/org              # Get current org details
PATCH  /api/v1/org              # Update org settings

# Sites
GET    /api/v1/sites            # List all sites
GET    /api/v1/sites/:id        # Get site details
PATCH  /api/v1/sites/:id        # Update site settings
DELETE /api/v1/sites/:id        # Remove site

# Ad Connections
GET    /api/v1/connections                  # List connections
POST   /api/v1/connections/google/auth      # Start Google OAuth
POST   /api/v1/connections/meta/auth        # Start Meta OAuth
DELETE /api/v1/connections/:id              # Remove connection

# Campaigns
GET    /api/v1/campaigns                    # List all campaigns
GET    /api/v1/campaigns/:id                # Get campaign details
GET    /api/v1/campaigns/:id/performance    # Get performance history

# Optimization
GET    /api/v1/rules                        # List optimization rules
POST   /api/v1/rules                        # Create rule
PATCH  /api/v1/rules/:id                    # Update rule
DELETE /api/v1/rules/:id                    # Delete rule
GET    /api/v1/actions                      # List recent actions
POST   /api/v1/actions/:id/rollback         # Rollback action

# Leads
GET    /api/v1/leads                        # List leads (paginated)
GET    /api/v1/leads/:id                    # Get lead details
PATCH  /api/v1/leads/:id                    # Update lead status

# Reports
GET    /api/v1/reports/overview             # Dashboard overview
GET    /api/v1/reports/performance          # Performance report
GET    /api/v1/reports/attribution          # Attribution report
GET    /api/v1/reports/integrity            # Data integrity report
```

## Background Workers

### 1. Sync Conversions Worker

Runs every 15 minutes. Uploads qualified leads as offline conversions.

```typescript
// workers/sync-conversions.ts

export async function syncConversions() {
  const orgs = await getOrgsWithPendingConversions();
  
  for (const org of orgs) {
    const leads = await getUnsyncedLeads(org.id, 100);
    
    if (leads.length === 0) continue;
    
    // Group by platform
    const googleLeads = leads.filter(l => l.gclid);
    const metaLeads = leads.filter(l => l.fbclid);
    
    // Upload to Google Ads
    if (googleLeads.length > 0) {
      const connection = await getConnection(org.id, 'google_ads');
      if (connection) {
        const result = await googleAds.uploadConversions(
          connection,
          googleLeads.map(l => ({
            gclid: l.gclid,
            conversionDateTime: l.createdAt,
            conversionValue: l.adjustedValueCents / 100,
            currencyCode: 'USD',
            conversionAction: 'Lead'
          }))
        );
        
        if (result.success) {
          await markLeadsSynced(googleLeads.map(l => l.id), 'google_ads');
          await logAction(org.id, 'conversion_sync', {
            platform: 'google_ads',
            count: googleLeads.length,
            totalValue: googleLeads.reduce((s, l) => s + l.adjustedValueCents, 0)
          });
        }
      }
    }
    
    // Upload to Meta CAPI
    if (metaLeads.length > 0) {
      // Similar flow for Meta
    }
  }
}
```

### 2. Pull Performance Worker

Runs every hour. Pulls latest campaign performance from ad platforms.

```typescript
// workers/pull-performance.ts

export async function pullPerformance() {
  const connections = await getActiveConnections();
  
  for (const conn of connections) {
    try {
      let campaigns;
      
      if (conn.platform === 'google_ads') {
        campaigns = await googleAds.getCampaignPerformance(conn, {
          dateRange: 'LAST_7_DAYS'
        });
      } else if (conn.platform === 'meta') {
        campaigns = await meta.getCampaignPerformance(conn, {
          dateRange: 'last_7d'
        });
      }
      
      for (const campaign of campaigns) {
        await upsertCampaign(conn.id, campaign);
        await upsertDailyPerformance(campaign);
      }
      
      await updateConnectionLastUsed(conn.id);
      
    } catch (error) {
      await markConnectionError(conn.id, error.message);
    }
  }
}
```

### 3. Run Optimization Worker

Runs every 6 hours. Evaluates rules and executes actions.

```typescript
// workers/run-optimization.ts

export async function runOptimization() {
  const orgs = await getOrgsWithActiveRules();
  
  for (const org of orgs) {
    const rules = await getEnabledRules(org.id);
    const campaigns = await getCampaigns(org.id);
    
    for (const rule of rules) {
      const matchingCampaigns = evaluateRule(rule, campaigns);
      
      for (const campaign of matchingCampaigns) {
        const action = buildAction(rule, campaign);
        
        // Execute action via ad platform API
        const result = await executeAction(action);
        
        // Log action
        await createOptimizationAction({
          orgId: org.id,
          campaignId: campaign.id,
          actionType: rule.actionType,
          targetEntity: 'campaign',
          targetId: campaign.externalId,
          oldValue: action.oldValue,
          newValue: action.newValue,
          reason: `Rule: ${rule.name}`,
          status: result.success ? 'executed' : 'failed',
          executedAt: new Date(),
          errorMessage: result.error
        });
        
        // Update rule stats
        await incrementRuleTriggerCount(rule.id);
      }
    }
  }
}

function evaluateRule(rule, campaigns) {
  return campaigns.filter(campaign => {
    const conditions = rule.conditions;
    const value = campaign[conditions.metric];
    
    switch (conditions.operator) {
      case '>': return value > conditions.value;
      case '<': return value < conditions.value;
      case '>=': return value >= conditions.value;
      case '<=': return value <= conditions.value;
      case '==': return value === conditions.value;
      default: return false;
    }
  });
}
```

## AI Services

### Campaign Planner

Generates campaign strategies based on business info and goals.

```typescript
// services/ai/planner.ts

export async function generateCampaignPlan(input: {
  vertical: string;
  budget: number;
  goals: string[];
  targetLocation: string;
  competitors?: string[];
}): Promise<CampaignPlan> {
  
  const prompt = `
You are an expert Google Ads strategist. Create a campaign plan for:

Business Type: ${input.vertical}
Monthly Budget: $${input.budget}
Goals: ${input.goals.join(', ')}
Target Location: ${input.targetLocation}
${input.competitors ? `Competitors: ${input.competitors.join(', ')}` : ''}

Provide:
1. Campaign structure (campaigns, ad groups)
2. Keyword strategy (themes, match types, negatives)
3. Ad copy recommendations (headlines, descriptions)
4. Budget allocation across campaigns
5. Bidding strategy recommendation
6. Expected KPIs (CPC, CTR, CPA ranges for this vertical)

Format as JSON.
`;

  const response = await gemini.generate(prompt);
  return parseCampaignPlan(response);
}
```

### Insights Generator

Analyzes performance and generates actionable insights.

```typescript
// services/ai/insights.ts

export async function generateInsights(orgId: string): Promise<Insight[]> {
  const performance = await getLast30DaysPerformance(orgId);
  const actions = await getRecentActions(orgId, 30);
  
  const prompt = `
Analyze this ad performance data and provide 3-5 actionable insights:

Performance Summary:
${JSON.stringify(performance, null, 2)}

Recent Optimization Actions:
${JSON.stringify(actions, null, 2)}

For each insight, provide:
- Observation (what you noticed)
- Impact (why it matters)
- Recommendation (specific action to take)
- Priority (high/medium/low)

Format as JSON array.
`;

  const response = await gemini.generate(prompt);
  return parseInsights(response);
}
```

## Security

### Credential Encryption

All ad platform credentials encrypted at rest using AES-256-GCM.

```typescript
// utils/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Rate Limiting

Per-site and per-org rate limits to prevent abuse.

```typescript
// middleware/rate-limit.ts

import { RateLimiterRedis } from 'rate-limiter-flexible';

const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100,        // 100 requests
  duration: 60,       // per minute
  blockDuration: 60,  // block for 1 minute if exceeded
});

export async function rateLimitMiddleware(c, next) {
  const key = c.get('siteId') || c.get('orgId') || c.req.header('x-forwarded-for');
  
  try {
    await limiter.consume(key);
    await next();
  } catch {
    return c.json({ error: 'Too many requests' }, 429);
  }
}
```

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/advocate

# Redis
REDIS_URL=redis://host:6379

# Encryption
ENCRYPTION_KEY=<64 hex chars>
JWT_SECRET=<random string>

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=<token>
GOOGLE_ADS_CLIENT_ID=<oauth client id>
GOOGLE_ADS_CLIENT_SECRET=<oauth client secret>

# Meta
META_APP_ID=<app id>
META_APP_SECRET=<app secret>

# AI
GEMINI_API_KEY=<key>

# Misc
NODE_ENV=production
LOG_LEVEL=info
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Scaling Considerations

| Component | Scaling Strategy |
|-----------|------------------|
| **API Server** | Horizontal (stateless, behind load balancer) |
| **Workers** | Horizontal (Redis-backed job queue ensures no duplicates) |
| **Database** | Vertical first, then read replicas |
| **Redis** | Single instance → Redis Cluster when needed |

## Monitoring

### Key Metrics to Track

- API latency (p50, p95, p99)
- Background job queue depth
- Conversion sync success rate
- Ad platform API error rates
- Data integrity scores across sites
- Active sites / churned sites
- Revenue per site (ad spend managed)

### Alerts

- API error rate > 1%
- Job queue depth > 1000
- Any ad platform auth failures
- Data integrity score drops > 10 points
- Conversion sync failures
