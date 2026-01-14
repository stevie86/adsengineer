#!/bin/bash

# AdsEngineer Development Management Script
# Simple, fast, and reliable server management

set -e

# Simple command mapping
case "$1" in
    start|dev)
        cd serverless && doppler run -- pnpm dev
        ;;
    deploy|prod)
        cd serverless && doppler run -- pnpm deploy  
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        echo "Available commands:"
        echo "  start    - Start development server"
        echo "  deploy   - Deploy to production"
        echo "  prod     - Deploy to production (alias for deploy)"
        echo ""
        echo "Examples:"
        echo "  ./manage.sh start"
        echo "  ./manage.sh deploy"
        exit 1
        ;;
esac