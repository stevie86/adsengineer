# Test Execution Scripts

## WordPress Plugin Tests

```bash
#!/bin/bash
# Run WordPress plugin unit tests
./vendor/bin/phpunit tests/unit/wordpress-plugin.json \
  --configuration tests/phpunit.xml \
  --coverage-text \
  --testsuite="AdVocate Plugin Suite"
```

## Cloudflare Worker Tests

```bash
#!/bin/bash
# Run Cloudflare Worker unit tests
npm test -- tests/unit/cloudflare-worker.json \
  --coverage \
  --testNamePattern="*.test.ts" \
  --verbose
```

## Integration Tests

```bash
#!/bin/bash
# Run full integration test suite
npm run test:integration \
  --config="tests/integration/config.json" \
  --timeout=300000 \
  --reporter="html"
```

## Load Testing

```bash
#!/bin/bash
# Performance test the API under load
npm run test:load \
  --concurrent=100 \
  --duration=60000 \
  --rampup=10000 \
  --endpoint="/api/v1/leads"
```

# Usage
./scripts/run-tests.sh unit
./scripts/run-tests.sh integration
./scripts/run-tests.sh load

# Continuous Testing
npm run test:watch  # File watcher for TDD
npm run test:coverage  # Generate coverage report