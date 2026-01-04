# Configuration

Complete setup guide for AdsEngineer environments and secrets.

## Environment Variables

AdsEngineer uses Doppler for secure secrets management.

### Required Secrets

Set these via Doppler CLI:

```bash
# Cloudflare Infrastructure
doppler secrets set CLOUDFLARE_API_TOKEN <your_api_token>
doppler secrets set CLOUDFLARE_ACCOUNT_ID <your_account_id>

# Application Security
doppler secrets set JWT_SECRET <your_jwt_secret>
doppler secrets set GHL_WEBHOOK_SECRET <your_ghl_webhook_secret>
doppler secrets set ADMIN_TOKEN <your_admin_token>

# Encryption
doppler secrets set ENCRYPTION_KEY <your_32_byte_key>

# Environment
doppler secrets set ENVIRONMENT development
```

### Optional Secrets

```bash
# Stripe Integration
doppler secrets set STRIPE_SECRET_KEY sk_test_...
doppler secrets set STRIPE_PUBLISHABLE_KEY pk_test_...
doppler secrets set STRIPE_WEBHOOK_SECRET whsec_...

# Google Ads Integration
doppler secrets set GOOGLE_ADS_DEVELOPER_TOKEN <your_dev_token>
doppler secrets set GOOGLE_ADS_CLIENT_ID <client_id>.apps.googleusercontent.com
doppler secrets set GOOGLE_ADS_CLIENT_SECRET <your_client_secret>

# Monitoring
doppler secrets set SENTRY_DSN https://...@sentry.io/...
```

## Environment Configuration

### Development
```bash
doppler run --config=dev -- pnpm dev
```

### Staging
```bash
doppler run --config=staging -- pnpm deploy
```

### Production
```bash
doppler run --config=production -- pnpm deploy
```

## Infrastructure as Code

### OpenTofu Setup

```bash
cd infrastructure

# Initialize OpenTofu
tofu init

# Plan changes
tofu plan -var="environment=development"

# Apply changes
tofu apply -var="environment=development"
```

### Environment Variables

| Environment | Worker Name | Database Name |
|-------------|---------------|---------------|
| development | advocate-cloud-dev | advocate-db |
| staging | advocate-cloud-staging | advocate-db |
| production | advocate-cloud | advocate-db |

## Local Development

### Wrangler Configuration

```jsonc
{
  "name": "advocate-cloud",
  "main": "src/index.ts",
  "compatibility_date": "2024-08-20",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "advocate-db",
      "database_id": "d262a6f7-a378-45d9-9a74-5f4264304bc6"
    }
  ]
}
```

### Database Migrations

```bash
cd serverless

# Apply migrations
wrangler d1 migrations apply advocate-db --remote

# Create new migration
wrangler d1 migrations create <migration_name>
```

## Package Scripts

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "types:check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Security Configuration

### JWT Settings

- **Algorithm:** HS256
- **Expiration:** 24 hours
- **Secret:** 32+ bytes recommended

### Rate Limiting

- **API:** 60 requests/minute
- **Webhooks:** 100 requests/hour per IP
- **Admin:** 30 requests/minute

### Encryption

- **Algorithm:** AES-256-GCM
- **Key Storage:** Doppler secrets
- **Field-level encryption** for sensitive data

## Monitoring & Logging

### Structured Logging

```typescript
import { logger } from './services/logging';

logger.log('INFO', 'Lead captured', { lead_id: '123', email: 'user@example.com' }, context);
```

### Error Tracking

```typescript
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: c.env.SENTRY_DSN,
  environment: c.env.ENVIRONMENT,
});
```

## Production Checklist

Before deploying to production:

- [ ] All secrets set in production Doppler config
- [ ] Infrastructure provisioned with production environment
- [ ] Database migrations applied
- [ ] Rate limits configured for production load
- [ ] Security headers implemented
- [ ] Monitoring and alerting configured
- [ ] SSL certificates configured
- [ ] Backup procedures tested

## Troubleshooting

### Common Issues

**"WRANGLER_AUTH_TOKEN not set"**
```bash
# Check Doppler is configured
doppler secrets list

# Run with Doppler
doppler run -- wrangler whoami
```

**"Database connection failed"**
```bash
# Check D1 binding in wrangler.jsonc
# Verify database exists: wrangler d1 list
# Check migration status: wrangler d1 migrations list
```

**"Rate limit exceeded"**
```bash
# Check rate limit headers
curl -I https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads

# Implement exponential backoff in client
```

---

**Next:** Read [Deployment](Deployment.md) for production deployment.