# Wiki Navigation

Quick access to all AdsEngineer documentation.

## 🚀 For New Users

| Topic | Description | Time to Read |
|--------|-------------|---------------|
| [Getting Started](Getting-Started.md) | 5-minute setup guide | 5 min |
| [API Reference](API-Reference.md) | Complete endpoint docs | 15 min |
| [Configuration](Configuration.md) | Environment and secrets setup | 10 min |
| [Deployment](Deployment.md) | Production deployment | 10 min |

## 🛠 For Developers

| Topic | Description | Time to Read |
|--------|-------------|---------------|
| [Architecture](Architecture.md) | System design and data flow | 20 min |
| [Contributing](Contributing.md) | Development setup and guidelines | 15 min |
| [Troubleshooting](Troubleshooting.md) | Common issues and solutions | 10 min |

## 📚 Quick Reference

### Authentication
```bash
# Get API token
curl -X POST "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/auth/token" \
     -d '{"user_id": "your_email"}'

# Use token
curl -H "Authorization: Bearer <token>" \
     "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads"
```

### Webhook Setup
```bash
# GHL Webhook
POST https://adsengineer-cloud.adsengineer.workers.dev/api/v1/ghl/webhook
Headers: X-GHL-Signature (HMAC verification)

# Shopify Webhook  
POST https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook
Headers: X-Shopify-Topic, X-Shopify-Shop-Domain
```

### Environment Setup
```bash
# Development
./provision-infrastructure.sh development
doppler run --config=dev -- pnpm dev

# Production
./provision-infrastructure.sh production
doppler run --config=production -- pnpm deploy
```

## 🔧 Common Commands

| Command | Purpose |
|----------|---------|
| `pnpm dev` | Start development server |
| `pnpm test` | Run all tests |
| `pnpm deploy` | Deploy to production |
| `doppler run -- <command>` | Run with secrets |
| `tofu apply -var="environment=prod"` | Provision infrastructure |

## 📖 External Resources

| Resource | Link |
|----------|------|
| Live API | https://adsengineer-cloud.adsengineer.workers.dev |
| API Docs | https://adsengineer-cloud.adsengineer.workers.dev/docs |
| Health Check | https://adsengineer-cloud.adsengineer.workers.dev/health |
| GitHub Repo | https://github.com/adsengineer/ads-engineer |
| Issues | https://github.com/adsengineer/ads-engineer/issues |

## 🆘 Getting Help

1. **Check this wiki first** - Most questions are answered here
2. **Search existing issues** - Avoid duplicate reports
3. **Use GitHub Discussions** - For questions and general help
4. **Create detailed issue** - Include steps to reproduce

---

**Start here:** [Getting Started](Getting-Started.md) for new users