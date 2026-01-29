# Security Policy and Rules

## Overview
This repository contains confidential configuration and handles sensitive user data. All contributors must follow these security guidelines.

## Security Best Practices

### 1. Secrets Management

**ALWAYS use Doppler:** Never commit `.env` files or secrets directly.

Setup:
```bash
# Install Doppler CLI
curl -sS https://cli.doppler.com/install.sh | sh

# Authenticate
doppler login

# Use secrets in commands
doppler run -- wrangler deploy
```

### 2. No Secrets in Code

❌ FORBIDDEN:
```javascript
const API_KEY = 'sk_live_12345';  // Never do this
```

✅ CORRECT:
```javascript
const API_KEY = env.API_KEY;  // Worker environment var
```

### 3. Dependency Scanning

Run security scan before pushing:
```bash
cd serverless && pnpm audit
pnpm depsync audit
```

### 4. Input Validation

All API inputs MUST be validated:
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/),
});

// In routes
export const POST = async (c) => {
  const body = await c.req.json();
  const validated = CreateUserSchema.parse(body);
  // ... rest of handler
};
```

### 5. Rate Limiting

All endpoints MUST have rate limiting:
```typescript
import { RateLimiter } from './services/rate-limiter';

const limiter = new RateLimiter({ requests: 100, window: '1m' });

if (!limiter.check(c.env.CF_ID)) {
  return c.text('Too many requests', { status: 429 });
}
```

### 6. Authentication & Authorization

```typescript
// Verify JWT in middleware
import { verifyJWT } from './utils/auth';

const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.text('Unauthorized', { status: 401 });
  }
  
  try {
    const user = await verifyJWT(token, env.JWT_SECRET);
    c.set('user', user);
    await next();
  } catch {
    return c.text('Invalid token', { status: 401 });
  }
};
```

### 7. CORS Configuration

Restrict CORS origins:
```typescript
app.use('*', cors({
  origin: '*',  // BAD - REMOVE THIS
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// CORRECT:
app.use('*', cors({
  origin: ['https://adsengineer.cloud', 'https://dashboard.adsengineer.cloud'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
```

## Security Rulesets

### Web Application Firewall (WAF)

Rate limiting rules:
```typescript
import { Rule } from '@cloudflare/workers-types';

export const wafRules: Rule[] = [
  {
    action: 'block',
    expression: 'http.request.uri.path contains \"../\"',
    description: 'Block path traversal',
  },
  {
    action: 'block',
    expression: 'http.request.body contains \"<script\"',
    description: 'Block XSS attempts',
  },
  {
    action: 'block',
    expression: 'http.request.body contains \"union all select\"',
    description: 'Block SQL injection',
  },
  {
    action: 'ratelimit',
    expression: 'http.request.uri.path startsWith \"/api/\"',
    description: 'Rate limit API endpoints',
  },
];
```

### Content Security Policy (CSP)

```astro
---
const CSP = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://www.googletagmanager.com',
    'https://www.gstatic.com',
  ],
  'frame-src': ['https://cal.com'],
  'connect-src': [
    "'self'",
    'https://*.google-analytics.com',
    'https://*.google.com',
  ],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https:'],
};

const cspHeader = Object.entries(CSP)
  .map(([key, values]) => `${key} ${values.join(' ')}`)
  .join('; ')
  .replace(/:/g, '-');

// In Layout.astro
---
<head>
  <meta http-equiv="Content-Security-Policy" content={cspHeader} />
</head>
```

## Secret Rotation Policy

### Required Secrets:

```
# Production Secrets (Doppler)
JWT_SECRET=256-bit random string
DB_ENCRYPTION_KEY=256-bit random string
STRIPE_SECRET_KEY=sk_live_XXXX
CLOUDFLARE_API_TOKEN=For deployment only
GCP_SERVICE_ACCOUNT_KEY=For backups
```

### Rotation Schedule:

- **JWT_SECRET:** Every 90 days
- **DB_ENCRYPTION_KEY:** Every 180 days (requires key rotation procedure)
- **STRIPE_SECRET_KEY:** Event-based (Stripe API events)
- **API Keys:** Immediately after compromise

Rotation procedure:
1. Generate new secret
2. Deploy service with both old and new
3. Update dependencies on new secret
4. Remove old secret after 24 hours

## Incident Response

### Security Incident Steps:

1. **Containment:**
   - Block affected endpoints
   - Rotate compromised secrets
   - Enable enhanced logging

2. **Assessment:**
   - Review access logs
   - Identify root cause
   - Determine data exposure

3. **Communication:**
   - Notify stakeholders
   - Post public security advisory (if needed)
   - Document remediation steps

4. **Remediation:**
   - Patch vulnerabilities
   - Strengthen controls
   - Update security policies

5. **Post-Incident Review:**
   - Document timeline
   - Update procedures
   - Conduct security training

## Compliance Notes

- **GDPR:** EU data sovereignty ensured
- **SOC 2:** Review access controls and logging
- **HIPAA:** Not applicable (no PHI)
- **PCI DSS:** Not directly compliant (uses Stripe)

## Checklist for Commits

- [ ] No hardcoded secrets
- [ ] Input validation added
- [ ] Rate limiting configured
- [ ] Error messages don't leak info
- [ ] CSP headers set
- [ ] CORS restricted
- [ ] Auth middleware added
- [ ] Dependencies scanned
- [ ] Security tests pass