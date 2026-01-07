# AdsEngineer Implementation Roadmap

**Version:** 1.0  
**Last Updated:** January 7, 2026  
**Based on:** [Architecture Analysis](./docs/ARCHITECTURE_ANALYSIS.md)

---

## 📋 Executive Summary

This roadmap outlines the implementation plan to complete your sophisticated server-side tracking platform. The architecture analysis reveals an **excellent modular foundation** requiring only **1-2 weeks** of focused development to reach production readiness.

**Key Finding:** Your codebase already follows the exact modular pattern you envisioned for advertising platforms and web technologies.

---

## 🎯 Objectives

1. **Complete unified tracking endpoint** (`/api/v1/track`)
2. **Implement backend forwarding service** (Shopify Ruby backend integration)
3. **Add GA4 module** (next advertising platform)
4. **Add WordPress module** (next web technology)
5. **Enhance CORS & Security** (dynamic origins, CSP guidance)

---

## 📅 Timeline Overview

| Phase | Duration | Priority | Status | Key Deliverables |
|--------|-----------|-----------|---------|------------------|
| **Phase 1** | 1 Week | 🔴 CRITICAL | Tracking endpoint + Backend forwarding |
| **Phase 2** | 1 Week | 🟡 HIGH | GA4 + WordPress modules |
| **Phase 3** | 1 Week | 🟢 MEDIUM | Enhanced security + monitoring |
| **Phase 4** | 2 Weeks | 🔵 LOW | Performance + testing |

---

## 🚨 Phase 1: Critical Infrastructure (Week 1)

### Week 1 - Days 1-3: Create Unified Tracking Endpoint

**File:** `src/routes/track.ts` (NEW)

**Priority:** 🔴 **CRITICAL** - Client snippet sending to non-existent endpoint

**Implementation:**
```typescript
// POST /api/v1/track - Unified tracking endpoint
trackRoutes.post('/', async (c) => {
  // 1. Validate payload
  const validation = validateTrackingPayload(payload);
  
  // 2. Store in database
  const lead = await c.get('db').insertLead(payload);
  
  // 3. Route to advertising platforms
  const router = new ConversionRouter(c.env.DB);
  const results = await router.routeConversions([lead]);
  
  // 4. Forward to web technology backend
  if (payload.site_id) {
    await forwardToBackend(c, payload);
  }
  
  return c.json({
    success: true,
    lead_id: lead.id,
    conversion_results: results
  });
});
```

**Register in `src/index.ts`:**
```typescript
import { trackRoutes } from './routes/track';
app.route('/api/v1/track', trackRoutes);
```

**Dependencies:** None (uses existing infrastructure)

**Testing:**
- ✅ Unit tests: `tests/unit/track-endpoint.test.ts`
- ✅ Integration tests: `tests/integration/tracking-flow.test.ts`

---

### Week 1 - Days 4-5: Backend Forwarding Service

**File:** `src/services/backend-forwarder.ts` (NEW)

**Priority:** 🔴 **CRITICAL** - Shopify stores need data forwarded

**Implementation:**
```typescript
export class BackendForwarder {
  async forwardToShopify(payload: TrackingData, shopDomain: string) {
    // 1. Get Shopify backend configuration
    const config = await this.getShopifyConfig(shopDomain);
    
    // 2. Create JWT for authentication
    const jwt = await this.createBackendJWT(config.jwt_secret);
    
    // 3. Forward with proper headers
    const response = await fetch(config.backend_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
        'X-Forwarded-For': c.req.header('CF-Connecting-IP')
      },
      body: JSON.stringify(payload)
    });
    
    return response;
  }
}
```

**Database Schema Addition:**
```sql
CREATE TABLE backend_configs (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  platform TEXT,  -- 'shopify', 'wordpress', 'ghl'
  backend_url TEXT,
  auth_type TEXT,  -- 'jwt', 'api_key', 'webhook_secret'
  auth_config TEXT,  -- JSON with keys
  active BOOLEAN,
  created_at TEXT
);
```

**Testing:**
- ✅ Unit tests: `tests/unit/backend-forwarder.test.ts`
- ✅ Integration tests: Mock Shopify backend

