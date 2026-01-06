#!/bin/bash

# AdsEngineer - Custom Domain Setup Script
# Sets up api.adsengineer.cloud for the production worker

set -e

echo "🌐 AdsEngineer - Custom Domain Setup"
echo "===================================="

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

echo "📝 Custom Domain Setup Instructions:"
echo ""
echo "⚠️  IMPORTANT: Custom domains must be set up manually in Cloudflare Dashboard"
echo ""
echo "Step 1: Add DNS Record"
echo "-----------------------"
echo "Go to: https://dash.cloudflare.com → adsengineer.cloud → DNS → Records"
echo ""
echo "Add this CNAME record:"
echo "• Type: CNAME"
echo "• Name: api"
echo "• Target: adsengineer-cloud.adsengineer.workers.dev"
echo "• Proxy status: ☁️ Proxied (orange cloud)"
echo ""
echo "Or import this CSV:"
echo "Type,Name,Content,TTL,Proxy status"
echo "CNAME,api,adsengineer-cloud.adsengineer.workers.dev,1,Proxied"
echo ""

read -p "Have you added the CNAME record? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please add the CNAME record first, then continue with Step 2."
    exit 1
fi

echo "Step 2: Add Custom Domain to Worker"
echo "------------------------------------"
echo "Go to: https://dash.cloudflare.com → Workers & Pages"
echo "→ adsengineer-cloud → Triggers → Custom Domains"
echo "→ Add Custom Domain: api.adsengineer.cloud"
echo ""
echo "Wait for SSL certificate (1-2 minutes)"
echo ""

read -p "Have you added the custom domain to the Worker? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please add the custom domain to the Worker first."
    exit 1
fi

echo "🧪 Testing custom domain..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" https://api.adsengineer.cloud/health)
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Custom domain working!"
    echo "🌐 API now available at: https://api.adsengineer.cloud"
    echo "📊 Health check response:"
    echo "$HEALTH_BODY" | jq . 2>/dev/null || echo "$HEALTH_BODY"
else
    echo "⚠️  Custom domain may still be propagating..."
    echo "   HTTP Status: $HTTP_STATUS"
    echo "   Try again in a few minutes with: curl https://api.adsengineer.cloud/health"
fi

echo ""
echo "✅ Custom domain setup complete!"
echo ""
echo "🧪 Test the new domain:"
echo "curl https://api.adsengineer.cloud/health"
echo ""
echo "📝 Next step: Update frontend to use new API URL"
echo "Set VITE_API_BASE_URL=https://api.adsengineer.cloud in production"