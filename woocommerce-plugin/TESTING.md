# WooCommerce Plugin - Status & Testing Guide

**Last Updated:** 2026-01-30

## Current Status: **Production Ready**

---

## Architecture Overview

```
┌──────────────────────────────────┐
│    WordPress/WooCommerce Site    │
│  ┌────────────────────────────┐  │
│  │  AdsEngineer Plugin (PHP)  │  │
│  │  - Tracking snippet inject   │  │
│  │  - GCLID cookie capture   │  │
│  │  - Order hooks            │  │
│  │  - Webhook sender         │  │
│  └──────────────┬─────────────┘  │
└─────────────────┼────────────────┘
                  │ POST /api/v1/woocommerce/webhook
                  ▼
┌──────────────────────────────────┐
│      AdsEngineer API             │
│  serverless/src/routes/          │
│  woocommerce.ts                  │
│  - HMAC signature validation     │
│  - Agency matching by domain     │
│  - Lead storage in D1            │
└──────────────────────────────────┘
```

---

## Components

| Component | Location | Status |
|-----------|----------|--------|
| **WordPress Plugin** | `woocommerce-plugin/adsengineer-woocommerce/` | ✅ Production Ready |
| **API Routes** | `serverless/src/routes/woocommerce.ts` | ✅ Complete |
| **Event Normalizer** | `serverless/src/services/event-normalizer.ts` | ✅ Complete |
| **WooCommerce Adapter** | `serverless/src/workers/multi-platform-tracking/src/adapters/woocommerce.ts` | ✅ Complete |
| **ZIP Generator** | `serverless/src/services/woocommerce-zip.ts` | ✅ Complete |
| **Tests** | `serverless/tests/unit/woocommerce-zip.test.ts` | ✅ All passing |

---

## Known Issues

| Issue | Severity | Details | Status |
|-------|----------|---------|---------|
| ~~Wrong default webhook URL~~ | ~~🔴 High~~ | Plugin defaults to `/webhooks/woo` but API endpoint is `/api/v1/woocommerce/webhook` | ✅ Fixed in v1.1.0 |
| ~~Missing GCLID capture~~ | ~~🟡 Medium~~ | Requires manual code in `functions.php` - not bundled | ✅ Fixed in v1.1.0 |
| ~~Two settings pages~~ | ~~🟡 Medium~~ | Confusing UX (one at Settings > AdsEngineer, another standalone) | ✅ Fixed in v1.1.0 |
| ~~Missing nonce verification~~ | ~~🟡 Medium~~ | Security issue in form submission | ✅ Fixed in v1.1.0 |
| Agency config required | 🟡 Medium | Backend requires `woocommerce_domain` + `woocommerce_webhook_secret` in agency config | ✅ Working as designed |

---

## Testing with Test Purchases

### Option 1: Local WooCommerce (Recommended)

**Prerequisites:**
- Local WordPress with WooCommerce (LocalWP, MAMP, Docker)
- ngrok or similar for webhook tunneling (if testing against production API)

**Steps:**

#### 1. Get plugin ZIP

```bash
curl -o adsengineer-woocommerce.zip \
  "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/zip"
```

#### 2. Install in WordPress

- WordPress Admin → Plugins → Add New → Upload Plugin
- Upload ZIP, activate

#### 3. Configure plugin

- Go to Settings → AdsEngineer
- Enter your **Site ID** (get from dashboard)
- Enter **Webhook URL** (or use default: `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook`)
- Click Save Settings
- Verify status indicators show "✓ Configured"

#### 4. Configure agency in database

You need an agency record with WooCommerce config:

```sql
UPDATE agencies
SET config = json_set(config,
  '$.woocommerce_domain', 'your-local-site.local',
  '$.woocommerce_webhook_secret', 'your-secret-here'
)
WHERE id = 'your-agency-id';
```

#### 5. Make a test purchase

1. Visit your store with `?gclid=test-gclid-12345` in URL
2. Add a product to cart
3. Complete checkout
4. Check `wp-content/debug.log` for AdsEngineer messages

**Expected behavior:**
- Plugin shows "✓ Plugin is configured and tracking!" in settings
- Snippet is injected on frontend (check page source for `snippet.js`)
- GCLID is captured from cookies to order
- Order data is sent to webhook endpoint
- API logs show successful lead creation

---

### Option 2: Direct API Testing (No WooCommerce Needed)

Test webhook endpoint directly with curl:

```bash
# Set your webhook secret
SECRET="your-webhook-secret"

# Create test payload
BODY='{"id":12345,"status":"completed","currency":"USD","total":"99.99","billing":{"email":"test@example.com","phone":"+1234567890","first_name":"Test","last_name":"User"},"date_created_gmt":"2026-01-29 12:00:00","meta_data":[{"key":"_gclid","value":"test-gclid-12345"}]}'

# Generate HMAC signature
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

# Send test webhook
curl -X POST "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook" \
  -H "Content-Type: application/json" \
  -H "x-wc-webhook-source: https://your-configured-domain.com" \
  -H "x-wc-webhook-signature: $SIGNATURE" \
  -d "$BODY"
```

**Expected response:**
```json
{"success": true, "lead_id": "..."}
```

**Common error responses:**

| Response | Cause |
|----------|-------|
| `{"error": "Missing webhook headers"}` | Missing `x-wc-webhook-signature` or `x-wc-webhook-source` |
| `{"error": "Site not configured"}` | No agency with matching `woocommerce_domain` |
| `{"error": "Invalid signature"}` | Wrong webhook secret or signature calculation |

---

### Option 3: Use Demo Endpoint

There's a demo endpoint for WooCommerce product templates:

```bash
curl "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/demo/templates/woocommerce-product"
```

---

## Debugging

### WordPress Logs

Enable debug logging in `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Then tail log:

```bash
tail -f wp-content/debug.log
```

**Look for:**
- `AdsEngineer: Webhook handler initialized` - Plugin started successfully
- `AdsEngineer: Order X sent successfully` - Webhook delivered
- `AdsEngineer: Failed to send order` - Webhook failed (check error message)

### API Logs

```bash
cd serverless && wrangler tail
```

---

## Quick Test Checklist

- [ ] Plugin installed and activated
- [ ] Site ID configured in settings (get from AdsEngineer dashboard)
- [ ] Webhook URL correctly set to `/api/v1/woocommerce/webhook` (or use default)
- [ ] Settings page shows "✓ Plugin is configured and tracking!"
- [ ] Agency record has `woocommerce_domain` matching your site
- [ ] Agency record has `woocommerce_webhook_secret` set
- [ ] Visit site and verify `snippet.js` is injected in page source
- [ ] Test order placed with `?gclid=test-123` in URL
- [ ] Check WordPress debug.log for success/failure messages
- [ ] Check API logs with `wrangler tail`

---

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/woocommerce/info` | GET | None | Plugin information |
| `/api/v1/woocommerce/download` | GET | None | Download PHP plugin file |
| `/api/v1/woocommerce/zip` | GET | None | Download plugin as ZIP |
| `/api/v1/woocommerce/webhook` | POST | HMAC | Receive order webhooks |

---

## Webhook Payload Schema

```json
{
  "id": 12345,
  "status": "completed",
  "currency": "USD",
  "total": "99.99",
  "billing": {
    "email": "customer@example.com",
    "phone": "+1234567890",
    "first_name": "John",
    "last_name": "Doe"
  },
  "date_created_gmt": "2026-01-29 12:00:00",
  "meta_data": [
    {"key": "_gclid", "value": "EAIaIQv3i3m8e7vOZ-1572532743"}
  ]
}
```

---

## Related Files

- `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php` - Main plugin
- `woocommerce-plugin/adsengineer-woocommerce/README.md` - Plugin README
- `serverless/src/routes/woocommerce.ts` - API routes
- `serverless/src/services/woocommerce-zip.ts` - ZIP generator
- `serverless/src/workers/multi-platform-tracking/src/adapters/woocommerce.ts` - Event adapter
