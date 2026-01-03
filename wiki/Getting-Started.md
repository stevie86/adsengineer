# Getting Started

Set up AdsEngineer in 5 minutes and start tracking conversions.

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Cloudflare account
- Doppler account (for secrets)

## 1. Install Dependencies

```bash
cd serverless
pnpm install
```

## 2. Configure Secrets

```bash
# Setup Doppler (one-time)
./setup-doppler.sh

# Add your Cloudflare credentials
doppler secrets set CLOUDFLARE_API_TOKEN <your_token>
doppler secrets set CLOUDFLARE_ACCOUNT_ID <your_account_id>
```

## 3. Provision Infrastructure

```bash
# Provision development environment
./provision-infrastructure.sh development

# Or use OpenTofu directly
cd infrastructure
tofu init
tofu apply -var="environment=development"
```

## 4. Start Development

```bash
cd serverless
doppler run -- pnpm dev
```

## 5. Test Your Setup

```bash
# Health check
curl http://localhost:8787/health

# API documentation
open http://localhost:8787/docs
```

## 6. Deploy to Production

```bash
# Deploy with secrets
doppler run -- pnpm deploy
```

## Next Steps

- Read [API Reference](API-Reference.md) to understand endpoints
- Read [Configuration](Configuration.md) for advanced setup
- Read [Deployment](Deployment.md) for production deployment

## Troubleshooting

**Issue:** "No D1 database found"
```bash
# Check database exists
wrangler d1 list

# Or check infrastructure output
tofu output
```

**Issue:** "JWT verification failed"
```bash
# Check JWT secret is set
doppler secrets get JWT_SECRET
```

**Issue:** "Doppler run command not found"
```bash
# Install Doppler CLI
curl -fsSL https://cli.doppler.com/install.sh | sh
```