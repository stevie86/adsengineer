# Technical Concerns

**Generated:** 2026-01-27
**Project:** AdsEngineer - Enterprise Conversion Tracking SaaS

## Technical Debt

### High Priority

#### 1. Mixed Package Managers
- **Issue:** `pnpm` for main packages, `npm` for `shopify-plugin/`
- **Location:** `shopify-plugin/package-lock.json`
- **Risk:** Dependency confusion, inconsistent lock files
- **Recommendation:** Migrate shopify-plugin to pnpm

#### 2. Legacy Linting Setup (Frontend)
- **Issue:** Frontend uses ESLint + Prettier while backend uses BiomeJS
- **Location:** `frontend/.eslintrc.json`
- **Risk:** Inconsistent code style, duplicate tooling
- **Recommendation:** Consider migrating frontend to BiomeJS

#### 3. Worktree Sprawl
- **Issue:** Multiple worktrees in `.worktrees/` that may be stale
- **Location:** `.worktrees/002-self-service-dashboard-mvp/`, `.worktrees/feat-marketing-launch-pack/`
- **Risk:** Confusion, disk space, merge conflicts
- **Recommendation:** Audit and clean up unused worktrees

### Medium Priority

#### 4. Commented-Out Code
- **Issue:** Disabled routes and features in production code
- **Location:** `serverless/src/index.ts` (evaluation router, swagger)
- **Risk:** Dead code, unclear feature status
- **Recommendation:** Remove or feature-flag properly

#### 5. Migration Numbering Gap
- **Issue:** Migration jumps from 0007 to 0018
- **Location:** `serverless/migrations/`
- **Risk:** Confusion about migration history
- **Recommendation:** Document the gap or renumber

#### 6. Duplicate Migration Files
- **Issue:** `0004_technology_tracking.sql` and `0004_technology_tracking_fixed.sql`
- **Location:** `serverless/migrations/`
- **Risk:** Unclear which is canonical
- **Recommendation:** Clean up and document

### Low Priority

#### 7. Admin Dashboard WIP
- **Issue:** `admin-dashboard/` appears incomplete
- **Risk:** Orphaned code
- **Recommendation:** Complete or remove

#### 8. Inspiration Folder
- **Issue:** `inspiration/` contains reference code that may drift
- **Risk:** Outdated references
- **Recommendation:** Clearly mark as read-only, add date stamps

## Security Considerations

### Strengths
- ✅ HMAC signature verification for webhooks
- ✅ JWT authentication for dashboard
- ✅ Prepared statements (SQL injection prevention)
- ✅ Rate limiting via KV
- ✅ Credential encryption at rest
- ✅ Timing-safe comparison for signatures
- ✅ Secrets via Doppler (not in code)

### Areas to Monitor

#### 1. CORS Configuration
- **Location:** `serverless/src/index.ts`
- **Issue:** Hardcoded IP addresses in CORS origins
- **Risk:** May need updates for new environments
```typescript
origin: [
  'http://localhost:3000',
  'http://172.104.241.225:3000',  // Hardcoded IP
  'http://100.111.164.18:3000',   // Hardcoded IP
  'https://adsengineer.com',
]
```

#### 2. Dev Guard Bypass
- **Location:** `serverless/src/middleware/dev-guard.ts`
- **Risk:** Ensure production environment doesn't expose dev endpoints

#### 3. OAuth Token Storage
- **Issue:** Per-agency OAuth tokens in database
- **Risk:** Token refresh, expiration handling
- **Recommendation:** Audit token lifecycle management

## Performance Considerations

### Current Architecture
- Cloudflare Workers (global edge deployment)
- D1 SQLite (regional, may have latency)
- KV for rate limiting (fast, global)

### Potential Bottlenecks

#### 1. Synchronous Conversion Upload
- **Issue:** Google Ads upload in request path
- **Location:** Services calling Google Ads API
- **Risk:** Slow response times, timeout on high volume
- **Recommendation:** Consider async queue (requires paid Workers plan)

#### 2. D1 Regional Latency
- **Issue:** D1 is regional, not global
- **Risk:** Higher latency for distant users
- **Recommendation:** Monitor p95 latencies, consider caching

#### 3. Large Webhook Payloads
- **Issue:** Shopify/WooCommerce can send large payloads
- **Risk:** Worker memory limits, parsing time
- **Recommendation:** Validate payload size early

## Fragile Areas

### 1. Multi-Platform Event Normalization
- **Location:** `serverless/src/services/event-normalizer.ts`
- **Risk:** Different platforms send different formats
- **Concern:** Adding new platforms requires careful testing

### 2. Billing State Machine
- **Location:** `serverless/src/services/billing*.ts`
- **Risk:** Subscription state transitions are complex
- **Concern:** Edge cases in upgrade/downgrade/cancel flows

### 3. OAuth Token Refresh
- **Location:** `serverless/src/routes/oauth.ts`, Google Ads service
- **Risk:** Token expiration during conversion upload
- **Concern:** Retry logic, token refresh race conditions

### 4. Custom Event Definitions
- **Location:** `serverless/src/routes/custom-event-definitions.ts`
- **Risk:** Complex schema with site assignments
- **Concern:** Validation edge cases

## Known Issues

### 1. Evaluation Router Disabled
```typescript
// serverless/src/index.ts
// app.route('/api/v1/evaluate', evaluationRouter); // Temporarily disabled
```
- **Status:** Intentionally disabled during development
- **Action:** Track when ready to re-enable

### 2. Swagger UI Disabled
```typescript
// app.doc('/docs', swaggerUI({ url: '/openapi.json' })); // Temporarily disabled
```
- **Status:** OpenAPI generation may need updates
- **Action:** Re-enable when API stabilizes

## Monitoring Gaps

### Missing
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring (APM)
- [ ] Business metrics dashboard
- [ ] Alerting for conversion failures

### Existing
- ✅ Health endpoint (`/health`)
- ✅ Request logging (dev-guard middleware)
- ✅ Wrangler tail for logs

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| High | Clean up worktrees | Low | Medium |
| High | Audit OAuth token lifecycle | Medium | High |
| Medium | Migrate shopify-plugin to pnpm | Low | Low |
| Medium | Remove commented code | Low | Low |
| Medium | Add error tracking | Medium | High |
| Low | Standardize linting tools | Medium | Low |
| Low | Fix migration numbering | Low | Low |
