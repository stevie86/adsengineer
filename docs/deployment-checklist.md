# Deployment Checklist - mycannaby.de

## Prerequisites

### 1. Cloudflare API Token (Required for D1 + Deploy)

**Create token at:** https://dash.cloudflare.com/profile/api-tokens

**Required permissions:**
- `Cloudflare Workers:Edit` - Deploy workers
- `Cloudflare Workers:Read` - Read worker configs
- `D1:Edit` - Execute D1 migrations
- `D1:Read` - Read D1 schemas

**Or use "Edit Workers & D1" template**

### 2. Add Token to Doppler

```bash
doppler secrets set CLOUDFLARE_API_TOKEN --value "your_api_token_here"
```

## Deployment Steps

### Step 1: Run D1 Migration

```bash
cd /home/webadmin/coding/ads-engineer
doppler run -- npx wrangler d1 execute adsengineer-db --remote --file=customers/mycannaby-setup.sql --yes
```

Expected output:
```
▲  WARNING: This process may take some time...

✅ Migration complete
```

### Step 2: Deploy to Production

```bash
cd /home/webadmin/coding/ads-engineer/serverless
doppler run -- pnpm deploy
```

Expected output:
```
▲  Worker built successfully
▲  Uploading...
▲  Deployed
```

### Step 3: Verify Deployment

```bash
curl https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
```

Expected response:
```json
{
  "status": "ready",
  "shop": "mycannaby.de (demo)",
  ...
}
```

## Shopify Configuration (Customer Tasks)

### 1. Configure Webhooks

**URL:** `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook`

**Topics:**
- `orders/create`
- `orders/paid`
- `customers/create`
- `customers/update`

### 2. Add Tracking Script

Add to theme.liquid before `</head>`:

```html
<script src="https://docs.adsengineer.cloud/shopify-gclid-tracking.js"></script>
```

Or inline the script from `docs/shopify-gclid-tracking.js`

### 3. Send Webhook Secret

Email to: `setup@adsengineer.cloud`
Subject: `mycannaby.de Webhook Secret`

```json
{
  "shop_domain": "mycannaby.myshopify.com",
  "webhook_secret": "shpat_your_secret_here"
}
```

## Environment Variables (Doppler)

These should already be configured:

| Secret | Status |
|--------|--------|
| `JWT_SECRET` | ✅ Configured |
| `ADMIN_SECRET` | ✅ Configured |
| `MAILERSEND_API_KEY` | ✅ Configured |
| `BACKUP_ENCRYPTION_KEY` | ✅ Configured |
| `CLOUDFLARE_API_TOKEN` | ❌ **Need to add** |

## Troubleshooting

### "Unable to read SQL text file"
- Check file path is correct relative to serverless directory

### "CLOUDFLARE_API_TOKEN not configured"
- Add token to Doppler: `doppler secrets set CLOUDFLARE_API_TOKEN`

### "Worker deployment failed"
- Check Cloudflare dashboard for errors
- Verify token has Workers:Edit permission

### Webhooks returning 404
- Verify shop domain is in `agencies` table
- Run D1 migration first
