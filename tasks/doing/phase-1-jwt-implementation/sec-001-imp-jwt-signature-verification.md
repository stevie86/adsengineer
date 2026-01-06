---
task_id: "SEC-001-IMP"
title: "JWT Signature Verification Implementation"
priority: "P0-CRITICAL"
story_points: 5
hours: 16
owner: "Backend Engineer"
dependencies: []
lane: "doing"
assignee: "Sisyphus AI Agent"
agent: "claude"
shell_pid: "24053"
review_status: ""
---

# Task: JWT Signature Verification Implementation

**Priority:** P0-CRITICAL
**Story Points:** 5
**Hours:** 16
**Owner:** Backend Engineer

## Description
Implement HMAC-SHA256 signature verification for JWT tokens to prevent authentication bypass attacks.

## Business Context
JWT tokens are currently decoded but NOT verified, allowing attackers to forge tokens and gain admin access to the system. This is a critical security vulnerability that must be fixed immediately.

## Technical Requirements

### Current Vulnerable Code
```typescript
// serverless/src/middleware/auth.ts - CURRENT (VULNERABLE)
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

### Required Implementation

#### 1. Create Crypto Utilities (`serverless/src/utils/crypto.ts`)
```typescript
import { createHmac } from 'crypto';

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verifyHMACSignature(
  message: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = createHmac(algorithm, secret)
    .update(message)
    .digest('base64url');

  return timingSafeEqual(signature, expectedSignature);
}
```

#### 2. Create JWT Service (`serverless/src/services/jwt.ts`)
```typescript
import { verifyHMACSignature, timingSafeEqual } from '../utils/crypto';

interface JWTPayload {
  sub: string;      // Subject (user ID)
  iss: string;      // Issuer
  aud: string;      // Audience
  exp: number;      // Expiration time
  iat?: number;     // Issued at
  org_id?: string;  // Organization ID
  role?: string;    // User role
}

export class JWTService {
  constructor(private secret: string) {}

  verifyToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;

      // Verify signature
      const message = `${headerB64}.${payloadB64}`;
      if (!verifyHMACSignature(message, signatureB64, this.secret)) {
        return null; // Invalid signature
      }

      // Decode payload
      const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload: JWTPayload = JSON.parse(payloadJson);

      // Validate claims
      if (!this.validateClaims(payload)) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  private validateClaims(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Check issuer
    if (payload.iss !== 'adsengineer') {
      return false;
    }

    // Check audience
    if (payload.aud !== 'adsengineer-api') {
      return false;
    }

    return true;
  }

  createToken(payload: Omit<JWTPayload, 'iss' | 'aud' | 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iss: 'adsengineer',
      aud: 'adsengineer-api',
      iat: now,
      exp: now + 3600, // 1 hour
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const message = `${headerB64}.${payloadB64}`;
    const signature = createHmac('sha256', this.secret)
      .update(message)
      .digest('base64url');

    return `${message}.${signature}`;
  }
}
```

#### 3. Update Auth Middleware (`serverless/src/middleware/auth.ts`)
```typescript
import { JWTService } from '../services/jwt';

let jwtService: JWTService;

export function initializeAuth(secret: string) {
  jwtService = new JWTService(secret);
}

export function authenticateRequest(c: Context): JWTPayload | null {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  return jwtService.verifyToken(token);
}

// Legacy function for backward compatibility (remove after migration)
export function decodeJWT(token: string): JWTPayload | null {
  console.warn('decodeJWT is deprecated and insecure. Use JWTService.verifyToken instead.');
  // Return null to force migration to new system
  return null;
}
```

#### 4. Update OpenAPI Spec (`serverless/src/openapi.ts`)
```typescript
// Update authentication section to reflect JWT requirements
auth: {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT token with HMAC-SHA256 signature verification'
}
```

## Files Created
- `serverless/src/utils/crypto.ts`
- `serverless/src/services/jwt.ts`

## Files Modified
- `serverless/src/middleware/auth.ts`
- `serverless/src/openapi.ts`

## Acceptance Criteria
- [ ] JWT signature verified before token acceptance
- [ ] Invalid signatures return 401 with "Invalid token signature"
- [ ] Token issuer (iss) validated to be "adsengineer"
- [ ] Token audience (aud) validated to be "adsengineer-api"
- [ ] Expired tokens rejected with 401
- [ ] All existing tests pass
- [ ] New tests cover signature verification
- [ ] Security review confirms fix

## Testing Requirements
- Unit tests for JWTService.verifyToken()
- Unit tests for crypto utilities
- Integration tests for auth middleware
- Security tests for signature verification
- Backward compatibility tests

## Dependencies
- Node.js crypto module (built-in)
- Existing auth middleware structure

## Risk Mitigation
- Implement gradual rollout to avoid breaking existing tokens
- Provide migration path for existing token usage
- Comprehensive testing before production deployment

---

## Activity Log

- 2026-01-06T20:58:00Z – Sisyphus AI Agent – shell_pid=24053 – lane=doing – Started JWT signature verification implementation