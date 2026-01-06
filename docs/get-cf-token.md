# Cloudflare API Token - Get from .env

**Option 1: One-liner to set and deploy**

```bash
export CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN ~/.env | cut -d'=' -f2) && ./deploy-mycannaby.sh
```

**Option 2: Set token then deploy separately**

```bash
# Set the token
export CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN ~/.env | cut -d'=' -f2)

# Verify it's set
echo $CLOUDFLARE_API_TOKEN

# Run deployment
./deploy-mycannaby.sh
```

**Option 3: Manual - copy token from .env file**

```bash
# View token (copy this output)
cat ~/.env | grep CLOUDFLARE_API_TOKEN

# Then set it
export CLOUDFLARE_API_TOKEN="pasted_token_here"
```
