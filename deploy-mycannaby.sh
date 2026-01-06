#!/bin/bash
# Deploy script for mycannaby.de
# Usage: ./deploy.sh

set -e

echo "🚀 AdsEngineer Deployment Script"
echo "================================"

# Check for Cloudflare API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set"
    echo ""
    echo "To get your token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create a token with Workers Edit + D1 Edit permissions"
    echo "3. Export it: export CLOUDFLARE_API_TOKEN='your_token'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Cloudflare API token found"

# Step 1: Run D1 Migration
echo ""
echo "📦 Step 1: Running D1 migration..."
cd /home/webadmin/coding/ads-engineer
npx wrangler d1 execute adsengineer-db --remote --file=customers/mycannaby-setup.sql --yes

# Step 2: Deploy to production
echo ""
echo "🚀 Step 2: Deploying to production..."
cd /home/webadmin/coding/ads-engineer/serverless
npx wrangler deploy --env production

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps for mycannaby.de:"
echo "1. Configure Shopify webhooks: https://docs.adsengineer.cloud/shopify-webhook-setup"
echo "2. Add tracking script to Shopify theme"
echo "3. Send webhook secret to: setup@adsengineer.cloud"
