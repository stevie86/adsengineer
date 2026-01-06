#!/bin/bash
doppler secrets set CLOUDFLARE_API_TOKEN "$(grep CLOUDFLARE_API_TOKEN serverless/.env | cut -d'=' -f2)" --config prd && echo "✅ Cloudflare API token synced to Doppler production"
