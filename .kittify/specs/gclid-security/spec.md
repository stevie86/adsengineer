# GCLID Security Sprint

**Goal:** Ensure GCLIDs are handled securely throughout the system  
**Duration:** 1 week (5 days)  
**Start Date:** Any  
**End Date:** 5 days from start

---

## Why This Matters

**GCLIDs are personally identifiable:**
- Google uses GCLID to track individual users across sites
- GCLIDs can be used to de-anonymize user data
- Under GDPR, GCLIDs may be considered personal data
- Storing plaintext GCLIDs = potential data breach

**Current State:**
- GCLIDs stored plaintext in `leads` table
- No format validation (accepts any string)
- No encryption at rest
- No redaction in logs

---

## Requirements

### GCLID-001: Format Validation (P0)

**Story:** Invalid GCLIDs accepted and stored

**Current Code:**
```typescript
// No validation!
const gclid = payload.gclid || extractGclidFromUtm(payload);
```

**Fix:**
```typescript
// Valid GCLID: GCLID_ followed by 22-40 alphanumeric chars and underscores
const GCLID_REGEX = /^GCLID_[A-Za-z0-9_-]{22,40}$/;

function isValidGCLID(gclid: string | null | undefined): boolean {
  if (!gclid) return false;
  return GCLID_REGEX.test(gclid);
}

// Usage
if (!isValidGCLID(lead.gclid)) {
  return c.json({ error: 'Invalid GCLID format' }, 400);
}
```

**Acceptance Criteria:**
- [ ] GCLID regex validation implemented
- [ ] Invalid GCLIDs rejected with 400
- [ ] Null/undefined GCLIDs handled gracefully
- [ ] Unit tests for all edge cases

---

### GCLID-002: Encryption at Rest (P1)

**Story:** GCLIDs stored plaintext in database

**Current Schema:**
```sql
CREATE TABLE leads (
  gclid TEXT,  -- PLAINTEXT!
  ...
);
```

**Option A: Encrypt GCLIDs**
```typescript
async function encryptGCLID(gclid: string, agencyId: string): Promise<string> {
  const key = `agency-${agencyId}-gclid`;
  return await encryptCredential(gclid, key);
}
```

**Option B: Hash GCLIDs** (for lookup, not reversal)
```typescript
async function hashGCLID(gclid: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(gclid));
  return Buffer.from(hash).toString('hex');
}
```

**Recommendation:** Hash GCLIDs for storage. You only need to verify GCLID equality, not retrieve the original value.

**Migration:**
```sql
-- Add hashed_gclid column
ALTER TABLE leads ADD COLUMN gclid_hash TEXT;

-- Hash existing GCLIDs
UPDATE leads SET gclid_hash = SHA256(gclid) WHERE gclid IS NOT NULL;

-- Drop plaintext gclid (or keep temporarily for rollback)
-- ALTER TABLE leads DROP COLUMN gclid;
```

**Acceptance Criteria:**
- [ ] New leads store hashed GCLID
- [ ] Existing GCLIDs hashed via migration
- [ ] GCLID lookups use hash
- [ ] Rollback plan documented

---

### GCLID-003: Log Redaction (P1)

**Story:** GCLIDs visible in plaintext logs

**Current:**
```
[INFO] Lead captured: { gclid: "EAIaIQv3i3m8e7vOZ-1572532743", ... }
```

**Fix:**
```typescript
// In logging service
function redactGCLID(logEntry: Record<string, any>): Record<string, any> {
  const redacted = { ...logEntry };
  if (redacted.gclid) {
    redacted.gclid = redacted.gclid.substring(0, 8) + '...REDACTED';
  }
  if (redacted.fbclid) {
    redacted.fbclid = redacted.fbclid.substring(0, 8) + '...REDACTED';
  }
  return redacted;
}
```

**Acceptance Criteria:**
- [ ] GCLIDs redacted in all logs
- [ ] GCLIDs redacted in audit logs
- [ ] Debug mode can optionally show GCLIDs (guarded by feature flag)

---

### GCLID-004: Retention Policy (P2)

**Story:** GCLIDs retained indefinitely

**Current:** No retention policy for GCLIDs

**Google Ads Policy:** GCLIDs valid for 90 days

**Fix:**
```sql
-- Mark old leads for GCLID cleanup
UPDATE leads 
SET gclid = NULL, gclid_hash = NULL 
WHERE created_at < datetime('now', '-90 days');

-- Create job to clean old GCLIDs weekly
CREATE TRIGGER clean_old_gclids AFTER INSERT ON leads
BEGIN
  UPDATE leads 
  SET gclid = NULL, gclid_hash = NULL 
  WHERE created_at < datetime('now', '-90 days');
END;
```

**Acceptance Criteria:**
- [ ] GCLIDs automatically cleared after 90 days
- [ ] Documentation of retention policy
- [ ] Compliance check passes

