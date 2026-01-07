# AdsEngineer Project Structure

**Version:** 1.0  
**Last Updated:** January 7, 2026  
**Based on:** [Architecture Analysis](./docs/ARCHITECTURE_ANALYSIS.md)

---

## 📁 Current Project Structure

```
serverless/
├── 📁 docs/                              ← NEW: Documentation directory
│   └── 📄 ARCHITECTURE_ANALYSIS.md        ← ✅ Created
├── 📁 src/                               ← Main source code
│   ├── 📁 routes/                         ← Route handlers
│   │   ├── 📄 admin.ts                   ← Admin endpoints (protected)
│   │   ├── 📄 analytics.ts               ← Analytics endpoints (protected)
│   │   ├── 📄 billing.ts                 ← Stripe billing (public)
│   │   ├── 📄 custom-event-definitions.ts ← Custom events (protected)
│   │   ├── 📄 custom-events.ts           ← Custom events (protected)
│   │   ├── 📄 gdpr.ts                   ← GDPR compliance (public)
│   │   ├── 📄 ghl.ts                    ← GoHighLevel webhooks (public)
│   │   ├── 📄 leads.ts                  ← Lead management (protected)
│   │   ├── 📄 oauth.ts                  ← OAuth flows (public)
│   │   ├── 📄 onboarding.ts             ← Customer onboarding (public)
│   │   ├── 📄 shopify.ts                ← Shopify webhooks (public)
│   │   ├── 📄 status.ts                 ← Status checks (protected)
│   │   ├── 📄 tracking.ts               ← Page visit tracking (public)
│   │   ├── 📄 waitlist.ts               ← Waitlist management (public)
│   │   └── 📄 track.ts                  ← NEW: Unified tracking endpoint
│   ├── 📁 services/                        ← Business logic services
│   │   ├── 📄 api-monitor.ts             ← API monitoring service
│   │   ├── 📄 conversion-router.ts       ← ✅ Platform routing
│   │   ├── 📄 crypto.ts                 ← Crypto utilities
│   │   ├── 📄 encryption.ts             ← ✅ Credential encryption
│   │   ├── 📄 google-ads-queue.ts       ← Google Ads queue processing
│   │   ├── 📄 google-ads.ts             ← ✅ Google Ads API client
│   │   ├── 📄 jwt.ts                   ← ✅ JWT service
│   │   ├── 📄 logging.ts                ← Structured logging
│   │   ├── 📄 meta-conversions.ts       ← ✅ Meta Conversions API
│   │   ├── 📄 oauth-storage.ts          ← OAuth token storage
│   │   ├── 📄 ga4.ts                   ← NEW: GA4 Measurement Protocol
│   │   └── 📄 backend-forwarder.ts      ← NEW: Backend forwarding service
│   ├── 📁 middleware/                      ← Request middleware
│   │   ├── 📄 auth.ts                   ← ✅ Authentication middleware
│   │   ├── 📄 rate-limit.ts             ← ✅ Rate limiting
│   │   ├── 📄 dynamic-cors.ts           ← NEW: Dynamic CORS handling
│   │   └── 📄 security.ts               ← NEW: Security enhancements
│   ├── 📁 database/                       ← Database layer
│   │   └── 📄 index.ts                  ← ✅ Database interface factory
│   ├── 📁 utils/                          ← Utility functions
│   │   └── 📄 gclid.ts                  ← GCLID utilities
│   ├── 📁 workers/                        ← Background workers
│   │   ├── 📄 offline-conversions.ts     ← Offline conversion processing
│   │   └── 📄 queue-consumer.ts          ← Queue consumer
│   ├── 📄 index.ts                        ← ✅ Main application entry point
│   ├── 📄 openapi.ts                      ← OpenAPI documentation
│   ├── 📄 snippet.ts                      ← Embedded tracking snippet
│   └── 📄 types.ts                        ← TypeScript type definitions
├── 📁 tests/                             ← Test suite
│   ├── 📁 unit/                           ← Unit tests
│   │   ├── 📄 backup-encryption.test.ts   ← ✅ Backup encryption tests
│   │   ├── 📄 conversion-router.test.ts   ← ✅ Conversion router tests
│   │   ├── 📄 credential-encryption.test.ts ← ✅ Credential encryption tests
│   │   ├── 📄 encryption.test.ts          ← ✅ Encryption tests
│   │   ├── 📄 jwt-verification.test.ts    ← ✅ JWT verification tests
│   │   ├── 📄 onboarding.test.ts          ← ✅ Onboarding tests
│   │   ├── 📄 onboarding-validation.test.ts← ✅ Onboarding validation tests
│   │   ├── 📄 rate-limit.test.ts          ← ✅ Rate limit tests
│   │   ├── 📄 secure-responses.test.ts    ← ✅ Security response tests
│   │   ├── 📄 shopify-gclid.test.ts      ← ✅ Shopify GCLID tests
│   │   ├── 📄 billing-system.test.ts     ← ✅ Billing system tests
│   │   └── 📄 [NEW TESTS]                ← Phase 1-4 additions
│   ├── 📁 integration/                    ← Integration tests
│   │   ├── 📄 api-integration.test.ts     ← ✅ API integration tests
│   │   ├── 📄 onboarding.test.ts          ← ✅ Onboarding integration tests
│   │   ├── 📄 secondary-routing.test.ts   ← ✅ Secondary routing tests
│   │   ├── 📄 secure-responses.test.ts    ← ✅ Secure response tests
│   │   └── 📄 [NEW TESTS]                ← Phase 1-4 additions
│   └── 📁 e2e/                           ← End-to-end tests
│       ├── 📄 onboarding.test.ts          ← ✅ Onboarding E2E tests
│       └── 📄 [NEW TESTS]                ← Phase 1-4 additions
├── 📁 public/                            ← Static assets
│   └── 📄 snippet.js                   ← Client-side tracking snippet
├── 📁 scripts/                           ← Utility scripts
│   ├── 📄 api-health-check.js          ← API health verification
│   ├── 📄 api-version-check.js         ← API version validation
│   ├── 📄 webhook-compatibility-test.js← Webhook compatibility testing
│   └── 📄 check-api-deprecations.js   ← API deprecation checking
├── 📁 migrations/                        ← Database migrations
├── 📄 package.json                       ← ✅ Dependencies and scripts
├── 📄 wrangler.jsonc                     ← ✅ Cloudflare Workers configuration
├── 📄 tsconfig.json                      ← ✅ TypeScript configuration
├── 📄 vite.config.ts                     ← ✅ Vite build configuration
├── 📄 README.md                          ← Project documentation
└── 📄 IMPLEMENTATION_ROADMAP.md         ← ✅ Implementation plan
```

