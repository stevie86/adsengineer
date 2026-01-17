# SEO AUDITOR KNOWLEDGE BASE

**Generated:** 2026-01-17
**Domain:** SEO Tools + Universal SST Snippet

## OVERVIEW
Two components: Shopify SEO auditor + Universal server-side tracking (SST) snippet.

## STRUCTURE
```
seo-auditor/
├── # SST FRAMEWORK
├── universal-tracking-snippet.js  # Client-side tracker (9KB)
├── sst-api.js                     # SST API endpoints (Cloudflare Worker)
├── schema.sql                     # SST database schema (sites, sessions, events)
├── SST_IMPLEMENTATION.md          # Full SST documentation
│
├── # SEO AUDITOR
├── shopify-seo-auditor.js         # Full Shopify SEO analysis
├── simple-auditor.js              # Lightweight version
├── html-parser.js                 # HTML analysis utilities
├── cli.js                         # CLI interface
│
├── # SHARED
├── core.ts                        # Shared utilities
├── types.ts                       # TypeScript types
├── wrangler.toml                  # Cloudflare config
└── test*.js                       # Test files
```

## UNIVERSAL SST FRAMEWORK

### Architecture
```
Client (any website)           SST API (Cloudflare Worker)
┌─────────────────────┐        ┌─────────────────────────┐
│ tracking-snippet.js │───────▶│ /api/v1/sst/auth        │
│   - Page views      │        │ /api/v1/sst/events      │
│   - Clicks          │        │ /api/v1/sst/sites       │
│   - Form submits    │        └──────────┬──────────────┘
│   - Conversions     │                   │
│   - Ad params       │                   ▼
└─────────────────────┘        ┌─────────────────────────┐
                               │ D1 Database             │
                               │   sites, sessions,      │
                               │   events tables         │
                               └─────────────────────────┘
```

### Client Installation
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

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/sst/auth` | POST | Site authentication (domain validation) |
| `/api/v1/sst/events` | POST | Event ingestion (batched) |
| `/api/v1/sst/sites` | GET/POST | Site registration/management |

### Tracked Events (Automatic)
- `page_view` - With UTM params, referrer, screen size
- `click` - Links, buttons, CTAs
- `form_submit` - Form data (field names, not values)

### Tracked Events (Manual)
```javascript
AdsEngineer.track('custom_event', { property: 'value' });
AdsEngineer.conversion({ value: 99.99, orderId: 'ORD-123' });
AdsEngineer.lead({ email: 'user@example.com', formType: 'contact' });
AdsEngineer.identify('user_123', { plan: 'premium' });
```

### Ad Parameter Collection
Auto-captures and persists (90-day cookie):
- `gclid` (Google Ads)
- `fbclid` (Meta/Facebook)
- `msclkid` (Microsoft Ads)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`

### Database Schema (D1)
```sql
sites (site_id, user_id, domain, name, plan, status)
sessions (session_id, site_id, expires_at, user_agent, ip_address)
events (id, session_id, site_id, event_name, properties, timestamp, url)
```

## CURRENT GAPS (Not Yet Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| GA4 Measurement Protocol | ❌ Missing | Need service to forward events to GA4 |
| Server-side GTM | ❌ Missing | No sGTM container integration |
| Client tier/labels | ❌ Missing | Only `plan` field exists, need `client_tier` |
| WooCommerce webhooks | ❌ Missing | No server-side order capture |

## SEO AUDITOR

### Usage
```bash
# Full audit
node shopify-seo-auditor.js -u https://store.com -d store.myshopify.com

# Simple audit
node simple-auditor.js -u https://store.com

# Save report
node shopify-seo-auditor.js -u https://store.com -o report.json
```

## COMMANDS
```bash
# Run SST API locally
wrangler dev

# Deploy SST API
wrangler deploy

# Run auditor tests
node test.js
```

## ANTI-PATTERNS
- Hardcoded API keys
- Blocking sync calls
- Missing error handling
- Unsanitized HTML parsing
- Storing PII in events (hash first)
