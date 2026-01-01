# AdVocate Architecture Overview

## Vision

AdVocate is a full-funnel ad automation platform that gives small-budget advertisers agency-level results through:
- **Visibility**: True conversion tracking with offline feedback loops
- **Automation**: AI-driven budget allocation, bid management, and campaign optimization
- **Simplicity**: One-click setup via WordPress plugin, managed by a central brain

## The Two-Part System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT SITES (WordPress)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Dental.com │  │ Plumber.com │  │  Legal.com  │  │  HVAC.com   │        │
│  │   Plugin    │  │   Plugin    │  │   Plugin    │  │   Plugin    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
└─────────┼────────────────┼────────────────┼────────────────┼───────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADVOCATE CLOUD (SaaS Backend)                        │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Ingestion  │  │  Optimizer   │  │   Planner    │  │   Dashboard  │    │
│  │   Service    │  │   Engine     │  │   AI Agent   │  │     API      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Google Ads  │  │  Meta Ads    │  │  Analytics   │  │   Alerting   │    │
│  │  Connector   │  │  Connector   │  │   Engine     │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Why This Split?

| Concern | WordPress Plugin | SaaS Backend |
|---------|------------------|--------------|
| **User onboarding** | ✅ Easy install, familiar UI | |
| **Event/conversion capture** | ✅ Direct site access | |
| **GCLID/FBCLID storage** | ✅ Per-site database | |
| **Local admin UI** | ✅ Native WP experience | |
| **API credentials** | | ✅ Centralized, secure vault |
| **Cross-account optimization** | | ✅ Aggregate learning |
| **Long-running jobs** | | ✅ Workers, queues |
| **Multi-client dashboard** | | ✅ Single pane of glass |
| **Billing & access control** | | ✅ Subscription management |
| **AI/ML models** | | ✅ GPU/compute resources |

## Data Flow

### 1. Lead Capture (Plugin → Cloud)

```
User visits site
       │
       ▼
Plugin captures:
  - GCLID/FBCLID from URL
  - UTM parameters
  - Landing page
  - Session data
       │
       ▼
User submits form / calls
       │
       ▼
Plugin creates lead record:
  - Contact info (hashed for privacy)
  - Lead score (initial)
  - Conversion value (base)
  - All tracking IDs
       │
       ▼
Plugin sends to Cloud API:
  POST /api/v1/leads
  {
    site_id: "abc123",
    gclid: "EAIaIQ...",
    lead_score: 72,
    value_cents: 15000,
    event_type: "form_submit",
    vertical: "dental",
    timestamp: "2025-12-29T10:30:00Z"
  }
```

### 2. Optimization Loop (Cloud → Ad Platforms)

```
Cloud receives lead data
       │
       ▼
Enrichment & Scoring:
  - Validate GCLID
  - Calculate adjusted value (multiplier)
  - Update lead score based on signals
       │
       ▼
Aggregation:
  - Group by campaign/ad group
  - Calculate true CPA, ROAS
  - Compare to targets
       │
       ▼
Decision Engine:
  - Budget reallocation needed?
  - Bid adjustments needed?
  - Pause underperformers?
  - Scale winners?
       │
       ▼
Execute via APIs:
  - Google Ads API: upload conversions, adjust bids
  - Meta API: update budgets, audiences
       │
       ▼
Log & Report:
  - Store all actions
  - Update dashboard
  - Send alerts if thresholds crossed
```

### 3. Status Sync (Cloud → Plugin)

```
Plugin polls Cloud:
  GET /api/v1/sites/{site_id}/status
       │
       ▼
Cloud returns:
  {
    sync_status: "healthy",
    last_optimization: "2025-12-29T09:00:00Z",
    actions_taken: [
      "Increased Campaign A budget by 15%",
      "Paused Ad Group B (CPA > $80)"
    ],
    data_integrity_score: 94,
    leads_synced_today: 12,
    value_protected: 4500
  }
       │
       ▼
Plugin displays in WP Admin:
  - Live Sync Dashboard
  - Health indicators
  - Recent actions log
```

## Security Model

### Plugin Security
- All API calls authenticated via site-specific JWT
- Sensitive data (emails, phones) hashed before transmission
- GCLID/FBCLID sent in full (required for conversion upload)
- WordPress nonces for all AJAX/REST endpoints
- Capability checks (`manage_options`) for admin features

### Cloud Security
- JWT tokens with short expiry, refresh rotation
- API keys for ad platform connections stored encrypted at rest
- Per-client data isolation (tenant ID on every query)
- Rate limiting per site to prevent abuse
- Audit log of all optimization actions

## Technology Stack

### WordPress Plugin
- **Language**: PHP 8.0+
- **WordPress**: 6.0+ compatibility
- **Frontend**: Vanilla JS + jQuery (WP admin context)
- **Storage**: WordPress options + custom tables via `$wpdb`
- **Communication**: REST API client to Cloud

### SaaS Backend
- **Runtime**: Node.js 20+ (or Bun for speed)
- **Framework**: Hono or Express (lightweight, fast)
- **Database**: PostgreSQL (primary) + Redis (cache/queues)
- **Queue**: BullMQ or similar for background jobs
- **Auth**: JWT + API keys
- **Hosting**: Railway / Render / Fly.io (start cheap, scale later)

### Ad Platform Integrations
- **Google Ads API**: Campaign management, conversion upload
- **Google Analytics 4**: Event tracking, audience sync
- **Meta Marketing API**: Campaign management, CAPI
- **Google Tag Manager API**: Container/tag automation

## Deployment Architecture

### Phase 1: Solo Dev (Now)
```
┌─────────────────┐     ┌─────────────────┐
│  Client Sites   │────▶│  Single Server  │
│  (WP + Plugin)  │     │  (API + Worker) │
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   (Managed)     │
                        └─────────────────┘
```

### Phase 2: Growth
```
┌─────────────────┐     ┌─────────────────┐
│  Client Sites   │────▶│   API Server    │
│  (WP + Plugin)  │     │   (Stateless)   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
             ┌───────────┐ ┌───────────┐ ┌───────────┐
             │  Worker 1 │ │  Worker 2 │ │  Worker N │
             │ (Optimize)│ │  (Sync)   │ │ (Reports) │
             └───────────┘ └───────────┘ └───────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 ▼
                        ┌─────────────────┐
                        │   PostgreSQL    │
                        │   + Redis       │
                        └─────────────────┘
```

## Next Steps

1. **Read**: `02-plugin-specification.md` for WordPress plugin details
2. **Read**: `03-saas-specification.md` for backend service details
3. **Read**: `04-feature-roadmap.md` for phased development plan
4. **Read**: `05-go-to-market.md` for commercial strategy
