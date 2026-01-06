# GCLID Security Tasks

**Duration:** 1 week  
**Total Tasks:** 10  
**Total Hours:** ~13

---

## Task 1: GCLID Validation Function

**Task ID:** GCLID-001  
**Status:** [ ]  
**Priority:** P0  
**Hours:** 1  
**Owner:** Backend

**File:** `serverless/src/utils/gclid.ts`

```typescript
// GCLID validation regex
// Format: GCLID_ followed by 22-40 alphanumeric chars, underscores, or hyphens
const GCLID_REGEX = /^GCLID_[A-Za-z0-9_-]{22,40}$/;

/**
 * Validate GCLID format
 */
export function isValidGCLID(gclid: string | null | undefined): boolean {
  if (!gclid || typeof gclid !== 'string') {
    return false;
  }
  return GCLID_REGEX.test(gclid);
}

/**
 * Sanitize GCLID - return null if invalid
 */
export function sanitizeGCLID(gclid: string | null | undefined): string | null {
  if (!gclid || typeof gclid !== 'string') {
    return null;
  }
  return isValidGCLID(gclid) ? gclid : null;
}

/**
 * Validate FBCLID format (similar to GCLID)
 */
const FBCLID_REGEX = /^_[A-Za-z0-9_-]{20,40}$/;

export function isValidFBCLID(fbclid: string | null | undefined): boolean {
  if (!fbclid || typeof fbclid !== 'string') {
    return false;
  }
  return FBCLID_REGEX.test(fbclid);
}

export function sanitizeFBCLID(fbclid: string | null | undefined): string | null {
  if (!fbclid || typeof fbclid !== 'string') {
    return null;
  }
  return isValidFBCLID(fbclid) ? fbclid : null;
}

/**
 * Validate MSCLKID format
 */
const MSCLKID_REGEX = /^MSCLKID\.[A-Za-z0-9_-]{20,40}$/;

export function isValidMSCLKID(msclkid: string | null | undefined): boolean {
  if (!msclkid || typeof msclkid !== 'string') {
    return false;
  }
  return MSCLKID_REGEX.test(msclkid);
}

export function sanitizeMSCLKID(msclkid: string | null | undefined): string | null {
  if (!msclkid || typeof msclkid !== 'string') {
    return null;
  }
  return isValidMSCLKID(msclkid) ? msclkid : null;
}
```

**Acceptance Criteria:**
- [ ] File created at correct path
- [ ] All validation functions exported
- [ ] Tests cover edge cases

---

## Task 2: GCLID Validation Tests

**Task ID:** GCLID-001-TEST  
**Status:** [ ]  
**Priority:** P0  
**Hours:** 0.5  
**Owner:** QA

**File:** `serverless/tests/unit/gclid.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { isValidGCLID, sanitizeGCLID, isValidFBCLID, isValidMSCLKID } from '../src/utils/gclid';

describe('GCLID Validation', () => {
  describe('isValidGCLID', () => {
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

    it('rejects null', () => {
      expect(isValidGCLID(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isValidGCLID(undefined)).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidGCLID('')).toBe(false);
    });

    it('rejects special characters', () => {
      expect(isValidGCLID('GCLID_test<script>alert(1)</script>')).toBe(false);
    });

    it('accepts underscores in GCLID', () => {
      expect(isValidGCLID('GCLID_abc_def_ghi_jkl_mno_pqr')).toBe(true);
    });

    it('accepts hyphens in GCLID', () => {
      expect(isValidGCLID('GCLID_abc-def-ghi-jkl-mno-pqr')).toBe(true);
    });
  });

  describe('sanitizeGCLID', () => {
    it('returns valid GCLID unchanged', () => {
      const gclid = 'EAIaIQv3i3m8e7vOZ-1572532743';
      expect(sanitizeGCLID(gclid)).toBe(gclid);
    });

    it('returns null for invalid GCLID', () => {
      expect(sanitizeGCLID('invalid')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(sanitizeGCLID(null)).toBeNull();
    });
  });
});

describe('FBCLID Validation', () => {
  it('accepts valid FBCLID', () => {
    expect(isValidFBCLID('_ABCDefGHijkLMNopQRstUVwxYZ')).toBe(true);
  });

  it('rejects FBCLID without underscore prefix', () => {
    expect(isValidFBCLID('ABCDefGHijkLMNopQRstUVwxYZ')).toBe(false);
  });
});

describe('MSCLKID Validation', () => {
  it('accepts valid MSCLKID', () => {
    expect(isValidMSCLKID('MSCLKID.ABCDefGHijkLMNopQRstUVwxYZ')).toBe(true);
  });

  it('rejects MSCLKID without prefix', () => {
    expect(isValidMSCLKID('ABCDefGHijkLMNopQRstUVwxYZ')).toBe(false);
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] 100% branch coverage on validation functions

---

## Task 3: Add Validation to Leads Route

**Task ID:** GCLID-001-LEADS  
**Status:** [ ]  
**Priority:** P0  
**Hours:** 0.5  
**Owner:** Backend

**File:** `serverless/src/routes/leads.ts`

**Change:** Add GCLID validation in POST / handler

```typescript
import { sanitizeGCLID, sanitizeFBCLID, sanitizeMSCLKID } from '../utils/gclid';

