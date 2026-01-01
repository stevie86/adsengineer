# Apprise Notification System Implementation

## Overview

Replace Pushbullet-only notifications with **Apprise** for multi-channel support while maintaining compatibility with existing n8n workflow.

## Why Apprise

- **70+ notification services** - Telegram, Slack, Discord, SMS, Email, etc.
- **Single API** - Same syntax for all channels
- **Failover support** - Primary + backup channels
- **No vendor lock-in** - Switch providers without code changes

## Architecture

```
Worker Event → Apprise API → Multiple Channels
                      ├── Pushbullet (existing)
                      ├── Telegram (future)
                      ├── Slack (future)
                      └── Email (backup)
```

## Implementation Steps

### 1. Update Worker Dependencies

```bash
cd serverless
pnpm add apprise
```

### 2. Add Notification Service

File: `serverless/src/services/notification.ts`

```typescript
import { Apprise } from 'apprise';
import type { AppEnv } from '../types';

export class NotificationService {
  private apprise: Apprise;

  constructor(env: AppEnv) {
    this.apprise = new Apprise();
    
    // Add notification URLs from environment
    if (env.PUSHBULLET_TOKEN) {
      this.apprise.add(`pbul://${env.PUSHBULLET_TOKEN}`);
    }
    
    // Future channels (add when ready)
    if (env.TELEGRAM_BOT_TOKEN) {
      this.apprise.add(`tgram://${env.TELEGRAM_BOT_TOKEN}/${env.TELEGRAM_CHAT_ID}`);
    }
  }

  async notify(title: string, body: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    const titlePrefix = priority === 'high' ? '🚨 ' : priority === 'normal' ? '📱 ' : 'ℹ️ ';
    const fullTitle = `${titlePrefix}${title}`;
    
    try {
      await this.apprise.notify({
        title: fullTitle,
        body: body,
        notifyType: priority
      });
    } catch (error) {
      console.error('Notification failed:', error);
      // Fallback to console for development
      console.log(`${fullTitle}: ${body}`);
    }
  }

  async notifyLead(data: {
    email: string;
    gclid?: string;
    lead_value_cents: number;
    utm_source?: string;
  }) {
    const title = '🎯 New Lead Captured';
    const body = `Email: ${data.email}\nGCLID: ${data.gclid || 'None'}\nValue: $${Math.round(data.lead_value_cents / 100)}\nSource: ${data.utm_source || 'Direct'}`;
    
    await this.notify(title, body, 'normal');
  }

  async notifySignup(data: {
    email: string;
    agency_name?: string;
    monthly_ad_spend?: string;
  }) {
    const title = '📝 New Waitlist Signup';
    const body = `Email: ${data.email}\nAgency: ${data.agency_name || 'Not provided'}\nAd Spend: ${data.monthly_ad_spend || 'Not provided'}`;
    
    await this.notify(title, body, 'normal');
  }

  async notifyError(data: {
    message: string;
    endpoint?: string;
    timestamp: string;
  }) {
    const title = 'Error Alert';
    const body = `Error: ${data.message}\nEndpoint: ${data.endpoint || 'Unknown'}\nTime: ${data.timestamp}`;
    
    await this.notify(title, body, 'high');
  }
}
```

### 3. Update Routes

File: `serverless/src/routes/notify.ts`

```typescript
import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { NotificationService } from '../services/notification';

export const notifyRoutes = new Hono<AppEnv>();

notifyRoutes.post('/', async (c) => {
  const notification = new NotificationService(c.env);
  const body = await c.req.json();
  
  try {
    switch (body.event_type) {
      case 'new_lead':
        await notification.notifyLead(body.data);
        break;
      case 'new_signup':
        await notification.notifySignup(body.data);
        break;
      case 'error':
        await notification.notifyError(body.data);
        break;
      default:
        console.log('Unknown event type:', body.event_type);
    }
    
    return c.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Notification error:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});
```

### 4. Update Environment Variables

```bash
# wrangler.toml or Cloudflare Workers dashboard
PUSHBULLET_TOKEN=your_existing_token
# Future additions:
# TELEGRAM_BOT_TOKEN=your_bot_token
# TELEGRAM_CHAT_ID=your_chat_id
```

## N8n Workflow Updates

### Current Pushbullet Flow (Keep Working)

Your existing n8n workflow continues to work unchanged:
- Webhook → Worker `/api/v1/notify` → Pushbullet
- No immediate changes required

### Enhanced Flow (Optional)

```json
{
  "name": "Enhanced Notification Router",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "webhookId": "notification-webhook-v2"
    },
    {
      "name": "Call Worker API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://advocate-cloud.adsengineer.workers.dev/api/v1/notify",
        "jsonParameters": true,
        "body": {
          "event_type": "={{ $json.event_type }}",
          "data": "={{ $json.data }}"
        }
      }
    },
    {
      "name": "Success Response",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "assignments": [
            {
              "name": "success",
              "value": true,
              "type": "boolean"
            },
            {
              "name": "message", 
              "value": "Notification sent via Apprise",
              "type": "string"
            }
          ]
        }
      }
    }
  ]
}
```

## Migration Timeline

### Phase 1 (Now - Pushbullet Compatibility)
- [ ] Implement Apprise in Worker
- [ ] Add Pushbullet support
- [ ] Test existing n8n workflow
- [ ] Deploy

### Phase 2 (Next - Telegram Addition)
- [ ] Add Telegram bot token to environment
- [ ] Test Telegram notifications
- [ ] Update n8n to use new endpoint (optional)

### Phase 3 (Future - Multi-channel)
- [ ] Add Slack/Discord channels
- [ ] Implement failover logic
- [ ] Add notification preferences per agency

## Benefits Summary

1. **Immediate**: Keep existing Pushbullet working
2. **Short-term**: Easy Telegram addition  
3. **Long-term**: Multi-channel redundancy
4. **Zero disruption**: n8n workflow unchanged
5. **Cost efficient**: Single API vs multiple integrations

## Recommended Action

**Start with Phase 1** - Implement Apprise with Pushbullet support today. This gives you the foundation for Telegram and other channels later without breaking existing workflows.

The migration is backwards compatible - your current n8n workflow continues working while you gain flexibility for future channels.