# AdsEngineer Full Telegram Admin Guide

Complete Telegram-based administration for AdsEngineer - no web UI needed.

## Commands Reference

### 📊 Status & Monitoring

| Command | Description |
|---------|-------------|
| `/status` | System health check - API, workers, database, domain |
| `/metrics` | 24h performance data - response time, requests, error rate |
| `/logs` | Recent error logs from the last 24h |
| `/version` | Worker version, Wrangler version, deployment date |

### 🚀 Deployment & Operations

| Command | Description |
|---------|-------------|
| `/deploy` | Deploy worker to production via Cloudflare API |
| `/restart` | Restart all workers (5-10s downtime) |

### 💾 Database & Business Data

| Command | Description |
|---------|-------------|
| `/db` | Database status, size, table count |
| `/agencies` | Agency statistics, active today, webhooks count |
| `/leads` | Leads summary, conversion rate, pending review |

### 🔐 Security & Configuration

| Command | Description |
|---------|-------------|
| `/keys` | API keys validity status (Google Ads, Stripe, etc.) |

### ⚠️ Emergency Commands

| Command | Description |
|---------|-------------|
| `/kill` | **EMERGENCY STOP** - Stops all traffic (requires CONFIRM) |
| `/restore` | Restore system after emergency stop |

### ℹ️ Other

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show all commands |

## Setup Instructions

### 1. Create Telegram Bot

```
1. Open @BotFather on Telegram
2. Send /newbot
3. Follow prompts to name your bot
4. Copy the Bot Token
```

### 2. Get Your Chat ID

```
1. Start a chat with your bot
2. Send any message
3. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
4. Note your "id" from the response
```

### 3. Configure n8n

#### Create Credentials

**Telegram API Credential:**
- Name: `Telegram API`
- Bot Token: Your bot token from BotFather

**HTTP Header Auth (for Cloudflare):**
- Name: `Cloudflare API`
- Headers: `Authorization: Bearer YOUR_CLOUDFLARE_API_TOKEN`

#### Environment Variables

Add to n8n environment:
```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
```

### 4. Configure Authorized Users

Edit the `Authenticate` node in n8n:

```javascript
const authorizedUserIds = [
  123456789,  // Your chat ID
  987654321,  // Additional admin
];

if (authorizedUserIds.includes($json.id)) {
  return { json: { authorized: true, ...$json } };
}
return { json: { authorized: false, ...$json } };
```

### 5. Import Workflow

1. Open n8n
2. Import `n8n-adsengineer-full-admin.json`
3. Assign credentials to Telegram nodes
4. Update authorized user IDs
5. Activate workflow

## API Endpoints Used

The workflow calls these internal API endpoints:

| Endpoint | Used By |
|----------|---------|
| `GET /health` | Status check |
| `GET /api/v1/status` | System metrics |
| `GET /logs?level=error` | Error logs |
| `GET /api/v1/admin/sites` | Database stats |
| `GET /api/v1/admin/stats` | Agency stats |
| `GET /api/v1/leads/stats` | Leads summary |
| `GET /version` | Version info |
| `GET /api/v1/admin/keys-check` | API keys status |

## Cloudflare API Integration

The `/deploy` command calls Cloudflare Workers API:

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/adsengineer-cloud/deployments
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
```

**Required Permissions:**
- `Account:Workers Scripts:Edit`
- `Account:Workers Scripts:Read`

## Kill Switch Implementation

The `/kill` command:
1. Sends warning with 30-second confirmation window
2. Calls Cloudflare API to disable the worker subdomain
3. All traffic stops immediately

**To restore:** Send `/restore_system` or manually re-enable via Cloudflare dashboard.

## Security Features

- **User Authentication:** Only authorized Telegram users can execute commands
- **Confirmation Required:** Emergency commands require explicit confirmation
- **Audit Trail:** All commands logged with timestamps
- **Rate Limiting:** Respects Telegram API rate limits

## Files

- Workflow JSON: `docs/n8n-adsengineer-full-admin.json`
- Documentation: `docs/n8n-full-admin-guide.md`

## Troubleshooting

**"Access Denied" message:**
- Your chat ID is not in `authorizedUserIds`
- Get your ID from https://api.telegram.org/bot<TOKEN>/getUpdates

**Bot not responding:**
- Check n8n workflow is Active
- Verify Telegram credential is correct
- Check n8n execution logs

**Commands not recognized:**
- Check the Command Router switch cases
- Ensure text matching is exact (lowercase)

**Deploy fails:**
- Verify `CLOUDFLARE_API_TOKEN` has correct permissions
- Check account ID is correct
- Review Cloudflare API response for error details
