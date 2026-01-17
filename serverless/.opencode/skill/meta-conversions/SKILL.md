---
name: meta-conversions
description: Meta/Facebook Conversions API (CAPI) integration - server-side event tracking
license: UNLICENSED
compatibility: opencode
metadata:
  platform: meta
  api-version: v18.0
  auth: oauth2
---

# Meta Conversions API Integration

## What I Do
- Upload server-side events to Meta via Conversions API
- Hash PII (email, phone) with SHA-256 for privacy
- Handle Facebook OAuth2 authentication

## Files
- `src/services/meta-conversions.ts` - Core CAPI client
- `src/routes/oauth.ts` - OAuth flow (`/oauth/meta/*`)
- `src/database/` - Agency credentials storage

## Key Types
```typescript
interface MetaConversionData {
  fbclid?: string;
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  custom_data?: {
    order_id?: string;
    content_name?: string;
    content_category?: string;
  };
  user_data?: {
    email?: string;  // Will be SHA-256 hashed
    phone?: string;  // Will be SHA-256 hashed
    external_id?: string;
  };
}
```

## Click ID
- Parameter: `fbclid`
- Config field: `agencies.meta_config`

## API Endpoint
```
POST https://graph.facebook.com/v18.0/{pixel_id}/events
```

## Privacy Requirements
- All PII (email, phone) MUST be SHA-256 hashed before sending
- Use lowercase and trim whitespace before hashing

## When to Use
- Adding Meta/Facebook conversion tracking
- Debugging CAPI event delivery
- Modifying OAuth flow
- Adding new event types
