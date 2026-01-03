# OpenTofu and Doppler Integration Guide

This guide covers the infrastructure-as-code (IaC) setup using OpenTofu and secrets management with Doppler for the AdsEngineer project.

## Overview

- **OpenTofu**: Manages Cloudflare Workers, D1 databases, and KV namespaces as code
- **Doppler**: Secure secrets management for API keys, tokens, and configuration

## Prerequisites

1. [OpenTofu CLI](https://opentofu.org/docs/intro/install/)
2. [Doppler CLI](https://cli.doppler.com/install.sh)
3. Cloudflare account with Workers enabled
4. Doppler account

## Quick Start

### 1. Initial Setup

```bash
# Run the Doppler setup script
./setup-doppler.sh

# Add your Cloudflare API token
doppler secrets set CLOUDFLARE_API_TOKEN <your_token>

# Add your Cloudflare Account ID
doppler secrets set CLOUDFLARE_ACCOUNT_ID <your_id>
```

### 2. Infrastructure Provisioning

```bash
cd infrastructure

# Initialize OpenTofu
tofu init

# Review the plan (development environment)
tofu plan -var="environment=development"

# Apply changes
tofu apply -var="environment=development"
```

### 3. Development Workflow

```bash
# Run commands with secrets from Doppler
doppler run -- pnpm dev

# Deploy with secrets
doppler run -- pnpm deploy

# Set a specific environment
doppler run --config=staging -- pnpm deploy
```

## Project Structure

```
.
├── infrastructure/
│   ├── main.tf              # Resource definitions
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── providers.tf         # Provider configuration
│   └── terraform.tfvars.example
├── doppler.yaml             # Doppler CLI configuration
├── doppler-secrets.template # Secrets reference
└── setup-doppler.sh         # Initial setup script
```

## OpenTofu Configuration

### Environments

The infrastructure supports three environments:
- `development` - Local development and testing
- `staging` - Pre-production validation
- `production` - Live production environment

### Resources Managed

1. **D1 Database**: Cloudflare D1 SQLite database
2. **Worker Script**: Cloudflare Worker with Hono framework
3. **KV Namespace**: Key-value storage for rate limiting
4. **Worker Routes**: Route configuration (dev/staging only)

### Workflows

#### Local Development

```bash
cd infrastructure

# Plan changes without applying
tofu plan -var="environment=development"

# Apply changes
tofu apply -var="environment=development"

# Destroy resources (use with caution)
tofu destroy -var="environment=development"
```

#### CI/CD Pipeline

The GitHub Actions workflow `.github/workflows/infrastructure.yml` automatically:
1. Validates Terraform syntax on every PR
2. Runs `tofu plan` to preview changes
3. Applies changes on main branch merges
4. Outputs infrastructure details (database IDs, worker URLs)

### State Management

- State is stored locally in `infrastructure/terraform.tfstate`
- For production, consider using a remote backend (S3, Terraform Cloud, etc.)

## Doppler Configuration

### Environments

Doppler manages three configs:
- `dev` - Development secrets
- `staging` - Staging secrets
- `prd` - Production secrets

### Managing Secrets

```bash
# List all secrets
doppler secrets list

# Set a secret
doppler secrets set JWT_SECRET <your_secret>

# Set a secret in specific config
doppler secrets set STRIPE_WEBHOOK_SECRET <secret> --config=prd

# Get a secret value
doppler secrets get JWT_SECRET

# Delete a secret
doppler secrets rm OLD_SECRET

# Run commands with secrets
doppler run -- <command>
```

### Secret Categories

#### Cloudflare Secrets
- `CLOUDFLARE_API_TOKEN` - API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_ZONE_ID` - Zone ID for custom domains

#### Application Secrets
- `JWT_SECRET` - Authentication token signing
- `GHL_WEBHOOK_SECRET` - GoHighLevel webhook verification
- `ADMIN_TOKEN` - Admin access token
- `ENCRYPTION_KEY` - AES-256 encryption key for credentials

#### Stripe Configuration
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `STRIPE_STARTER_PRICE_ID` - Starter plan price
- `STRIPE_PROFESSIONAL_PRICE_ID` - Professional plan price
- `STRIPE_ENTERPRISE_PRICE_ID` - Enterprise plan price

#### Google Ads Configuration
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Google Ads API developer token
- `GOOGLE_ADS_CLIENT_ID` - OAuth client ID
- `GOOGLE_ADS_CLIENT_SECRET` - OAuth client secret

## CI/CD Integration

### GitHub Actions

#### Infrastructure Workflow

The `.github/workflows/infrastructure.yml` workflow:

1. **Plan Stage** (runs on all PRs)
   - Initializes OpenTofu
   - Validates configuration
   - Generates execution plan

2. **Apply Stage** (runs on main branch)
   - Applies the approved plan
   - Exports infrastructure outputs

#### Deployment Workflow

The `.github/workflows/deploy.yml` workflow:

1. Checks out code
2. Authenticates with Doppler
3. Deploys Cloudflare Worker with secrets

#### CI/CD Pipeline

The `.github/workflows/ci-cd.yml` workflow includes:

- Testing and quality checks
- Security scanning
- Doppler-authenticated deployments to staging/production

### Required GitHub Secrets

Add these to your repository settings:

```
DOPPLER_TOKEN = <your_doppler_service_token>
```

## Common Workflows

### Setting Up a New Developer

```bash
# 1. Clone the repository
git clone <repo-url>
cd ads-engineer

# 2. Install dependencies
cd serverless && pnpm install

# 3. Setup Doppler
./setup-doppler.sh

# 4. Provision infrastructure
cd ../infrastructure
tofu init
tofu apply -var="environment=development"

# 5. Start development server
cd ../serverless
doppler run -- pnpm dev
```

### Deploying to Production

```bash
# Ensure production secrets are set in Doppler
doppler run --config=production -- tofu apply -var="environment=production"

# Deploy worker with production secrets
cd serverless
doppler run --config=production -- pnpm deploy
```

### Rotating Secrets

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in Doppler
doppler secrets set JWT_SECRET "$NEW_SECRET" --config=prd

# Redeploy worker to use new secret
cd serverless
doppler run --config=prd -- pnpm deploy
```

### Troubleshooting

#### OpenTofu Issues

**Error: State locked**
```bash
# Force unlock (use with caution)
tofu force-unlock <LOCK_ID>
```

**Error: Resource not found**
```bash
# Refresh state
tofu refresh -var="environment=development"
```

#### Doppler Issues

**CLI not authenticated**
```bash
# Login again
doppler login
```

**Wrong project config**
```bash
# Verify current config
doppler configure ls

# Set correct config
doppler configure set project adsengineer
doppler configure set config prd
```

## Security Best Practices

1. **Never commit secrets**: All secrets are managed by Doppler
2. **Use service tokens**: For CI/CD, use Doppler service tokens (not personal tokens)
3. **Rotate secrets regularly**: Implement a schedule for secret rotation
4. **Audit access**: Monitor Doppler audit logs for secret access
5. **Principle of least privilege**: Grant minimum required permissions to tokens

## Migration from Existing Setup

If you're migrating from manual Cloudflare configuration:

1. **Backup existing configuration**:
   ```bash
   # Export current wrangler configuration
   wrangler whoami
   wrangler list
   ```

2. **Import existing resources into OpenTofu**:
   ```bash
   cd infrastructure
   tofu import cloudflare_worker_script.main <worker_id>
   tofu import cloudflare_d1_database.main <database_id>
   ```

3. **Migrate secrets to Doppler**:
   ```bash
   # Add each secret from wrangler.toml or environment
   doppler secrets set CLOUDFLARE_API_TOKEN <token>
   # ... other secrets
   ```

4. **Update deployment scripts** to use Doppler

## Additional Resources

- [OpenTofu Documentation](https://opentofu.org/docs/)
- [Doppler Documentation](https://docs.doppler.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
