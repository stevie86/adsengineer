---
work_package_id: WP02
subtasks:
  - T007: Set up encryption key management system
  - T008: Implement credential encryption for Google Ads API keys
  - T009: Implement credential encryption for Meta API credentials
  - T010: Implement credential encryption for Stripe API keys
  - T011: Update credential access patterns with decryption
  - T012: Implement credential rotation workflow
  - T013: Add credential validation without exposing values
  - T014: Add API key management UI for customers
  - T015: Implement Google Ads API key validation
  - T016: Add GA4 API key support (optional)
lane: doing
assignee: "claude"
agent: "claude"
shell_pid: "12345"
started_at: "2026-01-03T11:00:00Z"
history:
  - created: "2026-01-02"
    by: "spec-kitty"
    action: "generated"
  - moved_to_doing: "2026-01-03T11:00:00Z"
    by: "claude"
    action: "started_implementation"
---

# Work Package WP02: API Credential Protection

## Objective
Encrypt and secure all API credentials (Google Ads, Meta, Stripe) to prevent credential leaks and unauthorized access while maintaining functionality.

## Context
AdsEngineer stores OAuth tokens, API keys, and secrets for multiple platforms. Without encryption, a database breach would expose customer ad accounts, payment processing, and sensitive business data. This work package ensures credentials are protected at rest and in transit.

## Detailed Implementation Guidance

### T007: Set up encryption key management system
**Goal:** Establish secure key generation and management for credential encryption

**Steps:**
1. Generate AES-256 encryption key using Cloudflare Workers crypto
2. Store master key securely (Cloudflare Workers secrets or external KMS)
3. Create encryption/decryption utility functions
4. Implement key rotation mechanism
5. Add key validation and error handling

**Implementation Location:** `serverless/src/services/encryption.ts` (create new file)

**Success Criteria:**
- Encryption/decryption functions work correctly
- Keys are securely managed and rotatable
- No keys exposed in code or logs

### T008: Implement credential encryption for Google Ads API keys
**Goal:** Encrypt Google Ads credentials before database storage

**Steps:**
1. Identify all Google Ads credential fields in database schema
2. Modify credential storage operations to encrypt before saving
3. Update credential retrieval to decrypt on access
4. Ensure OAuth refresh tokens are encrypted
5. Test with real Google Ads credentials

**Implementation Location:** `serverless/src/database/credentials.ts` - update Google Ads functions

**Success Criteria:**
- Google Ads credentials encrypted in database
- API calls work with encrypted credentials
- No credential exposure in logs

### T009: Implement credential encryption for Meta API credentials
**Goal:** Encrypt Meta/Facebook API credentials

**Steps:**
1. Identify Meta credential storage locations
2. Implement encryption for access tokens and app secrets
3. Update API call patterns to decrypt credentials
4. Ensure pixel IDs and account IDs remain accessible (not encrypted)
5. Test Meta API integration with encrypted credentials

**Implementation Location:** `serverless/src/database/credentials.ts` - update Meta functions

**Success Criteria:**
- Meta credentials encrypted in database
- Meta API calls function normally
- No exposure in error logs

### T010: Implement credential encryption for Stripe API keys
**Goal:** Encrypt Stripe API keys and secrets

**Steps:**
1. Locate Stripe credential storage
2. Implement encryption for publishable and secret keys
3. Update payment processing to decrypt keys
4. Ensure webhook secrets are encrypted
5. Test billing operations with encrypted keys

**Implementation Location:** `serverless/src/database/credentials.ts` - update Stripe functions

**Success Criteria:**
- Stripe credentials encrypted in database
- Payment processing works normally
- No key exposure in payment errors

### T011: Update credential access patterns with decryption
**Goal:** Modify all credential access points to handle encryption

**Steps:**
1. Audit all locations where credentials are accessed
2. Update each access point to decrypt credentials
3. Ensure decryption happens only when needed
4. Add error handling for decryption failures
5. Profile performance impact of decryption

**Implementation Location:** Update all credential access points across the codebase

**Success Criteria:**
- All credential access works with encryption
- No performance degradation >10%
- Decryption errors handled gracefully

### T012: Implement credential rotation workflow
**Goal:** Enable secure credential updates and rotation

**Steps:**
1. Create credential update endpoints with validation
2. Implement graceful rotation (old credentials work during transition)
3. Add credential expiration monitoring
4. Implement automated rotation triggers
5. Update documentation for credential management

**Implementation Location:** `serverless/src/routes/admin.ts` - add credential management endpoints

**Success Criteria:**
- Credentials can be rotated without service interruption
- Old credentials remain valid during transition period
- Rotation events are logged securely

### T013: Add credential validation without exposing values
**Goal:** Validate credentials exist and are accessible without revealing them

**Steps:**
1. Create credential validation endpoints
2. Test API connectivity without exposing keys
3. Return validation status (valid/invalid/expired)
4. Implement periodic credential health checks
5. Add validation to admin dashboard

**Implementation Location:** `serverless/src/routes/admin.ts` - add validation endpoints

**Success Criteria:**
- Credentials can be validated without exposure
- Validation results inform admin dashboard
- Failed validations trigger alerts

## Test Strategy

### Unit Tests
- Encryption/decryption functions with various inputs
- Credential validation without exposure
- Key rotation workflow

### Integration Tests
- Full API flows with encrypted credentials
- Credential rotation during active operations
- Validation endpoints functionality

### Security Tests
- Attempt to access encrypted credentials
- Test credential validation security
- Verify no credential leakage in logs

## Definition of Done
- [ ] All credential types encrypted at rest
- [ ] API integrations work with encrypted credentials
- [ ] Credential rotation possible without downtime
- [ ] Credentials can be validated without exposure
- [ ] No credentials appear in logs or error messages
- [ ] Encryption performance acceptable (<100ms impact)
- [ ] Code reviewed for encryption best practices

## Risks and Mitigations
- **Performance Impact:** Encryption/decryption could slow API calls
  - *Mitigation:* Use efficient algorithms, cache decrypted credentials briefly
- **Key Management:** Master key compromise would expose all credentials
  - *Mitigation:* Use Cloudflare's secure key management, implement key rotation
- **Migration Complexity:** Existing credentials need encryption
  - *Mitigation:* Implement gradual migration with fallback to unencrypted during transition

## Reviewer Guidance
- Verify encryption uses industry-standard algorithms (AES-256)
- Check that decryption only happens when absolutely necessary
- Confirm no credentials are logged anywhere
- Test credential rotation without breaking active integrations
- Ensure validation endpoints don't leak credential information
- Review for side-channel attacks (timing, error messages)