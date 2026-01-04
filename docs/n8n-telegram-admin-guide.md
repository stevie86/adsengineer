# AdsEngineer Telegram Admin Workflow

Control your AdsEngineer API remotely via Telegram with authenticated commands.

## Overview

This n8n workflow provides a Telegram bot interface for:
- System health checks
- Worker deployment
- Performance metrics
- Log retrieval
- Worker restarts

## Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and talk to [@BotFather](https://t.me/BotFather)
2. Send `/newbot` to create a new bot
3. Follow the prompts to name your bot
4. Copy the **Bot Token** (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Get Your Chat ID

1. Start a chat with your new bot
2. Send any message
3. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your `id` in the response

### 3. Configure n8n Credentials

In n8n, create a Telegram API credential:
- **Credential Name:** Telegram API
- **Bot Token:** Your bot token from BotFather

### 4. Add Authorized Users

Update the `authorizedUserIds` array in the workflow with your chat IDs:
```json
{
  "authorizedUserIds": [123456789, 987654321]
}
```

### 5. Configure Environment Variables

Add these to n8n or your `.env`:
```
GOOGLE_ADS_DEVELOPER_TOKEN=your_token
CLOUDFLARE_API_TOKEN=your_token
```

## Available Commands

### Info Commands
| Command | Description |
|---------|-------------|
| `/status` | System health check |
| `/version` | Current version info |
| `/help` | Show all commands |

### Admin Commands
| Command | Description |
|---------|-------------|
| `/deploy` | Deploy worker to production |
| `/restart` | Restart all workers |
| `/logs` | Get recent error logs |
| `/metrics` | Performance metrics |

### Quick Actions
| Command | Description |
|---------|-------------|
| `/deploy_prod` | Deploy to production |
| `/deploy_staging` | Deploy to staging |

## Workflow Structure

```
Telegram Trigger → Authenticate User → Command Router
                                         ↓
                    ┌────────────────────┼────────────────────┐
                    ↓                    ↓                    ↓
              Help Response       Status Response      Deploy Response
                    ↓                    ↓                    ↓
              Metrics Response    Logs Response        Restart Response
```

## Importing the Workflow

1. Open n8n
2. Click "Import" → "From File"
3. Select `n8n-adsengineer-telegram-admin.json`
4. Configure the Telegram API credential
5. Update `authorizedUserIds` with your chat IDs
6. Activate the workflow

## Security Features

- **User Authentication:** Only authorized chat IDs can execute commands
- **Audit Trail:** All commands logged with timestamps
- **Error Handling:** Failed commands return descriptive messages
- **Rate Limiting:** Telegram API rate limits apply

## Customization

### Adding New Commands

1. Add a new Switch case in "Command Router"
2. Create response node
3. Connect to router and response

### Changing Response Format

Edit the message text in each response node. Supports:
- Markdown formatting (`*bold*`, `_italic_`)
- Line breaks (`\n`)
- Variables (`{{ $json.field }}`)

## Deployment URL

Once configured, access your API at:
- **Production:** https://api.adsengineer.cloud
- **Staging:** https://adsengineer-cloud-staging.workers.dev

## Troubleshooting

**"Access Denied" message:**
- Check your chat ID is in `authorizedUserIds`
- Verify Telegram credential is configured

**"Unknown command":**
- Command may have typo - use `/help` for valid commands

**No response from bot:**
- Check n8n workflow is active
- Verify Telegram API credential
- Check n8n execution logs

## File Location

Workflow JSON: `docs/n8n-adsengineer-telegram-admin.json`