---

## Tasks

### Day 1: Validation (2 hours)
| Task | Hours | Owner |
|------|-------|-------|
| Implement GCLID regex validation | 1 | Backend |
| Add to leads.ts validation | 0.5 | Backend |
| Write unit tests | 0.5 | QA |

### Day 2: Encryption/Hashing (4 hours)
| Task | Hours | Owner |
|------|-------|-------|
| Implement GCLID hashing function | 1 | Backend |
| Update insertLead to hash GCLID | 1 | Backend |
| Create D1 migration | 1 | Backend |
| Test migration rollback | 1 | QA |

### Day 3: Log Redaction (2 hours)
| Task | Hours | Owner |
|------|-------|-------|
| Update logging service | 1 | Backend |
| Test log redaction | 1 | QA |

### Day 4: Retention Policy (1 hour)
| Task | Hours | Owner |
|------|-------|-------|
| Create cleanup trigger | 0.5 | Backend |
| Document policy | 0.5 | Docs |

### Day 5: Testing & Polish (4 hours)
| Task | Hours | Owner |
|------|-------|-------|
| Integration tests | 2 | QA |
| Security review | 1 | Security |
| Deploy to staging | 1 | DevOps |

---

## Test Cases

```typescript
describe('GCLID Validation', () => {
  it('accepts valid GCLID format', () => {
    expect(isValidGCLID('EAIaIQv3i3m8e7vOZ-1572532743')).toBe(true);
  });

  it('rejects GCLID without prefix', () => {
    expect(isValidGCLID('aIQv3i3m8e7vOZ-1572532743')).toBe(false);
  });

  it('rejects too short GCLID', () => {
    expect(isValidGCLID('GCLID_short')).toBe(false);
  });

  it('rejects too long GCLID', () => {
    expect(isValidGCLID('GCLID_' + 'a'.repeat(50))).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(isValidGCLID(null)).toBe(false);
    expect(isValidGCLID(undefined)).toBe(false);
  });
});

describe('GCLID Hashing', () => {
  it('hashes consistently', async () => {
    const hash1 = await hashGCLID('EAIaIQv3i3m8e7vOZ-1572532743');
    const hash2 = await hashGCLID('EAIaIQv3i3m8e7vOZ-1572532743');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different GCLIDs', async () => {
    const hash1 = await hashGCLID('GCLID_AAAAA');
    const hash2 = await hashGCLID('GCLID_BBBBB');
    expect(hash1).not.toBe(hash2);
  });

  it('is one-way (cannot reverse)', async () => {
    const gclid = 'EAIaIQv3i3m8e7vOZ-1572532743';
    const hash = await hashGCLID(gclid);
    // Cannot derive gclid from hash
    expect(hash).not.toContain(gclid);
  });
});

describe('Log Redaction', () => {
  it('redacts GCLID in log entry', () => {
    const entry = { gclid: 'EAIaIQv3i3m8e7vOZ-1572532743', email: 'test@example.com' };
    const redacted = redactGCLID(entry);
    expect(redacted.gclid).toBe('EAIaIQv3...REDACTED');
    expect(redacted.email).toBe('test@example.com'); // Not redacted
  });
});
```

---

## Files Modified

| File | Change |
|------|--------|
| `serverless/src/utils/gclid.ts` | New - validation and hashing |
| `serverless/src/routes/leads.ts` | Add GCLID validation |
| `serverless/src/routes/ghl.ts` | Add GCLID validation |
| `serverless/src/routes/shopify.ts` | Add GCLID validation |
| `serverless/src/services/logging.ts` | Add redaction |
| `serverless/migrations/gclid-security.sql` | New - schema changes |

---

## Definition of Done

- [ ] All GCLIDs validated on input
- [ ] All GCLIDs hashed at rest
- [ ] All GCLIDs redacted in logs
- [ ] 90-day retention policy implemented
- [ ] 90% test coverage on GCLID handling
- [ ] Security review passed
- [ ] Migration tested and documented

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration fails | High | Test on staging first, prepare rollback |
| Hashing breaks lookups | High | Use hash for both storage and lookup |
| Log redaction misses some logs | Medium | Audit all log statements |
| Performance impact of hashing | Low | SHA-256 is fast, one-time per lead |

---

## Timeline: 1 Week

| Day | Focus | Deliverables |
|-----|-------|--------------|
| 1 | Validation | GCLID regex implemented, tested |
| 2 | Hashing | Hash function, migration, integration |
| 3 | Logging | Redaction in all logs |
| 4 | Retention | Cleanup trigger, documentation |
| 5 | Polish | Integration tests, security review, deploy |

**Total Effort: ~13 hours (can be done in 2-3 days of focused work)**

---

**Created:** 2024-01-15  
**Version:** 1.0.0
