# AdsEngineer Load Testing

Comprehensive load testing suite for AdsEngineer Cloudflare Workers with fake data generation.

## Features

- **Fake Data Generation**: Creates realistic Shopify webhook payloads without real API calls
- **Multiple Test Scenarios**: Basic load, rate limiting, security validation, mixed topics
- **Performance Metrics**: Response times, throughput, error rates, status code distribution
- **Security Testing**: Tests HMAC validation, rate limiting, and error handling
- **Configurable**: Adjustable concurrency, request counts, and test duration

## Quick Start

### Test Local Development Server
```bash
# Start your local server first
cd serverless && pnpm dev

# Run load test against localhost
pnpm load-test:local
```

### Test Production
```bash
# Test production endpoints
pnpm load-test
```

### Specific Test Scenarios
```bash
# Test rate limiting
pnpm load-test:rate-limit

# Test security validation
pnpm load-test:security

# Custom configuration
CONCURRENCY=20 TOTAL_REQUESTS=500 node ../../load-test.js
```

## Test Scenarios

### 1. Basic Load Test
- Sends realistic webhook payloads
- Tests normal operation under load
- Measures response times and success rates

### 2. Rate Limiting Test
- High-frequency requests to trigger rate limits
- Verifies 429 responses and proper headers
- Tests rate limit recovery

### 3. Invalid Signature Test
- Sends webhooks with invalid HMAC signatures
- Verifies 401 responses and security logging
- Tests attack resistance

### 4. Mixed Topic Test
- Tests different Shopify webhook topics
- Verifies topic-specific processing
- Ensures broad compatibility

## Configuration

### Environment Variables
```bash
USE_LOCAL=true              # Test localhost instead of production
CONCURRENCY=20               # Number of concurrent requests
TOTAL_REQUESTS=500           # Total requests to send
RAMP_UP_TIME=10              # Seconds to ramp up load
TEST_DURATION=60             # Test duration in seconds
```

### Command Line Options
```bash
--local                     # Test against localhost
--concurrency 20            # Set concurrency level
--requests 500              # Set total requests
--scenario rate-limit       # Run specific scenario
--help                      # Show help
```

## Generated Fake Data

The load tester generates realistic fake data for:

### Shopify Orders
- Random order IDs, customer emails, product titles
- Realistic pricing and quantities
- Complete order structure with shipping info

### Shopify Customers
- Random customer profiles with order history
- Realistic contact information and addresses
- Proper customer data structure

### Webhook Signatures
- Proper HMAC-SHA256 signatures using fake secrets
- Invalid signatures for security testing
- Timestamp-based signature validation

## Security Testing

### HMAC Validation
- Tests valid signatures are accepted
- Tests invalid signatures are rejected (401)
- Verifies signature timing attacks are blocked

### Rate Limiting
- Tests IP-based rate limiting
- Tests shop domain rate limiting
- Verifies proper 429 responses with headers

### Error Handling
- Tests malformed payloads
- Tests missing required headers
- Verifies no sensitive data leakage

## Test Data Management

### Test Data Labeling

All load test data is clearly labeled for easy identification and cleanup:

**Database Markers:**
- `_loadTestMarker: "LOAD_TEST_DATA_v1"` - Primary test data identifier
- `_testTimestamp: <unix_timestamp>` - When test data was created
- `_isTestData: true` - Boolean flag for test records
- `_isTestAddress: true` - Test shipping/billing addresses

**Email Domains:**
- `@loadtest-example.com`
- `@loadtest-test.com`
- `@loadtest-demo.com`
- `@loadtest-sample.com`

**Shopify Domains:**
- `loadtest-shop-1.myshopify.com`
- `loadtest-shop-2.myshopify.com`
- `loadtest-shop-3.myshopify.com`

**Agency IDs:**
- `agency_loadtest_001`
- `agency_loadtest_002`
- `agency_loadtest_003`

### Cleanup Procedures

**Automatic Cleanup Script:**
```bash
# Dry run (safe - shows what would be cleaned)
node cleanup-load-test-data.js --dry-run

# Actual cleanup (requires confirmation)
CONFIRM_CLEANUP=true node cleanup-load-test-data.js
```

