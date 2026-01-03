#!/bin/bash

set -e

ENV=${1:-development}

case "$ENV" in
  development|staging|production)
    ;;
  *)
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

echo "🚀 Provisioning infrastructure for: $ENV"

cd infrastructure

if [ ! -d ".terraform" ]; then
  echo "📦 Initializing OpenTofu..."
  doppler run -- tofu init -var="environment=$ENV"
else
  echo "✓ OpenTofu already initialized"
fi

echo "📋 Planning infrastructure changes..."
doppler run -- tofu plan -var="environment=$ENV"

read -p "Apply changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🔨 Applying infrastructure changes..."
  doppler run -- tofu apply -var="environment=$ENV"
  echo "✅ Infrastructure provisioned successfully!"
  echo ""
  echo "Outputs:"
  doppler run -- tofu output -var="environment=$ENV"
else
  echo "❌ Changes not applied"
  exit 1
fi
