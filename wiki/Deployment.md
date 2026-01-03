# Deployment

Production deployment guide for AdsEngineer.

## Prerequisites

- Doppler CLI configured
- Cloudflare account with Workers enabled
- OpenTofu installed
- Production secrets set

## Production Deployment

### 1. Infrastructure Setup

```bash
cd infrastructure

# Plan production changes
tofu plan -var="environment=production"

# Apply infrastructure
tofu apply -var="environment=production"
```

### 2. Deploy Worker

```bash
cd serverless

# Deploy with production secrets
doppler run --config=production -- pnpm deploy
```

### 3. Health Check

```bash
# Verify deployment
curl -f https://advocate-cloud.adsengineer.workers.dev/health

# Check API docs
curl https://advocate-cloud.adsengineer.workers.dev/openapi.json | jq '.info.version'
```

## Automated Deployment

### GitHub Actions

Push to main branch triggers automatic deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy Cloudflare Worker

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dopplerhq/cli-action@v4
      - run: doppler run -- pnpm deploy
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

### Infrastructure Changes

Infrastructure changes trigger separate workflow:

```yaml
# .github/workflows/infrastructure.yml
name: Infrastructure Provisioning

on:
  push:
    paths:
      - 'infrastructure/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dopplerhq/cli-action@v4
      - run: |
        cd infrastructure
        doppler run -- tofu apply -var="environment=production"
        env:
          DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

## Environment Management

### Development

```bash
# Local development
./provision-infrastructure.sh development
cd serverless
doppler run --config=dev -- pnpm dev
```

### Staging

```bash
# Staging deployment
./provision-infrastructure.sh staging
cd serverless
doppler run --config=staging -- pnpm deploy
```

### Production

```bash
# Production deployment
./provision-infrastructure.sh production
cd serverless
doppler run --config=production -- pnpm deploy
```

## Rollback Procedures

### Worker Rollback

```bash
# Deploy previous version
cd serverless
git checkout <previous_commit_hash>
doppler run --config=production -- pnpm deploy

# Return to latest
git checkout main
```

### Infrastructure Rollback

```bash
cd infrastructure

# View state history
tofu state list

# Restore previous state
tofu state restore <backup_file>

# Re-apply with version lock
tofu apply -var="environment=production" -lock=true
```

## Monitoring

### Health Checks

```bash
# Automated health check
#!/bin/bash
HEALTH_URL="https://advocate-cloud.adsengineer.workers.dev/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Service is healthy"
else
    echo "❌ Service is down (HTTP $RESPONSE)"
    # Trigger alert
    curl -X POST "https://alerts.example.com/webhook" \
         -d "service=adsengineer&status=down&code=$RESPONSE"
fi
```

### Performance Monitoring

```bash
# Load testing
cd serverless
doppler run -- pnpm test:performance

# Check response times
curl -w "@curl-format.txt" \
     https://advocate-cloud.adsengineer.workers.dev/health
```

## Security

### SSL/TLS

- Cloudflare Workers automatically enforce HTTPS
- Custom domains need SSL in Cloudflare dashboard
- HSTS headers enabled by default

### Secret Rotation

```bash
# Rotate JWT secret
NEW_SECRET=$(openssl rand -base64 32)
doppler secrets set JWT_SECRET "$NEW_SECRET" -c production

# Rotate webhook secrets
NEW_WEBHOOK_SECRET=$(openssl rand -hex 32)
doppler secrets set GHL_WEBHOOK_SECRET "$NEW_WEBHOOK_SECRET" -c production

# Redeploy to activate new secrets
doppler run --config=production -- pnpm deploy
```

## Backup and Recovery

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_URL="https://advocate-cloud.adsengineer.workers.dev/api/v1/admin/backup"
ADMIN_TOKEN=$(doppler secrets get ADMIN_TOKEN -c production)

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "$BACKUP_URL" | jq . > "backup-$(date +%Y%m%d).json"

# Upload to secure storage
aws s3 cp "backup-$(date +%Y%m%d).json" \
    s3://adsengineer-backups/production/
```

### Recovery

```bash
# Restore from backup
curl -X POST "https://advocate-cloud.adsengineer.workers.dev/api/v1/admin/restore" \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"backup_file": "backup-20260103.json"}'
```

## Troubleshooting

### Deployment Issues

**"wrangler deploy failed"**
```bash
# Check authentication
doppler run -- wrangler whoami

# Check wrangler configuration
cat wrangler.jsonc

# Deploy with verbose output
doppler run -- wrangler deploy --verbose
```

**"Database migration failed"**
```bash
# Check migration status
wrangler d1 migrations list --remote

# Apply specific migration
wrangler d1 migrations apply advocate-db --remote --migration-id <migration_name>

# Rollback migration
wrangler d1 migrations rollback advocate-db --remote
```

**"Rate limiting issues"**
```bash
# Check current limits
curl -I https://advocate-cloud.adsengineer.workers.dev/api/v1/health

# Monitor rate limit headers
watch -n 60 'curl -I https://advocate-cloud.adsengineer.workers.dev/api/v1/status'
```

## Performance Optimization

### Worker Optimization

- Minimize bundle size
- Use caching for frequently accessed data
- Implement request deduplication
- Optimize D1 queries

### Database Optimization

- Use indexes where applicable
- Batch operations when possible
- Cache expensive queries
- Monitor query performance

---

**Next:** Read [Architecture](Architecture.md) for system design.