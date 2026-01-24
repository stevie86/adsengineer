# Codebase Concerns

**Analysis Date:** 2026-01-24

## Tech Debt

**Large Service Files:**
- Issue: Several service files exceed 700-1000 lines (adsengineer-onboarding.ts: 1090, customer-crm.ts: 1034, outreach-orchestration.ts: 940)
- Files: `serverless/src/services/adsengineer-onboarding.ts`, `serverless/src/services/customer-crm.ts`, `serverless/src/services/outreach-orchestration.ts`
- Impact: Difficult to maintain, test, and understand. High cognitive load for developers.
- Fix approach: Break down into smaller, focused modules. Extract common patterns into shared utilities.

**Type Safety Issues:**
- Issue: Multiple `as any` type assertions bypassing TypeScript safety
- Files: `serverless/src/services/customer-crm.ts:705`, `serverless/src/services/encryption.ts:55`, `serverless/src/services/email-sequence-generator.ts:558`, `serverless/src/services/meta-conversions.ts:98`
- Impact: Runtime errors possible, loss of type safety benefits
- Fix approach: Define proper interfaces for all dynamic data. Use discriminated unions for variant types.

**Environment Files in Git:**
- Issue: Environment configuration files committed to repository
- Files: `serverless/.env`, `serverless/.stripe.env`, `customers/mycannaby.env`
- Impact: Security risk, potential exposure of secrets
- Fix approach: Remove all .env files from git, use Doppler for all secrets management

## Known Bugs

**Stubbed Implementation:**
- Issue: Competitive analysis service returns empty arrays instead of implementing functionality
- Files: `serverless/src/services/competitive-analysis.ts:423` ("return []; // This would integrate with market research APIs")
- Symptoms: Market research features not working
- Trigger: Any call to identifyEmergingThreats() method
- Workaround: None available

**Migration Numbering Gap:**
- Issue: Migration files jump from 0007 to 0018, missing 8-17
- Files: `serverless/migrations/`
- Symptoms: Potential database schema inconsistency
- Trigger: Database migration process
- Workaround: Manual intervention required

## Security Considerations

**API Token in Code:**
- Risk: Cloudflare API token hardcoded in environment file
- Files: `serverless/.env:1` ("CLOUDFLARE_API_TOKEN=AwwZUO6gNH6LhY_4xAN6JCr6Co2513namQ-Hdr3q")
- Current mitigation: File should not be in git
- Recommendations: Use Doppler secrets management, rotate token immediately

**Insufficient Error Logging:**
- Risk: Security errors only logged to console, not proper monitoring
- Files: `serverless/src/middleware/auth.ts:69,81,87,93`, `serverless/src/middleware/rate-limit.ts:34,53,119`
- Current mitigation: Console logging in production
- Recommendations: Implement structured logging with security event aggregation

**Missing Input Validation:**
- Risk: Some API endpoints may lack comprehensive input validation
- Files: Various route files (inferred from console.log usage for debugging)
- Current mitigation: Zod validation used but may be incomplete
- Recommendations: Audit all endpoints for proper input validation

## Performance Bottlenecks

**Large Database Functions:**
- Problem: Database index.ts file has 480 lines with multiple complex queries
- Files: `serverless/src/database/index.ts`
- Cause: All database access patterns consolidated in one large file
- Improvement path: Split into domain-specific database modules (leads.ts, agencies.ts, etc.)

**Synchronous-like Operations:**
- Problem: Some services may have blocking operations in Cloudflare Workers environment
- Files: `serverless/src/services/outreach-orchestration.ts` (940 lines, likely complex operations)
- Cause: Complex orchestration logic may block event loop
- Improvement path: Break into smaller async operations, use Durable Objects for state management

## Fragile Areas

**Complex Service Dependencies:**
- Files: `serverless/src/services/customer-crm.ts`, `serverless/src/services/adsengineer-onboarding.ts`
- Why fragile: Heavy interdependencies between services, tight coupling
- Safe modification: Extract interfaces, implement dependency injection
- Test coverage: Large files difficult to test comprehensively

**Platform Integration Services:**
- Files: `serverless/src/services/meta-conversions.ts`, `serverless/src/services/google-ads.ts`, `serverless/src/services/tiktok-conversions.ts`
- Why fragile: External API dependencies, network failures, credential management
- Safe modification: Implement circuit breakers, retry logic with exponential backoff
- Test coverage: Limited integration test coverage for external APIs

**OpenAPI Generation:**
- Files: `serverless/src/openapi.ts` (896 lines, auto-generated)
- Why fragile: Auto-generated code may have drift issues
- Safe modification: Never edit manually, regenerate from route definitions
- Test coverage: Limited validation of generated schema accuracy

## Scaling Limits

**Single Worker Architecture:**
- Current capacity: Single Cloudflare Worker instance
- Limit: CPU time (10ms for free, 50ms for paid), memory (128MB)
- Scaling path: Implement Durable Objects for state management, consider multiple workers

**Database Query Performance:**
- Current capacity: D1 with basic indexing
- Limit: Query complexity, concurrent connections
- Scaling path: Implement query optimization, add more indexes, consider read replicas

## Dependencies at Risk

**Google Ads API Version:**
- Risk: Using specific version (v17) that may be deprecated
- Files: `serverless/src/services/google-ads.ts`
- Impact: Conversion upload failures
- Migration plan: Implement version detection, support multiple API versions

**Stripe API Usage:**
- Risk: Direct API integration without version pinning
- Files: `serverless/src/routes/billing.ts`, `serverless/src/services/billing*.ts`
- Impact: Billing failures
- Migration plan: Pin to specific API version, implement webhook versioning

## Missing Critical Features

**Comprehensive Error Handling:**
- Problem: Limited structured error handling across services
- Blocks: Production reliability, debugging capabilities
- Files: Most service files lack comprehensive try/catch with proper error types

**Monitoring and Alerting:**
- Problem: No centralized monitoring/health check system
- Blocks: Production observability, proactive issue detection
- Files: Limited to basic /health endpoint

**Data Validation Layer:**
- Problem: Inconsistent data validation across services
- Blocks: Data integrity, type safety
- Files: Zod used but inconsistently across endpoints

## Test Coverage Gaps

**Integration Test Coverage:**
- What's not tested: End-to-end flows involving external APIs (Google Ads, Meta, TikTok)
- Files: `serverless/tests/integration/` (limited external API mocking)
- Risk: Production failures with external integrations
- Priority: High

**Large Service Test Coverage:**
- What's not tested: Complex business logic in 700+ line service files
- Files: `serverless/src/services/customer-crm.ts`, `serverless/src/services/adsengineer-onboarding.ts`
- Risk: Regression bugs in core business logic
- Priority: High

**Error Path Testing:**
- What's not tested: Network failures, API rate limits, credential issues
- Files: Most service files lack comprehensive error scenario testing
- Risk: Poor error handling in production
- Priority: Medium

---

*Concerns audit: 2026-01-24*