# P0 Security Fix Sprint

**Sprint Goal:** Fix all critical security vulnerabilities (JWT signature verification, backup encryption, rate limiting)  
**Duration:** 1 week (5 days)  
**Start Date:** 2024-01-20  
**End Date:** 2024-01-24  
**Definition of Done:** All P0 issues resolved, security review passed, tests passing

---

## Executive Summary

**CRITICAL:** The AdsEngineer codebase has multiple critical security vulnerabilities that allow authentication bypass and data exposure. This sprint fixes all P0 issues before any other work proceeds.

**Vulnerabilities Found:**
1. **JWT-001:** JWT tokens can be forged (no signature verification) - CRITICAL
2. **ENC-001:** Backup returns unencrypted data - CRITICAL  
3. **RL-001:** Rate limiting fails open - HIGH

**Impact Assessment:**
- JWT-001 allows complete authentication bypass → attackers can access admin endpoints
- ENC-001 exposes sensitive customer data in backups → data breach risk
- RL-001 allows DDoS attacks → service availability risk

---

## Scope

### In Scope
- JWT signature verification implementation
- Backup encryption fail-close implementation
- Rate limiting fail-close implementation
- All associated tests
- Security review of fixes

### Out of Scope
- Any feature development (post-sprint)
- Frontend changes
- Monitoring implementation (post-sprint)

---

## Requirements

### SEC-001: JWT Signature Verification

**Priority:** P0-CRITICAL  
**Story Points:** 5  
**Severity:** CRITICAL  
**CVSS Score:** 9.8 (Critical)

**Description:**
JWT tokens are currently decoded but NOT verified. Attackers can forge tokens and gain admin access.

**Current Vulnerable Code:**
```typescript
// serverless/src/middleware/auth.ts
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
// ❌ NO SIGNATURE VERIFICATION!
```

**Attack Vector:**
```javascript
// Attacker creates fake JWT
const fakeToken = btoa(JSON.stringify({
  sub: 'victim_user_id',
  org_id: 'victim_org_id',
  role: 'admin',
  exp: 9999999999
})) + '.' + btoa('{}') + '.signature_here';

// Sends to /api/v1/admin/backup
// ✅ ACCESS GRANTED - No signature verification!
```

