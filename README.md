# AdsEngineer

Bulletproof conversion tracking for GoHighLevel agencies.

## What This Does

GHL's native tracking works for simple funnels. We handle the complex cases:

- **Multi-step funnels** - GCLID survives navigation between pages
- **Lead value scoring** - Tell Google which leads are worth $5,000 vs $50
- **Failure alerts** - Know when conversions fail before you lose data
- **Zero-config setup** - One webhook URL, done

## Live API

**Production:** https://advocate-cloud.adsengineer.workers.dev

```bash
curl https://advocate-cloud.adsengineer.workers.dev/health
```

## Project Structure

```
serverless/              # Cloudflare Worker
├── src/
│   ├── index.ts         # Hono app entry
│   ├── routes/          # API routes
│   ├── middleware/      # Auth
│   └── database/        # D1 layer
├── migrations/          # D1 schema
└── wrangler.jsonc       # Cloudflare config

infrastructure/          # OpenTofu IaC
├── main.tf             # Cloudflare resources
├── variables.tf        # Input variables
├── outputs.tf          # Output values
└── providers.tf        # Provider config

docs/                    # Strategy docs
```

## Development

### Prerequisites

1. Install [OpenTofu](https://opentofu.org/docs/intro/install/)
2. Install [Doppler CLI](https://cli.doppler.com/install.sh)
3. Run `./setup-doppler.sh` to configure secrets

### Setup

```bash
# 1. Setup Doppler
./setup-doppler.sh

# 2. Provision infrastructure
cd infrastructure
tofu init
tofu apply -var="environment=development"

# 3. Install dependencies
cd ../serverless
pnpm install
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
