# Risk Mitigation Plan

Actionable plan to address the risks and gaps identified in Code Critic and Code Skeptic.

---

## Executive Summary

**Current State:** Not production-ready  
**Target State:** Production-ready with enterprise reliability  
**Timeline:** 2-4 weeks for critical fixes, 2-3 months for complete hardening

---

## Risk Matrix

| Priority | Risk | Severity | Effort | Owner |
|----------|------|----------|--------|-------|
| P0 | JWT signature verification missing | CRITICAL | 2 days | Security |
| P0 | Backup returns unencrypted data | CRITICAL | 1 day | Backend |
| P0 | Rate limiting fails open | HIGH | 2 days | Backend |
| P1 | Conversion uploads stubbed | HIGH | 1 week | Backend |
| P1 | KV namespace not configured | HIGH | 2 days | DevOps |
| P1 | No webhook retry mechanism | HIGH | 1 week | Backend |
| P2 | No monitoring/alerting | HIGH | 1 week | SRE |
| P2 | Queue processing disabled | MEDIUM | 2 weeks | Backend |
| P2 | GDPR consent validation flawed | HIGH | 3 days | Backend |
| P3 | Test coverage < 80% | MEDIUM | 2 weeks | QA |
| P3 | No circuit breakers | MEDIUM | 1 week | Backend |
| P3 | Dead code cleanup | LOW | 2 days | Backend |

---

## P0: Critical Security Fixes

### 1.1 JWT Signature Verification

**Issue:** JWT tokens can be forged (no signature verification)

**Implementation:**

```typescript
// serverless/src/middleware/auth.ts

import { createHmac } from 'crypto';

interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat?: number;
  org_id?: string;
  tenant_id?: string;
  role?: string;
}

// HMAC-based signature verification (for symmetric keys)
// For production, use RS256 with public/private key pair
function verifyJWTSignature(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [header, payload, signature] = parts;
  const expectedSignature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  // Timing-safe comparison
  return signature === expectedSignature;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export const authMiddleware = (options: { requireAuth?: boolean } = { requireAuth: true }) => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    // Verify signature
    const signatureValid = verifyJWTSignature(token, c.env.JWT_SECRET);
    if (!signatureValid) {
      return c.json({ error: 'Invalid token signature' }, 401);
    }

    const payload = decodeJWT(token);
    if (!payload) {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    // Validate issuer
    if (payload.iss !== 'adsengineer') {
      return c.json({ error: 'Invalid token issuer' }, 401);
    }

    // Validate audience
    if (payload.aud !== 'adsengineer-api') {
      return c.json({ error: 'Invalid token audience' }, 401);
    }

    // Validate expiration
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

**Steps:**
1. Add `jwt` library to dependencies (or implement HMAC-SHA256)
2. Update auth middleware with signature verification
3. Update token generation to use same algorithm
4. Add tests for token verification
5. Rotate all existing JWT secrets

---

### 1.2 Backup Encryption Fix

**Issue:** Backup returns unencrypted data if key missing

**Implementation:**

```typescript
// serverless/src/routes/admin.ts

adminRoutes.get('/backup', async (c) => {
  const db = c.env.DB;
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    // Log security event
    await logSecurityEvent(c, 'backup_attempt_without_key', {
      ip: c.req.header('CF-Connecting-IP'),
      timestamp: new Date().toISOString(),
    });

    return c.json(
      {
        success: false,
        error: 'Backup encryption not configured',
        message: 'Cannot perform backup without encryption key. Contact administrator.',
        code: 'BACKUP_ENCRYPTION_REQUIRED',
      },
      503
    );
  }

  // Fetch data and encrypt
  const backup = { /* ... */ };
  const encrypted = await encryptBackup(JSON.stringify(backup), encryptionKey);

  return c.json({
    success: true,
    encrypted: true,
    exported_at: backup.exported_at,
    counts: backup.counts,
    data: encrypted.ciphertext,
    iv: encrypted.iv,
  });
});

