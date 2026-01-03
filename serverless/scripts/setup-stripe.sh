#!/bin/bash

# Stripe Setup Script
# Sets up Stripe secrets and environment variables for AdsEngineer

set -e

echo "🔧 Setting up Stripe integration for AdsEngineer..."

# Check if .stripe.env exists
if [ ! -f ".stripe.env" ]; then
    echo "❌ Error: .stripe.env file not found!"
    echo "Please create .stripe.env with your Stripe secret key."
    exit 1
fi

# Read Stripe secret key from .stripe.env
STRIPE_SECRET_KEY=$(cat .stripe.env | tr -d '\n' | tr -d '\r')

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Error: Stripe secret key not found in .stripe.env"
    exit 1
fi

echo "✅ Found Stripe secret key"

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found. Please install it first."
    echo "npm install -g wrangler"
    exit 1
fi

# Set Stripe secret using wrangler
echo "🔑 Setting Stripe secret key..."
wrangler secret put STRIPE_SECRET_KEY

echo ""
echo "🎉 Stripe setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up Stripe price IDs in wrangler.jsonc or Cloudflare dashboard:"
echo "   - STRIPE_STARTER_PRICE_ID"
echo "   - STRIPE_PROFESSIONAL_PRICE_ID"
echo "   - STRIPE_ENTERPRISE_PRICE_ID"
echo "   - STRIPE_WEBHOOK_SECRET"
echo ""
echo "2. Create products and prices in your Stripe dashboard"
echo "3. Update the price IDs in your environment variables"
echo ""
echo "4. Test the billing endpoints:"
echo "   curl -X GET http://localhost:8090/api/v1/billing/pricing"