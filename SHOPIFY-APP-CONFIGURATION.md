# Shopify Partner App Configuration Guide

## 🎯 **AdsEngineer Conversion Tracking App Setup**

This guide provides step-by-step instructions for creating and configuring the Shopify Partner app for AdsEngineer conversion tracking.

## 📋 **Prerequisites**

- Shopify Partner account (https://partners.shopify.com/)
- Deployed Shopify plugin URL (from Railway/Vercel/Heroku)
- AdsEngineer API credentials

## 🚀 **Step-by-Step Configuration**

### **1. Access Shopify Partners Dashboard**

1. Navigate to: https://partners.shopify.com/
2. Sign in with your Shopify Partner account
3. Click "Apps" in the left sidebar
4. Click "Create app" → "Create app manually"

### **2. Basic App Information**

Fill in the app details:

```
App name: AdsEngineer Conversion Tracking
App type: Public app (recommended)
```

### **3. App URLs Configuration**

Use your deployed plugin URL (replace with actual URL):

```
App URL: https://adsengineer-shopify.up.railway.app
Allowed redirection URL(s):
  https://adsengineer-shopify.up.railway.app/auth/callback
```

### **4. API Configuration**

#### **Admin API Integration**
- **Integration type:** Latest Admin API
- **API version:** 2024-10 (or latest stable)

#### **API Scopes** (check all required):
```
✅ read_orders
✅ write_orders
✅ read_customers
```

### **5. Webhooks Configuration**

Add webhook for order creation:

```
Event: Order creation
URL: https://adsengineer-shopify.up.railway.app/webhooks/orders-create
Format: JSON
API version: 2024-10
```

### **6. App Setup**

#### **Embedded App**
- **Embed in Shopify admin:** No (our app doesn't need admin UI)

#### **Privacy & Compliance**
- **Data processing purpose:** Marketing and advertising
- **Data retention:** Customer data retained for analytics
- **Data sharing:** Shared with AdsEngineer for conversion tracking

### **7. Generate API Credentials**

After saving the configuration:

1. **API Key:** Will be generated (format: `shpka_xxxxxxxxxxxxxxxxxxxxxxxxx`)
2. **API Secret Key:** Will be generated
3. **Webhook Secret:** Will be generated for webhook verification

**⚠️ IMPORTANT:** Save these credentials securely - you'll need them for environment variables.

## 🔧 **Environment Variables Setup**

Configure these in your hosting platform (Railway/Vercel/Heroku):

```bash
# Shopify Credentials
SHOPIFY_API_KEY=shpka_xxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SCOPES=read_orders,write_orders,read_customers
SHOPIFY_HOST=https://adsengineer-shopify.up.railway.app

# AdsEngineer Configuration
ADSENGINEER_API_KEY=your_adsengineer_api_key

# App Settings
PORT=3000
NODE_ENV=production
```

## 📱 **App Installation**

### **Install in Development Store**

1. In Partner Dashboard → "Apps" → Your App
2. Click "Select store"
3. Choose your development store
4. Click "Install app"
5. Authorize the requested permissions

### **Install in MyCannaby Store**

1. Select "mycannaby.de" from store list
2. Click "Install"
3. Authorize permissions
4. App will be active immediately

## ✅ **Verification Steps**

### **1. Check App Status**
```bash
curl https://your-app-url.com/api/status
# Expected: {"shopify_connected":true,"adsengineer_connected":true}
```

### **2. Test Webhook**
```bash
curl -X POST https://your-app-url.com/webhooks/orders-create \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: mycannaby.de" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{"id":12345,"email":"test@example.com","total_price":"99.99"}'
```

### **3. Check Logs**
- Monitor your hosting platform logs
- Verify webhook processing messages
- Check for any error responses

## 🔍 **Troubleshooting**

### **Webhook Not Receiving**
- Verify webhook URL is correct and accessible
- Check webhook secret matches environment variable
- Ensure app is properly installed in store

### **Permission Errors**
- Verify all required API scopes are checked
- Reinstall app if scopes changed

### **Connection Issues**
- Check AdsEngineer API key is valid
- Verify hosting platform environment variables
- Test AdsEngineer health: `curl https://adsengineer-cloud.adsengineer.workers.dev/health`

## 📊 **Monitoring**

Once installed:
- Webhooks will automatically send order data to AdsEngineer
- GCLID tracking will work for Google Ads conversions
- Monitor via AdsEngineer dashboard and Shopify app logs

## 🎉 **Success Indicators**

✅ App shows as "Installed" in Partner Dashboard
✅ Status endpoint returns healthy connections
✅ Test orders appear in AdsEngineer leads
✅ GCLID data is captured and processed

---

**This configuration enables AdsEngineer to receive Shopify webhooks and process conversion data with GCLID tracking for accurate attribution.**