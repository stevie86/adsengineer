# Shopify App Integration

**Feature ID:** shopify-app-integration  
**Created:** 2026-01-07  
**Status:** Specification Complete  
**Priority:** P0 - Critical Path

---

## Overview

Build a native Shopify App that enables one-click installation of AdsEngineer's server-side tracking for Shopify merchants. The app eliminates manual webhook configuration by automatically registering webhooks during OAuth install flow.

### Problem Statement

Current integration requires merchants to:
1. Manually copy/paste webhook URLs into Shopify admin
2. Configure webhook secrets
3. No App Store discovery (zero organic distribution)

This friction limits adoption and loses to competitors with native apps.

### Solution

A Shopify App (initially unlisted, later App Store) that:
1. Installs via OAuth flow (one click)
2. Auto-registers webhooks on install
3. Provides basic status UI in Shopify admin
4. Connects to existing AdsEngineer backend

---

## User Scenarios

### Scenario 1: New Merchant Installation

**Actor:** Shopify store owner  
**Goal:** Connect store to AdsEngineer tracking

**Flow:**
1. Merchant receives install link from AdsEngineer
2. Clicks link → redirected to Shopify OAuth
3. Reviews permissions → clicks "Install"
4. App auto-configures webhooks
5. Merchant sees "Connected" status
6. Orders now flow to AdsEngineer automatically

**Acceptance Criteria:**
- [ ] Install completes in under 30 seconds
- [ ] No manual configuration required
- [ ] Webhooks registered for: orders/create, orders/paid, app/uninstalled
- [ ] Merchant can verify connection status in Shopify admin

### Scenario 2: Viewing Connection Status

**Actor:** Shopify store owner  
**Goal:** Verify AdsEngineer is receiving data

**Flow:**
1. Merchant opens app in Shopify admin
2. Sees connection status dashboard
3. Views recent sync activity
4. Can manually test connection

**Acceptance Criteria:**
- [ ] Status shows: Connected/Disconnected indicator
- [ ] Last successful sync timestamp displayed
- [ ] Recent orders synced count visible
- [ ] "Test Connection" button works

### Scenario 3: Uninstallation

**Actor:** Shopify store owner  
**Goal:** Remove AdsEngineer from store

**Flow:**
1. Merchant clicks "Uninstall" in Shopify admin
2. App receives uninstall webhook
3. AdsEngineer marks store as inactive
4. Data retained for potential re-install

**Acceptance Criteria:**
- [ ] Uninstall webhook received and processed
- [ ] Store marked inactive in AdsEngineer database
- [ ] Historical data preserved (not deleted)
- [ ] Clean uninstall (no orphaned webhooks)

---

## Functional Requirements

### FR-1: OAuth Installation Flow

**Description:** Implement Shopify OAuth 2.0 flow for app installation

**Requirements:**
- FR-1.1: `/auth/shopify` endpoint redirects to Shopify OAuth with required scopes
- FR-1.2: `/auth/shopify/callback` exchanges code for access token
- FR-1.3: Access token stored securely (encrypted at rest)
- FR-1.4: Shop domain associated with existing agency/org record
- FR-1.5: Installation recorded with timestamp

**Scopes Required:**
- `read_orders` - Access order data
- `write_orders` - Add order notes/tags (for GCLID)
- `read_customers` - Access customer data
- `read_products` - Access product data (for conversion value)

### FR-2: Automatic Webhook Registration

**Description:** Register required webhooks via Shopify Admin API on install

**Requirements:**
- FR-2.1: Create webhook for `orders/create` topic
- FR-2.2: Create webhook for `orders/paid` topic  
- FR-2.3: Create webhook for `app/uninstalled` topic
- FR-2.4: Webhook URL points to existing `/api/v1/shopify/webhook` endpoint
- FR-2.5: Webhook registration happens automatically after OAuth success
- FR-2.6: Failed registration triggers error notification

**Webhook Configuration:**
```
Address: https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Format: JSON
API Version: 2024-01 (or latest stable)
```

### FR-3: Embedded Admin UI

**Description:** Basic status dashboard within Shopify admin