---

## 🏗️ Architecture Layers

### Layer 1: Routes (Request Handling)
**Purpose:** HTTP request/response management  
**Files:** `src/routes/*.ts`  

**Status:**
- ✅ **Existing:** Admin, Analytics, Billing, GDPR, GHL, Leads, OAuth, Onboarding, Shopify, Status, Tracking, Waitlist
- 🚧 **New:** `track.ts` (unified endpoint)

**Key Features:**
- Public routes (no auth required): `/api/v1/*`
- Protected routes (JWT required): `/api/v1/leads`, `/api/v1/status`, `/api/v1/analytics`
- Admin routes (admin token required): `/api/v1/admin`

---

### Layer 2: Services (Business Logic)
**Purpose:** Core business logic and external integrations  
**Files:** `src/services/*.ts`

**Status:**
- ✅ **Advertising Platforms:** Google Ads, Meta Conversions
- 🚧 **New:** GA4 (Measurement Protocol)
- 🚧 **New:** Backend Forwarder
- ✅ **Core Services:** Conversion Router, JWT, Encryption, Logging, API Monitor

**Key Features:**
- Platform-agnostic data handling
- Parallel processing capabilities
- Error handling and retry logic
- Credential management

---

### Layer 3: Middleware (Cross-Cutting Concerns)
**Purpose:** Request processing, security, validation  
**Files:** `src/middleware/*.ts`

