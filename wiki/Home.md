# AdsEngineer

Enterprise-grade conversion tracking for GoHighLevel agencies.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/adsengineer/ads-engineer.git
cd ads-engineer
./setup-doppler.sh
./provision-infrastructure.sh development

# Start development
cd serverless
doppler run -- pnpm dev
```

**Live API:** https://advocate-cloud.adsengineer.workers.dev

## What This Does

- **Multi-step funnels** - GCLID survives navigation between pages
- **Lead value scoring** - Tell Google which leads are worth $5,000 vs $50
- **Failure alerts** - Know when conversions fail before you lose data
- **Zero-config setup** - One webhook URL, done

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1
- **Language:** TypeScript
- **Infrastructure:** OpenTofu
- **Secrets:** Doppler

## For Users

- [Getting Started](Getting-Started.md) - 5-minute setup guide
- [API Reference](API-Reference.md) - Complete endpoint documentation
- [Configuration](Configuration.md) - Environment setup
- [Deployment](Deployment.md) - How to deploy

## For Contributors

- [Architecture](Architecture.md) - High-level system design
- [Contributing](Contributing.md) - Development setup and PR process
- [Troubleshooting](Troubleshooting.md) - Common issues

## Quick Links

| Page | Purpose |
|-------|----------|
| Getting Started | New user onboarding |
| API Reference | Endpoint documentation |
| Configuration | Setup and secrets |
| Deployment | Production deployment |

---

**Next:** Read [Getting Started](Getting-Started.md)