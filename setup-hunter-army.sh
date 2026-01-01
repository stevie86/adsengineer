#!/bin/bash

# Hunter Army Setup Script
# Creates minimal Manager/Slave workflow structure

echo "🎯 Setting up Hunter Army..."

# Create directory structure
mkdir -p n8n-hunter-army/{manager,slave,config}

echo "📁 Created directory structure"

# Copy workflow templates
cp "docs/n8n-hunter-army/manager.json" "n8n-hunter-army/manager/"
cp "docs/n8n-hunter-army/slave.json" "n8n-hunter-army/slave/"

echo "📋 Copied workflow templates"

# Create deployment config
cat > n8n-hunter-army/config/manager-config.json << 'EOF'
{
  "manager": {
    "webhook_path": "campaign",
    "status_path": "status",
    "max_concurrent_slaves": 10,
    "task_timeout_minutes": 30
  },
  "slave": {
    "assignment_path": "assignment",
    "manager_webhook": "https://your-manager.example.com/status",
    "scan_timeout_ms": 10000
  }
}
EOF

echo "⚙️ Created configuration"

# Create quick deploy script
cat > n8n-hunter-army/deploy.sh << 'EOF'
#!/bin/bash

# Hunter Army Deployment Script

echo "🚀 Deploying Hunter Army..."

# Deploy Manager (use Railway for stability)
echo "📦 Deploying Manager..."
cd n8n-hunter-army/manager
railway login --default
railway link
railway up --service-name hunter-army-manager
echo "✅ Manager deployed: $(railway domain)"

# Deploy Slaves (use Cloudflare Workers)
echo "📦 Deploying Slaves..."
cd ../slave

# Deploy multiple slave workers
for i in {1..3}; do
    echo "Deploying slave-$i..."
    wrangler deploy --name hunter-slave-$i
done

echo "✅ Deployed 3 slave workers"

echo "🎯 Hunter Army Ready!"
echo "Manager: $(railway domain)"
echo "Slaves: https://hunter-slave-{1,2,3}.your-subdomain.workers.dev"
EOF

chmod +x n8n-hunter-army/deploy.sh

echo "🔧 Created deployment script"

# Create README
cat > n8n-hunter-army/README.md << 'EOF'
# Hunter Army - Minimal Manager/Slave Setup

## Quick Start

```bash
# Deploy everything
./deploy.sh
```

## Architecture

- **Manager**: Handles orchestration and task distribution
- **Slaves**: Execute parallel agency discovery
- **Communication**: Webhook-based state synchronization

## Scaling

- Add more slaves by modifying `deploy.sh`
- Update `max_concurrent_slaves` in config
- Monitor progress via Manager webhook endpoints

## URLs

- Manager Campaign: POST `/campaign`
- Manager Status: POST `/status`  
- Slave Assignment: POST `/assignment`
EOF

echo "📖 Created README"

echo "✅ Hunter Army setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update URLs in manager.json and slave.json"
echo "2. Run: ./deploy.sh" 
echo "3. Test with: curl -X POST https://your-manager.railway.app/campaign"