async function logSecurityEvent(c: Context, eventType: string, details: Record<string, any>) {
  // Log to audit system, send alert, etc.
  console.error(`[SECURITY] ${eventType}:`, JSON.stringify(details));

  // Optional: Send to external alerting (PagerDuty, Slack, etc.)
  // await sendAlert({ event: eventType, ...details });
}
```

**Steps:**
1. Update admin backup endpoint to fail closed
2. Add security event logging
3. Set up alerting for backup failures
4. Document backup encryption requirement

---

### 1.3 Rate Limiting Fail-Close

**Issue:** Rate limiting fails open (KV not bound)

**Implementation:**

```typescript
// serverless/src/middleware/rate-limit.ts

export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const key = config.keyGenerator(c);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const kv = c.env.RATE_LIMIT_KV;
    if (!kv) {
      // FAIL CLOSED - deny request if rate limiting unavailable
      console.error('[SECURITY] Rate limiting KV not bound - failing closed');

      return c.json(
        {
          error: 'rate_limit_config_error',
          message: 'Service temporarily unavailable - rate limiting misconfigured',
          retry_after: 60,
        },
        503
      );
    }

    // ... existing rate limiting logic
  };
};

// Alternative: Memory-based fallback for development
const memoryRateLimit = new Map<string, { count: number; windowStart: number }>();

export const rateLimitWithMemoryFallback = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const key = config.keyGenerator(c);
    const kv = c.env.RATE_LIMIT_KV;

    if (!kv) {
      // Use memory-based fallback (per-isolate, not production-safe)
      const now = Date.now();
      const windowStart = now - config.windowMs;

      let record = memoryRateLimit.get(key) || { count: 0, windowStart };

      if (now > record.windowStart + config.windowMs) {
        record = { count: 0, windowStart: now };
      }

      record.count++;

      if (record.count > config.maxRequests) {
        memoryRateLimit.set(key, record);
        return c.json({ error: 'rate_limit_exceeded', retry_after: 60 }, 429);
      }

      memoryRateLimit.set(key, record);
      return next();
    }

    // Use KV when available
    return rateLimitMiddleware(config)(c, next);
  };
};
```

**Steps:**
1. Change fail behavior from open to closed
2. Add memory fallback for development
3. Set up KV namespace in infrastructure
4. Document KV requirement

---

## P1: Feature Completion

### 2.1 Google Ads Conversion Upload

**Issue:** Conversion uploads are stubbed, not implemented

**Implementation:**

```typescript
// serverless/src/services/google-ads.ts

