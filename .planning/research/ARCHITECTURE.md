# Architecture Research

**Domain:** Hybrid SaaS Architecture (Self-Hosted Orchestrator + Edge Workers)
**Researched:** 2026-01-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer VPS Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Clawdbot Orchestrator              │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │  │   API   │  │ Scheduler│  │  Config  │   │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘   │    │
│  │       │            │            │              │    │
│  └───────┴────────────┴────────────┴──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Cloudflare Edge Layer                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            AdsEngineer Workers                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │  │ Routes  │  │Services │  │Workers   │   │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘   │    │
│  │       │            │            │              │    │
│  └───────┴────────────┴────────────┴──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    External Services                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Google   │  │  Stripe  │  │ Shopify  │           │
│  │    Ads   │  │ Billing  │  │ Webhooks │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Clawdbot API | Central control plane, worker management, configuration sync | Node.js/Express with TypeScript |
| Scheduler | Background jobs, deployment triggers, health monitoring | Node-schedule or Bull Queue |
| Config Manager | Secret storage, environment variables, VPS settings | Encrypted local storage + Doppler sync |
| Workers API | Public endpoints, webhook processing, request routing | Hono framework on Cloudflare Workers |
| Services | Business logic, data processing, external integrations | TypeScript modules in Workers |
| Background Workers | Async processing, retry logic, offline conversions | Cloudflare Workers with Durable Objects |

## Recommended Project Structure

```
clawdbot-orchestrator/           # Self-hosted control plane
├── src/
│   ├── api/                 # REST API for worker management
│   │   ├── routes/          # API endpoints (/workers, /config, /deploy)
│   │   └── middleware/      # Auth, validation, rate limiting
│   ├── scheduler/            # Background job management
│   │   ├── jobs/           # Job definitions (deploy, health, sync)
│   │   └── queue/          # Queue management (Redis/Bull)
│   ├── config/              # Configuration management
│   │   ├── secrets.ts       # Secret encryption/decryption
│   │   ├── environment.ts   # VPS-specific settings
│   │   └── workers.ts      # Worker-specific configs
│   ├── deployment/          # Worker deployment logic
│   │   ├── cf-orchestrator.ts # Core Cloudflare orchestration
│   │   ├── templates/       # Worker code templates
│   │   └── scripts/        # Deployment automation
│   └── monitoring/         # Health checks and metrics
│       ├── health.ts        # Worker health monitoring
│       └── metrics.ts       # Performance tracking
├── scripts/                # VPS setup and maintenance
│   ├── setup-vps.sh       # Initial VPS provisioning
│   ├── install-deps.sh     # Dependency installation
│   └── backup-secrets.sh   # Secret backup automation
├── docker/                 # Container configuration
│   └── Dockerfile          # Orchestrator container
└── package.json

serverless/                  # Existing: Enhanced for hybrid integration
├── src/
│   ├── routes/             # Enhanced with orchestrator endpoints
│   │   ├── orchestrator.ts  # New: Clawdbot communication
│   │   └── health-sync.ts  # New: Health status sync
│   ├── services/           # Enhanced with remote config
│   │   ├── orchestrator.ts # New: VPS communication
│   │   └── config-sync.ts  # New: Configuration sync
│   └── workers/           # Enhanced with remote management
│       └── orchestrator-worker.ts # New: Remote deployment worker
└── migrations/             # Enhanced with orchestrator tables
    └── 0021_orchestrator_config.sql
```

### Structure Rationale

- **clawdbot-orchestrator/:** Self-hosted control plane keeps customer data and secrets on their VPS
- **serverless/:** Existing Workers API enhanced to communicate with orchestrator
- **orchestrator.ts skill file:** Provides standardized Cloudflare management interface
- **Separation of concerns:** Control plane (VPS) handles sensitive data, data plane (Workers) handles public traffic

## Architectural Patterns

### Pattern 1: Control Plane/Data Plane Separation

**What:** Split infrastructure into control plane (self-hosted) and data plane (edge Workers)
**When to use:** Enterprise SaaS requiring data sovereignty and compliance
**Trade-offs:** 
- Pros: Customer controls secrets, compliance-friendly, audit trail
- Cons: More complex deployment, requires VPS management

**Example:**
```typescript
// Clawdbot control plane API
app.post('/api/workers/:workerId/deploy', async (req, res) => {
  const config = await getWorkerConfig(workerId);
  const workerCode = generateWorkerCode(config);
  await deployToCloudflare(workerCode, config.secrets);
  res.json({ status: 'deployed' });
});
```

### Pattern 2: Configuration Synchronization

**What:** Two-way sync between VPS orchestrator and edge Workers
**When to use:** When Workers need access to up-to-date configuration from control plane
**Trade-offs:**
- Pros: Centralized config management, real-time updates
- Cons: Network dependency between VPS and Workers

**Example:**
```typescript
// Worker config sync service
export class ConfigSync {
  async syncFromOrchestrator(workerId: string) {
    const config = await fetch(`${ORCHESTRATOR_URL}/config/${workerId}`);
    await KV.put(`config:${workerId}`, JSON.stringify(config));
  }
}
```

### Pattern 3: Secure Secret Relay

**What:** Secrets stored on VPS, only encrypted metadata pushed to Workers
**When to use:** Enterprise requirements for secret isolation
**Trade-offs:**
- Pros: Enhanced security, compliance with data residency
- Cons: Requires secret management infrastructure

**Example:**
```typescript
// Secret encryption for Worker deployment
export async function encryptForWorker(secret: string, workerKey: string): Promise<string> {
  const encrypted = await encrypt(secret, workerKey);
  return encrypted; // Only deployed to Worker, not stored in cloud
}
```

