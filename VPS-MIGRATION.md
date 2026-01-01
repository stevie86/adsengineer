# AdVocate Cloud - VPS Sync Guide

> **Sync your Cloudflare Workers code to VPS for backup, collaboration, and CI/CD**

## Quick Start

### One-Time Setup
```bash
chmod +x sync-to-vps.sh
./sync-to-vps.sh YOUR_VPS_IP
```

### Ongoing Sync
```bash
git push vps main
```

---

## Architecture

```
Your Local Repo ──┐
                 ├─▶ Cloudflare Workers (Production)
                 └─▶ VPS (Backup/Dev)
```

- **Primary**: Cloudflare Workers (your live API)
- **Secondary**: VPS (code backup, development, CI/CD runner)
- **CI/CD**: GitHub Actions auto-deploys to Workers + syncs to VPS

---

## Setup Instructions

### 1. Initial VPS Sync
```bash
./sync-to-vps.sh 123.45.67.89 ubuntu /home/ubuntu/ad-autopilot
```

### 2. GitHub Actions Setup
Add these secrets to your GitHub repo:

| Secret | Value | Example |
|--------|-------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `abc123...` |
| `VPS_HOST` | VPS IP address | `123.45.67.89` |
| `VPS_USER` | SSH username | `ubuntu` |
| `VPS_PATH` | Destination path | `/home/ubuntu/ad-autopilot` |
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA...` |
| `SLACK_WEBHOOK_URL` | Optional notifications | `https://hooks.slack.com/...` |

### 3. VPS SSH Key Setup
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Add to VPS
cat ~/.ssh/id_rsa.pub | ssh ubuntu@YOUR_VPS_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

# Add private key to GitHub secrets
cat ~/.ssh/id_rsa | pbcopy  # macOS
# or: cat ~/.ssh/id_rsa  # copy manually
```

---

## Deployment Workflow

### Automatic (GitHub Actions)
```yaml
on: push
jobs:
  deploy:
    - pnpm deploy  # To Cloudflare Workers
    - rsync to VPS  # Sync code
    - health check
```

### Manual Local Commands
```bash
# Deploy to Workers
pnpm deploy

# Sync to VPS
git push vps main

# Deploy from VPS
ssh ubuntu@VPS_IP 'cd /path/to/ad-autopilot && pnpm deploy'
```

---

## VPS Uses

### Primary Functions
- **Code Backup**: Always have latest code accessible
- **Development**: Test changes before deploying
- **CI/CD Runner**: GitHub Actions can run from VPS if needed
- **Collaboration**: Team can access code on VPS

### Development on VPS
```bash
ssh ubuntu@VPS_IP
cd /home/ubuntu/ad-autopilot/serverless
pnpm install
pnpm dev  # Local testing
pnpm deploy  # Deploy to Workers
```

### Database Access
```bash
# Access D1 database from VPS
cd /home/ubuntu/ad-autopilot/serverless
wrangler d1 execute advocate-db --remote --command "SELECT * FROM leads LIMIT 10"
```

---

## Directory Structure on VPS

```
/home/ubuntu/ad-autopilot/
├── .git/                 # Bare git repository
├── serverless/
│   ├── src/              # Source code
│   ├── package.json       # Dependencies
│   ├── wrangler.jsonc     # Cloudflare config
│   ├── tests/            # Test suite
│   └── .env.template     # Environment template
├── docs/                 # Documentation
└── README.md            # Project info
```

---

## Sync Commands Reference

### Initial Setup
```bash
# Full sync with Git history
./sync-to-vps.sh 123.45.67.89

# Custom path and user
./sync-to-vps.sh 123.45.67.89 ubuntu /var/www/ad-autopilot
```

### Daily Sync
```bash
# Push current state
git push vps main

# Pull from VPS
git pull vps main

# Force sync (overwrites VPS)
git push vps main --force
```

### Selective Sync
```bash
# Sync only serverless directory
rsync -avz serverless/ ubuntu@VPS_IP:/path/to/serverless/

# Sync specific files
rsync -avz serverless/src/ ubuntu@VPS_IP:/path/to/serverless/src/
```

---

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh ubuntu@VPS_IP "echo 'SSH works'"

# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### Sync Issues
```bash
# Check rsync exclusions
rsync --dry-run -avz --exclude='node_modules' ./ ubuntu@VPS_IP:/path/

# Manual sync test
scp serverless/package.json ubuntu@VPS_IP:/tmp/test
```

### Permission Issues
```bash
# Fix permissions on VPS
ssh ubuntu@VPS_IP "sudo chown -R ubuntu:ubuntu /home/ubuntu/ad-autopilot"
```

---

## Advanced Usage

### Multiple Environments
```bash
# Staging VPS
git remote add vps-staging ubuntu@staging-ip:/path/to/staging
git push vps-staging main

# Production VPS
git remote add vps-prod ubuntu@prod-ip:/path/to/prod
git push vps-prod main
```

### Automated Backups
```bash
# Add to crontab on VPS
0 2 * * * tar -czf /backup/ad-autopilot-$(date +\%Y\%m\%d).tar.gz /home/ubuntu/ad-autopilot
```

### Rollback
```bash
# Restore previous version
git checkout vps main~1  # Checkout previous commit
git push vps main --force # Force push to VPS
```

---

## Benefits

### ✅ What You Get
- **Instant backup** on every commit
- **Team collaboration** via VPS access
- **Automated deployment** with GitHub Actions
- **Development environment** for testing
- **Disaster recovery** if local machine fails

### ✅ Why Keep Cloudflare Workers?
- **Zero-ops scaling**
- **Global CDN**
- **Built-in D1 database**
- **Pay-per-use pricing**
- **99.99% uptime SLA**

---

## Summary

Your setup is now:
1. **Production**: Cloudflare Workers (unchanged)
2. **Backup**: VPS with git sync
3. **CI/CD**: GitHub Actions auto-deploy + sync

The VPS is just a **code mirror** - your actual API still runs on Cloudflare Workers with all the benefits.