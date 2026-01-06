# mycannaby Order Processing - n8n Workflow

This n8n workflow handles Shopify orders from mycannaby.de and integrates with AdsEngineer for conversion tracking.

## Features

- 🎯 **GCLID Extraction** - Automatically extracts GCLID from note_attributes, tags, or URL
- 📊 **Conversion Tracking** - Sends order data to AdsEngineer API
- 🔔 **Notifications** - Discord notifications for all orders
- 🚨 **High-Value Alerts** - Slack alerts for orders ≥ €100
- 🛡️ **Fail-Safe** - Webhook secret validation for security

## Setup Instructions

### 1. Create Shopify Credentials

In n8n, create a Shopify API credential:
- **Shop:** `mycannaby.myshopify.com`
- **Access Token:** Get from Shopify Admin → Apps → Develop apps → Your App → API credentials

### 2. Configure Environment Variables

Set these in n8n or `.env`:
```bash
SHOPIFY_WEBHOOK_SECRET=shpat_your_webhook_secret
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3. Import Workflow

1. Open n8n → Settings → Import → `docs/n8n-mycannaby-workflow.json`
2. Update Shopify Trigger credential
3. Activate workflow

### 4. Webhook Configuration

Alternatively, configure Shopify webhooks directly:

| Topic | URL |
|-------|-----|
| `orders/create` | `https://your-n8n.com/webhook/shopify-orders` |
| `orders/paid` | `https://your-n8n.com/webhook/shopify-orders` |

## Workflow Flow

```
Shopify Order
     ↓
Filter: orders/create only
     ↓
Extract GCLID (note_attributes → tags → URL)
     ↓
    ├─→ Send to AdsEngineer API
    └─→ Check: Order ≥ €100?
             ↓ No
             ↓ Yes → Slack Alert
     ↓
Discord Notification
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_WEBHOOK_SECRET` | Yes | Shopify webhook signature secret |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for notifications |
| `SLACK_WEBHOOK_URL` | No | Slack webhook for high-value alerts |

## Discord Notification Example

```
🛒 New Order - mycannaby
━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: 12345        Amount: €150.00
GCLID: ✅ EAIaIQv3...
━━━━━━━━━━━━━━━━━━━━━━━━━
```

## High-Value Alert (≥ €100)

```
🚨 High-Value Order Alert
━━━━━━━━━━━━━━━━━━━━━━
Amount: €150.00
Customer: customer@example.com
GCLID: EAIaIQv3...
```

## Troubleshooting

### GCLID not found
1. Verify tracking script is installed on Shopify theme
2. Check that customers arrive via Google Ads
3. Test: Open browser dev tools → check `localStorage.adsengineer_gclid`

### Webhook not firing
1. Verify Shopify webhook is active
2. Check webhook delivery logs in Shopify
3. Ensure n8n webhook URL is publicly accessible

### API errors
1. Verify AdsEngineer API is deployed
2. Check `SHOPIFY_WEBHOOK_SECRET` matches AdsEngineer config
3. Review n8n execution logs
