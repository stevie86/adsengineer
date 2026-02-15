# Kilo.ai Cloud Agent Setup Guide for AdsEngineer

**Date:** 2026-02-13  
**Context:** Setup commands for Kilo.ai Cloud Agent integration

---

## ⚠️ Important: Command Adjustments Required

The default Kilo.ai setup commands **need modification** for your specific AdsEngineer setup. This guide explains why and provides the correct commands.

---

## Default Kilo.ai Commands vs. Your Setup

### Install Command

| Kilo.ai Default | Your Setup | Status |
|-----------------|------------|--------|
| `npm install` | `pnpm install` | ❌ **Must change** |

**Why:** Your AGENTS.md explicitly states:
> "Package Manager: `pnpm` ONLY. No `npm`/`yarn`."

### Build Command

| Kilo.ai Default | Your Setup | Status |
|-----------------|------------|--------|
| `npm run build` | Multiple commands | ⚠️ **Needs context** |

**Why:** You have **3 separate packages**, not a single project:

```
ads-engineer/
├── serverless/     # Backend - uses Wrangler, no build needed for dev
├── frontend/       # React app - needs build
└── landing-page/   # Astro app - needs build
```

### Test Command

| Kilo.ai Default | Your Setup | Status |
|-----------------|------------|--------|
| `npm test` | `pnpm test` or `pnpm test:integration` | ❌ **Must change** |

**Why:** Your 206 tests are in `serverless/` and use pnpm + Vitest.

---

## Correct Commands for Kilo.ai Setup

### Option 1: Backend-Focused (serverless/)

Use this when working on API, auth, billing, or database:

```bash
# Install
pnpm install

# Development (requires Doppler)
doppler run -- pnpm dev

# Test
pnpm test              # Unit tests
pnpm test:integration  # Integration tests

# Lint/Format
pnpm lint:fix && pnpm format

# Deploy
doppler run -- pnpm deploy
```

### Option 2: Frontend-Focused (frontend/)

Use this when working on React dashboard:

```bash
# Install
pnpm install

# Development
pnpm dev

# Build
pnpm run build

# Test
pnpm test
```

### Option 3: Landing Page (landing-page/)

Use this when working on marketing site:

```bash
# Install
pnpm install

# Development
pnpm dev --host

# Build
pnpm run build

# Deploy
pnpm build && wrangler pages deploy dist/
```

---

## Key Differences from Standard Node.js Projects

### 1. Package Manager: pnpm (NOT npm)

Your project uses **pnpm@10.27.0** exclusively:

```bash
# Wrong
npm install
npm run build
npm test

# Correct
pnpm install
pnpm run build
pnpm test
```

**Reference:** `AGENTS.md` line 51: "Package Manager: `pnpm` ONLY. No `npm`/`yarn`."

### 2. Monorepo Structure

Unlike single-package projects, you have **3 separate packages**:

| Package | Location | Tech Stack | Primary Use |
|---------|----------|------------|-------------|
| Backend | `serverless/` | Hono + Cloudflare Workers | API, auth, billing |
| Dashboard | `frontend/` | React 18 + Tailwind | Customer UI |
| Marketing | `landing-page/` | Astro + Tailwind | Landing pages |

Each has its own `package.json`, dependencies, and commands.

### 3. Secrets Management: Doppler

Production commands require Doppler for secrets:

```bash
# Local dev with secrets
doppler run -- pnpm dev

# Deploy with secrets
doppler run -- pnpm deploy
```

**Never** commit `.env` files (gitignored).

### 4. Backend Doesn't Need "Build" for Dev

The `serverless/` package uses Wrangler CLI + Cloudflare Workers:

```bash
# Development (no build step)
doppler run -- pnpm dev

# The backend runs directly via Wrangler + D1
```

Frontend packages (`frontend/`, `landing-page/`) need build:

```bash
# React frontend
cd frontend && pnpm run build

# Astro landing page  
cd landing-page && pnpm run build
```