**Status:**
- ✅ **Existing:** Authentication, Rate Limiting
- 🚧 **New:** Dynamic CORS, Security enhancements

**Key Features:**
- JWT token verification
- Rate limiting per IP/shop
- Input validation and sanitization
- Security headers

---

### Layer 4: Database (Data Persistence)
**Purpose:** Data access layer and query abstraction  
**Files:** `src/database/index.ts`

**Status:**
- ✅ **Complete:** Full CRUD operations for all entities
- ✅ **Features:** Credential encryption, audit logging, lead management

**Key Features:**
- Prepared statements for performance
- Encrypted credential storage
- Audit trail for compliance
- Multi-environment support

---

## 📦 Module Categories

### Advertising Platform Modules ✅

| Module | File | Status | Capabilities |
|---------|-------|---------|---------------|
| **Google Ads** | `services/google-ads.ts` | ✅ PRODUCTION | Offline conversions, OAuth2, Error handling |
| **Meta Conversions** | `services/meta-conversions.ts` | ✅ PRODUCTION | Facebook pixel, SHA256 hashing, Batch uploads |
| **GA4** | `services/ga4.ts` | 🚧 IMPLEMENTING | Measurement Protocol, Event tracking |

### Web Technology Modules ✅

| Module | File | Status | Capabilities |
|---------|-------|---------|---------------|
| **Shopify** | `routes/shopify.ts` | ✅ PRODUCTION | Webhook processing, GCLID extraction, Rate limiting |
| **GoHighLevel** | `routes/ghl.ts` | ✅ PRODUCTION | Workflow integration, Lead scoring, Vertical detection |
| **WordPress** | `routes/wordpress.ts` | 🚧 IMPLEMENTING | Contact form processing, Plugin integration |

### Infrastructure Modules ✅

| Component | File | Status | Purpose |
|-----------|-------|---------|---------|
| **Conversion Router** | `services/conversion-router.ts` | ✅ PRODUCTION | Multi-platform conversion routing |
| **JWT Service** | `services/jwt.ts` + `middleware/auth.ts` | ✅ PRODUCTION | Authentication & authorization |
| **Encryption** | `services/encryption.ts` | ✅ PRODUCTION | Credential security |
| **Database** | `database/index.ts` | ✅ PRODUCTION | Data persistence layer |
| **Logging** | `services/logging.ts` | ✅ PRODUCTION | Structured logging |

---

## 🔧 Configuration Files

### Core Configuration
```jsonc
📄 wrangler.jsonc           ← Cloudflare Workers config
📄 package.json            ← Dependencies and scripts
📄 tsconfig.json           ← TypeScript configuration
📄 vite.config.ts          ← Build configuration
```

### Environment Configuration
```jsonc
// wrangler.jsonc
{
  "name": "adsengineer-cloud",
  "compatibility_date": "2024-08-20",
  "compatibility_flags": ["nodejs_compat"],
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "adsengineer-db",
      "database_id": "d262a6f7-a378-45d9-9a74-5f4264304bc6"
    }
  ],
  
  "env": {
    "production": {
      "name": "adsengineer-cloud",
      "custom_domains": [
        { "domain_name": "api.adsengineer.cloud" }
      ]
    }
  }
}
```

---

## 🚀 Deployment Structure

### Development
```bash
📁 .wrangler/               ← Wrangler development cache
📄 wrangler.jsonc           ← Development configuration
📄 .env                     ← Local environment variables
```

### Production
```bash
🏭 Cloudflare Workers      ← Runtime environment
💾 D1 Database           ← Production database
🌐 Custom Domain         ← api.adsengineer.cloud
```

---

## 🧪 Testing Structure

### Unit Tests (`tests/unit/`)
**Purpose:** Test individual functions and classes  
**Coverage:** 85%+ target  

