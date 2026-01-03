#!/bin/bash

# Generate encryption master key for AdsEngineer

echo "🔐 Generating encryption master key for AdsEngineer..."
echo ""

# Generate a secure 256-bit (32-byte) key
MASTER_KEY=$(openssl rand -base64 32)

echo "✅ Generated secure master key:"
echo "$MASTER_KEY"
echo ""

echo "⚠️  IMPORTANT SECURITY NOTICE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 This key provides access to ALL encrypted customer data"
echo "🔒 Store this key securely - never commit to version control"
echo "🗝️  Use Cloudflare Workers secrets to store it:"
echo ""
echo "   wrangler secret put ENCRYPTION_MASTER_KEY"
echo ""
echo "📋 Then paste the key above when prompted"
echo ""
echo "❌ If this key is lost, ALL encrypted data becomes inaccessible"
echo "💾 Consider key rotation procedures for production"
echo ""
echo "🔄 For development, you can set it in .env:"
echo "   ENCRYPTION_MASTER_KEY=$MASTER_KEY"
echo ""

# Save to a temporary file for easy copying
echo "$MASTER_KEY" > encryption-key-temp.txt
echo "💾 Key also saved to: encryption-key-temp.txt (delete after use)"
echo ""
echo "🚀 Ready to set up encryption!"