### 5. Testing Strategy

| Test Type | Location | Command | Count |
|-----------|----------|---------|-------|
| Unit | `serverless/tests/unit/` | `pnpm test` | ~150 |
| Integration | `serverless/tests/integration/` | `pnpm test:integration` | ~56 |
| **Total** | | | **206** |

```bash
# From serverless/ directory
pnpm test              # Fast unit tests
pnpm test:integration  # Slower API tests with real D1
```

---

## Recommended Kilo.ai Configuration

### For Backend Tasks (Auth, Billing, API)

```yaml
Project Root: /home/webadmin/coding/ads-engineer/serverless

Install Command: pnpm install
Build Command: echo "No build needed for Workers"  
Test Command: pnpm test
Dev Command: doppler run -- pnpm dev

Environment Variables:
  - NODE_ENV=development
  - DOPPLER_ENV=dev
```

### For Frontend Tasks (Dashboard UI)

```yaml
Project Root: /home/webadmin/coding/ads-engineer/frontend

Install Command: pnpm install
Build Command: pnpm run build
Test Command: pnpm test
Dev Command: pnpm dev
```

### For Landing Page Tasks (Marketing)

```yaml
Project Root: /home/webadmin/coding/ads-engineer/landing-page

Install Command: pnpm install
Build Command: pnpm run build
Test Command: pnpm test
Dev Command: pnpm dev --host
```

---

## Critical Setup Notes for Kilo.ai

### 1. Directory Context Matters

Always specify which subdirectory to work in:

```bash
# Backend work
cd serverless && pnpm install && pnpm test

# Frontend work
cd frontend && pnpm install && pnpm run build
```

### 2. pnpm Workspace (If Applicable)

Check if you have a root `pnpm-workspace.yaml`:

```bash
cat /home/webadmin/coding/ads-engineer/pnpm-workspace.yaml
```

If yes, you can run `pnpm install` from root to install all packages.

### 3. Wrangler Configuration

The backend (`serverless/`) uses Wrangler CLI:

```bash
# Key files
serverless/wrangler.toml    # Workers config
serverless/.dev.vars        # Local secrets (gitignored)
```

### 4. D1 Database

Integration tests need D1:

```bash
# Apply migrations first
wrangler d1 migrations apply adsengineer-db --local

# Then run tests
pnpm test:integration
```

---

## Quick Verification Checklist

Before running any commands in Kilo.ai, verify:

- [ ] Which package? (`serverless/`, `frontend/`, or `landing-page/`)
- [ ] Using `pnpm` not `npm`
- [ ] Doppler configured (for backend)
- [ ] D1 migrations applied (for integration tests)
- [ ] Working in correct subdirectory

---

## Summary

| Kilo.ai Default | Your Correct Command | Package |
|-----------------|---------------------|---------|
| `npm install` | `pnpm install` | All |
| `npm run build` | `echo "No build"` | serverless |
| `npm run build` | `pnpm run build` | frontend, landing-page |
| `npm test` | `pnpm test` | All |
| `npm run dev` | `doppler run -- pnpm dev` | serverless |
| `npm run dev` | `pnpm dev` | frontend, landing-page |

**Bottom Line:** Your setup is more complex than a standard Node.js project. You have a monorepo with 3 distinct packages, use pnpm exclusively, and require Doppler for secrets. Update Kilo.ai configuration accordingly.

---

## References

- Main config: `/home/webadmin/coding/ads-engineer/AGENTS.md`
- Backend: `/home/webadmin/coding/ads-engineer/serverless/AGENTS.md`
- Frontend: `/home/webadmin/coding/ads-engineer/frontend/AGENTS.md`
- Landing page: `/home/webadmin/coding/ads-engineer/landing-page/AGENTS.md`

---

*Generated: 2026-02-13*  
*Purpose: Kilo.ai Cloud Agent configuration guide*
