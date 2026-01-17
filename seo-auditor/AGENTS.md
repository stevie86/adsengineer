# SEO AUDITOR KNOWLEDGE BASE

**Generated:** 2026-01-13
**Domain:** SEO Tools + Universal SST Snippet

## OVERVIEW
Two components: Shopify SEO auditor + Universal server-side tracking (SST) snippet.

## STRUCTURE
```
seo-auditor/
├── shopify-seo-auditor.js  # Main SEO auditor
├── simple-auditor.js       # Lightweight version
├── html-parser.js          # HTML analysis
├── core.ts                 # Shared utilities
├── types.ts                # TypeScript types
├── cli.js                  # CLI interface
├── sst-api.js              # SST API endpoints
├── universal-tracking-snippet.js  # Client-side snippet
├── wrangler.toml           # Cloudflare config
└── test*.js                # Test files
```

## KEY FILES
| File | Purpose |
|------|---------|
| `shopify-seo-auditor.js` | Full Shopify SEO analysis |
| `universal-tracking-snippet.js` | Platform-agnostic tracking |
| `sst-api.js` | Site registration, auth |

## UNIVERSAL SST
Platform-agnostic tracking that works anywhere:
```html
<script>
  var siteId = 'your-site-id';
  (function() {
    var s = document.createElement('script');
    s.src = 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js';
    s.setAttribute('data-site-id', siteId);
    document.head.appendChild(s);
  })();
</script>
```

## COMMANDS
```bash
# Audit Shopify store
node shopify-seo-auditor.js -u https://store.com

# Run tests
node test.js
```

## ANTI-PATTERNS
- Hardcoded API keys
- Blocking sync calls
- Missing error handling
- Unsanitized HTML parsing