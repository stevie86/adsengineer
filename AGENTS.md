# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-03
**Commit:** HEAD
**Branch:** main
**Last Major Update:** OpenTofu & Doppler Integration

## OVERVIEW
AdsEngineer: Enterprise conversion tracking SaaS (Google/Meta/TikTok/Shopify). Cloudflare Workers + Hono + D1 + Stripe.

**Stack:** TypeScript, Hono, Cloudflare Workers, D1, Stripe
**Infra:** OpenTofu (IaC), Doppler (Secrets)
**Package Manager:** pnpm@10.27.0
**Security:** Enterprise (HMAC, Encrypted creds, Rate limiting)

## STRUCTURE
```
./
├── serverless/           # Core API (Hono/Workers)
│   ├── src/routes/      # Endpoints (6 files)
│   ├── src/services/    # Logic (2 files)
│   ├── src/middleware/  # Auth (2 files)
│   └── tests/           # Unit/Integration
├── infrastructure/       # IaC (OpenTofu)
├── frontend/             # UI (React/Vue)
├── docs/                 # Architecture/Specs
└── wp-content/           # WP Integration (Themes/Plugins)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| API Dev | `serverless/` | `pnpm dev` |
| Infra | `infrastructure/` | `tofu apply` |
| DB Schema | `serverless/migrations/` | D1 SQL |
| Auth Logic | `serverless/src/middleware/` | JWT, Guard |
| Billing | `serverless/src/services/` | Stripe |
| Docs | `docs/` | Specs, Guides |

## CONVENTIONS
- **Package Manager:** `pnpm` ONLY. No `npm`/`yarn`.
- **Secrets:** `Doppler` ONLY. No `.env` files in git.
- **Linting:** `BiomeJS` (replaces ESLint/Prettier).
- **Type Safety:** Strict TypeScript. No `any`.

## DEVELOPMENT TOOLS

### Code Search & Navigation
- **ripgrep (rg):** Ultra-fast text search across codebase
  - Install: `brew install ripgrep` (already available at `/home/linuxbrew/.linuxbrew/bin/rg`)
  - Usage: `rg "search_term"` (much faster than `grep`)
  - Features: Regex support, smart case sensitivity, file type filtering

## COMMANDS
```bash
# Dev
./setup-doppler.sh
doppler run -- pnpm dev

# Landing Page Development
cd landing-page && pnpm dev --host  # Expose to network for testing

# Deploy
cd serverless && pnpm deploy
cd infrastructure && tofu apply
cd landing-page && pnpm build && wrangler pages deploy dist/
```

## WORKTREE MANAGEMENT
```bash
# List all worktrees
git worktree list

# Remove completed worktrees (after merging feature branches)
git worktree remove .worktrees/<feature-name>
# Use --force if there are untracked build artifacts
git worktree remove --force .worktrees/<feature-name>

# Clean up all unused worktrees
git worktree prune
```

**Note:** Worktrees are created by spec-kitty for feature development and should be cleaned up after merging to main.

## ANTI-PATTERNS
- Committing secrets (Use Doppler)
- Direct `node_modules` modification
- bypassing Biome rules
- Leaving worktrees unmerged/unremoved
