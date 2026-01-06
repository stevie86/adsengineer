# Shopify Webhook Configuration

This guide explains how to configure Shopify webhooks for the AdsEngineer conversion tracking system.

## Webhook Endpoint

**Production URL:**
```
https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
```

## Required Webhooks

Configure the following webhooks in your Shopify admin:

| Event Topic | Description | When Triggered |
|-------------|-------------|----------------|
| `orders/create` | New order created | Customer places order |
| `orders/paid` | Order paid | Payment successful |
| `customers/create` | New customer registered | Customer account created |
| `customers/update` | Customer updated | Customer details changed |

## Setup Steps

### 1. Navigate to Webhooks

1. Go to your Shopify Admin → **Settings** → **Apps and sales channels**
2. Click **Develop apps** (or **Manage private apps** for older Shopify)
3. Create a new app or select existing one
4. Click **Configure Webhooks**

### 2. Add Webhooks

Add the following webhooks:

```
Topic: orders/create
Callback URL: https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Format: JSON

Topic: orders/paid
Callback URL: https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Format: JSON

Topic: customers/create
Callback URL: https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Format: JSON

Topic: customers/update
Callback URL: https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Format: JSON
```

### 3. Copy Webhook Secret

After saving webhooks, Shopify generates a **webhook signature secret** for each. Copy this secret and provide it to AdsEngineer for configuration.

**Example webhook secret:**
```
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
```

### 4. Provide Credentials to AdsEngineer

Send the following to configure your account:

```json
{
  "shop_domain": "yourstore.myshopify.com",
  "shopify_webhook_secret": "shpat_your_secret_here"
}
```

## GCLID Support

The webhook handler extracts GCLID from three sources (in priority order):

1. **note_attributes** - Best method (set by tracking script)
2. **tags** - Format: `gclid:GCLID_xxx`
3. **landing_site** - URL query parameter

## Verification

Test your webhook configuration:

```bash
curl https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
```

Expected response:
```json
{
  "status": "ready",
  "shop": "mycannaby.de (demo)",
  "endpoints": {
    "POST": "/webhook - Receives Shopify webhooks"
  },
  "supported_topics": [
    "customers/create",
    "customers/update",
    "orders/create",
    "orders/paid"
  ],
  "gclid_support": {
    "sources": ["note_attributes", "tags", "landing_site"],
    "storage": "sha256_hash",
    "redaction": "first8_last4"
  }
}
```

## Troubleshooting

### "Webhook signature validation failed"
- Verify the webhook secret matches exactly
- Check for extra whitespace or characters

### "Unknown shop domain"
- Ensure your shop domain is configured in AdsEngineer
- Contact support to add your store

### Webhooks not triggering
- Verify webhook is active in Shopify admin
- Check Shopify's webhook delivery logs
- Ensure your app has necessary permissions

## Rate Limiting

| Limit Type | Default | Description |
|------------|---------|-------------|
| Per IP | 100 requests/hour | Prevents abuse |
| Per shop | 1,000 requests/hour | Handles high volume |
| Global | Configurable | Per-endpoint limits |

## Security Headers

All webhook responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```
