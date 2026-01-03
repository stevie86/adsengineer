# Quickstart: Marketing Landing Page

## Prerequisites
- Node.js 18+
- pnpm

## Local Development

```bash
# Navigate to landing page directory
cd landing-page

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Server will start at `http://localhost:4321` (default Astro port).

## Deployment

Deployments are handled via Cloudflare Pages git integration.

```bash
# Manual deployment (if needed)
pnpm build
wrangler pages deploy dist --project-name adsengineer-landing
```
