---
name: tiktok-conversions
description: TikTok Events API integration - server-side conversion tracking
license: UNLICENSED
compatibility: opencode
metadata:
  platform: tiktok
  api-version: v1.3
  auth: oauth2
---

# TikTok Events API Integration

## What I Do
- Upload server-side events to TikTok Events API
- Handle TikTok webhook events
- Process TikTok click tracking (ttclid)

## Files
- `src/services/tiktok-conversions.ts` - Core Events API client
- `src/routes/tiktok.ts` - Webhook handlers
- `src/routes/oauth.ts` - OAuth flow (if implemented)
- `src/database/` - Agency credentials storage

## Key Types
```typescript
interface TikTokConversionData {
  ttclid?: string;
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  conversion_value?: number;
  order_id?: string;
  external_id?: string;
  ad_platform?: 'tiktok' | 'unknown';
  user_data?: {
    email?: string;
    phone?: string;
    external_id?: string;
  };
}
```

## Click ID
- Parameter: `ttclid`
- Config field: `agencies.tiktok_config`

## API Endpoint
```
POST https://business-api.tiktok.com/open_api/v1.3/event/upload/
```

## When to Use
- Adding TikTok conversion tracking
- Handling TikTok webhook events
- Debugging event delivery
- Adding new TikTok event types
