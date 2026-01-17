#!/bin/bash

set -e

echo "🧪 AdsEngineer Test Runner"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if required dependencies are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is required but not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Set up test environment
setup_test_env() {
    log_info "Setting up test environment..."
    
    # Create test database if needed
    cd serverless
    pnpm wrangler d1 create adsengineer-test --location=us-central1
    
    # Set environment variables
    export NODE_ENV=test
    export D1_DATABASE_URL="local:$(pwd)/.wrangler/state/v3/d1/miniflare-D1Database__adsengineer-test.sqlite"
    
    log_success "Test environment configured"
}

# Cleanup test environment
cleanup_test_env() {
    log_info "Cleaning up test environment..."
    
    # Kill any running processes
    pkill -f "wrangler dev" || true
    pkill -f "vite dev" || true
    
    # Cleanup temporary files
    rm -rf .wrangler/state/v3/d1/miniflare-D1Database__adsengineer-test.sqlite
    
    log_success "Test environment cleaned up"
}

# Run serverless tests
run_serverless_tests() {
    log_info "Running serverless tests..."
    
    cd serverless
    
    echo "🧪 Unit Tests"
    pnpm test:unit --reporter=verbose || {
        log_error "Serverless unit tests failed"
        return 1
    }
    
    echo "🧪 Integration Tests"
    pnpm test:integration --reporter=verbose || {
        log_error "Serverless integration tests failed"
        return 1
    }
    
    echo "📊 Coverage Report"
    pnpm test:coverage --reporter=text || {
        log_warning "Coverage report generation failed"
    }
    
    log_success "Serverless tests completed"
}

# Run frontend tests
run_frontend_tests() {
    log_info "Running frontend tests..."
    
    cd frontend
    
    echo "🧪 Component Tests"
    pnpm test --reporter=verbose || {
        log_error "Frontend tests failed"
        return 1
    }
    
    echo "📊 Frontend Coverage Report"
    pnpm test:coverage --reporter=text || {
        log_warning "Frontend coverage report generation failed"
    }
    
    log_success "Frontend tests completed"
}

# Run E2E tests
run_e2e_tests() {
    log_info "Running end-to-end tests..."
    
    cd serverless
    
    # Install Playwright browsers
    pnpm exec playwright install --with-deps
    
    echo "🌐 E2E Tests"
    pnpm test:e2e || {
        log_error "E2E tests failed"
        return 1
    }
    
    log_success "E2E tests completed"
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    cd serverless
    
    echo "⚡ Load Tests"
    pnpm load-test:local || {
        log_error "Performance tests failed"
        return 1
    }
    
    log_success "Performance tests completed"
}

# Run security scans
run_security_tests() {
    log_info "Running security scans..."
    
    cd serverless
    
    echo "🔒 Security Audit"
    pnpm audit || {
        log_warning "Security audit found issues"
    }
    
    log_success "Security scans completed"
}

# Run all tests
run_all_tests() {
    log_info "Running complete test suite..."
    
    check_dependencies
    setup_test_env
    
    # Run test suites
    run_serverless_tests
    run_frontend_tests
    
    # Only run E2E and performance tests if explicitly requested
    if [[ "$RUN_E2E" == "true" ]]; then
        run_e2e_tests
    fi
    
    if [[ "$RUN_PERFORMANCE" == "true" ]]; then
        run_performance_tests
    fi
    
    run_security_tests
    
    cleanup_test_env
    
    log_success "🎉 All tests completed successfully!"
}

# Generate comprehensive test report
generate_report() {
    log_info "Generating test report..."
    
    local report_dir="test-reports"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$report_dir/test_report_$timestamp.md"
    
    mkdir -p "$report_dir"
    
    cat > "$report_file" << EOF
# AdsEngineer Test Report

**Generated**: $(date)
**Environment**: $NODE_ENV

## Test Results Summary

### Serverless Tests
- Unit Tests: $(cd serverless && pnpm test:unit --reporter=json 2>/dev/null | jq -r '.numTotalTests // "N/A"') tests
- Integration Tests: $(cd serverless && pnpm test:integration --reporter=json 2>/dev/null | jq -r '.numTotalTests // "N/A"') tests
- Coverage: $(cd serverless && pnpm test:coverage --reporter=json 2>/dev/null | jq -r '.total.lines.pct // "N/A"')%

### Frontend Tests
- Component Tests: $(cd frontend && pnpm test --reporter=json 2>/dev/null | jq -r '.numTotalTests // "N/A"') tests
- Coverage: $(cd frontend && pnpm test:coverage --reporter=json 2>/dev/null | jq -r '.total.lines.pct // "N/A"')%

### Performance Tests
- Load Test: $([ "$RUN_PERFORMANCE" == "true" ] && echo "Completed" || echo "Skipped")
- Target RPS: 1000
- Actual RPS: $(cat load-test-results.json 2>/dev/null | jq -r '.rps // "N/A"')

### Security
- Vulnerabilities Found: $(cd serverless && pnpm audit --json 2>/dev/null | jq -r '.vulnerabilities | length // "N/A"')
- Critical Issues: $(cd serverless && pnpm audit --json 2>/dev/null | jq -r '.vulnerabilities | map(select(.severity == "critical")) | length // "N/A"')

## Recommendations

EOF
    
    echo "📄 Test report generated: $report_file"
}

# Parse command line arguments
case "${1:-all}" in
    "serverless"|"api")
        check_dependencies
        setup_test_env
        run_serverless_tests
        cleanup_test_env
        ;;
    "frontend")
        check_dependencies
        setup_test_env
        run_frontend_tests
        cleanup_test_env
        ;;
    "e2e")
        check_dependencies
        setup_test_env
        RUN_E2E=true
        run_e2e_tests
        cleanup_test_env
        ;;
    "performance"|"load")
        check_dependencies
        setup_test_env
        RUN_PERFORMANCE=true
        run_performance_tests
        cleanup_test_env
        ;;
    "security"|"audit")
        run_security_tests
        ;;
    "coverage")
        check_dependencies
        setup_test_env
        run_serverless_tests
        run_frontend_tests
        generate_report
        cleanup_test_env
        ;;
    "all")
        RUN_E2E=true
        RUN_PERFORMANCE=true
        run_all_tests
        generate_report
        ;;
    "cleanup")
        cleanup_test_env
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  serverless     Run serverless (API) tests"
        echo "  frontend       Run frontend component tests"
        echo "  e2e           Run end-to-end tests"
        echo "  performance    Run performance/load tests"
        echo "  security       Run security audit"
        echo "  coverage      Run all tests with coverage report"
        echo "  all           Run complete test suite"
        echo "  cleanup        Clean up test environment"
        echo "  help          Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  RUN_E2E=true     Include E2E tests in 'all' command"
        echo "  RUN_PERFORMANCE=true Include performance tests in 'all' command"
        exit 0
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac