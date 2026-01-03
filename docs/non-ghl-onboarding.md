# 🚀 Onboarding Non-GHL Clients

## Step 1: Client Website Setup
```html
<!-- Install on any website with forms -->
<script src="https://adsengineer.cloud/snippet.js"></script>

<!-- Or inline version -->
<script>
[PASTE THE SNIPPET CODE HERE]
</script>
```

## Step 2: Lead Data Integration
```bash
# Send leads to our webhook (any CRM works)
curl -X POST https://advocate-cloud.adsengineer.workers.dev/api/leads \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "client@example.com",
    "phone": "+1234567890",
    "landing_page": "https://yourwebsite.com/contact",
    "gclid": "AUTO_CAPTURED_BY_SNIPPET",
    "utm_source": "google",
    "utm_campaign": "summer_sale"
  }'
```

## Step 3: Google Ads Setup
```bash
# Configure Google Ads credentials
curl -X POST https://advocate-cloud.adsengineer.workers.dev/api/agencies \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"google_ads_config": {...}}'
```

## Compatible CRMs
- ✅ **HubSpot** - Webhook integration
- ✅ **Zapier** - Connect any CRM
- ✅ **ActiveCampaign** - Webhook support
- ✅ **Custom** - Any system that can POST JSON
- ✅ **Direct API** - No CRM needed

---

## 🎯 Non-GHL Client Flow

1. **Install Snippet** → Captures all ad parameters
2. **Lead Generated** → CRM/webhook sends data to us
3. **We Process** → Queue for Google Ads conversion
4. **Google Ads Updated** → Attribution works perfectly

**Zero CRM restrictions - works with anything!** 🎉