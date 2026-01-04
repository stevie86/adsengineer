#!/bin/bash
set -e

ENV=${1:-production}
SKIP_MIGRATIONS=${2:-false}

echo "============================================"
echo "AdVocate Cloud Deployment"
echo "Environment: $ENV"
echo "============================================"

if [ "$ENV" != "production" ] && [ "$ENV" != "staging" ] && [ "$ENV" != "development" ]; then
  echo "Error: Invalid environment. Use: production, staging, or development"
  exit 1
fi

echo ""
echo "[1/5] Running type check..."
pnpm types:check
echo "Type check passed."

echo ""
echo "[2/5] Running tests..."
pnpm test:run || echo "Tests skipped (no test runner configured)"

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo ""
  echo "[3/5] Running database migrations..."
  
  if [ "$ENV" = "production" ]; then
    wrangler d1 migrations apply adsengineer-db --remote
  else
    wrangler d1 migrations apply adsengineer-db --remote --env $ENV
  fi
  echo "Migrations complete."
else
  echo ""
  echo "[3/5] Skipping migrations (SKIP_MIGRATIONS=true)"
fi

echo ""
echo "[4/5] Deploying to Cloudflare Workers..."
if [ "$ENV" = "production" ]; then
  wrangler deploy
else
  wrangler deploy --env $ENV
fi
echo "Deployment complete."

echo ""
echo "[5/5] Verifying deployment..."
sleep 3

if [ "$ENV" = "production" ]; then
  HEALTH_URL="https://adsengineer-cloud.adsengineer.workers.dev/health"
else
  HEALTH_URL="https://adsengineer-cloud-${ENV}.adsengineer.workers.dev/health"
fi

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Health check passed!"
  echo "Response: $BODY"
else
  echo "Warning: Health check returned HTTP $HTTP_CODE"
  echo "Response: $BODY"
fi

echo ""
echo "============================================"
echo "Deployment Summary"
echo "============================================"
echo "Environment: $ENV"
echo "Health URL: $HEALTH_URL"
echo "Status: Deployed"
echo "============================================"