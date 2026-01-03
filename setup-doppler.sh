#!/bin/bash

set -e

echo "🔧 Setting up Doppler for AdsEngineer..."

if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI is not installed"
    echo "Install it from: https://cli.doppler.com/install.sh"
    exit 1
fi

if ! doppler whoami &> /dev/null; then
    echo "📝 Please login to Doppler..."
    doppler login
fi

echo "📦 Creating Doppler project..."
doppler projects create adsengineer --name "AdsEngineer" || echo "✓ Project already exists"

echo "⚙️ Configuring local environment..."
doppler configure set project adsengineer
doppler configure set config dev

echo "🔐 Importing secrets template..."
if [ -f "doppler-secrets.template" ]; then
    echo "📋 Please review and set your secrets in the Doppler dashboard:"
    echo "https://dash.doppler.com/workplace/adsengineer/configs/dev"
    echo ""
    echo "Or use 'doppler secrets set KEY=VALUE' to set secrets individually"
else
    echo "⚠️  Template file not found"
fi

echo "🌍 Setting up environments..."
doppler configs create staging --name "Staging" || echo "✓ Staging already exists"
doppler configs create production --name "Production" || echo "✓ Production already exists"

echo "🔑 Generating development secrets..."

JWT_SECRET=$(openssl rand -base64 32)
doppler secrets set JWT_SECRET "$JWT_SECRET" -c dev

ADMIN_TOKEN=$(openssl rand -hex 32)
doppler secrets set ADMIN_TOKEN "$ADMIN_TOKEN" -c dev

ENCRYPTION_KEY=$(openssl rand -hex 32)
doppler secrets set ENCRYPTION_KEY "$ENCRYPTION_KEY" -c dev

doppler secrets set ENVIRONMENT "development" -c dev

echo "✅ Doppler setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Cloudflare API token: doppler secrets set CLOUDFLARE_API_TOKEN <your_token>"
echo "2. Add your Cloudflare Account ID: doppler secrets set CLOUDFLARE_ACCOUNT_ID <your_id>"
echo "3. Add remaining secrets via the dashboard or CLI"
echo ""
echo "View all secrets: doppler secrets list"
echo "Run commands with secrets: doppler run -- <command>"
