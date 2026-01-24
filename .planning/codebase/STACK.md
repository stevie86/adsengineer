# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- TypeScript 5.9.3 - Serverless API, Frontend, Admin Dashboard
- JavaScript 18+ - Shopify plugin runtime requirement

**Secondary:**
- SQL - D1 database schema and migrations

## Runtime

**Environment:**
- Cloudflare Workers - Serverless API runtime
- Node.js 18+ - Shopify plugin development requirement

**Package Manager:**
- pnpm 10.27.0 - Primary package manager for all packages
- Lockfile: Present across all packages

## Frameworks

**Core:**
- Hono 4.11.3 - API framework for Cloudflare Workers
- React 18.3.1 - Frontend dashboard and admin UI
- Astro 5.16.9 - Landing page static site generator
- Express 4.18.0 - Shopify plugin web server

**Testing:**
- Vitest 4.0.16 - Unit, integration, and E2E testing framework
- Playwright 1.40.0 - E2E browser testing

**Build/Dev:**
- Vite 5.4.21 - Frontend build tool
- Wrangler 4.59.1 - Cloudflare Workers CLI
- TypeScript 5.9.3 - Type checking and compilation

## Key Dependencies

**Critical:**
- Stripe 14.25.0 - Payment processing and billing
- google-ads-api 21.0.1 - Google Ads integration
- @hono/zod-openapi 0.18.4 - API validation and documentation
- zod 3.25.76 - Schema validation

**Infrastructure:**
- @cloudflare/workers-types 4.20260101.0 - Cloudflare Workers type definitions
- @noble/hashes 1.4.0 - Cryptographic functions
- @paralleldrive/cuid2 3.0.6 - Unique ID generation
- fflate 0.8.2 - Compression utilities

## Configuration

**Environment:**
- Cloudflare Workers runtime environment
- Doppler for secrets management (no .env files in git)
- Multi-environment support (development, staging, production)

**Build:**
- wrangler.jsonc for Workers configuration
- vite.config.ts for frontend builds
- biome.json for backend linting/formatting
- eslint.config.js for frontend linting
- tailwind.config.js for CSS framework

## Platform Requirements

**Development:**
- Node.js 18+ runtime
- pnpm package manager
- Wrangler CLI for Workers development
- Doppler CLI for secrets management
- OpenTofu for infrastructure provisioning

**Production:**
- Cloudflare Workers for API hosting
- Cloudflare D1 for database
- Cloudflare Pages for landing page
- Custom domains via Cloudflare DNS

---

*Stack analysis: 2026-01-24*