**Manual Cleanup Queries:**
```sql
-- Remove test orders
DELETE FROM orders WHERE _loadTestMarker = 'LOAD_TEST_DATA_v1';

-- Remove test customers
DELETE FROM customers WHERE email LIKE '%@loadtest-%';

-- Remove test leads
DELETE FROM leads WHERE customer_email LIKE '%@loadtest-%';

-- Remove test webhook logs
DELETE FROM webhook_logs WHERE shop_domain LIKE 'loadtest-%';
```

**Cloudflare KV Cleanup:**
```bash
# List rate limit keys
wrangler kv:key list --namespace-id YOUR_RATE_LIMIT_KV_ID

# Delete test keys
wrangler kv:key delete "webhook:ip:192.168.1.x" --namespace-id YOUR_RATE_LIMIT_KV_ID
wrangler kv:key delete "webhook:shop:loadtest-shop-x.myshopify.com" --namespace-id YOUR_RATE_LIMIT_KV_ID
```

### Safety Features

- **DRY_RUN mode** by default (no changes made)
- **Explicit confirmation** required for live cleanup
- **Test data markers** ensure only test data is removed
- **No production data** matching cleanup patterns
- **Manual review** recommended before production cleanup

### Post-Cleanup Verification

After cleanup, verify:
```bash
# Check for remaining test data
SELECT COUNT(*) FROM orders WHERE _loadTestMarker IS NOT NULL;
SELECT COUNT(*) FROM customers WHERE email LIKE '%@loadtest-%';
```

**⚠️ Always run cleanup in DRY_RUN mode first to verify what will be removed.**

## Performance Metrics

### Reported Metrics
- **Total Requests**: Total number sent
- **Success Rate**: Percentage of successful requests
- **Response Time**: Average response time in milliseconds
- **Requests/Second**: Throughput measurement
- **Error Breakdown**: Failed, rate limited, invalid signatures
- **Status Codes**: Distribution of HTTP status codes

### Monitoring
- Real-time progress updates
- Error collection and reporting
- Performance degradation alerts

## Usage Examples

### Basic Load Test
```bash
# 100 requests, 10 concurrent
node load-test.js --local --concurrency 10 --requests 100
```

### Stress Test
```bash
# High load test
CONCURRENCY=50 TOTAL_REQUESTS=1000 node load-test.js --local
```

### Security Audit
```bash
# Test security features
node load-test.js --scenario invalid-sig --requests 200
```

### Rate Limit Testing
```bash
# Test rate limiting specifically
node load-test.js --scenario rate-limit --local
```

## Best Practices

### Testing Strategy
1. **Start Small**: Begin with low concurrency and request counts
2. **Gradual Ramp-up**: Increase load gradually to find breaking points
3. **Mixed Scenarios**: Run all test types to ensure comprehensive coverage
4. **Monitor Resources**: Watch Cloudflare dashboard for worker usage

### Environment Considerations
- **Local Testing**: Use `--local` flag for development
- **Production Testing**: Start with small loads, monitor closely
- **Rate Limits**: Respect Cloudflare Workers limits (1000 req/minute free tier)

### Security Notes
- Only tests with fake data - no real API calls
- Tests security controls without compromising real data
- Safe for production environments with proper monitoring

## Troubleshooting

### Common Issues

**Connection Refused**
- Ensure local server is running (`pnpm dev`)
- Check port configuration (default 8090)

**Rate Limiting Errors**
- Normal behavior - indicates security working
- Check rate limit configuration in environment

**High Error Rates**
- Check server logs for issues
- Verify environment variables are set
- Ensure database is accessible

### Debug Mode
```bash
# Verbose output
DEBUG=true node load-test.js --local

# Single scenario debugging
node load-test.js --scenario basic --requests 5 --local
```

## Integration with CI/CD

Add to your deployment pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Test
on: [push, pull_request]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run load-test:local
```

## Contributing

When adding new test scenarios:

1. Add scenario to `LoadTester.getTestScenarios()`
2. Implement runner function
3. Update documentation
4. Test with both local and production targets

## Support

For issues with the load testing:

1. Check server logs for error details
2. Verify environment configuration
3. Test with minimal load first
4. Review Cloudflare Workers metrics

---

**Note**: This load testing tool uses fake data only and does not interact with real Google Ads, Meta, or Stripe APIs. All webhook payloads are synthetically generated for testing purposes.