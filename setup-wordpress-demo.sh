#!/bin/bash
# WordPress Demo Shop Setup Script
# This script helps you set up a WordPress demo site for testing the AdsEngineer plugin

set -e

echo "🚀 AdsEngineer WordPress Demo Shop Setup"
echo "========================================"

# Configuration
read -p "Enter your demo WordPress site URL (e.g., https://demo.adsengineer.com): " DEMO_URL
read -p "Enter SSH host for WordPress server: " SSH_HOST
read -p "Enter SSH user: " SSH_USER
read -p "Enter SSH port (default 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# Generate secrets
DEMO_SITE_ID="demo_$(date +%s)_$(openssl rand -hex 8)"
DEMO_WEBHOOK_SECRET="$(openssl rand -hex 32)"

# Create GitHub secrets file
cat > .github/demo-secrets.yml << EOF
# Add these secrets to your GitHub repository settings:
# Settings → Secrets and variables → Actions → New repository secret

WORDPRESS_DEMO_URL: $DEMO_URL
WORDPRESS_DEMO_SSH_HOST: $SSH_HOST
WORDPRESS_DEMO_SSH_USER: $SSH_USER
WORDPRESS_DEMO_SSH_PORT: $SSH_PORT
WORDPRESS_DEMO_ADMIN_USER: your_wp_admin_username
WORDPRESS_DEMO_ADMIN_PASS: your_wp_admin_password
WORDPRESS_DEMO_SITE_ID: $DEMO_SITE_ID
WORDPRESS_DEMO_WEBHOOK_SECRET: $DEMO_WEBHOOK_SECRET
WORDPRESS_DEMO_API_KEY: your_woocommerce_api_key
EOF

echo ""
echo "✅ GitHub secrets file created: .github/demo-secrets.yml"
echo ""
echo "Next steps:"
echo "1. Add the secrets from .github/demo-secrets.yml to GitHub repository settings"
echo "2. Ensure your WordPress site has:"
echo "   - WooCommerce installed and configured"
echo "   - Products created for testing"
echo "   - WP-CLI installed on server"
echo "3. Test the deployment workflow manually from GitHub Actions tab"
echo ""
echo "The workflow will:"
echo "- Automatically deploy latest plugin on main branch pushes"
echo "- Configure plugin settings (Site ID, Webhook URL, Secret)"
echo "- Verify functionality (snippet injection, API access)"
echo "- Create deployment summary"
echo ""
echo "Demo site will be ready for testing with:"
echo "- Latest AdsEngineer WooCommerce plugin"
echo "- Automatic GCLID capture"
echo "- Webhook integration to production API"
echo "- Status monitoring"

echo ""
echo "🎯 Ready to automate your WordPress demo!"
echo "Add the secrets to GitHub and push the workflow files."