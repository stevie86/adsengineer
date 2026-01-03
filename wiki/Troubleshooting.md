# Troubleshooting

Common issues and solutions for AdsEngineer.

## Quick Diagnostics

### Health Check
```bash
curl -f https://advocate-cloud.adsengineer.workers.dev/health
```

### System Status
```bash
curl -H "Authorization: Bearer <token>" \
     https://advocate-cloud.adsengineer.workers.dev/api/v1/status
```

## Development Issues

### Environment Setup

**Issue:** "doppler command not found"
```bash
# Install Doppler CLI
curl -fsSL https://cli.doppler.com/install.sh | sh

# Or use npm
npm install -g @dopplerhq/cli

# Verify installation
doppler --version
```

**Issue:** "pnpm command not found"
```bash
# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# Or use npm
npm install -g pnpm

# Verify installation
pnpm --version
```

**Issue:** "wrangler auth required"
```bash
# Check if authenticated
wrangler whoami

# Login to Cloudflare
wrangler auth login

# Or use API token
wrangler auth
```

### Dependencies

**Issue:** "Module not found" errors
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

**Issue:** TypeScript compilation errors
```bash
# Check TypeScript version
pnpm list typescript

# Update to latest
pnpm add -D typescript@latest

# Rebuild
pnpm types:check
```

### Development Server

**Issue:** "Port already in use"
```bash
# Find process using port 8787
lsof -i :8787

# Kill process
kill -9 <PID>

# Or use different port
pnpm dev --port 8788
```

**Issue:** "Hot reload not working"
```bash
# Check file watcher limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Restart development server
pnpm dev
```

## Deployment Issues

### Worker Deployment

**Issue:** "wrangler deploy failed"
```bash
# Check authentication
wrangler whoami

# Verify wrangler configuration
cat wrangler.jsonc

# Deploy with verbose output
pnpm deploy --verbose

# Check worker size limit
wrangler tail
```

**Issue:** "D1 database not found"
```bash
# List available databases
wrangler d1 list

# Check database binding in wrangler.jsonc
grep -A 5 "d1_databases" wrangler.jsonc

# Create database if missing
wrangler d1 create advocate-db
```

**Issue:** "Environment variables missing"
```bash
# Check Doppler secrets
doppler secrets list

# Verify environment
echo $ENVIRONMENT

# Set missing secret
doppler secrets set MISSING_SECRET <value>
```

### Infrastructure

**Issue:** "tofu apply failed"
```bash
# Check OpenTofu version
tofu --version

# Initialize if needed
tofu init

# Check syntax
tofu validate

# Plan before apply
tofu plan
```

**Issue:** "Cloudflare API token invalid"
```bash
# Test token
curl -H "Authorization: Bearer <token>" \
     https://api.cloudflare.com/client/v4/user/tokens/verify

# Check token permissions
curl -H "Authorization: Bearer <token>" \
     https://api.cloudflare.com/client/v4/user/tokens
```

## API Issues

### Authentication

**Issue:** "Invalid JWT token"
```bash
# Check JWT secret
doppler secrets get JWT_SECRET

# Generate new token (helper script)
curl -X POST "http://localhost:8787/api/v1/auth/token" \
     -d '{"user_id": "test"}'

# Verify token format
echo <token> | cut -d'.' -f2 | base64 -d | jq .exp
```

**Issue:** "Rate limit exceeded"
```bash
# Check rate limit headers
curl -I "https://advocate-cloud.adsengineer.workers.dev/api/v1/leads" \
     -H "Authorization: Bearer <token>"

# Wait for reset (from X-RateLimit-Reset header)
# Implement exponential backoff
sleep $((2 ** $RETRY_COUNT))
```

### Webhooks

**Issue:** "Webhook signature verification failed"
```bash
# Check webhook secret
doppler secrets get GHL_WEBHOOK_SECRET

# Test signature manually
body='{"test": "data"}'
signature=echo -n "$body" | openssl sha256 -hmac "$secret" -binary | base64

# Compare with received signature
echo "Expected: $signature"
echo "Received: $received_signature"
```

