# AdsEngineer

Enterprise conversion tracking SaaS for e-commerce platforms.

## What This Does

Bulletproof attribution for modern e-commerce:

- **Multi-platform support** - Shopify, WooCommerce, custom sites
- **Advanced event tracking** - Custom business events with flexible configuration
- **Google Ads optimization** - Accurate conversion tracking and audience building
- **Real-time monitoring** - Platform connectivity and attribution health
- **Enterprise scalability** - Handle unlimited stores and high-volume events

## Key Features

- **Custom Events Engine**: Define and track business-specific events (subscriptions, high-value purchases, customer segments)
- **Multi-Assignment Support**: Same event with different configurations across sites
- **Platform Agnostic**: Unified tracking across Shopify, WooCommerce, and custom platforms
- **Google Ads Integration**: Automatic conversion upload with proper attribution windows
- **Firewall Awareness**: Bypasses platform restrictions for reliable data transmission

## Live API

**Production:** https://adsengineer-cloud.adsengineer.workers.dev

```bash
curl https://adsengineer-cloud.adsengineer.workers.dev/health
```

## Project Structure

```
serverless/              # Core API (Hono/Cloudflare Workers)
├── src/
│   ├── routes/          # API endpoints (leads, custom events, Shopify, etc.)
│   ├── services/        # Business logic (Google Ads, conversion processing)
│   ├── middleware/      # Auth, rate limiting, encryption
│   ├── database/        # D1 queries and migrations
│   └── workers/         # Background processing
├── migrations/          # D1 database schema
└── tests/              # Comprehensive test suite

infrastructure/          # IaC (OpenTofu/Terraform)
├── main.tf             # Cloudflare resources and DNS
├── variables.tf        # Environment configuration
├── outputs.tf          # Deployment outputs
└── providers.tf        # Cloud providers

shopify-plugin/         # Shopify app for webhook processing
├── index.js           # Express server with Shopify auth
├── package.json       # Node.js dependencies
└── README.md          # Deployment guide

.kittify/specs/         # Feature specifications
├── custom-events-database-system/
│   ├── spec.md        # Feature requirements
│   ├── plan.md        # Implementation plan
│   ├── tasks.md       # Work packages
│   ├── data-model.md  # Database schema
│   └── research.md    # Business analysis

docs/                   # Documentation
├── api-documentation.md
├── deployment guides
└── integration guides
```

## Development

### Prerequisites

1. Install [OpenTofu](https://opentofu.org/docs/intro/install/)
2. Install [Doppler CLI](https://cli.doppler.com/install.sh)
3. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
4. Run `./setup-doppler.sh` to configure secrets

### Setup

```bash
# 1. Setup Doppler secrets management
./setup-doppler.sh

# 2. Provision infrastructure
cd infrastructure
tofu init
tofu apply -var="environment=development"

# 3. Install serverless dependencies
cd ../serverless
pnpm install

# 4. Apply database migrations
wrangler d1 migrations apply adsengineer-db --local
```

### Development Workflow

```bash
# Local development with secrets
cd serverless
doppler run -- pnpm dev

# Test with local database
wrangler d1 migrations apply adsengineer-db --local
pnpm test

# Deploy to staging
doppler run -- pnpm deploy:staging

# Deploy to production
doppler run -- pnpm deploy
```

### Shopify Plugin Development

```bash
# Install Shopify plugin dependencies
cd shopify-plugin
npm install

# Test locally
npm start

# Deploy to hosting platform (Railway/Vercel/Heroku)
# Follow deployment guide in shopify-plugin/README.md
```

### Running

```bash
# Local development with secrets
doppler run -- pnpm dev

# Deploy to Cloudflare
doppler run -- pnpm deploy
```

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1
- **Language:** TypeScript
- **Infrastructure:** OpenTofu
- **Secrets:** Doppler

## Documentation

- [OpenTofu & Doppler Guide](./docs/opentofu-doppler-guide.md) - IaC and secrets management
- [Serverless README](./serverless/README.md) - Worker API documentation
