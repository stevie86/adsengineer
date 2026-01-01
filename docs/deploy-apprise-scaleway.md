# Deploy Apprise API to Cloudflare Workers (2025)

## Why Cloudflare Workers for Apprise API

✅ **100,000 requests/day FREE** (3M/month)
✅ **Already your platform** - no new account needed
✅ **Global edge** - sub-second cold starts
✅ **Zero cost** for notification workloads
✅ **Same platform** as your main app

## Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/caronc/apprise-api
cd apprise-api

# 2. Install Wrangler (if not already)
npm install -g wrangler

# 3. Configure as Workers project
wrangler init --compatibility-date=2024-11-01

# 4. Set environment variables
wrangler secret put APPRISE_CONFIG_FILE_URL
wrangler secret put PUSHBULLET_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN  # Future

# 5. Deploy
wrangler deploy
```

## Environment Configuration

Set these in Scaleway dashboard or CLI:

```bash
# Notification URLs (keep your existing Pushbullet)
APPRISE_CONFIG_FILE_URL=https://your-storage.com/apprise-config.yml

# Optional: Enable stateless mode (no persistence)
APPRISE_STATELESS_MODE=1

# Security (optional)
ALLOWED_ORIGINS=https://advocate-cloud.adsengineer.workers.dev
```

## Config File Format

Create `apprise-config.yml` and host it somewhere accessible:

```yaml
urls:
  - pbul://your-pushbullet-token
  # Future additions:
  # - tgram://your-bot-token/chat-id
  # - slack://your-webhook-url

format: text
title: AdVocate Notification
tag: advocate-alerts
```

## Update Cloudflare Worker

```typescript
// In your notification service
private APPRISE_API_URL = 'https://your-function.scaleway-app.com/notify';

async notify(title: string, body: string) {
  await fetch(this.APPRISE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      body,
      format: 'text',
      tag: 'advocate-alert'
    })
  });
}
```

## 2025 Cost Estimate (Cloudflare Workers)

For your notification volume:
- **1,000 notifications/month**: **$0** (within 100k/day free tier)
- **10,000 notifications/month**: **$0** (within 100k/day free tier)
- **100,000 notifications/month**: **$0** (within 100k/day free tier)
- **1M notifications/month**: **$0** (at daily limit, might need paid tier)

**All FREE for typical agency notification volumes!**

## Benefits

✅ Pay only when notifications are sent
✅ No monthly minimum fees
✅ Global edge deployment
✅ Easy to add Telegram/Slack later
✅ Keeps existing Pushbullet working