export async function uploadConversion(
  credentials: GoogleAdsCredentials,
  conversionData: ConversionData
): Promise<UploadResult> {
  try {
    // 1. Get fresh access token
    const accessToken = await getAccessToken(credentials);

    // 2. Validate GCLID format
    if (conversionData.gclid && !isValidGCLID(conversionData.gclid)) {
      return {
        success: false,
        errors: ['Invalid GCLID format'],
      };
    }

    // 3. Validate conversion time (within 90 days)
    const conversionTime = new Date(conversionData.conversionTime);
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
    if (Date.now() - conversionTime.getTime() > maxAge) {
      return {
        success: false,
        errors: ['Conversion is too old (must be within 90 days)'],
      };
    }

    // 4. Construct payload
    const clickConversion = {
      conversion_action: conversionData.conversionActionId,
      conversion_date_time: formatConversionTime(conversionTime),
      conversion_value: conversionData.conversionValue,
      currency_code: conversionData.currencyCode || 'USD',
      gclid: conversionData.gclid,
      order_id: conversionData.orderId,
      consent: {
        ad_user_data: 'GRANTED',
        ad_personalization: 'GRANTED',
      },
    };

    // 5. Make API call with retry
    const result = await retryWithBackoff(async () => {
      return await fetch(
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
    }, { maxRetries: 3, baseDelay: 1000 });

    const responseData = await result.json();

    if (!result.ok) {
      return {
        success: false,
        errors: [responseData.error?.message || 'API error'],
      };
    }

    if (responseData.partial_failure_error) {
      return {
        success: false,
        errors: [responseData.partial_failure_error.message],
      };
    }

    return {
      success: true,
      conversionAction: responseData.results?.[0]?.conversion_action,
      uploadDateTime: responseData.results?.[0]?.upload_date_time,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

function isValidGCLID(gclid: string): boolean {
  return /^GCLID_[A-Za-z0-9_-]{22,40}$/.test(gclid);
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelay: number }
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < options.maxRetries) {
        const delay = options.baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

**Steps:**
1. Implement conversion upload in google-ads.ts
2. Add GCLID validation
3. Add conversion time validation (90 days)
4. Add retry with exponential backoff
5. Update leads.ts to actually call upload
6. Add tests for conversion upload

---

### 2.2 KV Namespace Configuration

**Issue:** Rate limiting KV namespace not created

**Steps:**

1. Create KV namespace in Cloudflare:
```bash
wrangler kv:namespace create "RATE_LIMIT_KV"
```

2. Update wrangler.jsonc:
```json
{
  "kv_namespaces": [
    {
      "binding": "RATE_LIMIT_KV",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-id"
    }
  ]
}
```

3. Update OpenTofu:
```hcl
resource "cloudflare_workers_kv_namespace" "rate_limit" {
  account_id = local.account_id
  title       = "${var.worker_name}-rate-limit-${var.environment}"
}
```

4. Deploy and test rate limiting

---

### 2.3 Webhook Retry Mechanism

**Issue:** No retry for failed webhooks

**Implementation Options:**

**Option A: Client-side retry (Shopify/GHL responsibility)**
- Most platforms already retry failed webhooks
- Document expected behavior
- Return 2xx quickly, process async

**Option B: Queue-based retry (Recommended)**
```typescript
// When webhook received
adminRoutes.post('/webhook', async (c) => {
  const payload = await c.req.json();

  // Validate quickly
  if (!isValidPayload(payload)) {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  // Queue for async processing
  await c.env.WEBHOOK_QUEUE.send({
    payload,
    topic: c.req.header('X-Shopify-Topic'),
    shopDomain: c.req.header('X-Shopify-Shop-Domain'),
    receivedAt: new Date().toISOString(),
    retryCount: 0,
  });

  // Return immediately
  return c.json({ status: 'received' }, 202);
});

// Queue consumer
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const job = JSON.parse(message.body);

      try {
        await processWebhook(job);
        await message.ack();
      } catch (error) {
        if (job.retryCount < 3) {
          // Requeue with incremented retry count
          await env.WEBHOOK_QUEUE.send({
            ...job,
            retryCount: job.retryCount + 1,
            lastError: error.message,
          });
          await message.ack();
        } else {
          // Move to dead letter
          await env.DEAD_LETTER_QUEUE.send({
            ...job,
            failedAt: new Date().toISOString(),
            error: error.message,
          });
          await message.ack();
        }
      }
    }
  },
};
```

**Steps:**
1. Enable Cloudflare Queues (paid plan required)
2. Create webhook queue and dead letter queue
3. Update webhook handlers to queue instead of process sync
4. Implement queue consumer with retry logic
5. Set up monitoring for dead letter queue

---

## P2: Monitoring & Compliance

### 3.1 Monitoring Dashboard

**Issue:** No monitoring or alerting

**Implementation:**

```typescript
// serverless/src/services/monitoring.ts

interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];

  async record(name: string, value: number, tags: Record<string, string> = {}) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });
  }

  async flush(): Promise<Metric[]> {
    const batch = [...this.metrics];
    this.metrics = [];
    return batch;
  }
}

export const metrics = new MetricsCollector();

// Middleware to record request metrics
export const metricsMiddleware = () => {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const path = c.req.path;
    const method = c.req.method;

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      const status = c.res.status;

      await metrics.record('http_request_duration_ms', duration, {
        path,
        method,
        status: status.toString(),
      });
    }
  };
};

// Health check with all dependencies
export async function comprehensiveHealthCheck(env: Bindings): Promise<HealthCheckResult> {
  const checks: HealthCheck[] = [];

  // Database check
  try {
    const start = Date.now();
    await env.DB.prepare('SELECT 1').first();
    checks.push({
      service: 'database',
      status: Date.now() - start < 1000 ? 'healthy' : 'degraded',
      latency: Date.now() - start,
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // Encryption service check
  const encryptionHealthy = encryptionService.getHealthStatus().initialized;
  checks.push({
    service: 'encryption',
    status: encryptionHealthy ? 'healthy' : 'degraded',
  });

  return {
    status: checks.every(c => c.status === 'healthy')
      ? 'healthy'
      : checks.some(c => c.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  };
}
```

**Monitoring Stack Recommendation:**

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus + Grafana | Dashboards, alerting |
| Logs | ELK Stack or Datadog | Log aggregation |
| Errors | Sentry | Error tracking |
| Uptime | Pingdom or Cloudflare Health | Availability |
| APM | Datadog or New Relic | Performance |

---

### 3.2 GDPR Consent Fix

**Issue:** Consent validation happens after storage

**Implementation:**

```typescript
// serverless/src/routes/leads.ts

leadsRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const db = c.get('db');
  const body = await c.req.json();
  const leads: Lead[] = Array.isArray(body) ? body : [body];

  const validLeads: Lead[] = [];
  const deniedLeads: Lead[] = [];

  for (const lead of leads) {
    // Validate consent FIRST
    const consentValid = await validateConsent(lead, db);

    if (!consentValid) {
      deniedLeads.push({
        ...lead,
        consent_status: 'denied',
        consent_timestamp: new Date().toISOString(),
      });
      continue;
    }

    validLeads.push({
      ...lead,
      consent_status: 'granted',
      consent_timestamp: new Date().toISOString(),
    });
  }

  // Only store valid leads
  if (validLeads.length > 0) {
    const storedLeads = await Promise.all(
      validLeads.map((lead) =>
        db.insertLead({ ...lead, org_id: auth.org_id })
      )
    );
  }

  return c.json({
    success: true,
    processed: leads.length,
    stored: validLeads.length,
    denied: deniedLeads.length,
    denied_leads: deniedLeads.map(l => ({
      email: l.email,
      reason: 'consent_required',
    })),
  });
});

async function validateConsent(lead: Lead, db: Database): Promise<boolean> {
  // Check explicit consent status
  if (lead.consent_status === 'granted') {
    return true;
  }

  // Check for valid consent method
  if (lead.consent_method === 'cookie_banner' && lead.consent_timestamp) {
    // Consent was given via cookie banner
    return true;
  }

  // For webhooks, we need explicit consent flag
  // GHL/Shopify should pass consent status
  return false;
}
```

**Steps:**
1. Update consent validation to happen before storage
2. Document required consent fields for webhooks
3. Add GDPR compliance tests
4. Implement consent audit logging

---

## P3: Hardening & Quality

### 4.1 Circuit Breaker Pattern

**Implementation:**

```typescript
// serverless/src/services/circuit-breaker.ts

interface CircuitBreakerConfig {
  failureThreshold: number;  // Number of failures before opening
  successThreshold: number;  // Number of successes before closing
  timeout: number;           // Time to wait before trying again (ms)
}

export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = 'half-open';
      } else {
        throw new CircuitBreakerOpenError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

// Usage for external APIs
const googleAdsBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 60000,  // 1 minute
});

export async function safeUploadConversion(...): Promise<UploadResult> {
  return googleAdsBreaker.execute(async () => {
    return await uploadConversion(...);
  });
}
```

---

### 4.2 Dead Code Cleanup

**Steps:**

1. Run BiomeJS to find unused code:
```bash
cd serverless && pnpm biome check --unused-columns --unused-functions .
```

2. Remove unused variables:
- `HIGH_VALUE_THRESHOLD_CENTS` in leads.ts
- `error` variables in index.ts, waitlist.ts

3. Remove or implement stubs:
- `storeLeadTechnologies` function
- `createSecureErrorResponse` function

4. Delete or complete commented code:
- Queue consumer (implement or remove)
- Rate limiting (enable or remove)

---

### 4.3 Test Coverage Improvement

**Target:** 80% coverage

**Current Gaps:**
- Webhook HMAC validation
- Lead scoring algorithm
- GDPR endpoints
- Conversion upload retry
- Encryption/decryption
- Rate limiting

**Test Examples:**

```typescript
// serverless/tests/unit/auth.test.ts

describe('authMiddleware', () => {
  it('should reject token with invalid signature', async () => {
    const mockEnv = { JWT_SECRET: 'test-secret' };
    const mockContext = createMockContext({
      headers: { Authorization: 'Bearer invalid.signature' },
      env: mockEnv,
    });

    const middleware = authMiddleware();
    const response = await middleware(mockContext, mockNext);

    expect(response.status).toBe(401);
    expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: 'Invalid token signature' })
    );
  });

  it('should accept valid JWT token', async () => {
    const token = createTestJWT({
      sub: 'user-123',
      org_id: 'org-456',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }, 'test-secret');

    const mockContext = createMockContext({
      headers: { Authorization: `Bearer ${token}` },
      env: { JWT_SECRET: 'test-secret' },
    });

    const middleware = authMiddleware();
    await middleware(mockContext, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('auth', expect.objectContaining({
      user_id: 'user-123',
      org_id: 'org-456',
      role: 'admin',
    }));
  });
});
```

---

## Rollout Plan

### Week 1: Critical Security (P0)

| Day | Task | Owner |
|-----|------|-------|
| 1 | JWT signature verification | Security |
| 2 | Backup encryption fix | Backend |
| 3 | Rate limiting fix | Backend |
| 4 | Security testing | QA |
| 5 | Deploy to staging | DevOps |

### Week 2: Core Features (P1)

| Day | Task | Owner |
|-----|------|-------|
| 1 | Google Ads upload implementation | Backend |
| 2 | KV namespace setup | DevOps |
| 3 | Webhook retry mechanism | Backend |
| 4 | Integration testing | QA |
| 5 | Deploy to staging | DevOps |

### Week 3-4: Monitoring & Hardening (P2/P3)

| Week | Task | Owner |
|------|------|-------|
| 3 | Monitoring dashboard | SRE |
| 3 | GDPR compliance fix | Backend |
| 4 | Circuit breakers | Backend |
| 4 | Test coverage > 80% | QA |
| 4 | Production deployment | DevOps |

---

## Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Security vulnerabilities (critical) | 0 | 2+ |
| Test coverage | 80% | Unknown |
| Conversion upload success rate | 99% | 0% (stubbed) |
| API latency (p95) | <500ms | Unknown |
| Uptime SLA | 99.9% | N/A |
| GDPR compliance | Pass audit | Questionable |

---

## Emergency Procedures

### If JWT Bug Exploited

1. **Immediate:** Rotate JWT_SECRET via Doppler
2. **Notify:** All customers to re-authenticate
3. **Audit:** Check admin logs for unauthorized access
4. **Patch:** Deploy fix within 4 hours

### If Backup Returns Unencrypted

1. **Immediate:** Disable backup endpoint
2. **Notify:** Security team
3. **Audit:** Check who accessed unencrypted backups
4. **Patch:** Deploy fix within 24 hours

### If Conversion Data Lost

1. **Assess:** Determine extent of data loss
2. **Notify:** Affected customers
3. **Recover:** Attempt from Google Ads API
4. **Prevent:** Implement queue-based processing

---

## Resources Required

| Resource | Quantity | Purpose |
|----------|----------|---------|
| Backend Engineer | 1 FTE | Implementation |
| Security Engineer | 0.25 FTE | Review |
| DevOps Engineer | 0.25 FTE | Infrastructure |
| QA Engineer | 0.5 FTE | Testing |
| Cloudflare Paid Plan | 1 | Queues, Workers |
| Monitoring Tooling | 1 | ELK/Prometheus |

**Estimated Cost:**
- Cloudflare: $25-100/month (depending on usage)
- Monitoring: $50-200/month
- Engineering: ~3 person-months

---

## Conclusion

This mitigation plan addresses all critical and high-priority risks identified in the Code Critic and Code Skeptic reviews.

**Timeline:** 4 weeks for full implementation  
**Investment:** ~3 person-months  
**Outcome:** Production-ready, enterprise-grade system

---

**Last Updated:** 2024-01-15  
**Next Review:** 2024-02-15
