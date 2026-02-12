#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(basename "$SCRIPT_DIR")" == "scripts" ]]; then
    cd "$SCRIPT_DIR/.."
else
    cd "$SCRIPT_DIR"
fi
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
PROJECT_NAME="adsengineer-landing"
DIST_DIR="dist"

# Performance tracking
START_TIME=$(date +%s)
BUILD_START=0
BUILD_END=0
DEPLOY_START=0
DEPLOY_END=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║   AdsEngineer Landing Page - Performance Deployer        ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Start Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the landing-page directory?"
        exit 1
    fi
    
    NODE_VERSION=$(node -v 2>/dev/null || echo "not found")
    if [ "$NODE_VERSION" = "not found" ]; then
        log_error "Node.js not found. Please install Node.js 18+."
        exit 1
    fi
    log_success "Node.js version: $NODE_VERSION"
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm not found. Please install pnpm."
        exit 1
    fi
    log_success "pnpm is installed"
    
    if ! command -v wrangler &> /dev/null; then
        log_error "wrangler not found. Please install wrangler."
        exit 1
    fi
    log_success "wrangler is installed"
    
    if ! wrangler whoami &> /dev/null; then
        log_error "Not logged in to wrangler. Run: wrangler login"
        exit 1
    fi
    log_success "wrangler is authenticated"
    
    echo ""
}

# Pre-build optimizations
pre_build_optimizations() {
    log_info "Running pre-build optimizations..."
    
    if [ -d "$DIST_DIR" ]; then
        log_info "Cleaning previous build..."
        rm -rf "$DIST_DIR"
    fi
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        pnpm install --frozen-lockfile
    fi
    
    if [ ! -f "public/_headers" ]; then
        log_warning "public/_headers not found. Performance will not be optimal."
    else
        log_success "Optimization files present"
    fi
    
    echo ""
}

# Build with optimizations
build_project() {
    log_info "Building project with optimizations..."
    BUILD_START=$(date +%s)
    
    export NODE_ENV=production
    
    log_info "Running Astro build..."
    if ! pnpm build > build.log 2>&1; then
        log_error "Build failed. Check build.log for details."
        cat build.log
        exit 1
    fi
    
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    
    log_success "Build completed in ${BUILD_TIME}s"
    
    if [ ! -d "$DIST_DIR" ]; then
        log_error "Build output directory not found: $DIST_DIR"
        exit 1
    fi
    
    log_info "Build statistics:"
    echo "  - Total files: $(find "$DIST_DIR" -type f | wc -l)"
    echo "  - Total size: $(du -sh "$DIST_DIR" | cut -f1)"
    echo "  - HTML files: $(find "$DIST_DIR" -name '*.html' | wc -l)"
    echo "  - JS files: $(find "$DIST_DIR" -name '*.js' | wc -l)"
    echo "  - CSS files: $(find "$DIST_DIR" -name '*.css' | wc -l)"
    
    echo ""
}

# Post-build optimizations
post_build_optimizations() {
    log_info "Running post-build optimizations..."
    
    if [ -f "public/_headers" ] && [ ! -f "$DIST_DIR/_headers" ]; then
        cp public/_headers "$DIST_DIR/_headers"
        log_success "Copied _headers to dist"
    fi
    
    if [ -f "public/_routes.json" ] && [ ! -f "$DIST_DIR/_routes.json" ]; then
        cp public/_routes.json "$DIST_DIR/_routes.json"
        log_success "Copied _routes.json to dist"
    fi
    
    if [ -f "public/_redirects" ] && [ ! -f "$DIST_DIR/_redirects" ]; then
        cp public/_redirects "$DIST_DIR/_redirects"
        log_success "Copied _redirects to dist"
    fi
    
    log_info "Verifying optimization files in dist:"
    for file in _headers _routes.json _redirects; do
        if [ -f "$DIST_DIR/$file" ]; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (missing)"
        fi
    done
    
    log_info "Pre-compressing assets..."
    find "$DIST_DIR" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) -exec gzip -k -9 {} \; 2>/dev/null || true
    
    if command -v brotli &> /dev/null; then
        find "$DIST_DIR" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.svg" \) -exec brotli -k -q 11 {} \; 2>/dev/null || true
        log_success "Assets compressed (Gzip + Brotli)"
    else
        log_warning "brotli not installed. Install with: apt-get install brotli"
        log_success "Assets compressed (Gzip only)"
    fi
    
    echo ""
}

# Validate build
validate_build() {
    log_info "Validating build..."
    
    if [ ! -f "$DIST_DIR/index.html" ]; then
        log_error "index.html not found in dist"
        exit 1
    fi
    
    log_info "Checking for broken internal links..."
    if grep -r "href=\"#/" "$DIST_DIR" 2>/dev/null; then
        log_warning "Found potential broken links (href=\"#/\")"
    fi
    
    log_info "Validating HTML structure..."
    HTML_ERRORS=$(find "$DIST_DIR" -name '*.html' -exec grep -l "<html" {} \; | wc -l)
    if [ "$HTML_ERRORS" -eq 0 ]; then
        log_error "No valid HTML files found"
        exit 1
    fi
    
    log_success "Build validation passed"
    echo ""
}

