# n8n Workflows Production Deployment

This guide walks through deploying the Hunter Army n8n workflows to production.

## Prerequisites

- Railway account (or similar hosting: Render, DigitalOcean, etc.)
- n8n workflows exported from development
- API credentials for external services

## Option 1: Deploy to Railway (Recommended)

### Step 1: Create Railway Account
1. Sign up at https://railway.app
2. Connect GitHub (optional) or deploy directly

### Step 2: Create New Project
1. Click "New Project"
2. Choose "Empty Project" or "Deploy from GitHub"
3. Name it "adsengineer-n8n"

### Step 3: Deploy n8n
Using Railway CLI or dashboard:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway create adsengineer-n8n

# Deploy n8n
railway up
```

Or use the n8n Docker template in Railway.

### Step 4: Configure Environment Variables
In Railway dashboard → Variables:

```bash
# Database (Railway provides PostgreSQL)
DATABASE_TYPE=postgres
DB_POSTGRE_HOST=${{ Railway.POSTGRESQL_HOST }}
DB_POSTGRE_PORT=${{ Railway.POSTGRESQL_PORT }}
DB_POSTGRE_DATABASE=${{ Railway.POSTGRESQL_DATABASE }}
DB_POSTGRE_USER=${{ Railway.POSTGRESQL_USER }}
DB_POSTGRE_PASSWORD=${{ Railway.POSTGRESQL_PASSWORD }}

# Security
N8N_ENCRYPTION_KEY=your_32_char_encryption_key
N8N_JWT_SECRET=your_jwt_secret

# Execution
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=120
EXECUTIONS_TIMEOUT_MAX=300

# Webhook
WEBHOOK_URL=https://your-n8n-instance.com
N8N_HOST=https://your-n8n-instance.com
N8N_PORT=5678
N8N_PROTOCOL=https

# API
N8N_REST_API_ENABLED=true
N8N_REST_API_PATH=rest

# Hunter Army specific
HUNTER_API_KEY=your_hunter_io_api_key
LINKEDIN_API_KEY=your_linkedin_api_key
APOLLO_API_KEY=your_apollo_api_key
ZOOMINFO_API_KEY=your_zoominfo_api_key

# AdsEngineer API
ADSENGINEER_API_URL=https://advocate-cloud.adsengineer.workers.dev
ADSENGINEER_API_KEY=your_api_key
```

### Step 5: Import Workflows
1. Access n8n web interface
2. Import the workflow JSON files:
   - `1-master-agency-hunter-coordinator.json`
   - `2-discovery-scout-agent.json`
   - `3-tech-stack-auditor-agent.json`
   - `4-outreach-copywriter-agent.json`
   - `5-notification-router.json`

### Step 6: Configure Webhooks
Update workflow webhooks to point to production URLs.

## Option 2: Self-Host n8n on VPS

### Step 1: Server Setup
```bash
# On Ubuntu/Debian server
sudo apt update
sudo apt install docker.io docker-compose

# Create directory
mkdir n8n && cd n8n
```

### Step 2: Docker Compose
Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_ENCRYPTION_KEY=your_32_char_encryption_key
      - N8N_JWT_SECRET=your_jwt_secret
      - EXECUTIONS_PROCESS=main
      - EXECUTIONS_MODE=regular
      - WEBHOOK_URL=https://your-domain.com
      - N8N_HOST=https://your-domain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      # Add other env vars from Railway section
    volumes:
      - ./n8n-data:/home/node/.n8n
  postgres:
    image: postgres:13
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=your_password
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
```

### Step 3: SSL with Caddy
Add Caddy for SSL:

```yaml
  caddy:
    image: caddy:2
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
volumes:
  caddy_data:
  caddy_config:
```

Caddyfile:
```
your-domain.com {
    reverse_proxy n8n:5678
}
```

## Testing Workflows

1. **Manual Testing**: Trigger workflows manually in n8n
2. **API Testing**: Test webhook endpoints
3. **Integration Testing**: Verify data flows to AdsEngineer API

## Monitoring & Scaling

### Health Checks
- Set up Railway health checks
- Monitor workflow execution times
- Alert on failed executions

### Scaling
- Railway auto-scales based on usage
- For high volume, consider Railway Pro plan
- Monitor API rate limits

### Backups
- Railway automatic backups
- Export workflows regularly
- Backup environment variables

## Security Considerations

1. **Network Security**
   - Use Railway private networking if possible
   - Restrict IP access to known ranges
   - Use VPN for admin access

2. **API Security**
   - Rotate API keys regularly
   - Use environment-specific credentials
   - Monitor API usage

3. **Data Protection**
   - Encrypt sensitive data
   - Implement data retention policies
   - Regular security audits

## Troubleshooting

### Workflows Not Executing
- Check webhook URLs
- Verify API credentials
- Check n8n logs: `railway logs`

### Performance Issues
- Monitor memory/CPU usage
- Check database connections
- Optimize workflow logic

### Connection Failures
- Verify network connectivity
- Check firewall rules
- Validate SSL certificates

## Cost Estimation

- **Railway**: $5-10/month for basic n8n
- **Railway Pro**: $15-25/month for scaling
- **VPS**: $10-50/month depending on specs
- **External APIs**: Varies by usage (Hunter, LinkedIn, etc.)

Start with Railway for simplicity and scale as needed.