**Key Test Files:**
- ✅ `google-ads.test.ts` - Google Ads client testing
- ✅ `meta-conversions.test.ts` - Meta API testing
- ✅ `jwt-verification.test.ts` - JWT security testing
- ✅ `conversion-router.test.ts` - Routing logic testing

### Integration Tests (`tests/integration/`)
**Purpose:** Test module interactions  
**Coverage:** Full request flows  

**Key Test Files:**
- ✅ `api-integration.test.ts` - Full API integration
- ✅ `onboarding.test.ts` - Customer onboarding flow
- ✅ `secondary-routing.test.ts` - Dual platform routing

### E2E Tests (`tests/e2e/`)
**Purpose:** Test complete user journeys  
**Coverage:** Critical user paths  

**Key Test Files:**
- ✅ `onboarding.test.ts` - Complete onboarding journey
- 🚧 [NEW] - Multi-platform tracking flows

---

## 📚 Documentation Structure

```
📁 docs/                           ← Documentation directory
├── 📄 ARCHITECTURE_ANALYSIS.md     ← ✅ Complete architecture review
├── 📄 IMPLEMENTATION_ROADMAP.md    ← ✅ Implementation timeline
├── 📄 CSP_GUIDE.md                ← 🚧 Shopify CSP configuration
├── 📄 API_REFERENCE.md            ← 🚧 API endpoint documentation
├── 📄 INTEGRATION_GUIDES/         ← 🚧 Platform-specific guides
│   ├── 📄 SHOPIFY.md
│   ├── 📄 WORDPRESS.md
│   ├── 📄 GA4.md
│   └── 📄 GHL.md
└── 📄 TROUBLESHOOTING.md          ← 🚧 Common issues and solutions
```

---

## 🔧 Development Workflow

### 1. Local Development
```bash
npm run dev                    # Start Wrangler dev server (port 8090)
npm run types:check            # TypeScript type checking
npm run lint                   # Code linting
npm run format                 # Code formatting
```

### 2. Testing
```bash
npm run test                   # Run all unit tests
npm run test:integration        # Run integration tests
npm run test:e2e              # Run E2E tests
npm run test:coverage         # Run with coverage report
```

### 3. Building
```bash
# Auto-builds with Wrangler
wrangler dev                   # Development build
wrangler deploy                # Production deployment
```

---

## 📡 Data Flow Architecture

```
🌐 Client Applications
   ↓ (POST /api/v1/track)
🛣️ Cloudflare Worker (Edge)
   ├── 📋 Request Validation (middleware)
   ├── 🔐 Authentication (if required)
   ├── 💾 Database Storage (D1)
   ├── 🔄 Platform Routing (services)
   │   ├── 📈 Google Ads (conversions)
   │   ├── 📘 Meta (conversions)
   │   └── 📊 GA4 (events)
   └── 🌐 Backend Forwarding (Shopify, WordPress, etc.)
       ↓
🏪 Customer Backends (Ruby/PHP/etc.)
```

---

## 🔐 Security Architecture

### Multi-Layer Security
1. **Edge Security:** Cloudflare DDoS protection
2. **Application Security:** JWT authentication, rate limiting
3. **Data Security:** Credential encryption, GCLID hashing
4. **Network Security:** CORS policies, security headers

### Security Files by Layer
```
🔐 Security Layer              └── 📄 Implementation File
───────────────────────────────────────────────────────────
Edge Security                 ← Cloudflare Workers platform
Application Security          ← middleware/auth.ts, middleware/rate-limit.ts
Data Security                 ← services/encryption.ts, services/crypto.ts
Network Security              ← middleware/dynamic-cors.ts
```

---

## 📊 Performance Architecture

### Cloudflare Workers Advantages
- **Global Edge:** 200+ data centers worldwide
- **Zero Cold Starts:** Instant scaling from 0 to millions
- **Sub-second Latency:** <100ms average response time
- **Auto-scaling:** No capacity planning needed