**Issue:** "Webhook not received"
```bash
# Test webhook endpoint
curl -X POST "http://localhost:8787/api/v1/ghl/webhook" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}' \
     -v

# Check ngrok/tunnel if testing locally
curl -I "https://your-ngrok-url.ngrok.io/api/v1/ghl/webhook"
```

### Database Issues

**Issue:** "Database query failed"
```bash
# Check database schema
wrangler d1 execute advocate-db --remote \
    --command "SELECT sql FROM sqlite_master WHERE type='table'"

# Test query manually
wrangler d1 execute advocate-db --remote \
    --command "SELECT COUNT(*) FROM leads LIMIT 1"

# Check recent migrations
wrangler d1 migrations list --remote
```

**Issue:** "Migration failed"
```bash
# Check migration syntax
sqlite3 migrations/001_migration.sql ".schema"

# Apply manually
wrangler d1 execute advocate-db --remote \
    --command "$(cat migrations/001_migration.sql)"

# Rollback if needed
wrangler d1 migrations rollback advocate-db --remote
```

## Performance Issues

### Slow Response Times

```bash
# Measure response time
curl -w "@curl-format.txt" \
     "https://advocate-cloud.adsengineer.workers.dev/health"

# Check with curl-format.txt content:
#     time_namelookup:  %{time_namelookup}\n
#     time_connect:     %{time_connect}\n
#     time_appconnect:  %{time_appconnect}\n
#     time_pretransfer: %{time_pretransfer}\n
#     time_redirect:    %{time_redirect}\n
#     time_starttransfer: %{time_starttransfer}\n
#     time_total:      %{time_total}\n

# Monitor with wrangler tail
wrangler tail --format pretty
```

### Memory Issues

**Issue:** "Worker memory limit exceeded"
```bash
# Check worker logs
wrangler tail | grep "Memory"

# Optimize code
# - Reduce object creation
# - Use streaming for large data
# - Implement caching
```

## Security Issues

### SSL/TLS

**Issue:** "SSL certificate error"
```bash
# Check certificate
openssl s_client -connect advocate-cloud.adsengineer.workers.dev:443 \
    -servername advocate-cloud.adsengineer.workers.dev

# Check Cloudflare SSL status
curl -I "https://advocate-cloud.adsengineer.workers.dev"
```

### CORS Issues

**Issue:** "CORS error in browser"
```bash
# Check CORS headers
curl -H "Origin: https://example.com" \
     -I "https://advocate-cloud.adsengineer.workers.dev/health"

# Verify Access-Control-Allow-Origin header
# Should match your domain or be "*"
```

## Monitoring and Debugging

### Log Analysis

```bash
# Real-time logs
wrangler tail

# Filter logs
wrangler tail --format json | jq '.message | contains("error")'

# Export logs
wrangler tail --since 1h > logs.txt
```

### Error Tracking

**Issue:** "Missing error context"
```bash
# Add structured logging
import { logger } from './services/logging';

logger.log('ERROR', 'Processing failed', {
  error: error.message,
  stack: error.stack,
  context: additional_context
}, context);
```

### Performance Monitoring

```bash
# Load testing
cd serverless
pnpm test:load

# Monitor metrics during test
wrangler tail --format json | jq '.metrics'
```

## Getting Help

### Community Resources

- **GitHub Issues:** [Create new issue](https://github.com/adsengineer/ads-engineer/issues)
- **GitHub Discussions:** [Ask questions](https://github.com/adsengineer/ads-engineer/discussions)
- **Documentation:** [Project wiki](https://github.com/adsengineer/ads-engineer/wiki)

### Debug Information

When reporting issues, include:

```bash
# System information
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Wrangler: $(wrangler --version)"
echo "OpenTofu: $(tofu --version)"

# Environment details
echo "Environment: $ENVIRONMENT"
echo "Database: $(doppler secrets get D1_DATABASE_ID)"
echo "Worker URL: $(doppler secrets get WORKER_URL)"
```

### Emergency Procedures

**Service Down:**
1. Check status page
2. Review recent deployments
3. Check error rates in monitoring
4. Rollback if necessary

**Data Issues:**
1. Stop processing to prevent corruption
2. Verify data integrity
3. Restore from backup if needed
4. Investigate root cause

---

**Need more help?** Check [Contributing](Contributing.md) for development guidelines or create an issue.