**Requirements:**
- FR-3.1: App loads within Shopify admin iframe (App Bridge)
- FR-3.2: Displays connection status (connected/disconnected)
- FR-3.3: Shows last sync timestamp
- FR-3.4: Shows count of orders synced (last 7 days)
- FR-3.5: "Test Connection" button pings AdsEngineer backend
- FR-3.6: Link to full AdsEngineer dashboard (external)

### FR-4: Session Token Authentication

**Description:** Secure embedded app authentication using Shopify session tokens

**Requirements:**
- FR-4.1: Validate session tokens on all embedded app requests
- FR-4.2: Extract shop domain from session token
- FR-4.3: Reject requests with invalid/expired tokens

### FR-5: Uninstall Handling

**Description:** Clean up when merchant uninstalls app

**Requirements:**
- FR-5.1: Receive `app/uninstalled` webhook
- FR-5.2: Mark shop as inactive in database
- FR-5.3: Do NOT delete historical data
- FR-5.4: Log uninstall event for analytics

---

## Non-Functional Requirements

### NFR-1: Performance
- OAuth flow completes in < 5 seconds
- Webhook registration completes in < 3 seconds
- Embedded UI loads in < 2 seconds

### NFR-2: Security
- Access tokens encrypted at rest
- HMAC signature validation on all webhooks
- Session token validation on embedded app
- No sensitive data in URLs or logs

### NFR-3: Reliability
- Webhook registration retries on failure (3 attempts)
- Graceful degradation if AdsEngineer backend unavailable
- Connection status reflects actual state

### NFR-4: Compliance
- Privacy policy URL provided
- GDPR-compliant data handling
- Shopify App Store requirements met

---

## Technical Constraints

### Must Integrate With
- Existing Cloudflare Workers backend (`serverless/`)
- Existing Shopify webhook handler (`/api/v1/shopify/webhook`)
- Existing D1 database schema (agencies table)
- Existing Google Ads conversion upload pipeline

### Shopify Requirements
- Shopify API version: 2024-01 or later
- App Bridge 3.x for embedded UI
- Polaris components for UI consistency
- Session token authentication (not cookies)

### Reuse Existing Code
- `serverless/src/routes/shopify.ts` - webhook handler (100% reuse)
- `serverless/src/services/crypto.ts` - signature validation (100% reuse)
- `serverless/src/routes/oauth.ts` - OAuth pattern reference (80% reuse)

---

## Success Criteria

1. **Installation Success Rate:** >95% of install attempts complete successfully
2. **Time to Value:** Merchant sees first order synced within 24 hours of install
3. **Webhook Reliability:** >99.9% of order webhooks processed successfully
4. **User Satisfaction:** Merchants can verify connection status without support

---

## Out of Scope (V1)

- Shopify App Store listing (unlisted first)
- Billing through Shopify (use existing Stripe)
- Advanced analytics in embedded UI
- Multi-location support
- Shopify POS integration
- Theme app extensions

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Shopify Partner Account | Required | Create before development |
| Existing webhook handler | ✅ Done | `serverless/src/routes/shopify.ts` |
| D1 database | ✅ Done | Agencies table exists |
| Google Ads integration | ✅ Done | Conversion upload working |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Shopify API changes | Low | Medium | Use stable API version, monitor deprecations |
| App Store rejection | Medium | High | Follow guidelines, prepare compliance docs early |
| Session token complexity | Medium | Low | Use official Shopify libraries |

---

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| OAuth Flow | 2 days | Install/uninstall working |
| Webhook Registration | 1 day | Auto-configure on install |
| Embedded UI | 2-3 days | Basic status dashboard |
| Testing & Polish | 2 days | End-to-end testing |
| **Total** | **7-8 days** | **Unlisted app ready** |

---

## Next Steps

1. Create Shopify Partner account
2. Create development app in Partner Dashboard
3. Implement OAuth flow (`/auth/shopify`, `/auth/shopify/callback`)
4. Implement webhook registration
5. Build minimal embedded UI
6. Test with development store
7. Deploy and generate install links
