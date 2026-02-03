# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

### Hardcoded Secrets in Frontend Code
- **Issue:** Admin token hardcoded in production frontend code
- **Files:** `frontend/src/utils/adminApi.ts` (lines 3-74)
- **Impact:** Security vulnerability - token exposed in client bundle
- **Fix approach:** Move to environment-based configuration or remove hardcoded values, use proper authentication flow

### Mock/Placeholder Credentials in Setup Scripts
- **Issue:** Default mock credentials in customer setup script that could accidentally be used in production
- **Files:** `setup-customer.js` (lines 184-186, 199)
  - `clientId: 'mock_client_id'`
  - `clientSecret: 'mock_client_secret'`
  - `developerToken: 'mock_developer_token'`
  - `apiSecret: 'mock_api_secret'`
- **Impact:** If accidentally deployed, would fail silently or cause confusion with Google Ads API
- **Fix approach:** Make these required fields with no defaults, fail fast if not provided

### Placeholder Admin Token in Diagnostic Tools
- **Issue:** Hardcoded admin token placeholder in diagnostic script
- **Files:** `mycannaby-diagnostic.js` (line 206)
- **Impact:** Non-functional diagnostic tool without proper token
- **Fix approach:** Accept token via environment variable or CLI argument

### Disabled Queue Processing
- **Issue:** Queue consumer explicitly disabled due to free tier limitation
- **Files:** `serverless/src/workers/queue-consumer.ts` (lines 1-10)
- **Impact:** All processing is synchronous, no retry capability for failed operations
- **Fix approach:** Implement polling-based retry mechanism or upgrade to paid Cloudflare plan

### Mock Facebook CAPI Service
- **Issue:** Meta/Facebook Conversions API currently mocks CAPI calls for Phase 1
- **Files:** `serverless/src/workers/multi-platform-tracking/src/services/facebook.ts` (line 5)
- **Impact:** No actual conversion tracking to Meta in production
- **Fix approach:** Replace mock with real CAPI implementation

### TODO Comment in Diagnostic Script
- **Issue:** Token validation not implemented in diagnostic tool
- **Files:** `mycannaby-diagnostic.js` (line 466)
- **Impact:** Diagnostic tool may produce false positives
- **Fix approach:** Implement proper JWT validation against database

## Security Concerns

### Fallback Development Secret in Admin Routes
- **Risk:** Admin routes fall back to hardcoded dev secret when ADMIN_SECRET not configured
- **Files:** `serverless/src/routes/admin.ts` (lines 30-32)
  - ```typescript
    const isDevelopment = c.env.ENVIRONMENT === 'development' || !adminSecret;
    const fallbackSecret = isDevelopment ? 'dev-admin-secret-12345' : null;
    ```
- **Current mitigation:** Checks environment, but still hardcoded
- **Recommendations:** 
  - Remove fallback entirely for production
  - Fail with 503 if ADMIN_SECRET not configured
  - Add explicit DEVELOPMENT_MODE flag instead of relying on absence of secret

### Console Logging in Production
- **Risk:** 740+ console.log/error/warn statements across 94 files in production code
- **Files:** Throughout serverless/src, frontend/src, and root-level scripts
- **Current mitigation:** None - all log statements active
- **Recommendations:**
  - Replace console.* with structured logging service
  - Add log level controls via environment
  - Filter sensitive data from logs (already partial filtering in logging.ts)

### Encryption Key Missing Handling
- **Risk:** Encryption service warns but continues when ENCRYPTION_MASTER_KEY not found
- **Files:** `serverless/src/services/encryption.ts` (line 305)
- **Current mitigation:** Warning logged, encryption disabled
- **Recommendations:** Fail-fast on startup if encryption required

### Backup Without Encryption Key
- **Risk:** Backup endpoint fails gracefully (503) when BACKUP_ENCRYPTION_KEY missing
- **Files:** `serverless/src/routes/admin.ts` (lines 59-70)
- **Current mitigation:** Returns 503 with clear error
- **Recommendations:** Consider this acceptable fail-close behavior

## Performance Bottlenecks

### Large Service Files
- **Problem:** Multiple services exceed 500 lines, indicating potential complexity issues
- **Files:**
  - `serverless/src/services/outreach-orchestration.ts` (940 lines)
  - `serverless/src/services/customer-crm.ts` (1034 lines)
  - `serverless/src/services/adsengineer-onboarding.ts` (1090 lines)
  - `serverless/src/services/linkedin-sales-navigator.ts` (740 lines)
- **Cause:** Monolithic service design, multiple responsibilities per file
- **Improvement path:** 
  - Split into smaller focused modules
  - Extract domain-specific logic (email, outreach, crm)
  - Consider repository pattern for data access

### Synchronous Processing for All Webhooks
- **Problem:** No queue system means all webhook processing is synchronous
- **Files:** All webhook routes in `serverless/src/routes/` (shopify.ts, ghl.ts, tiktok.ts)
- **Cause:** Cloudflare Queues require paid plan, disabled in queue-consumer.ts
- **Improvement path:**
  - Implement D1-based job queue with polling worker
  - Add retry logic with exponential backoff
  - Consider upgrading to paid Cloudflare plan

