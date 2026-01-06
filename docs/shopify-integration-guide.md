# AdsEngineer Shopify Integration Guide

## Overview
AdsEngineer provides automated, server-side conversion tracking for Shopify stores. Track Google Ads, Meta Ads, and Microsoft Ads conversions with GDPR compliance and zero manual setup.

## Prerequisites
- Shopify store (any plan)
- Google Ads account (for Google Ads tracking)
- Meta Business account (for Meta Ads tracking - optional)
- 5 minutes setup time

---

## Step 1: Sign Up for AdsEngineer

1. Visit your AdsEngineer dashboard
2. Create account and select your plan:
   - **Starter**: €80/month (Google Ads only)
   - **Professional**: €250/month (Google + Meta Ads)
   - **Enterprise**: €500/month (All platforms + custom features)

---

## Step 2: Install Tracking Snippet

### Automatic Installation (Recommended)

1. In AdsEngineer dashboard, go to "Shopify Integration"
2. Enter your Shopify store URL: `https://yourstore.myshopify.com`
3. Click "Install Snippet"
4. AdsEngineer will automatically add the tracking code to your theme

### Manual Installation

If automatic installation fails:

1. In Shopify admin, go to **Online Store > Themes**
2. Click **"Customize"** next to your live theme
3. Go to **Theme Settings > Custom Code**
4. Add this code to the **"Head"** section:

```html
<script>
(function() {
  var script = document.createElement('script');
  script.src = 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js';
  script.async = true;
  script.setAttribute('data-site-id', 'mycannaby-687f1af9');
  document.head.appendChild(script);
})();
</script>
```

Replace `YOUR_SITE_ID` with the ID provided in your AdsEngineer dashboard.

---

## Step 3: Configure Google Ads (Required)

1. In AdsEngineer dashboard, go to "Google Ads Setup"
2. Follow the OAuth flow to connect your Google Ads account
3. Select your conversion action or let AdsEngineer create one
4. Verify the connection shows "Active"

**Required Permissions:**
- Google Ads API access
- Conversion tracking management

---

## Step 4: Set Up Webhooks (Automatic)

AdsEngineer automatically creates these webhooks in your Shopify store:

- **Order Creation**: Tracks purchases and conversion value
- **Lead/Contact Forms**: Tracks form submissions
- **Customer Registration**: Tracks new customer signups

No manual setup required!

---

## Step 5: Configure Meta Ads (Optional)

If you have Professional/Enterprise plan:

1. In AdsEngineer dashboard, go to "Meta Ads Setup"
2. Connect your Meta Business account
3. Select your Facebook Pixel
4. AdsEngineer will handle conversion matching automatically

---

## Step 6: Test Your Setup

### Test Conversion Tracking

1. In AdsEngineer dashboard, go to "Test Tracking"
2. Click "Send Test Conversion"
3. Check your Google Ads dashboard for the test conversion (appears within 1 hour)
4. Verify conversion value and attribution

### Test Webhooks

1. Place a test order on your Shopify store
2. Check AdsEngineer dashboard for order tracking
3. Verify conversion appears in your ad platforms

---

## Configuration Options

### Tracking Settings
- **Google Ads Only**: Track only Google Ads conversions
- **Multi-Platform**: Track Google + Meta + Microsoft
- **Custom Events**: Track specific Shopify events (orders, add-to-cart, etc.)

### Privacy Settings
- **GDPR Compliant**: Server-side tracking, no third-party cookies
- **Consent Management**: Respects Shopify customer consent preferences
- **Data Retention**: 3 years maximum, automated cleanup

---

## Troubleshooting

### Snippet Not Loading
1. Check if snippet code is in theme `<head>`
2. Verify site ID is correct
3. Clear Shopify cache and reload

### Conversions Not Appearing
1. Check Google Ads connection status
2. Verify conversion action is active
3. Wait up to 2 hours for processing
4. Check AdsEngineer dashboard for errors

### Webhooks Failing
1. Verify AdsEngineer has proper Shopify permissions
2. Check webhook URLs are correct
3. Reinstall webhooks from dashboard

---

## Support
- **Email**: support@adsengineer.workers.dev
- **Dashboard**: Real-time status and logs
- **Response Time**: < 2 hours during business days

---

## Security & Compliance
- ✅ **GDPR Compliant** (server-side, no personal data storage)
- ✅ **SOC 2 Ready** (infrastructure security)
- ✅ **Data Encryption** (end-to-end)
- ✅ **Regular Audits** (security and performance)

---

*Last updated: January 2025*</content>
<parameter name="filePath">docs/shopify-integration-guide.md