#!/bin/bash

# AdsEngineer - Cloudflare API Token Setup Script
# This script helps you set up your Cloudflare API token in Doppler

set -e

echo "🔧 AdsEngineer - Cloudflare API Token Setup"
echo "=========================================="

# Check if Doppler CLI is installed
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI is not installed"
    echo "Install it from: https://cli.doppler.com/install.sh"
    exit 1
fi

# Check if user is logged in to Doppler
if ! doppler whoami &> /dev/null; then
    echo "📝 Please login to Doppler first..."
    doppler login
fi

# Create project if it doesn't exist
echo "📦 Setting up Doppler project 'adsengineer'..."
doppler projects create adsengineer --name "AdsEngineer" --description "AdsEngineer SaaS Platform" 2>/dev/null || echo "✓ Project already exists"

# Set up configurations
echo "⚙️ Setting up configurations..."
doppler configs create dev --project adsengineer 2>/dev/null || echo "✓ Dev config exists"
doppler configs create staging --project adsengineer 2>/dev/null || echo "✓ Staging config exists"
doppler configs create production --project adsengineer 2>/dev/null || echo "✓ Production config exists"

# Ensure all configs exist before proceeding
for env in staging production; do
    if ! doppler configs get $env --project adsengineer &>/dev/null; then
        echo "Creating missing $env config..."
        doppler configs create $env --project adsengineer || echo "Failed to create $env config"
    fi
done

# Set default config
doppler configure set project adsengineer
doppler configure set config dev

# Get the API token
API_TOKEN=""

# First, try to read from ~/.env file
if [ -f ~/.env ]; then
    echo "🔍 Checking ~/.env for CLOUDFLARE_API_TOKEN..."
    API_TOKEN=$(grep "^CLOUDFLARE_API_TOKEN=" ~/.env | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
fi

# If not found, try serverless/.env
if [ -z "$API_TOKEN" ] && [ -f "serverless/.env" ]; then
    echo "🔍 Checking serverless/.env for CLOUDFLARE_API_TOKEN..."
    API_TOKEN=$(grep "^CLOUDFLARE_API_TOKEN=" serverless/.env | cut -d'=' -f2- | sed 's/^"//' | sed 's/"$//')
fi

# If still not found, prompt user
if [ -z "$API_TOKEN" ]; then
    echo ""
    echo "🔑 Cloudflare API Token not found automatically."
    echo "Please enter your Cloudflare API token:"
    echo "(You can find it at: https://dash.cloudflare.com/profile/api-tokens)"
    echo ""
    read -s -p "CLOUDFLARE_API_TOKEN: " API_TOKEN
    echo ""
fi

if [ -z "$API_TOKEN" ]; then
    echo "❌ No API token provided. Exiting."
    exit 1
fi

# Validate token format (should be long alphanumeric string)
if [[ ! $API_TOKEN =~ ^[A-Za-z0-9_-]{40,}$ ]]; then
    echo "⚠️  Warning: API token doesn't look like a valid Cloudflare token"
    echo "   It should be a long string of letters, numbers, hyphens, and underscores"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set the token in all environments
echo "🔐 Setting CLOUDFLARE_API_TOKEN in Doppler..."

for env in dev staging production; do
    echo "  → Setting in $env environment..."
    doppler secrets set CLOUDFLARE_API_TOKEN "$API_TOKEN" --project adsengineer --config $env
done

echo ""
echo "✅ Cloudflare API token set successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Verify token works: doppler run -- echo 'API token is set'"
echo "2. Deploy to production: cd serverless && doppler run -- wrangler deploy --env production"
echo "3. Check deployment: curl https://adsengineer-cloud.adsengineer.workers.dev/health"
echo ""
echo "📚 Useful commands:"
echo "- View secrets: doppler secrets --project adsengineer --config production"
echo "- Deploy: doppler run --project adsengineer --config production -- wrangler deploy --env production"