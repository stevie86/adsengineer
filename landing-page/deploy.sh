#!/bin/bash
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN"
cd /home/webadmin/coding/ads-engineer/landing-page
npx wrangler@4.59.1 pages deploy dist --project-name=adsengineer-landing