**Fix Required:**
```typescript
import { createHmac } from 'crypto';

interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  org_id?: string;
  role?: string;
}

function verifyJWTSignature(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  const [header, payload, signature] = parts;
  const expectedSignature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  
  // Timing-safe comparison
  return timingSafeEqual(signature, expectedSignature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**Acceptance Criteria:**
- [ ] JWT signature verified before token acceptance
- [ ] Invalid signatures return 401 with "Invalid token signature"
- [ ] Token issuer (iss) validated to be "adsengineer"
- [ ] Token audience (aud) validated to be "adsengineer-api"
- [ ] Expired tokens rejected with 401
- [ ] All existing auth tests pass
- [ ] New tests cover signature verification
- [ ] Security review confirms fix

**Test Cases:**
```typescript
describe('JWT Signature Verification', () => {
  it('rejects token with invalid signature', async () => {
    const token = createTestToken({ role: 'admin' }, 'wrong-secret');
    const response = await request('/api/v1/admin/backup')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Invalid token signature');
  });

  it('rejects token with wrong issuer', async () => {
    const token = createTestToken({ iss: 'attacker', role: 'admin' });
    const response = await request('/api/v1/admin/backup')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('rejects expired token', async () => {
    const token = createTestToken({ exp: Date.now() / 1000 - 3600 });
    const response = await request('/api/v1/admin/backup')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('expired');
  });

  it('accepts valid token', async () => {
    const token = createTestToken({ role: 'admin' });
    const response = await request('/api/v1/admin/backup')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
```

---

### SEC-002: Backup Encryption Fail-Close

**Priority:** P0-CRITICAL  
**Story Points:** 3  
**Severity:** CRITICAL  
**CVSS Score:** 9.1 (Critical)

**Description:**
Backup endpoint returns unencrypted sensitive data when BACKUP_ENCRYPTION_KEY is not configured.

**Current Vulnerable Code:**
```typescript
// serverless/src/routes/admin.ts
if (!encryptionKey) {
  return c.json({
    warning: 'BACKUP_ENCRYPTION_KEY not set - returning unencrypted',
    ...backup,  // ❌ EXPOSES SENSITIVE DATA!
  });
}
```

**Data Exposed:**
- Customer emails
- Lead data
- Conversion logs
- Internal metrics

**Fix Required:**
```typescript
adminRoutes.get('/backup', async (c) => {
  const encryptionKey = c.env.BACKUP_ENCRYPTION_KEY;

  if (!encryptionKey) {
    // Log security event
    await logSecurityEvent(c, 'backup_attempt_without_key', {
      ip: c.req.header('CF-Connecting-IP'),
      timestamp: new Date().toISOString(),
      userAgent: c.req.header('User-Agent'),
    });

    // Return error - NO DATA
    return c.json({
      success: false,
      error: 'Backup encryption not configured',
      code: 'BACKUP_ENCRYPTION_REQUIRED',
      message: 'Cannot perform backup without encryption key. Contact administrator.',
    }, 503);
  }

  // Proceed with encrypted backup
  const backup = await createEncryptedBackup(c.get('db'), encryptionKey);
  return c.json(backup);
});
```

**Acceptance Criteria:**
- [ ] Backup returns 503 when encryption key missing
- [ ] No unencrypted data in response
- [ ] Security event logged
- [ ] Alert triggered
- [ ] Documentation updated
- [ ] Tests verify fail-close behavior

**Test Cases:**
```typescript
describe('Backup Encryption', () => {
  it('returns 503 when encryption key not configured', async () => {
    const response = await request('/api/v1/admin/backup')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('BACKUP_ENCRYPTION_REQUIRED');
    expect(response.body.data).toBeUndefined();
  });

  it('does not include backup data in error response', async () => {
    const response = await request('/api/v1/admin/backup');
    expect(response.body.leads).toBeUndefined();
    expect(response.body.waitlist).toBeUndefined();
  });

  it('logs security event', async () => {
    await request('/api/v1/admin/backup');
    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.any(Object),
      'backup_attempt_without_key',
      expect.objectContaining({ ip: expect.any(String) })
    );
  });
});
```

---

### SEC-003: Rate Limiting Fail-Close

**Priority:** P0-HIGH  
**Story Points:** 5  
**Severity:** HIGH  
**CVSS Score:** 7.5 (High)

**Description:**
Rate limiting middleware fails OPEN when KV namespace is not bound, allowing DDoS attacks.

**Current Vulnerable Code:**
```typescript
// serverless/src/middleware/rate-limit.ts
const kv = c.env.RATE_LIMIT_KV;
if (!kv) {
  console.warn('RATE_LIMIT_KV not bound, skipping rate limiting');
  return next();  // ❌ FAIL OPEN - NO PROTECTION!
}
```

**Attack Vector:**
- Attacker discovers RATE_LIMIT_KV not bound
- Sends 10,000 requests/second
- No rate limiting applied
- Database overwhelmed
- Service unavailable for all users

**Fix Required:**
```typescript
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const kv = c.env.RATE_LIMIT_KV;
    
    // FAIL CLOSED - Security first
    if (!kv) {
      console.error('[SECURITY] Rate limiting KV not bound - failing closed');
      
      return c.json({
        error: 'rate_limit_config_error',
        message: 'Service temporarily unavailable',
        retry_after: 60,
      }, 503);
    }

    // Existing rate limiting logic...
  };
};

// Memory fallback for development (documented, not for production)
const memoryRateLimit = new Map<string, { count: number; windowStart: number }>();

export const rateLimitWithFallback = (config: RateLimitConfig) => {
  return async (c: Context, next: Next) => {
    const kv = c.env.RATE_LIMIT_KV;
    
    if (!kv) {
      // Development fallback - log warning
      console.warn('[DEV] Using memory-based rate limiting (not for production)');
      return memoryRateLimitFallback(config)(c, next);
    }
    
    return rateLimitMiddleware(config)(c, next);
  };
};
```

**Acceptance Criteria:**
- [ ] Returns 503 when KV not bound
- [ ] Memory fallback available for development
- [ ] IP-based rate limiting: 100 requests/hour
- [ ] Shop-based rate limiting: 1000 requests/hour
- [ ] Rate limit headers included
- [ ] KV namespace configured in infrastructure
- [ ] Tests verify fail-close behavior

**Test Cases:**
```typescript
describe('Rate Limiting Fail-Close', () => {
  it('returns 503 when KV not bound', async () => {
    const response = await request('/api/v1/shopify/webhook')
      .set('X-Shopify-Shop-Domain', 'test.myshopify.com')
      .send(testPayload);
    expect(response.status).toBe(503);
    expect(response.body.error).toContain('rate_limit_config_error');
  });

  it('includes Retry-After header', async () => {
    const response = await request('/api/v1/shopify/webhook');
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('allows requests within limit when KV bound', async () => {
    // Mock KV as bound
    const response = await request('/api/v1/shopify/webhook')
      .set('X-Shopify-Shop-Domain', 'test.myshopify.com')
      .send(testPayload);
    expect(response.status).toBe(200);
  });
});
```

---

## Tasks

### Task 1: JWT Signature Verification Implementation
**Status:** Pending  
**Priority:** P0  
**Story Points:** 5  
**Hours:** 16  
**Owner:** Backend Engineer  
**Dependencies:** None

**Subtasks:**
- [ ] Add crypto utilities for HMAC signature
- [ ] Implement signature verification in auth middleware
- [ ] Add issuer validation
- [ ] Add audience validation
- [ ] Update token creation to include signature
- [ ] Update OpenAPI spec

**Files Modified:**
- `serverless/src/middleware/auth.ts`
- `serverless/src/openapi.ts`

---

### Task 2: JWT Tests
**Status:** Pending  
**Priority:** P0  
**Story Points:** 3  
**Hours:** 8  
**Owner:** QA Engineer  
**Dependencies:** Task 1

**Subtasks:**
- [ ] Create `serverless/tests/unit/auth.test.ts`
- [ ] Write signature verification tests
- [ ] Write issuer validation tests
- [ ] Write audience validation tests
- [ ] Write expiration tests
- [ ] Achieve 90% coverage

---

### Task 3: Backup Encryption Fix
**Status:** Pending  
**Priority:** P0  
**Story Points:** 3  
**Hours:** 8  
**Owner:** Backend Engineer  
**Dependencies:** None

**Subtasks:**
- [ ] Modify backup endpoint to fail close
- [ ] Add security event logging
- [ ] Add alert trigger
- [ ] Update OpenAPI spec
- [ ] Update documentation

**Files Modified:**
- `serverless/src/routes/admin.ts`
- `serverless/src/openapi.ts`

---

### Task 4: Backup Encryption Tests
**Status:** Pending  
**Priority:** P0  
**Story Points:** 2  
**Hours:** 4  
**Owner:** QA Engineer  
**Dependencies:** Task 3

**Subtasks:**
- [ ] Create `serverless/tests/unit/backup.test.ts`
- [ ] Test 503 response when key missing
- [ ] Test no data in error response
- [ ] Test security event logging

---

### Task 5: Rate Limiting Fix
**Status:** Pending  
**Priority:** P0  
**Story Points:** 5  
**Hours:** 12  
**Owner:** Backend Engineer  
**Dependencies:** None

**Subtasks:**
- [ ] Modify rateLimitMiddleware to fail close
- [ ] Add memory fallback for development
- [ ] Add rate limit headers
- [ ] Update wrangler.jsonc
- [ ] Update OpenTofu for KV namespace

**Files Modified:**
- `serverless/src/middleware/rate-limit.ts`
- `serverless/wrangler.jsonc`
- `infrastructure/main.tf`

---

### Task 6: Rate Limiting Tests
**Status:** Pending  
**Priority:** P0  
**Story Points:** 3  
**Hours:** 6  
**Owner:** QA Engineer  
**Dependencies:** Task 5

**Subtasks:**
- [ ] Create `serverless/tests/unit/rate-limit.test.ts`
- [ ] Test fail-close behavior
- [ ] Test request allowance
- [ ] Test rate limit headers
- [ ] Achieve 90% coverage

---

### Task 7: Security Review
**Status:** Pending  
**Priority:** P0  
**Story Points:** 3  
**Hours:** 8  
**Owner:** Security Engineer  
**Dependencies:** Tasks 1, 3, 5

**Subtasks:**
- [ ] Review JWT implementation
- [ ] Review backup implementation
- [ ] Review rate limiting implementation
- [ ] Document findings
- [ ] Provide sign-off

---

### Task 8: Dead Code Cleanup
**Status:** Pending  
**Priority:** P0  
**Story Points:** 2  
**Hours:** 4  
**Owner:** Backend Engineer  
**Dependencies:** None

**Subtasks:**
- [ ] Remove unused variable `error` in index.ts
- [ ] Remove unused `consentSummary` variable in leads.ts
- [ ] Remove unused `storeLeadTechnologies` function
- [ ] Remove unused `HIGH_VALUE_THRESHOLD_CENTS` variable
- [ ] Remove unused `createSecureErrorResponse` reference
- [ ] Remove unused variable `e` in shopify.ts
- [ ] Remove unused variable `error` in waitlist.ts
- [ ] Remove unused `sendToSecurityMonitoring` method

**Files Modified:**
- `serverless/src/index.ts`
- `serverless/src/routes/leads.ts`
- `serverless/src/routes/shopify.ts`
- `serverless/src/routes/waitlist.ts`
- `serverless/src/services/logging.ts`

---

### Task 9: Deploy to Staging
**Status:** Pending  
**Priority:** P0  
**Story Points:** 2  
**Hours:** 4  
**Owner:** DevOps Engineer  
**Dependencies:** All other tasks

**Subtasks:**
- [ ] Merge all fixes to main
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Smoke test all endpoints

---

### Task 10: Production Security Check
**Status:** Pending  
**Priority:** P0  
**Story Points:** 2  
**Hours:** 4  
**Owner:** Security Engineer  
**Dependencies:** Task 9

**Subtasks:**
- [ ] Verify fixes in staging
- [ ] Penetration test (basic)
- [ ] Document security status
- [ ] Provide production sign-off

---

## Test Coverage Requirements

| Module | Coverage Target |
|--------|----------------|
| auth.ts | 95% |
| admin.ts | 90% |
| rate-limit.ts | 95% |

---

## Definition of Done

- [ ] All P0 vulnerabilities fixed
- [ ] JWT signature verification implemented and tested
- [ ] Backup encryption fail-close implemented and tested
- [ ] Rate limiting fail-close implemented and tested
- [ ] All dead code removed
- [ ] Security review passed
- [ ] Test coverage targets met
- [ ] Deployed to staging
- [ ] Production sign-off from security

---

## Timeline

| Day | Task | Owner |
|-----|------|-------|
| 1 | JWT implementation | Backend |
| 2 | JWT tests + Backup fix | QA + Backend |
| 3 | Rate limiting fix | Backend |
| 4 | Rate limiting tests + Dead code cleanup | QA + Backend |
| 5 | Security review + Deploy | Security + DevOps |

---

## Dependencies

### External
- None (uses existing infrastructure)

### Internal
- All tasks depend on their predecessor tests

---

## Budget

| Category | Amount |
|----------|--------|
| Engineering (2 person-weeks) | ~$16,000 |
| Security audit | ~$2,000 |
| **Total** | **~$18,000** |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fix introduces regression | High | Comprehensive tests, staged rollout |
| JWT token invalidation | Medium | Graceful migration, old tokens still work 24h |
| Performance impact | Low | HMAC-SHA256 is fast |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| P0 vulnerabilities | 0 |
| Test coverage (auth) | >95% |
| Test coverage (rate-limit) | >95% |
| Security review | Pass |
| Production sign-off | Obtained |

---

**Created:** 2024-01-15  
**Version:** 1.0.0  
**Priority:** P0-CRITICAL