---

### Week 1 - Day 6-7: Dynamic CORS Implementation

**File:** `src/middleware/dynamic-cors.ts` (NEW)

**Priority:** 🟡 **HIGH** - Support dynamic Shopify domains

**Implementation:**
```typescript
export const dynamicCorsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('Origin');
  
  // Check if origin is whitelisted in database
  const isAllowed = await c.get('db').validateOrigin(origin);
  
  if (isAllowed) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to development origins
    c.header('Access-Control-Allow-Origin', 'https://app.adsengineer.com');
  }
  
  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  await next();
};
```

**Update `src/index.ts`:**
```typescript
import { dynamicCorsMiddleware } from './middleware/dynamic-cors';
app.use('*', dynamicCorsMiddleware);
```

**Database Schema Addition:**
```sql
CREATE TABLE allowed_origins (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  origin TEXT,
  platform TEXT,
  active BOOLEAN,
  created_at TEXT
);
```

---

## 📊 Phase 2: Platform Expansion (Week 2)

### Week 2 - Days 1-3: GA4 Module

**File:** `src/services/ga4.ts` (NEW)

**Priority:** 🟡 **HIGH** - Next advertising platform

**Implementation:**
```typescript
export class GA4Service {
  private measurementId: string;
  private apiSecret: string;

  constructor(measurementId: string, apiSecret: string) {
    this.measurementId = measurementId;
    this.apiSecret = apiSecret;
  }

  async sendEvent(payload: GA4Event) {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    return response;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'test',
            events: [{ name: 'page_view' }]
          })
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**Interface Definition:**
```typescript
export interface GA4Event {
  client_id: string;
  user_id?: string;
  timestamp_micros?: string;
  non_personalized_ads?: boolean;
  events: Array<{
    name: string;
    parameters?: Record<string, any>;
  }>;
}
```

**Update Conversion Router:**
```typescript
// In src/services/conversion-router.ts
private async uploadToGA4(conversions: Conversion[], agency: any) {
  if (agency.ga4_config) {
    const config = JSON.parse(agency.ga4_config);
    const ga4Service = new GA4Service(config.measurement_id, config.api_secret);
    
    const events = conversions.map(conv => ({
      client_id: conv.external_id || 'unknown',
      events: [{
        name: 'conversion',
        parameters: {
          value: conv.conversion_value,
          currency: conv.currency || 'USD',
          gclid: conv.gclid
        }
      }]
    }));
    
    return await ga4Service.sendEvent(events);
  }
}
```

**Testing:**
- ✅ Unit tests: `tests/unit/ga4.test.ts`
- ✅ Integration: Mock GA4 endpoint

---

### Week 2 - Days 4-5: WordPress Module

**File:** `src/routes/wordpress.ts` (NEW)

**Priority:** 🟡 **HIGH** - Next web technology platform

**Implementation:**
```typescript
export const wordpressRoutes = new Hono<AppEnv>();