### Performance Optimization Strategies
1. **Database Optimization:** Prepared statements, connection pooling
2. **Caching:** Config caching (5-minute TTL)
3. **Batch Processing:** Parallel API calls to platforms
4. **Compression:** Response compression for large payloads

---

## 🔄 Migration Strategy

### Database Migrations
```
📁 migrations/
├── 📄 001_initial_schema.sql     ← ✅ Base schema
├── 📄 002_add_backend_configs.sql ← 🚧 Backend forwarding configs
├── 📄 003_add_allowed_origins.sql  ← 🚧 Dynamic CORS support
└── 📄 004_add_structured_logs.sql ← 🚧 Enhanced logging
```

### Configuration Migration
```typescript
// Migration script for wrangler.jsonc
const migrations = {
  'v1.0': {
    added: ['GA4_ENABLED', 'BACKEND_FORWARDING_ENABLED'],
    deprecated: [],
    changed: ['JWT_SECRET'] // Added enhanced validation
  }
};
```

---

## 📈 Scalability Considerations

### Current Scaling Capabilities
- **Requests:** Millions per day (Cloudflare Workers)
- **Database:** D1 scales automatically
- **Storage:** 5GB free, can scale to TBs
- **Compute:** Auto-scaling with edge distribution

### Future Scaling Needs
- **Queue Processing:** Background workers for heavy processing
- **Analytics:** Real-time dashboards and metrics
- **Multi-region:** Database replication for global compliance

---

## 🎯 Key Architectural Decisions

### 1. Modular Platform Support ✅
**Decision:** Separate service classes per advertising platform  
**Benefit:** Easy to add new platforms, independent scaling

### 2. Unified Data Model ✅
**Decision:** Single `Lead` interface across all platforms  
**Benefit:** Consistent data processing, easy analytics

### 3. Configuration-Driven ✅
**Decision:** Platform configs stored in database  
**Benefit:** Runtime configuration changes, no redeploys

### 4. Security-First ✅
**Decision:** Encryption, JWT, rate limiting from day 1  
**Benefit:** Enterprise security, compliance ready

### 5. Edge-First ✅
**Decision:** Cloudflare Workers as primary platform  
**Benefit:** Global performance, zero-downtime deployments

---

## 🚨 Critical Path Items

### Must Complete Before Production
1. **Track Endpoint** (`/api/v1/track`) - Client data ingestion
2. **Backend Forwarding** - Customer Ruby backend integration
3. **Dynamic CORS** - Support unlimited Shopify domains
4. **Comprehensive Testing** - Ensure reliability

### Should Complete for Full Features
1. **GA4 Module** - Next advertising platform
2. **WordPress Module** - Next web technology
3. **Enhanced Monitoring** - Real-time visibility
4. **Performance Optimization** - Scale to millions of requests

---

## 📝 Implementation Status

| Component | Status | Priority | Implementation Phase |
|------------|---------|-----------|-------------------|
| Track Endpoint | 🚧 IN PROGRESS | 🔴 CRITICAL | Phase 1 |
| Backend Forwarder | 🚧 IN PROGRESS | 🔴 CRITICAL | Phase 1 |
| Dynamic CORS | 🚧 IN PROGRESS | 🟡 HIGH | Phase 1 |
| GA4 Module | 📋 PLANNED | 🟡 HIGH | Phase 2 |
| WordPress Module | 📋 PLANNED | 🟡 HIGH | Phase 2 |
| Enhanced Security | 📋 PLANNED | 🟢 MEDIUM | Phase 3 |
| Monitoring Dashboard | 📋 PLANNED | 🟢 MEDIUM | Phase 3 |
| Performance Optimization | 📋 PLANNED | 🔵 LOW | Phase 4 |
| Comprehensive Testing | 📋 PLANNED | 🔵 LOW | Phase 4 |

---

**Structure Created:** January 7, 2026  
**Based on Analysis:** [ARCHITECTURE_ANALYSIS.md](./docs/ARCHITECTURE_ANALYSIS.md)  
**Implementation Plan:** [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)  
**Next Step:** Begin Phase 1 critical infrastructure implementation