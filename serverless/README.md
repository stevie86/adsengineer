# AdVocate Cloud - MVP Setup Guide

## Quick Start

```bash
cd serverless
pnpm install
pnpm dev
```

## Production API

**Live URL:** https://adsengineer-cloud.adsengineer.workers.dev

### Health Check
```bash
curl https://adsengineer-cloud.adsengineer.workers.dev/health
```

### API Documentation
- Swagger UI: https://adsengineer-cloud.adsengineer.workers.dev/docs
- OpenAPI JSON: https://adsengineer-cloud.adsengineer.workers.dev/openapi.json

## API Endpoints

### Core Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/snippet.js` | GET | No | Tracking snippet for websites |

### Platform Integration
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/shopify/webhook` | POST | Signature | Shopify webhook receiver |
| `/api/v1/ghl/webhook` | POST | Signature | GoHighLevel webhook receiver |

### Lead & Attribution
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/leads` | GET/POST | JWT | Lead management |
| `/api/v1/custom-events` | GET/POST | JWT | Track/retrieve custom events |
| `/api/v1/custom-event-definitions/definitions` | GET/POST | JWT | Manage event definitions |
| `/api/v1/custom-event-definitions/sites/:siteId` | GET | JWT | Get site event assignments |
| `/api/v1/custom-event-definitions/sites/:siteId/assign` | POST | JWT | Assign events to sites |

### Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/status` | GET | JWT | System status |
| `/api/v1/admin/*` | GET/POST | Admin | Administrative functions |
| `/api/v1/waitlist` | POST | No | Landing page signups |

## Environment Setup

### Required Secrets (Cloudflare Dashboard)

```
JWT_SECRET=<your-jwt-secret>
GHL_WEBHOOK_SECRET=<your-ghl-webhook-secret>
ADMIN_TOKEN=<your-admin-token>
```

### Optional: Google Ads Integration

Store per-agency credentials in the `agencies` table:
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com",
  "client_secret": "your-client-secret",
  "refresh_token": "your-refresh-token",
  "developer_token": "your-developer-token",
  "customer_id": "1234567890",
  "conversion_action_id": "987654321"
}
```

## Development Commands

```bash
pnpm dev           # Local development server
pnpm types:check   # TypeScript validation
pnpm test          # Run tests
pnpm deploy        # Deploy to production
```

## Database Migrations

```bash
wrangler d1 migrations apply adsengineer-db --remote
```

## GHL Integration

### Webhook Setup

1. In GoHighLevel, navigate to Settings > Integrations > Webhooks
2. Add webhook URL: `https://advocate-cloud.adsengineer.workers.dev/api/v1/ghl/webhook`
3. Select events: Contact Created, Contact Updated, Opportunity Created
4. Copy the webhook secret to Cloudflare secrets

### Expected Webhook Payload

```json
{
  "contact": {
    "id": "contact_123",
    "email": "lead@example.com",
    "phone": "+1234567890",
    "customField": {
      "gclid": "EAIaIQv3i3m8e7vOZ-1572532743"
    }
  },
  "locationId": "loc_456"
}
```

## Google Ads Conversion Upload

Conversions are uploaded via the Google Ads REST API v17:

```typescript
POST https://googleads.googleapis.com/v17/customers/{customer_id}:uploadClickConversions

{
  "conversions": [{
    "conversion_action": "customers/123/conversionActions/456",
    "gclid": "EAIaIQv3i3m8e7vOZ-1572532743",
    "conversion_date_time": "2026-01-01 12:00:00+00:00",
    "conversion_value": 150.00,
    "currency_code": "USD"
  }],
  "partial_failure": true
}
```

## Troubleshooting

### Common Issues

**"Database connection failed"**
- Check D1 binding in wrangler.jsonc
- Verify database exists: `wrangler d1 list`

**"Invalid JWT token"**
- Ensure JWT_SECRET is set in Cloudflare secrets
- Check token expiration

**"Google Ads upload failed"**
- Verify OAuth credentials are valid
- Check GCLID format (must be valid Google Click ID)
- Conversions must be within 90 days

### Logs

```bash
wrangler tail
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GHL Webhook   │────▶│ Cloudflare Worker │────▶│   Google Ads    │
└─────────────────┘     │                  │     │   Conversions   │
                        │   D1 Database    │     └─────────────────┘
┌─────────────────┐     │   - leads        │
│  Landing Page   │────▶│   - agencies     │
│   (Waitlist)    │     │   - audit_logs   │
└─────────────────┘     └──────────────────┘
```

## Support

- GitHub Issues: https://github.com/adsengineer/ad-autopilot/issues
- Email: support@adsengineer.com