wordpressRoutes.post('/webhook', async (c) => {
  try {
    const payload = await c.req.json();
    const db = c.get('db');

    // Validate required fields
    if (!payload.email && !payload.contact_form_data) {
      return c.json({ error: 'email or contact_form_data required' }, 400);
    }

    // Extract data from WordPress contact form
    const leadData = {
      email: payload.email || payload.contact_form_data?.email,
      phone: payload.phone || payload.contact_form_data?.phone,
      name: payload.name || payload.contact_form_data?.name,
      site_id: payload.site_id || 'wordpress',
      gclid: payload.gclid || extractGclidFromUrl(payload.referrer),
      fbclid: payload.fbclid,
      landing_page: payload.landing_page || payload.referrer,
      form_data: payload.contact_form_data,
      wordpress_site: payload.site_url,
      created_at: payload.timestamp || new Date().toISOString()
    };

    // Store lead
    const result = await db.insertLead(leadData);

    // Route conversions
    const router = new ConversionRouter(db);
    const conversionResults = await router.routeConversions([{
      gclid: leadData.gclid,
      fbclid: leadData.fbclid,
      conversion_value: 0, // WordPress forms typically don't have values
      conversion_time: result.created_at,
      order_id: result.id,
      agency_id: 'wordpress_default'
    }]);

    return c.json({
      success: true,
      lead_id: result.id,
      wordpress_site: leadData.wordpress_site,
      has_conversion_data: !!leadData.gclid,
      conversion_results: conversionResults
    });

  } catch (error) {
    console.error('WordPress webhook error:', error);
    return c.json({
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
```

**Register in `src/index.ts`:**
```typescript
import { wordpressRoutes } from './routes/wordpress';
app.route('/api/v1/wordpress', wordpressRoutes);
```

**WordPress Plugin Integration:**
```php
// WordPress plugin snippet for sending to worker
function send_to_adsengineer($form_data) {
    $payload = array(
        'email' => $form_data['email'],
        'name' => $form_data['name'],
        'phone' => $form_data['phone'],
        'site_id' => get_option('adsengineer_site_id'),
        'contact_form_data' => $form_data,
        'referrer' => $_SERVER['HTTP_REFERER'],
        'site_url' => get_site_url(),
        'timestamp' => current_time('mysql')
    );
    
    wp_remote_post('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/wordpress/webhook', array(
        'body' => json_encode($payload),
        'headers' => array(
            'Content-Type' => 'application/json'
        )
    ));
}
```

**Testing:**
- ✅ Unit tests: `tests/unit/wordpress.test.ts`
- ✅ Integration: Mock WordPress webhook

---

### Week 2 - Days 6-7: Enhanced Error Logging

**File:** `src/services/structured-logging.ts` (NEW)

**Priority:** 🟢 **MEDIUM** - Better debugging with wrangler tail

**Implementation:**
```typescript
export interface LogContext {
  request_id?: string;
  user_id?: string;
  org_id?: string;
  platform?: string;
  action?: string;
  message: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class StructuredLogger {
  constructor(private env: AppEnv['Bindings']) {}

  log(level: 'info' | 'warn' | 'error', context: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'adsengineer-cloud',
      version: '1.0.0',
      ...context
    };
    
    // Output to console (for wrangler tail)
    console.log(JSON.stringify(logEntry));
    
    // Also write to D1 for audit trail (async)
    this.persistLog(logEntry);
  }

  private async persistLog(logEntry: any) {
    try {
      await this.env.DB.prepare(`
        INSERT INTO structured_logs (level, message, context, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        logEntry.level,
        logEntry.message,
        JSON.stringify(logEntry),
        logEntry.timestamp
      ).run();
    } catch (error) {
      console.error('Failed to persist log:', error);
    }
  }
}
```

**Database Schema Addition:**
```sql
CREATE TABLE structured_logs (
  id TEXT PRIMARY KEY,
  level TEXT,
  message TEXT,
  context TEXT,  -- JSON
  created_at TEXT
);
```

---

## 🔒 Phase 3: Security & Monitoring (Week 3)

### Week 3 - Days 1-2: Enhanced Security Middleware

**File:** `src/middleware/security.ts` (NEW)

**Priority:** 🟢 **MEDIUM** - Additional security measures

**Implementation:**
```typescript
export const securityMiddleware = async (c: Context, next: Next) => {
  // 1. Request size limits
  const contentLength = c.req.header('Content-Length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
    return c.json({ error: 'Request too large' }, 413);
  }

  // 2. IP-based rate limiting (additional to existing)
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
  const isRateLimited = await c.get('db').checkIPRateLimit(clientIP);
  
  if (isRateLimited) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  // 3. Input sanitization headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  await next();
};
```

**Database Schema Addition:**
```sql
CREATE TABLE ip_rate_limits (
  id TEXT PRIMARY KEY,
  ip_address TEXT,
  request_count INTEGER,
  window_start TEXT,
  created_at TEXT
);
```

---

### Week 3 - Days 3-4: CSP Documentation & Guidance

**File:** `docs/CSP_GUIDE.md` (NEW)

**Priority:** 🟢 **MEDIUM** - Help Shopify stores whitelist worker

**Content:**
```markdown
# Content Security Policy (CSP) Guide for Shopify Integration

## Required CSP Entry

Add this to your Shopify theme's CSP header:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://adsengineer-cloud.adsengineer.workers.dev; 
               connect-src 'self' https://adsengineer-cloud.adsengineer.workers.dev;
               img-src 'self' data: https:;
               style-src 'self' 'unsafe-inline';">
```

## Shopify Store Configuration

### 1. Edit Theme.liquid
Add CSP meta tag in `<head>` section.

### 2. Add Worker Domain to Trusted Origins
In Shopify Admin → Settings → Checkout → Order processing → Add trusted origins:
```
https://adsengineer-cloud.adsengineer.workers.dev
```

### 3. Whitelist in CDN Settings (if using Cloudflare)
```
adsengineer-cloud.adsengineer.workers.dev
```
```

---

### Week 3 - Days 5-7: Monitoring Dashboard

**File:** `src/routes/monitoring.ts` (NEW)

**Priority:** 🟢 **MEDIUM** - Real-time visibility

**Implementation:**
```typescript
export const monitoringRoutes = new Hono<AppEnv>();

monitoringRoutes.get('/health', async (c) => {
  const db = c.get('db');
  
  // Get system metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    services: {
      database: await checkDatabaseHealth(db),
      conversion_router: await checkConversionRouterHealth(),
      backend_forwarder: await checkBackendForwarderHealth()
    },
    metrics: {
      total_leads_24h: await getLeadsCount24h(db),
      conversion_success_rate: await getConversionSuccessRate(db),
      error_rate_1h: await getErrorRate1h(db),
      active_platforms: await getActivePlatformsCount(db)
    }
  };

  return c.json(metrics);
});

monitoringRoutes.get('/logs', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const logs = await c.get('db').getRecentLogs(limit);
  return c.json({ logs });
});
```

**Register in `src/index.ts`:**
```typescript
import { monitoringRoutes } from './routes/monitoring';
app.route('/api/v1/monitoring', monitoringRoutes);
```

---

## ⚡ Phase 4: Performance & Testing (Weeks 4-5)

### Week 4: Performance Optimization

**Priority:** 🔵 **LOW** - Nice to have improvements

**Implementations:**
1. **Config Caching** - Cache agency configs in memory
2. **Batch Operations** - Group platform uploads
3. **Response Compression** - For large payloads

```typescript
// Config caching
private configCache = new Map<string, { data: any, expiry: number }>();

async function getCachedConfig(orgId: string): Promise<any> {
  const cached = this.configCache.get(orgId);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  const fresh = await this.loadConfigFromDB(orgId);
  this.configCache.set(orgId, {
    data: fresh,
    expiry: Date.now() + (5 * 60 * 1000) // 5 minutes
  });
  
  return fresh;
}
```

---

### Week 5: Comprehensive Testing

**Priority:** 🔵 **LOW** - Ensure production readiness

**Test Suite:**
1. **Unit Tests** - All new modules
2. **Integration Tests** - Cross-module flows
3. **E2E Tests** - Complete user journeys
4. **Load Testing** - Performance under load
5. **Security Tests** - Attack vectors

**Test Commands:**
```bash
npm run test                    # All unit tests
npm run test:integration        # Integration tests
npm run test:e2e              # E2E tests
npm run load-test              # Performance testing
npm run test:coverage         # Coverage report
```

---

## 📋 Configuration Updates

### Environment Variables (wrangler.jsonc)

**Additions:**
```jsonc
{
  "vars": {
    // NEW: Backend forwarding
    "BACKEND_FORWARDING_ENABLED": "true",
    
    // NEW: Platform modules
    "GA4_ENABLED": "true",
    "WORDPRESS_ENABLED": "true",
    
    // NEW: Security
    "REQUEST_SIZE_LIMIT": "1048576",  // 1MB
    "IP_RATE_LIMIT": "1000"           // per hour
  },
  "secrets": [
    // Existing: JWT_SECRET, ADMIN_SECRET
    
    // NEW: Backend authentication
    "BACKEND_JWT_SECRET",
    
    // NEW: Platform secrets
    "GA4_API_SECRET",
    
    // NEW: Security
    "CSP_NONCE_SECRET"
  ]
}
```

---

## 🎯 Success Metrics

### Phase 1 Success Criteria
- ✅ `/api/v1/track` endpoint handling 10K+ requests/day
- ✅ Backend forwarding to Shopify Ruby backends working
- ✅ Dynamic CORS supporting 50+ Shopify domains
- ✅ Zero client-side tracking failures

### Phase 2 Success Criteria
- ✅ GA4 module processing 5K+ events/day
- ✅ WordPress module handling 100+ form submissions/day
- ✅ Structured logging operational for debugging
- ✅ 99.9% uptime across all modules

### Phase 3 Success Criteria
- ✅ Security middleware blocking 100% of attack vectors
- ✅ Monitoring dashboard providing real-time insights
- ✅ CSP guidance implemented by 80% of Shopify clients
- ✅ Complete audit trail for compliance

### Phase 4 Success Criteria
- ✅ Sub-100ms response times for 95% of requests
- ✅ 95%+ test coverage across all modules
- ✅ Load tested to 10K concurrent requests
- ✅ Zero security vulnerabilities in penetration testing

---

## 🚀 Deployment Strategy

### Week 1 - Critical Fix Deployment
```bash
# Deploy critical tracking endpoint fix
npm run deploy:staging
# Run integration tests
npm run test:integration
# Deploy to production
npm run deploy
```

### Week 2 - Platform Rollout
```bash
# Deploy GA4 and WordPress modules
npm run deploy:staging
# Run platform-specific tests
npm run test:platforms
# Production deployment
npm run deploy
```

### Week 3-4 - Production Hardening
```bash
# Deploy security and monitoring
npm run deploy:staging
# Full test suite
npm run test:coverage
# Load testing in staging
npm run load-test:staging
# Production deployment with monitoring
npm run deploy
```

---

## 📞 Support & Rollback Plan

### Monitoring During Deployment
1. **Real-time logs:** `wrangler tail adsengineer-cloud`
2. **Health checks:** `GET /api/v1/monitoring/health`
3. **Error tracking:** Alert on error_rate > 1%
4. **Performance tracking:** Alert on response_time > 500ms

### Rollback Triggers
- Error rate > 5% for 5 minutes
- Response time > 2s for 10 minutes
- Database connection failures
- Platform API failures

### Rollback Procedure
```bash
# Quick rollback to previous version
wrangler rollback adsengineer-cloud
# Verify rollback
npm run health-check
# Monitor recovery
wrangler tail adsengineer-cloud
```

---

## 📚 Documentation Updates

### Required Documentation
1. ✅ **Architecture Analysis** - `docs/ARCHITECTURE_ANALYSIS.md`
2. 🚧 **API Documentation** - Auto-generated from OpenAPI
3. 🚧 **Integration Guides** - Shopify, WordPress, GA4
4. 🚧 **Troubleshooting Guide** - Common issues and solutions
5. 🚧 **Security Guide** - Best practices and configurations

### Developer Resources
1. **Code Examples** - Integration samples
2. **Testing Guide** - How to run tests
3. **Deployment Guide** - Step-by-step deployment
4. **Configuration Guide** - Environment setup

---

## 🎉 Conclusion

This implementation roadmap will transform your **excellent modular foundation** into a **production-ready server-side tracking platform** within **5 weeks**.

**Key Benefits:**
- ✅ Complete tracking pipeline (client → worker → platforms → backends)
- ✅ Modular architecture supporting unlimited platforms
- ✅ Enterprise-grade security and monitoring
- ✅ Production-ready performance and reliability

**Timeline to Production:** **1-2 weeks for core functionality** (Phase 1), **5 weeks for full feature set**

**Next Step:** Begin Phase 1 implementation starting with the unified `/api/v1/track` endpoint.

---

**Roadmap Created:** January 7, 2026  
**Based on Architecture Analysis:** [ARCHITECTURE_ANALYSIS.md](./docs/ARCHITECTURE_ANALYSIS.md)  
**Owner:** AdsEngineer Development Team