## Data Flow

### Request Flow

```
Customer Action
    ↓
VPS Orchestrator → Config Generator → Deployment Service → Cloudflare API
    ↓                    ↓                    ↓              ↓
Status Monitor ← Health Check ← Worker Metrics ← Cloudflare Workers
    ↓              ↓           ↓              ↓
Dashboard Update ← Admin Panel ← Monitoring API ← Edge Requests
```

### Configuration Sync Flow

```
VPS Config Change
    ↓ (Webhook)
Cloudflare Workers → Config Sync Service → KV Storage → Route Updates
    ↓                    ↓              ↓              ↓
Worker Restart ← New Config ← KV Listener ← Route Handler
```

### Key Data Flows

1. **Worker Deployment Flow:** VPS orchestrator generates worker code with embedded config → Deploys via Cloudflare API → Workers register health status
2. **Configuration Sync Flow:** Admin updates config on VPS → Orchestrator pushes encrypted updates to Workers → Workers restart with new config
3. **Health Monitoring Flow:** Workers send periodic health metrics to VPS → Orchestrator aggregates metrics → Dashboard updates in real-time

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 customers | Single VPS orchestrator, shared Workers |
| 10-100 customers | Multi-region VPS orchestrators, dedicated Worker environments |
| 100+ customers | Orchestrator clustering, Worker environment isolation |

### Scaling Priorities

1. **First bottleneck:** VPS orchestrator CPU/memory as Worker count grows
2. **Second bottleneck:** Cloudflare API rate limits for frequent deployments
3. **Third bottleneck:** Network latency between VPS and Workers

## Anti-Patterns

### Anti-Pattern 1: Secrets in Workers

**What people do:** Store API keys and sensitive data directly in Cloudflare Workers environment variables
**Why it's wrong:** Violates enterprise data sovereignty requirements, creates security risk
**Do this instead:** Keep secrets on VPS, only push encrypted one-time tokens to Workers

### Anti-Pattern 2: Tightly Coupled Orchestrator

**What people do:** Build orchestrator that requires constant connection to Workers
**Why it's wrong:** Creates single point of failure, Workers can't operate independently
**Do this instead:** Design Workers to function with last-known-good config, sync opportunistically

### Anti-Pattern 3: Manual Worker Management

**What people do:** Manually update Workers when customer config changes
**Why it's wrong:** Defeats purpose of orchestrator, introduces human error
**Do this instead:** Automate entire deployment pipeline through orchestrator API

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare API | REST API via orchestrator | Rate limits apply, use exponential backoff |
| Doppler Secrets | CLI sync in VPS setup | Keep Doppler tokens on VPS, not Workers |
| Stripe Billing | Existing webhook integration | No changes needed |
| Google Ads | Existing service integration | Enhance with remote config loading |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| VPS ↔ Workers | HTTP API + Webhooks | Use authentication tokens, rotate regularly |
| Orchestrator ↔ Database | Encrypted local storage | SQLite with encryption at rest |
| Workers ↔ KV | Native KV API | Use prefixes for customer isolation |
| Workers ↔ D1 | Existing D1 binding | No changes needed |

## Integration with Existing Components

### Enhanced Serverless Components

| Component | Current | Hybrid Enhancement |
|-----------|----------|-------------------|
| **Routes** | 14 endpoint files | Add `/orchestrator/*` endpoints for VPS communication |
| **Services** | 28 business logic files | Add `orchestrator.ts` for VPS API communication |
| **Database** | D1 with 10 migrations | Add orchestrator config and health tracking tables |
| **Workers** | Background processing | Add orchestrator communication worker |

### New VPS Components

| Component | Purpose | Implementation |
|------------|----------|----------------|
| **Clawdbot API** | Worker management and deployment | Express.js with TypeScript |
| **CF Orchestrator Skill** | Standardized Cloudflare management | `cf-orchestrator.ts` skill file |
| **Setup Scripts** | Automated VPS provisioning | Bash scripts with dependency management |
| **Architecture Page** | Visual representation of hybrid setup | React component with real-time status |

### Data Flow Changes

1. **Existing Flow:** Customer → Dashboard → API → Services → Database
2. **Hybrid Flow:** Customer → VPS Dashboard → Orchestrator API → Worker Deployment → Cloudflare Edge
3. **Configuration Flow:** VPS Config → Worker Sync → KV Storage → Route Configuration

## Build Order Recommendations

### Phase 1: Foundation (Week 1-2)
1. **Create VPS orchestrator API** - Basic Express server with auth
2. **Implement Cloudflare API integration** - Worker deployment capability
3. **Add orchestrator communication endpoints** to existing Workers API

### Phase 2: Configuration Sync (Week 2-3)
1. **Build configuration management** in VPS orchestrator
2. **Implement sync service** in Workers for remote config
3. **Add health monitoring** between VPS and Workers

### Phase 3: User Experience (Week 3-4)
1. **Create VPS setup scripts** for automated deployment
2. **Build architecture dashboard** showing hybrid setup
3. **Implement Clawdbot skill file** for standardized management

### Phase 4: Integration Testing (Week 4)
1. **End-to-end testing** of VPS → Workers deployment
2. **Security audit** of secret management
3. **Performance testing** of sync mechanisms

## Sources

- Cloudflare Workers API Documentation (2025)
- Hybrid Deployment Models Research - Airbyte (2025)
- Self-Hosted Control Plane Architecture - Rafay Documentation (2025)
- Enterprise Integration Patterns - Gartner SOAP Analysis (2026)
- Container Orchestration Patterns - Portainer (2025)

---
*Architecture research for: Hybrid SaaS Architecture*
*Researched: 2026-01-26*