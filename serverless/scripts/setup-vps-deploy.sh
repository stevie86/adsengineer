#!/bin/bash

# Usage: ./setup-vps-deploy.sh your-vps-ip your-domain.com

set -e

VPS_IP="$1"
DOMAIN="$2"

if [ -z "$VPS_IP" ] || [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <vps-ip> <domain>"
    exit 1
fi

echo "🚀 Setting up VPS deployment for $DOMAIN..."
cat > deploy-to-vps.sh << EOF
#!/bin/bash
set -e

VPS_IP="$VPS_IP"
DOMAIN="$DOMAIN"
APP_DIR="/var/www/ad-autopilot"

echo "📦 Deploying to VPS..."

# Build and deploy
npm run build
scp -r ./* root@\$VPS_IP:\$APP_DIR/
ssh root@\$VPS_IP << REMOTE
cd \$APP_DIR/serverless
npm install --production
npm run migrate
pm2 restart advocate-api
REMOTE

echo "✅ Deployment completed!"
EOF

chmod +x deploy-to-vps.sh


mkdir -p .github/workflows

cat > .github/workflows/vps-deploy.yml << EOF
name: Deploy to VPS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd serverless
          npm ci
          
      - name: Deploy to VPS
        env:
          VPS_SSH_KEY: \${{ secrets.VPS_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "\$VPS_SSH_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          
          ssh-keyscan -H $VPS_IP >> ~/.ssh/known_hosts
          
          cd serverless
          scp -r ./* root@$VPS_IP:/var/www/ad-autopilot/
          ssh root@$VPS_IP << 'SSH_EOF'
            cd /var/www/ad-autopilot/serverless
            npm install --production
            npm run migrate
            pm2 restart advocate-api
SSH_EOF
EOF

echo "✅ VPS deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Add VPS_SSH_KEY to GitHub secrets"
echo "2. Run: ./deploy-to-vps.sh"
echo "3. Configure DNS: A record $DOMAIN → $VPS_IP"
echo "4. Setup SSL: ssh root@$VPS_IP 'certbot --nginx -d $DOMAIN'"