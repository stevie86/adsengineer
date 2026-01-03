#!/bin/bash

# Stripe Product Setup Script
# Creates products and prices in Stripe dashboard

set -e

echo "🛍️  Setting up Stripe Products & Prices for AdsEngineer..."
echo ""

# Check if Stripe CLI is authenticated
if ! stripe --version > /dev/null 2>&1; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "npm install -g stripe"
    exit 1
fi

echo "✅ Stripe CLI found"

# Check if logged in
if ! stripe config --list > /dev/null 2>&1; then
    echo "❌ Not logged into Stripe CLI. Please run:"
    echo "stripe login"
    exit 1
fi

echo "✅ Stripe CLI authenticated"
echo ""

# Create products and prices
echo "📦 Creating Stripe products..."

# Starter Plan
echo "Creating Starter plan (€99/month)..."
STARTER_PRODUCT=$(stripe products create \
    --name="AdsEngineer Starter" \
    --description="Basic conversion tracking for small agencies" \
    --json | jq -r '.id')

STARTER_PRICE=$(stripe prices create \
    --product="$STARTER_PRODUCT" \
    --unit-amount=9900 \
    --currency=eur \
    --interval=month \
    --json | jq -r '.id')

echo "✅ Starter Plan created:"
echo "   Product ID: $STARTER_PRODUCT"
echo "   Price ID: $STARTER_PRICE"
echo ""

# Professional Plan
echo "Creating Professional plan (€299/month)..."
PROFESSIONAL_PRODUCT=$(stripe products create \
    --name="AdsEngineer Professional" \
    --description="Advanced conversion tracking for growing agencies" \
    --json | jq -r '.id')

PROFESSIONAL_PRICE=$(stripe prices create \
    --product="$PROFESSIONAL_PRODUCT" \
    --unit-amount=29900 \
    --currency=eur \
    --interval=month \
    --json | jq -r '.id')

echo "✅ Professional Plan created:"
echo "   Product ID: $PROFESSIONAL_PRODUCT"
echo "   Price ID: $PROFESSIONAL_PRICE"
echo ""

# Enterprise Plan
echo "Creating Enterprise plan (€999/month)..."
ENTERPRISE_PRODUCT=$(stripe products create \
    --name="AdsEngineer Enterprise" \
    --description="Unlimited conversion tracking for large agencies" \
    --json | jq -r '.id')

ENTERPRISE_PRICE=$(stripe prices create \
    --product="$ENTERPRISE_PRODUCT" \
    --unit-amount=99900 \
    --currency=eur \
    --interval=month \
    --json | jq -r '.id')

echo "✅ Enterprise Plan created:"
echo "   Product ID: $ENTERPRISE_PRODUCT"
echo "   Price ID: $ENTERPRISE_PRICE"
echo ""

# Generate webhook secret
echo "🔐 Creating webhook endpoint secret..."
WEBHOOK_SECRET=$(openssl rand -hex 32)

echo "✅ Webhook secret generated"
echo ""

# Save configuration
cat > stripe-config.json << EOF
{
  "stripe_price_ids": {
    "starter": "$STARTER_PRICE",
    "professional": "$PROFESSIONAL_PRICE",
    "enterprise": "$ENTERPRISE_PRICE"
  },
  "stripe_products": {
    "starter": "$STARTER_PRODUCT",
    "professional": "$PROFESSIONAL_PRODUCT",
    "enterprise": "$ENTERPRISE_PRODUCT"
  },
  "webhook_secret": "$WEBHOOK_SECRET"
}
EOF

echo "💾 Configuration saved to stripe-config.json"
echo ""

echo "🎉 Stripe products and prices created successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Update wrangler.jsonc with the price IDs:"
echo "   STRIPE_STARTER_PRICE_ID: \"$STARTER_PRICE\""
echo "   STRIPE_PROFESSIONAL_PRICE_ID: \"$PROFESSIONAL_PRICE\""
echo "   STRIPE_ENTERPRISE_PRICE_ID: \"$ENTERPRISE_PRICE\""
echo "   STRIPE_WEBHOOK_SECRET: \"$WEBHOOK_SECRET\""
echo ""
echo "2. Deploy to Cloudflare:"
echo "   wrangler deploy"
echo ""
echo "3. Test the endpoints:"
echo "   curl https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/pricing"
echo ""
echo "4. Set up webhooks in Stripe dashboard pointing to:"
echo "   https://advocate-cloud.adsengineer.workers.dev/api/v1/billing/webhooks/stripe"
echo ""
echo "5. Use the webhook secret above for webhook validation"