// In leadsRoutes.post:
const lead = leads[0];

// Validate and sanitize click IDs
const sanitizedGCLID = sanitizeGCLID(lead.gclid);
const sanitizedFBCLID = sanitizeFBCLID(lead.fbclid);
const sanitizedMSCLKID = sanitizeMSCLKID(lead.msclkid);

// If any click ID was provided but invalid, reject
if ((lead.gclid && !sanitizedGCLID) || 
    (lead.fbclid && !sanitizedFBCLID) ||
    (lead.msclkid && !sanitizedMSCLKID)) {
  return c.json({
    error: 'Invalid tracking ID format',
    details: {
      gclid: lead.gclid ? (!sanitizedGCLID ? 'invalid format' : 'ok') : 'not provided',
      fbclid: lead.fbclid ? (!sanitizedFBCLID ? 'invalid format' : 'ok') : 'not provided',
      msclkid: lead.msclkid ? (!sanitizedMSCLKID ? 'invalid format' : 'ok') : 'not provided',
    }
  }, 400);
}
```

**Acceptance Criteria:**
- [ ] Invalid GCLIDs rejected with 400
- [ ] Error message includes what's invalid
- [ ] Valid GCLIDs accepted

---

## Task 4: Add Validation to GHL Route

**Task ID:** GCLID-001-GHL  
**Status:** [ ]  
**Priority:** P0  
**Hours:** 0.5  
**Owner:** Backend

**File:** `serverless/src/routes/ghl.ts`

**Similar changes as leads.ts**

---

## Task 5: Add Validation to Shopify Route

**Task ID:** GCLID-001-SHOPIFY  
**Status:** [ ]  
**Priority:** P0  
**Hours:** 0.5  
**Owner:** Backend

**File:** `serverless/src/routes/shopify.ts`

**Similar changes as leads.ts**

---

## Task 6: GCLID Hashing

**Task ID:** GCLID-002  
**Status:** [ ]  
**Priority:** P1  
**Hours:** 2  
**Owner:** Backend

**File:** `serverless/src/utils/gclid.ts`

```typescript
/**
 * Hash GCLID using SHA-256
 * One-way function - cannot reverse engineer original GCLID
 */
export async function hashGCLID(gclid: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(gclid);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

/**
 * Hash GCLID synchronously (for non-critical paths)
 */
export function hashGCLIDSync(gclid: string): string {
  // For synchronous use, could use Node crypto in non-worker context
  // For Workers, use async version
  throw new Error('Use async hashGCLID in Workers context');
}
```

**Database Changes:**
```sql
-- Add gclid_hash column
ALTER TABLE leads ADD COLUMN gclid_hash TEXT;
ALTER TABLE leads ADD COLUMN fbclid_hash TEXT;

-- Create indexes on hash columns
CREATE INDEX idx_leads_gclid_hash ON leads(gclid_hash);
CREATE INDEX idx_leads_fbclid_hash ON leads(fbclid_hash);
```

**Acceptance Criteria:**
- [ ] Hashing function implemented
- [ ] Migration script created
- [ ] Indexes created

---

## Task 7: Update Leads Insert to Hash GCLID

**Task ID:** GCLID-002-INSERT  
**Status:** [ ]  
**Priority:** P1  
**Hours:** 1  
**Owner:** Backend

**File:** `serverless/src/database/index.ts`

```typescript
async function insertLead(data: Record<string, any>): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  
  // Hash GCLIDs before storage
  let gclidHash = null;
  let fbclidHash = null;
  
  if (data.gclid) {
    gclidHash = await hashGCLID(data.gclid);
  }
  if (data.fbclid) {
    fbclidHash = await hashGCLID(data.fbclid);
  }
  
  await d1.prepare(`
    INSERT INTO leads (
      id, org_id, site_id, gclid, fbclid, gclid_hash, fbclid_hash,
      ...other fields
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ...)
  `).bind(
    id, data.org_id, data.site_id, 
    data.gclid || null, data.fbclid || null,
    gclidHash, fbclidHash,
    ...other values
  ).run();
  
  return { id };
}
```

**Acceptance Criteria:**
- [ ] New leads have hashed GCLIDs
- [ ] Original GCLID still stored (for now)
- [ ] Hash indexed for lookups

---

## Task 8: Log Redaction

**Task ID:** GCLID-003  
**Status:** [ ]  
**Priority:** P1  
**Hours:** 2  
**Owner:** Backend

**File:** `serverless/src/services/logging.ts`

```typescript
/**
 * Redact GCLID from log entries
 */