### Large Test Files
- **Problem:** Test files with excessive mocking complexity
- **Files:**
  - `serverless/tests/integration/custom-events-workflow.test.ts` (extensive vi.mock usage)
  - Multiple test files with 20+ mock declarations
- **Cause:** Testing implementation details rather than behavior
- **Improvement path:** 
  - Use integration tests with real services where possible
  - Extract common mock setup to shared utilities
  - Test at API boundary rather than internal functions

## Fragile Areas

### Complex Zod Schema Validation
- **Files:** `serverless/src/services/adsengineer-onboarding.ts` (lines 1-250+)
- **Why fragile:** Extremely complex nested schemas with 30+ fields
- **Safe modification:** 
  - Add new fields as optional first
  - Test with existing data before making required
  - Version schemas for migration support
- **Test coverage:** Schema validation tested but edge cases may be missed

### External API Integration Points
- **Files:** 
  - `serverless/src/services/google-ads.ts` - Google Ads API v17
  - `serverless/src/services/meta-conversions.ts` - Meta CAPI
  - `serverless/src/services/tiktok-conversions.ts` - TikTok Events API
- **Why fragile:** 
  - External API version dependencies
  - OAuth token expiration handling
  - Rate limiting not fully implemented
- **Safe modification:**
  - Always wrap external calls in try/catch
  - Implement circuit breaker pattern
  - Add comprehensive API response validation

### HMAC Signature Validation
- **Files:** `serverless/src/services/crypto.ts`, webhook routes
- **Why fragile:** Timing-sensitive cryptographic operations
- **Safe modification:**
  - Use timingSafeEqual for all comparisons
  - Never short-circuit validation logic
  - Add tests for timing attack prevention

## Dependencies at Risk

### Stripe SDK in Billing Service
- **Risk:** Direct Stripe SDK usage without version pinning in package.json
- **Files:** `serverless/src/services/billing.ts` (line 4)
- **Impact:** API changes in Stripe SDK could break billing flow
- **Migration plan:** Pin Stripe SDK version, use webhook verification wrapper

### Zod Validation Library
- **Risk:** Heavy reliance on Zod for all input validation
- **Impact:** Breaking changes in Zod major versions would affect all routes
- **Migration plan:** Wrap Zod validators in adapter functions, centralize validation logic

## Missing Critical Features

### Production-Ready Queue System
- **Problem:** No working queue system for background jobs
- **Blocks:** Reliable webhook processing, retry mechanisms, batch operations
- **Priority:** HIGH

### Complete Meta CAPI Implementation
- **Problem:** Currently mocked, not sending real conversions to Meta
- **Blocks:** Meta/Facebook ad attribution
- **Priority:** HIGH

### Database Migration System
- **Problem:** Manual migration application via wrangler CLI
- **Blocks:** Automated deployments, rollback capability
- **Priority:** MEDIUM

### Comprehensive Error Monitoring
- **Problem:** Console-based logging only, no external error tracking service
- **Blocks:** Production incident response, error trending
- **Priority:** MEDIUM

## Test Coverage Gaps

### Complex Service Logic
- **What's not tested:** 
  - `outreach-orchestration.ts` - Email sequence logic not unit tested
  - `linkedin-sales-navigator.ts` - LinkedIn API integration mocked only
  - `customer-crm.ts` - Lifecycle state machine transitions partially tested
- **Files:** See service files in `serverless/src/services/`
- **Risk:** Complex business logic changes could break without detection
- **Priority:** MEDIUM

### OAuth Token Refresh
- **What's not tested:** Token refresh flows for Google Ads, Meta, TikTok
- **Files:** `serverless/src/routes/oauth.ts`
- **Risk:** Token expiration could break integrations silently
- **Priority:** HIGH

### Encryption Service Edge Cases
- **What's not tested:** 
  - Key rotation scenarios
  - Invalid ciphertext handling
  - Concurrent encryption operations
- **Files:** `serverless/src/services/encryption.ts`
- **Risk:** Data corruption or loss if encryption fails
- **Priority:** HIGH

### Rate Limiting Under Load
- **What's not tested:** Rate limiting behavior under concurrent requests
- **Files:** `serverless/src/middleware/rate-limit.ts`
- **Risk:** Rate limits may not work correctly under production load
- **Priority:** MEDIUM

## Code Quality Issues

### Excessive "any" Type Usage
- **Problem:** 130+ occurrences of `any` type casting across 54 files
- **Files:** Throughout frontend and serverless tests
- **Impact:** Loss of TypeScript type safety, potential runtime errors
- **Examples:**
  - `frontend/src/tests/*.tsx` - Mock typing as `any`
  - `serverless/tests/unit/*.test.ts` - Test context as `any`

### Route Duplication
- **Problem:** Duplicate backup decrypt endpoint in admin routes
- **Files:** `serverless/src/routes/admin.ts` (lines 111-139 and 145-163)
- **Impact:** Confusion about which endpoint is active, maintenance burden

### Inconsistent Error Handling
- **Problem:** Mix of try/catch with console.error and throwing typed errors
- **Files:** All route files in `serverless/src/routes/`
- **Impact:** Inconsistent API error responses
- **Recommendation:** Standardize on typed errors with consistent response format

---

*Concerns audit: 2026-02-03*
