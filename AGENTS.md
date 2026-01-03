# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-03
**Commit:** HEAD
**Branch:** main
**Last Major Update:** Security Hardening & Stripe Integration Complete

## OVERVIEW
AdsEngineer: Enterprise-grade conversion tracking SaaS platform with multi-platform attribution, secure webhook processing, and subscription billing. Handles Google Ads, Meta Ads, TikTok, and Shopify integrations with military-grade security.

**Stack:** TypeScript, Hono, Cloudflare Workers, D1, Stripe
**Package Manager:** pnpm@10.27.0
**Security Level:** Enterprise (HMAC validation, rate limiting, encrypted credentials)

## 7-DAY MVP COMPLETION SPRINT (HIGH PRIORITY)

### Day 1-2: Complete WP02 Encryption
**Goal:** Apply encryption system to real credential storage
- ✅ Update database schema for encrypted fields
- ✅ Modify Google Ads API key storage to use encryption
- ✅ Test credential encryption/decryption
- ✅ Validate no plain text in logs/responses

**Status:** ✅ COMPLETED

### Day 3-4: Basic Authentication System
**Goal:** JWT-based user authentication
- ⏳ Implement JWT token generation/validation
- ⏳ Create user registration/login endpoints
- ⏳ Add protected route middleware
- ⏳ Basic password policies

**Status:** 📋 PLANNED

### Day 5: Stripe Product Completion
**Goal:** Enable payment processing
- ⏳ Create Stripe products/prices via CLI
- ⏳ Update environment variables
- ⏳ Test customer subscription creation
- ⏳ Unblock WP04 payment security

**Status:** 🚫 BLOCKED (waiting for manual Stripe setup)

### Day 6: Security Headers Implementation
**Goal:** HTTPS and transmission security
- ⏳ Add HSTS headers to all responses
- ⏳ Implement CSP (Content Security Policy)
- ⏳ Configure secure cookie settings
- ⏳ Test header implementation

**Status:** 📋 PLANNED

### Day 7: Integration Testing & Launch Prep
**Goal:** End-to-end validation
- ⏳ Test complete customer onboarding flow
- ⏳ Run security audit of all endpoints
- ⏳ Load testing with new features
- ⏳ Prepare for beta customer acquisition

**Status:** 📋 PLANNED

### Post-MVP: BiomeJS Adoption (Day 8-10)
**Goal:** Performance tooling upgrade
- 📋 Install and configure BiomeJS
- 📋 Update CI/CD to use Biome
- 📋 Remove ESLint/Prettier legacy tools
- 📋 10-100x faster development experience

**Status:** 📋 POSTPONED (after MVP)

## STRUCTURE
```
./
├── serverless/     # Cloudflare Worker - MVP Core
├── docs/          # Essential documentation only
├── .kittify/      # Active spec-kitty tasks
├── load-test.js   # Load testing infrastructure
├── archives/      # Archived non-essential files
└── AGENTS.md      # Root knowledge base
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Cloudflare Worker dev | serverless/ | pnpm dev, wrangler deploy |
| API docs | docs/ | Strategy, architecture docs |
| WordPress themes | wp-content/themes/ | TwentyTwentyFive, etc. |
| Stripe setup | STRIPE-INTEGRATION-GUIDE.md | Complete billing setup |
| Load testing | LOAD-TESTING-README.md | Performance testing |
| Security hardening | .kittify/specs/ | WP01-WP05 implementation |
| Deployment | .github/workflows/ | CI/CD pipelines |
| Archived docs | archives/ | Historical docs (if needed) |

## CODE MAP
No LSP available - project <10 files threshold.

## CONVENTIONS
- pnpm@10.27.0 pinned in package.json
- serverless/ uses Hono framework
- TypeScript strict mode
- Cloudflare Workers runtime

## ANTI-PATTERNS (THIS PROJECT)
- No direct node_modules manipulation
- No npm/yarn commands (pnpm only)
- No untyped JavaScript files

## UNIQUE STYLES
- Conversion tracking with GCLID persistence
- Multi-step funnel handling
- Google Ads offline conversions

## COMMANDS
```bash
cd serverless
pnpm install
pnpm dev              # Local dev
pnpm deploy           # Deploy
pnpm types:check      # TypeScript check
```

## NOTES
- D1 Database: advocate-db
- Worker: advocate-cloud
- URL: https://advocate-cloud.adsengineer.workers.dev
