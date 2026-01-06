#!/bin/bash

# AdsEngineer - Cloudflare DNS Setup Script
# Sets up DNS records for adsengineer.cloud using Cloudflare API

set -e

echo "🌐 AdsEngineer - Cloudflare DNS Setup"
echo "====================================="

# Get Cloudflare API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set"
    echo "Set it with: export CLOUDFLARE_API_TOKEN='your_token'"
    exit 1
fi

# Get Zone ID for adsengineer.cloud
echo "🔍 Finding zone for adsengineer.cloud..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=adsengineer.cloud" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
    echo "❌ Domain adsengineer.cloud not found in Cloudflare"
    echo ""
    echo "📋 To add the domain to Cloudflare:"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Click 'Add a site'"
    echo "3. Enter 'adsengineer.cloud'"
    echo "4. Follow the setup wizard"
    echo "5. Update your domain registrar's nameservers to Cloudflare's"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Found zone: $ZONE_ID"

# Create CNAME record for api.adsengineer.cloud
echo "🔧 Creating CNAME record: api.adsengineer.cloud → adsengineer-cloud.adsengineer.workers.dev"

RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "api",
    "content": "adsengineer-cloud.adsengineer.workers.dev",
    "ttl": 1,
    "proxied": true
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ CNAME record created successfully!"
    RECORD_ID=$(echo $RESPONSE | jq -r '.result.id')
    echo "📝 Record ID: $RECORD_ID"
else
    echo "❌ Failed to create CNAME record"
    echo "Error: $(echo $RESPONSE | jq -r '.errors[0].message')"
    exit 1
fi

echo ""
echo "🎯 DNS setup complete!"
echo ""
echo "⏳ Wait 5-10 minutes for DNS propagation, then:"
echo "curl https://api.adsengineer.cloud/health"
echo ""
echo "📋 Current DNS records:"
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[] | {name: .name, type: .type, content: .content, proxied: .proxied}'