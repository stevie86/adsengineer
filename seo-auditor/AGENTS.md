# SEO AUDITOR KNOWLEDGE BASE

**Generated:** 2026-01-19
**Domain:** SEO Tools + Universal SST Snippet

## OVERVIEW
Two components: Shopify SEO auditor + Universal server-side tracking (SST) snippet.

## STRUCTURE
```
seo-auditor/
├── # SST FRAMEWORK
├── universal-tracking-snippet.js  # Client-side tracker (9KB)
├── sst-api.js                     # SST API endpoints (Cloudflare Worker)
├── schema.sql                     # SST database schema
├── SST_IMPLEMENTATION.md          # Full SST documentation
│
├── # SEO AUDITOR
├── shopify-seo-auditor.js         # Full Shopify SEO analysis
├── simple-auditor.js              # Lightweight version
├── html-parser.js                 # HTML analysis utilities
├── cli.js                         # CLI interface
└── core.ts                        # Shared utilities
```

## UNIVERSAL SST
- **Client:** `tracking-snippet.js` (auto-captures pageview, click, form).
- **Server:** `sst-api.js` (Cloudflare Worker).
- **Events:** `page_view`, `click`, `form_submit`, custom events.
- **Ad Params:** `gclid`, `fbclid`, `utm_*` (90-day persistence).

## COMMANDS
```bash
# Run Auditor
node shopify-seo-auditor.js -u https://store.com

# Deploy SST API
wrangler deploy
```

## ANTI-PATTERNS
- Blocking sync calls.
- Unsanitized HTML parsing.
- Storing PII without hashing.
