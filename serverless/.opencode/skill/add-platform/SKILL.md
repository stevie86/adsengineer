---
name: add-platform
description: Guide for adding a new ad platform integration to AdsEngineer
license: UNLICENSED
compatibility: opencode
metadata:
  type: guide
  difficulty: intermediate
---

# Adding a New Ad Platform

## Overview
AdsEngineer uses a modular platform architecture. Each ad platform (Google, Meta, TikTok, etc.) is a separate service module that follows a consistent pattern.

## Steps to Add a New Platform

### 1. Create Service Module
Create `src/services/{platform}-conversions.ts`:

```typescript
export interface {Platform}ConversionData {
  click_id?: string;      // Platform-specific (gclid, fbclid, ttclid, etc.)
  event_name: string;
  event_time: number;
  value?: number;
  currency?: string;
  user_data?: { email?: string; phone?: string };
}

export class {Platform}ConversionsAPI {
  private accessToken: string;
  private apiVersion: string = 'v1';

  constructor(accessToken: string, ...platformParams: any[]) {
    this.accessToken = accessToken;
  }

  async uploadConversions(conversions: {Platform}ConversionData[]): Promise<Result> {
    // Platform-specific API call
  }

  async validateCredentials(): Promise<boolean> {
    // Credential validation
  }
}
```

### 2. Add to Conversion Router
Update `src/services/conversion-router.ts`:

```typescript
import { {Platform}ConversionsAPI } from './{platform}-conversions';

// In routeConversions method:
const {platform}Conversions = conversions.filter(c => c.{click_id});
if ({platform}Conversions.length > 0 && agency.{platform}_config) {
  const config = JSON.parse(agency.{platform}_config);
  const client = new {Platform}ConversionsAPI(config.access_token, ...);
  results.{platform} = await client.uploadConversions({platform}Conversions);
}
```

### 3. Add Database Migration
Create `migrations/000X_{platform}_config.sql`:

```sql
ALTER TABLE agencies ADD COLUMN {platform}_config TEXT;
```

### 4. Add OAuth Flow (if needed)
Update `src/routes/oauth.ts`:

```typescript
oauthRoutes.get('/{platform}/init', async (c) => {
  // OAuth initiation
});

oauthRoutes.get('/{platform}/callback', async (c) => {
  // OAuth callback handling
});
```

### 5. Create Skill Documentation
Create `.opencode/skill/{platform}-conversions/SKILL.md` following the existing pattern.

## Checklist
- [ ] Service module with standard interface
- [ ] Added to conversion-router.ts
- [ ] Database migration for config storage
- [ ] OAuth flow (if applicable)
- [ ] Encryption for stored credentials
- [ ] Unit tests
- [ ] Integration tests
- [ ] Skill documentation

## Click ID Routing Table
| Platform | Click ID | Config Field |
|----------|----------|--------------|
| Google Ads | `gclid` | `google_ads_config` |
| Meta/Facebook | `fbclid` | `meta_config` |
| TikTok | `ttclid` | `tiktok_config` |
| LinkedIn | `li_fat_id` | `linkedin_config` |
| Microsoft | `msclkid` | `microsoft_config` |
| Pinterest | `epik` | `pinterest_config` |

## When to Use
- Adding support for a new ad platform
- Understanding the platform integration pattern
- Reviewing existing platform implementations
