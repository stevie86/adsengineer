# MyCannaby Shopify Plugin Installation Guide

## 🎯 **Install AdsEngineer Plugin on MyCannaby Store**

This guide provides step-by-step instructions for installing the AdsEngineer conversion tracking plugin in the MyCannaby Shopify store.

## 📋 **Prerequisites**

- ✅ Shopify Partner app created and configured
- ✅ Plugin deployed to hosting platform (Railway/Vercel/Heroku)
- ✅ Environment variables configured
- ✅ App permissions authorized
- Access to MyCannaby Shopify admin panel

## 🚀 **Installation Steps**

### **Step 1: Access MyCannaby Shopify Admin**

1. Navigate to: https://mycannaby.de/admin
2. Sign in with MyCannaby admin credentials
3. Verify you have admin/store owner permissions

### **Step 2: Install App from Partner Dashboard**

#### **Option A: Direct Installation (Recommended)**

1. **In Shopify Partner Dashboard:**
   - Go to "Apps" → "AdsEngineer Conversion Tracking"
   - Click "Select store"
   - Search for and select "mycannaby.de"
   - Click "Install app"

2. **Authorize Permissions:**
   - Review the requested permissions:
     - ✅ Read orders
     - ✅ Write orders
     - ✅ Read customers
   - Click "Install app"

#### **Option B: App Store Listing**

If the app is published to Shopify App Store:

1. In MyCannaby admin → "Apps" → "Visit Shopify App Store"
2. Search for "AdsEngineer Conversion Tracking"
3. Click "Add app" → "Install app"
4. Authorize permissions

### **Step 3: Verify Installation**

After installation:

1. **Check App Status:**
   - MyCannaby admin → "Apps" → "AdsEngineer Conversion Tracking"
   - Should show as "Installed" with green status

2. **Verify Webhook Configuration:**
   - Partner Dashboard → Apps → Your App → "Webhooks"
   - Should show active webhook for "Order creation"
   - URL should point to your deployed plugin

### **Step 4: Test Webhook Functionality**

#### **Test 1: Status Check**
```bash
curl https://your-plugin-url.com/api/status
# Expected: {"shopify_connected":true,"adsengineer_connected":true}
```

#### **Test 2: Manual Webhook Test**
```bash
curl -X POST https://your-plugin-url.com/webhooks/orders-create \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: mycannaby.de" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{
    "id": 12345,
    "email": "test@mycannaby.de",
    "total_price": "49.99",
    "customer": {
      "id": 67890,
      "email": "test@mycannaby.de",
      "first_name": "Test",
      "last_name": "User"
    },
    "note_attributes": [
      {"name": "gclid", "value": "EAIaIQv3i3m8e7vO-1234567890"}
    ]
  }'
```

#### **Test 3: Real Order Test**
1. Place a test order on mycannaby.de with Google Ads tracking
2. Check AdsEngineer dashboard for new lead
3. Verify GCLID was captured and processed

### **Step 5: Monitor and Troubleshoot**

#### **Check Logs**
- Monitor hosting platform logs for webhook processing
- Check AdsEngineer worker logs for data ingestion
- Verify no errors in webhook delivery

#### **Common Issues**

**❌ Webhook Not Firing:**
- Check app is properly installed
- Verify webhook URL is correct
- Ensure app permissions are granted

**❌ GCLID Not Captured:**
- Verify snippet is installed on product/cart pages
- Check for JavaScript errors blocking tracking
- Test with manual GCLID injection

**❌ Data Not Appearing in AdsEngineer:**
- Check AdsEngineer API connectivity
- Verify site_id configuration
- Review error logs for failed requests

## 📊 **Expected Behavior**

### **After Installation:**

1. **Webhook Activation:**
   - Shopify will send order data to your plugin
   - Plugin processes and forwards to AdsEngineer
   - GCLID data is extracted and stored securely

2. **Tracking Flow:**
   ```
   Customer Visit (with gclid) → Add to Cart → Checkout → Order Complete
       ↓
   Shopify Webhook → AdsEngineer Plugin → AdsEngineer API → Database
       ↓
   Google Ads Conversion Upload → Attribution Reports
   ```

3. **Monitoring:**
   - Shopify monitoring worker will show MyCannaby as operational
   - No more firewall blocks for this store
   - Real-time conversion tracking active

## 🔍 **Verification Checklist**

- [ ] App shows as "Installed" in Shopify admin
- [ ] Status endpoint returns healthy connections
- [ ] Test webhook processes successfully
- [ ] Real order creates lead in AdsEngineer
- [ ] GCLID data is captured and hashed
- [ ] Monitoring worker shows green status
- [ ] Google Ads conversions upload correctly

## 🎉 **Success Confirmation**

When everything is working:

✅ **MyCannaby** appears in operational clients list
✅ **Order webhooks** are processed within seconds
✅ **GCLID tracking** works for Google Ads conversions
✅ **AdsEngineer dashboard** shows MyCannaby leads
✅ **Firewall issues** are completely resolved

---

**Installation complete! MyCannaby now has enterprise-level conversion tracking with AdsEngineer.** 🚀