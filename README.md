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

docs/                    # Strategy docs
```

## Development

```bash
cd serverless
pnpm install
pnpm dev         # Local dev
pnpm deploy      # Deploy to Cloudflare
```

## Tech Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1
- **Language:** TypeScript
