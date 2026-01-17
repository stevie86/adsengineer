---
name: google-ads
description: Google Ads Offline Conversions API integration - upload conversions via GCLID
license: UNLICENSED
compatibility: opencode
metadata:
  platform: google-ads
  api-version: v17
  auth: oauth2
---

# Google Ads Integration

## What I Do
- Upload offline conversions to Google Ads via REST API
- Handle OAuth2 token refresh
- Format conversion data for Google Ads API v17

## Files
- `src/services/google-ads.ts` - Core API client
- `src/services/google-ads-queue.ts` - Batch processing queue
- `src/routes/oauth.ts` - OAuth flow (`/oauth/google/*`)
- `src/database/` - Agency credentials storage

## Key Types
```typescript
interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string; // For MCC accounts
}

interface ConversionData {
  gclid?: string;
  conversionActionId: string;
  conversionValue: number;
  currencyCode?: string;
  conversionTime: string; // "yyyy-mm-dd hh:mm:ss+|-hh:mm"
  orderId?: string;
}
```

## Click ID
- Parameter: `gclid`
- Config field: `agencies.google_ads_config`

## API Endpoint
```
POST https://googleads.googleapis.com/v17/customers/{customer_id}:uploadClickConversions
```

## When to Use
- Adding Google Ads conversion tracking
- Debugging conversion upload failures
- Modifying OAuth flow
- Adding new conversion action types
