#!/bin/bash

VPS_HOST="webadmin@172.104.241.225"
VPS_PATH="${1:-/var/www/ad-autopilot}"

echo "Syncing to $VPS_HOST:$VPS_PATH..."

ssh $VPS_HOST "mkdir -p $VPS_PATH"

rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='coverage' \
    --exclude='.wrangler' \
    --exclude='*.log' \
    --exclude='.env*' \
    ./ $VPS_HOST:$VPS_PATH/

echo "Done!"