export function redactGCLIDs(logEntry: Record<string, any>): Record<string, any> {
  const redacted = { ...logEntry };
  
  // Redact gclid
  if (redacted.gclid && typeof redacted.gclid === 'string') {
    redacted.gclid = `${redacted.gclid.substring(0, 8)}...REDACTED`;
  }
  
  // Redact fbclid
  if (redacted.fbclid && typeof redacted.fbclid === 'string') {
    redacted.fbclid = `${redacted.fbclid.substring(0, 8)}...REDACTED`;
  }
  
  // Redact msclkid
  if (redacted.msclkid && typeof redacted.msclkid === 'string') {
    redacted.msclkid = `${redacted.msclkid.substring(0, 8)}...REDACTED`;
  }
  
  // Redact in nested objects
  if (redacted.lead && typeof redacted.lead === 'object') {
    redacted.lead = redactGCLIDs(redacted.lead);
  }
  
  // Redact in context
  if (redacted.context && typeof redacted.context === 'object') {
    if (redacted.context.gclid) {
      redacted.context.gclid = `${redacted.context.gclid.substring(0, 8)}...REDACTED`;
    }
  }
  
  return redacted;
}

// In log() method:
log(level: string, message: string, context?: Record<string, any>, c?: Context): void {
  const redactedContext = context ? redactGCLIDs(context) : undefined;
  // ... rest of logging
}
```

**Acceptance Criteria:**
- [ ] GCLIDs redacted in all logs
- [ ] Test log redaction

---

## Task 9: Retention Policy

**Task ID:** GCLID-004  
**Status:** [ ]  
**Priority:** P2  
**Hours:** 1  
**Owner:** Backend

**File:** `serverless/migrations/gclid-retention.sql`

```sql
-- Create trigger to auto-clear GCLIDs after 90 days
CREATE TRIGGER IF NOT EXISTS clean_gclids_after_90_days
AFTER INSERT ON leads
BEGIN
  UPDATE leads 
  SET gclid = NULL, gclid_hash = NULL,
      fbclid = NULL, fbclid_hash = NULL,
      updated_at = datetime('now')
  WHERE id = NEW.id 
  AND created_at < datetime('now', '-90 days');
END;

-- For existing records, run manually:
-- UPDATE leads SET gclid = NULL, gclid_hash = NULL 
-- WHERE created_at < datetime('now', '-90 days');

-- Create index for cleanup performance
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
```

**Documentation:**
```markdown
## GCLID Retention Policy

GCLIDs are retained for 90 days from lead creation date.

**Rationale:**
- Google Ads GCLIDs are valid for 90 days
- Beyond 90 days, GCLIDs cannot be used for conversion attribution
- Reduces data breach impact by limiting stored PII

**Automatic Cleanup:**
- Triggers clear GCLIDs from leads table after 90 days
- Audit logs retain record of original lead (without GCLID)
```

**Acceptance Criteria:**
- [ ] Trigger created
- [ ] Documentation written
- [ ] Tested manually

---

## Task 10: Integration Tests & Security Review

**Task ID:** GCLID-TEST-REVIEW  
**Status:** [ ]  
**Priority:** P1  
**Hours:** 4  
**Owner:** QA + Security

**Test Scenarios:**
1. Full lead capture with valid GCLID
2. Lead capture with invalid GCLID rejected
3. Lead capture with missing GCLID succeeds
4. GCLID hash stored correctly
5. GCLID redacted in logs
6. GCLID cleared after 90 days

**Security Review Checklist:**
- [ ] Hashing cannot be reversed
- [ ] No GCLIDs in error messages
- [ ] No GCLIDs in plaintext logs
- [ ] Migration tested for rollback

---

## Summary

| Task | Name | Hours |
|------|------|-------|
| 1 | GCLID Validation Function | 1 |
| 2 | GCLID Validation Tests | 0.5 |
| 3 | Validation in Leads Route | 0.5 |
| 4 | Validation in GHL Route | 0.5 |
| 5 | Validation in Shopify Route | 0.5 |
| 6 | GCLID Hashing | 2 |
| 7 | Update Leads Insert | 1 |
| 8 | Log Redaction | 2 |
| 9 | Retention Policy | 1 |
| 10 | Tests & Security Review | 4 |
| **Total** | | **~13** |

---

**Created:** 2024-01-15  
**Version:** 1.0.0
