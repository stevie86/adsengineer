# Technology Stack

**Analysis Date:** 2026-01-27

## Languages

**Primary:**
- TypeScript - Core API, frontend, infrastructure tooling
- JavaScript - SEO auditor, CLI scripts

**Secondary:**
- SQL - D1 database migrations
- Shell - Deployment scripts
- HCL/Terraform - Infrastructure as code

## Runtime

**Environment:**
- Cloudflare Workers - Serverless edge compute
- Node.js - CLI tools, SEO auditor, local development

**Package Manager:**
- pnpm@10.27.0
- Lockfile: pnpm-lock.yaml

## Frameworks

**Core:**
- Hono v4.11.3 - Web framework (API routes)
- Astro v5.16.9 - Marketing website framework
- React 18.3.1 - Frontend dashboard
- Express (shopify-plugin) - Node.js webhooks

**Testing:**
- Vitest v4.0.16 - Unit/integration/e2e testing
- Playwright v1.40.0 - E2E browser testing

**Build/Dev:**
- Wrangler v4.59.1 - Cloudflare Workers CLI
- Vite v5.4.21 - Frontend build tool
- OpenTofu - Infrastructure provisioning (IaC)

## Key Dependencies

**Critical:**
- stripe v14.25.0 - Payment processing and billing
- google-ads-api v21.0.1 - Google Ads integration
- @hono/zod-openapi v0.18.4 - API validation and documentation
- zod v3.25.76 - Schema validation
- @noble/hashes v1.4.0 - Cryptographic hashing

**Infrastructure:**
- @cloudflare/workers-types - TypeScript definitions
- @biomejs/biome v2.3.10 - Linting and formatting (backend)
- ESLint + Prettier - Linting and formatting (frontend legacy)

**External Services:**
- axios v1.6.0 - HTTP client
- fflate v0.8.2 - Compression

## Configuration

**Environment:**
- Doppler - Secrets management (CLI and dashboard)
- Cloudflare Dashboard - Additional secrets and configuration
- Environment-specific configs: development, staging, production

**Configuration Files:**
- `wrangler.jsonc` - Cloudflare Workers configuration (D1 bindings, environments)
- `vite.config.ts` - Frontend build configuration
- `vitest.config.ts` - Testing configuration
- `terraform.tfvars` - Infrastructure variables
- `biome.json` - Linting rules

**Required Secrets:**
- JWT_SECRET, STRIPE_SECRET_KEY, GOOGLE_ADS_CLIENT_ID/SECRET
- CLOUDFLARE_API_TOKEN, ENCRYPTION_KEY
- OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm package manager
- Wrangler CLI (Cloudflare)
- Doppler CLI

**Production:**
- Cloudflare Workers runtime (edge computing)
- Cloudflare D1 (database)
- Cloudflare KV (rate limiting - planned)
- Custom domain routing via Cloudflare

**CI/CD:**
- Manual deployments via `pnpm deploy`
- OpenTofu for infrastructure provisioning
- Doppler for secret injection

---

*Stack analysis: 2026-01-27*