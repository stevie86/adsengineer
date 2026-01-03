---
work_package_id: WP01
subtasks:
  - T001: Add HMAC validation library to serverless dependencies
  - T002: Implement HMAC signature verification for Shopify webhooks
  - T003: Add webhook payload integrity validation
  - T004: Implement rate limiting for webhook endpoints
  - T005: Add comprehensive webhook error logging
  - T006: Update webhook response handling for security events
lane: doing
assignee: "Sisyphus"
agent: "claude"
shell_pid: "12345"
review_status: ""
history:
  - created: "2026-01-02"
    by: "spec-kitty"
    action: "generated"
  - timestamp: "2026-01-02T20:15:00Z"
    by: "Sisyphus"
    action: "Started implementation"
    lane: "doing"
---

# Work Package WP01: Webhook Security Implementation

## Objective
Implement comprehensive HMAC validation and integrity checks for all webhook endpoints to prevent data manipulation attacks and ensure only authenticated webhooks are processed.

## Context
Shopify webhooks are critical for AdsEngineer functionality, but without proper validation, malicious actors could send fake webhook data to manipulate lead data, conversion tracking, or trigger unauthorized actions. This work package establishes the security foundation for all webhook processing.

## Detailed Implementation Guidance

### T001: Add HMAC validation library to serverless dependencies
**Goal:** Install and configure a crypto library for HMAC operations

**Steps:**
1. Add `@noble/hashes` to `serverless/package.json` (Cloudflare Workers compatible)
2. Update `pnpm-lock.yaml` by running `pnpm install`
3. Verify the library works in Cloudflare Workers environment
4. Add type definitions if needed

**Success Criteria:**
- Library installed without conflicts
- Basic HMAC operation tested in development

### T002: Implement HMAC signature verification for Shopify webhooks
**Goal:** Validate incoming webhook signatures against expected values

**Steps:**
1. Extract `X-Shopify-Hmac-Sha256` header from webhook requests
2. Get the raw request body as UTF-8 string
3. Use webhook secret to generate expected HMAC-SHA256 signature
4. Compare generated signature with received signature (timing-safe comparison)
5. Reject request if signatures don't match

**Implementation Location:** `serverless/src/routes/shopify.ts` - modify the webhook POST handler

**Success Criteria:**
- Valid Shopify webhooks are accepted
- Invalid signatures are rejected with 401 status
- No false positives or negatives

### T003: Add webhook payload integrity validation
**Goal:** Ensure webhook payload structure matches expected format

**Steps:**
1. Validate required fields exist (id, email, created_at, etc.)
2. Check data types match expected schemas
3. Validate timestamp is within reasonable window (not too old)
4. Ensure email addresses are valid format
5. Check for malicious content in text fields

**Implementation Location:** Add validation function in `serverless/src/routes/shopify.ts`

**Success Criteria:**
- Malformed payloads are rejected with descriptive errors
- Valid payloads pass through without issues
- Error logging includes validation failure reasons

### T004: Implement rate limiting for webhook endpoints
**Goal:** Prevent abuse through excessive webhook calls

**Steps:**
1. Implement IP-based rate limiting (max 100 requests per hour per IP)
2. Add shop domain-based limiting (max 1000 requests per hour per shop)
3. Use Cloudflare Workers KV for rate limit storage
4. Return 429 status for rate-limited requests
5. Include rate limit headers in responses

**Implementation Location:** `serverless/src/middleware/rate-limit.ts` (create new file)

**Success Criteria:**
- Legitimate webhook traffic flows normally
- Abusive traffic is blocked with proper HTTP status
- Rate limits are configurable via environment variables

### T005: Add comprehensive webhook error logging
**Goal:** Log security events and errors for monitoring and debugging

**Steps:**
1. Log all webhook signature validation failures with request details
2. Log rate limit violations with IP and shop domain
3. Log payload validation errors with specific failure reasons
4. Include timestamps, request IDs, and non-sensitive payload data
5. Ensure no sensitive data (secrets, personal info) is logged

**Implementation Location:** `serverless/src/services/logging.ts` (extend existing logging)

**Success Criteria:**
- Security events are logged at appropriate levels (WARN for suspicious, ERROR for blocks)
- Logs are structured for easy monitoring
- No sensitive data exposure in logs

### T006: Update webhook response handling for security events
**Goal:** Provide appropriate responses for different security scenarios

**Steps:**
1. Return 401 for invalid HMAC signatures
2. Return 429 for rate limit violations
3. Return 400 for malformed payloads
4. Include security headers in all responses
5. Ensure error messages don't leak sensitive information

**Implementation Location:** Update response handling in `serverless/src/routes/shopify.ts`

**Success Criteria:**
- Appropriate HTTP status codes for each security scenario
- Error messages are generic (don't reveal validation logic)
- Security headers present (HSTS, CSP, etc.)

## Test Strategy

### Unit Tests
- HMAC validation with valid/invalid signatures
- Payload validation with various malformed inputs
- Rate limiting logic with mock KV storage

### Integration Tests
- End-to-end webhook processing with valid signatures
- Rejection of invalid webhooks
- Rate limit enforcement

### Security Tests
- Attempt to bypass HMAC validation
- Test with malformed payloads
- Verify rate limiting effectiveness

## Definition of Done
- [ ] All subtasks implemented and tested
- [ ] Valid webhooks processed successfully
- [ ] Invalid webhooks rejected with proper status codes
- [ ] Security events logged appropriately
- [ ] No sensitive data leaked in logs or responses
- [ ] Rate limiting prevents abuse
- [ ] Code reviewed for security best practices

## Risks and Mitigations
- **Performance Impact:** HMAC validation could slow webhook processing
  - *Mitigation:* Use efficient crypto library, cache secrets, profile performance
- **False Positives:** Valid webhooks might be rejected
  - *Mitigation:* Thorough testing with real Shopify webhooks, monitoring in production
- **Secret Management:** Webhook secrets need secure storage
  - *Mitigation:* Use Cloudflare Workers secrets, rotate regularly

## Reviewer Guidance
- Verify HMAC implementation matches Shopify's specification
- Check that no secrets are logged or exposed
- Confirm rate limiting is not too restrictive for legitimate traffic
- Ensure error responses don't reveal validation logic
- Test with real webhook payloads if possible