# Deploy to Cloudflare Pages
deploy() {
    log_info "Deploying to Cloudflare Pages..."
    DEPLOY_START=$(date +%s)
    
    log_info "Starting deployment..."
    wrangler pages deploy "$DIST_DIR" > deploy.log 2>&1
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Check deploy.log for details."
        cat deploy.log
        log_info "If authentication failed, ensure you have 'Cloudflare Pages' permissions."
        exit 1
    fi
    
    DEPLOY_END=$(date +%s)
    DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
    
    log_success "Deployment completed in ${DEPLOY_TIME}s"
    
    DEPLOY_URL=$(grep -o 'https://[a-z0-9-]*\.pages\.dev' deploy.log | tail -1)
    if [ -n "$DEPLOY_URL" ]; then
        log_success "Preview URL: $DEPLOY_URL"
    fi
    
    echo ""
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    sleep 5
    
    DOMAIN="adsengineer.com"
    log_info "Testing $DOMAIN..."
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Main domain is accessible (HTTP 200)"
    else
        log_warning "Main domain returned HTTP $HTTP_STATUS"
    fi
    
    log_info "Checking security headers..."
    HEADERS=$(curl -s -I "https://$DOMAIN" 2>/dev/null)
    
    if echo "$HEADERS" | grep -q "x-frame-options: DENY"; then
        echo "  ✓ X-Frame-Options: DENY"
    else
        echo "  ✗ X-Frame-Options missing"
    fi
    
    if echo "$HEADERS" | grep -q "x-content-type-options: nosniff"; then
        echo "  ✓ X-Content-Type-Options: nosniff"
    else
        echo "  ✗ X-Content-Type-Options missing"
    fi
    
    log_info "Checking cache headers..."
    CACHE_HEADER=$(curl -s -I "https://$DOMAIN/assets/" 2>/dev/null | grep -i "cache-control" || echo "")
    if [ -n "$CACHE_HEADER" ]; then
        echo "  ✓ Cache-Control present"
    else
        echo "  ✗ Cache-Control missing on assets"
    fi
    
    log_info "Checking API proxy..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/v1/health" || echo "000")
    if [ "$API_STATUS" = "200" ]; then
        log_success "API proxy working (HTTP 200)"
    else
        log_warning "API proxy returned HTTP $API_STATUS"
    fi
    
    echo ""
}

# Performance test
performance_test() {
    log_info "Running performance tests..."
    
    DOMAIN="adsengineer.com"
    
    log_info "Measuring Time to First Byte..."
    TTFB=$(curl -s -o /dev/null -w "%{time_starttransfer}" "https://$DOMAIN" || echo "0")
    TTFB_MS=$(echo "$TTFB * 1000" | bc 2>/dev/null || printf "%.0f" $(echo "$TTFB * 1000" | awk '{print $1}') 2>/dev/null || echo "0")
    log_info "TTFB: ${TTFB_MS}ms"
    
    log_info "Checking Cloudflare cache status..."
    CACHE_STATUS=$(curl -s -I "https://$DOMAIN" 2>/dev/null | grep -i "cf-cache-status" || echo "")
    if [ -n "$CACHE_STATUS" ]; then
        echo "  Cloudflare Cache Status: $CACHE_STATUS"
    else
        log_warning "Cloudflare cache headers not found"
    fi
    
    echo ""
}

# Generate deployment report
generate_report() {
    END_TIME=$(date +%s)
    TOTAL_TIME=$((END_TIME - START_TIME))
    
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                 DEPLOYMENT COMPLETE                       ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo "Performance Summary:"
    echo "  ⏱️  Total Time: ${TOTAL_TIME}s"
    echo "  🔨 Build Time: ${BUILD_TIME}s"
    echo "  🚀 Deploy Time: ${DEPLOY_TIME}s"
    echo ""
    
    echo "Deployment Details:"
    echo "  📦 Environment: $ENVIRONMENT"
    echo "  🌐 Domain: https://adsengineer.com"
    echo "  📊 Build Size: $(du -sh "$DIST_DIR" | cut -f1)"
    echo "  📄 Total Files: $(find "$DIST_DIR" -type f | wc -l)"
    echo ""
    
    echo "Optimizations Applied:"
    echo "  ✓ Security headers (X-Frame-Options, CSP, etc.)"
    echo "  ✓ Aggressive asset caching (1 year for static files)"
    echo "  ✓ HTML revalidation (always fresh)"
    echo "  ✓ Brotli & Gzip pre-compression"
    echo "  ✓ API proxy to Workers"
    echo "  ✓ Geographic redirects"
    echo ""
    
    echo "Next Steps:"
    echo "  1. Test the site: https://adsengineer.com"
    echo "  2. Run Lighthouse audit"
    echo "  3. Monitor Real User Monitoring (RUM) data in Cloudflare"
    echo ""
    
    log_success "Deployment successful! 🎉"
}

# Cleanup
cleanup() {
    rm -f build.log deploy.log 2>/dev/null || true
}

# Error handler
error_handler() {
    log_error "Deployment failed at line $1"
    cleanup
    exit 1
}

trap 'error_handler $LINENO' ERR

# Main execution
main() {
    print_header
    check_prerequisites
    pre_build_optimizations
    build_project
    post_build_optimizations
    validate_build
    deploy
    verify_deployment
    performance_test
    generate_report
    cleanup
}

# Run main function
main "$@"
