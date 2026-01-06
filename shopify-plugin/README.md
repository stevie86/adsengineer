# AdsEngineer Shopify Plugin

A simple Shopify plugin that establishes connection with AdsEngineer Cloudflare Workers for conversion tracking.

## Features

- ✅ Simple status indicator showing connection state
- ✅ Automatic webhook processing for orders
- ✅ Minimal UI - just a connection status icon
- ✅ Updateable via Shopify app updates
- ✅ Opens door for Cloudflare Workers connection

## Installation

### Step 1: Deploy to Hosting Platform

Choose one of these hosting platforms:

**Railway (Recommended):**
```bash
cd shopify-plugin
railway login
railway init
railway up
# Note the deployment URL (e.g., https://adsengineer-shopify.up.railway.app)
```

**Vercel:**
```bash
cd shopify-plugin
npm install -g vercel
vercel --prod
# Note the deployment URL
```

**Heroku:**
```bash
cd shopify-plugin
heroku create adsengineer-shopify-plugin
git push heroku main
# Note the deployment URL
```

### Step 2: Create Shopify Partner App

1. **Go to Shopify Partners:** https://partners.shopify.com/
2. **Create new app:**
   - App name: "AdsEngineer Conversion Tracking"
   - App type: "Public app"
   - App URL: `https://your-deployment-url.com` (from Step 1)
   - Allowed redirection URL: `https://your-deployment-url.com/auth/callback`

3. **Configure API scopes:**
   - `read_orders`
   - `write_orders`
   - `read_customers`

4. **Configure webhooks:**
   - Event: `Order creation`
   - URL: `https://your-deployment-url.com/webhooks/orders-create`
   - Format: `JSON`

5. **Note the credentials:**
   - API Key: `shpka_xxxxxxxxxxxxxxxxxxxxxxxxx`
   - API Secret Key: `xxxxxxxxxxxxxxxxxxxxxxxxx`
   - Webhook Secret: (generated automatically)

### Step 3: Configure Environment Variables

Update your hosting platform with these environment variables:

```bash
# Shopify Credentials (from Partner Dashboard)
SHOPIFY_API_KEY=shpka_xxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_SCOPES=read_orders,write_orders,read_customers
SHOPIFY_HOST=https://your-deployment-url.com

# AdsEngineer Configuration
ADSENGINEER_API_KEY=your_adsengineer_api_key

# App Configuration
PORT=3000
NODE_ENV=production
```

### Step 4: Install in Shopify Stores

1. **In Shopify Partner Dashboard:**
   - Go to "Apps" → "Your App"
   - Click "Select store" to install in a store

2. **For MyCannaby:**
   - Select "mycannaby.de" store
   - Authorize the app permissions
   - App will be installed and webhooks will be active

### Step 5: Verify Installation

1. **Check webhook connectivity:**
   ```bash
   curl https://your-deployment-url.com/api/status
   # Should return: {"shopify_connected":true,"adsengineer_connected":true}
   ```

2. **Test with a test order:**
   - Place a test order in the Shopify store
   - Check AdsEngineer dashboard for new lead
   - Verify GCLID tracking if present

## Environment Variables

```bash
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_orders,write_orders,read_customers
SHOPIFY_HOST=https://your-app-domain.com

# AdsEngineer Configuration
ADSENGINEER_API_KEY=your_adsengineer_api_key

# App Configuration
PORT=3000
NODE_ENV=production
```

## Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Option 2: Heroku

```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
heroku config:set SHOPIFY_API_KEY=your_key
git push heroku main
```

### Option 3: Railway

```bash
railway login
railway init
railway up
```

## Updating the Plugin

When you update the code:

1. **Push changes** to your git repository
2. **Redeploy** to your hosting platform
3. **Shopify automatically** pulls the latest version
4. **Stores get updates** without reinstallation

## What the Plugin Does

### Backend (Invisible to Users)
- Processes Shopify webhooks (orders, customers)
- Extracts GCLID and tracking data
- Sends data to AdsEngineer Cloudflare Workers
- Maintains connection status

### Frontend (What Users See)
- Simple status page with connection indicator
- Green checkmark when connected ✅
- Red X when disconnected ❌
- Auto-refreshes every 30 seconds

## File Structure

```
shopify-plugin/
├── index.js              # Main app logic
├── package.json          # Dependencies
├── .env.example          # Environment template
├── public/
│   ├── index.html        # Status page
│   ├── app.js           # Status checker
│   └── app.css          # Minimal styling
└── README.md            # This file
```

## API Endpoints

- `GET /` - Status page
- `GET /api/status` - Connection status JSON
- `POST /webhooks/orders-create` - Order webhook processing

## Connection Status

The plugin checks two connections:

1. **Shopify Connection**: Always ✅ (you're in Shopify)
2. **AdsEngineer Connection**: ✅/❌ based on Cloudflare Workers response

## Troubleshooting

### Status Shows Red X
- Check Cloudflare Workers are running
- Verify ADSENGINEER_API_KEY is correct
- Check network connectivity

### Webhooks Not Processing
- Verify webhook URLs in Shopify app settings
- Check server logs for errors
- Ensure proper Shopify scopes

### Plugin Won't Update
- Force refresh in Shopify admin
- Check deployment completed successfully
- Verify environment variables

## Security

- Uses Shopify's official API authentication
- Webhook signatures verified
- HTTPS only connections
- No sensitive data stored locally

## Support

For issues with the AdsEngineer connection:
- Check Cloudflare Workers status
- Verify API keys are correct
- Contact AdsEngineer support

For Shopify-specific issues:
- Check Shopify app settings
- Verify webhook configurations
- Contact Shopify support

---

**This plugin provides a simple bridge between Shopify and AdsEngineer, enabling reliable conversion tracking with minimal user interface.**