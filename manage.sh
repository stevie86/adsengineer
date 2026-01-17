#!/bin/bash

# AdsEngineer Development Management Script
# Simple, fast, and reliable server management

set -e

# Check if server is running on port 8090
check_server() {
    if lsof -ti:8090 > /dev/null 2>&1; then
        return 0  # Server is running
    fi
    return 1  # Server is not running
}

# Kill existing server
kill_server() {
    echo "🛑 Found existing server on port 8090"
    echo ""
    read -p "Kill existing server and start new one? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "⏳ Killing existing server..."
        pkill -9 -f "wrangler dev" 2>/dev/null || true
        pkill -9 -f "node.*wrangler" 2>/dev/null || true
        lsof -ti:8090 | xargs kill -9 2>/dev/null || true
        sleep 2
        echo "✅ Existing server killed"
        return 0
    else
        echo "❌ Aborted. Server is still running on port 8090."
        exit 1
    fi
}

# Simple command mapping
case "$1" in
    start|dev)
        # Check and handle existing server
        if check_server; then
            kill_server
        fi
        
        echo "🚀 Starting development server..."
        cd serverless && doppler run -- pnpm dev --ip 0.0.0.0 &
        DEV_PID=$!
        
        echo "⏳ Waiting for server to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:8090/health > /dev/null 2>&1; then
                echo ""
                echo "╔══════════════════════════════════════════════════════════════╗"
                echo "║  ✅ Server is ready!                                        ║"
                echo "╚══════════════════════════════════════════════════════════════╝"
                echo ""
                echo "🌐 Access URLs:"
                echo "   • Local:       http://localhost:8090"
                echo "   • Network:     http://127.0.0.1:8090"
                echo "   • Public IP:   http://172.104.241.225:8090"
                echo "   • Tailscale:   http://100.111.164.18:8090"
                echo ""
                echo "📡 API Endpoints:"
                echo "   • Health:           GET  http://localhost:8090/health"
                echo "   • Billing Pricing:  GET  http://localhost:8090/api/v1/billing/pricing"
                echo "   • Admin API:        GET  http://localhost:8090/api/v1/admin/*"
                echo ""
                echo "🔑 Admin Token: dev-admin-secret-12345"
                echo ""
                echo "🛑 Press Ctrl+C to stop the server"
                echo ""
                
                # Wait for the dev server process
                wait $DEV_PID
                exit $?
            fi
            sleep 1
        done
        
        echo "⏰ Server took too long to start. Check logs for errors."
        exit 1
        ;;
    deploy|prod)
        cd serverless && doppler run -- pnpm deploy  
        ;;
    stop)
        if check_server; then
            echo "🛑 Stopping existing server..."
            pkill -9 -f "wrangler dev" 2>/dev/null || true
            pkill -9 -f "node.*wrangler" 2>/dev/null || true
            lsof -ti:8090 | xargs kill -9 2>/dev/null || true
            echo "✅ Server stopped"
        else
            echo "✅ No server running on port 8090"
        fi
        ;;
    restart)
        if check_server; then
            echo "🔄 Restarting server..."
            pkill -9 -f "wrangler dev" 2>/dev/null || true
            pkill -9 -f "node.*wrangler" 2>/dev/null || true
            lsof -ti:8090 | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
        echo "🚀 Starting development server..."
        cd serverless && doppler run -- pnpm dev
        ;;
    status)
        if check_server; then
            echo "✅ Server is RUNNING on port 8090"
            lsof -ti:8090 | xargs ps -p 2>/dev/null || true
        else
            echo "❌ Server is NOT running on port 8090"
        fi
        ;;
    help|--help|-h)
        echo "📚 AdsEngineer Management Script"
        echo ""
        echo "Usage: ./manage.sh <command>"
        echo ""
        echo "Available commands:"
        echo "  start    - Start development server (kills existing if needed)"
        echo "  stop     - Stop running server"
        echo "  restart  - Restart server"
        echo "  status   - Check if server is running"
        echo "  deploy   - Deploy to production"
        echo "  prod     - Deploy to production (alias for deploy)"
        echo ""
        echo "Examples:"
        echo "  ./manage.sh start"
        echo "  ./manage.sh status"
        echo "  ./manage.sh stop"
        exit 0
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        echo "📚 Usage: ./manage.sh <command>"
        echo ""
        echo "Available commands:"
        echo "  start    - Start development server (kills existing if needed)"
        echo "  stop     - Stop running server"
        echo "  restart  - Restart server"
        echo "  status   - Check if server is running"
        echo "  deploy   - Deploy to production"
        echo "  prod     - Deploy to production (alias for deploy)"
        echo ""
        echo "Run ./manage.sh help for more info"
        exit 1
        ;;
esac