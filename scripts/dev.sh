#!/bin/bash

# AdsEngineer Development Management Script
# Usage: ./scripts/dev.sh [options]

set -e

# Default values
HOST="localhost"
PORT="8090"
ENVIRONMENT="development"
COMMAND="dev"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            HOST="$2"
            shift
            ;;
        --port)
            PORT="$2"
            shift
            ;;
        --prod|--production)
            ENVIRONMENT="production"
            COMMAND="deploy"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --host HOST       Set host (default: localhost)"
            echo "  --port PORT       Set port (default: 8090)"
            echo "  --prod          Use production environment (deploy instead of dev)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Start dev server on localhost:8090"
            echo "  $0 --host 0.0.0.0      # Start on custom host"
            echo "  $0 --port 3000            # Start on port 3000"
            echo "  $0 --prod                 # Deploy to production"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

# Set working directory
cd serverless

# Execute command based on environment
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🚀 Deploying to production..."
    doppler run -- pnpm deploy
else
    echo "🔧 Starting development server..."
    echo "   Host: $HOST"
    echo "   Port: $PORT"
    echo "   Environment: $ENVIRONMENT"
    
    # Build wrangler command with array of args
    WRANGLER_ARGS=()
    
    # Always add port
    WRANGLER_ARGS+=("--port")
    WRANGLER_ARGS+=("$PORT")
    
    # Add custom host if not localhost
    if [[ "$HOST" != "localhost" ]]; then
        WRANGLER_ARGS+=("--host")
        WRANGLER_ARGS+=("$HOST")
    fi
    
    # Debug: Show what we're passing
    echo "🐛 Debug: WRANGLER_ARGS = ${WRANGLER_ARGS[@]}"
    echo "🐛 Debug: Number of args = ${#WRANGLER_ARGS[@]}"
    
    # Execute with expanded args
    doppler run -- pnpm dev "${WRANGLER_ARGS[@]}"
fi