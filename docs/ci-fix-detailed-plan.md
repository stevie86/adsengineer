# CI/CD Blocker Fix Plan

**Status:** 🟡 READY TO EXECUTE
**Created:** 2026-01-17
**Priority:** 🔴 CRITICAL

---

## Current Blockers

### Blocker #1: Duplicate Class Definitions (CRITICAL)

**File:** `serverless/src/services/tiktok-conversions.ts`
**Error:** TypeScript compilation fails - `TikTokConversionsAPI` defined 3 times

```
Line 35: export class TikTokConversionsAPI { ... }
Line 45: export class TikTokConversionsAPI { ... }  ❌ DUPLICATE
Line 55: export class TikTokConversionsAPI { ... }  ❌ DUPLICATE
```

**Impact:**
- ❌ All CI/CD pipelines fail
- ❌ Cannot deploy to production
- ❌ TypeScript compilation fails locally

**Root Cause:**
AGENTS.md generation process accidentally duplicated class definitions when extracting patterns.

---

### Blocker #2: Undeclared Router Variables

**File:** `serverless/src/routes/index.ts`
**Error:** All router variables are undeclared

```
Line 27: The leadsRouter variable is undeclared
Line 28: The oauthRouter variable is undeclared
Line 29: The onboardingRouter variable is undeclared
...
(12 total undeclared routers)
```

**Impact:**
- ❌ Routes not registered in Hono app
- ❌ API endpoints not accessible
- ❌ LSP errors prevent development

**Root Cause:**
Likely missing imports or router files not exporting correctly.

---

## Fix Plan

### Phase 1: Investigate & Understand (15 min)

**Goal:** Understand the full scope of corruption

#### Step 1.1: Check File History
```bash
# Check when files were last clean
git log --oneline -5

# Check if files existed in previous commits
git show d35ece6:serverless/src/services/tiktok-conversions.ts 2>&1 | head -5
git show d35ece6:serverless/src/routes/index.ts 2>&1 | head -5
```

#### Step 1.2: Check Original Source
```bash
# Check if tiktok-conversions.ts existed before recent work
git log --all --oneline -- serverless/src/services/tiktok-conversions.ts

# Check index.ts imports
head -50 serverless/src/routes/index.ts | grep "import"
```

**Success Criteria:**
- [ ] Known when files were last clean
- [ ] Understand original file structure

---

### Phase 2: Restore Corrupted Files (10 min)

**Goal:** Restore files to working state

#### Step 2.1: Restore tiktok-conversions.ts
```bash
# Option A: If file existed in recent commit
git checkout d35ece6 -- serverless/src/services/tiktok-conversions.ts

# Option B: If file is new, delete and recreate
rm serverless/src/services/tiktok-conversions.ts
# Manually recreate with correct structure

# Verify restoration
grep -c "export class TikTokConversionsAPI" serverless/src/services/tiktok-conversions.ts
# Should be exactly 1
```

#### Step 2.2: Check routes/index.ts
```bash
# Check what imports are missing
head -100 serverless/src/routes/index.ts

# Look for router files
ls -la serverless/src/routes/

# Check if each router file exports correctly
grep "export" serverless/src/routes/*.ts | head -20
```

**Success Criteria:**
- [ ] tiktok-conversions.ts has exactly 1 class definition
- [ ] routes/index.ts has all required imports
- [ ] All LSP errors resolved

---

### Phase 3: Reapply Valid Changes (20 min)

**Goal:** Apply only the intended changes (not corruption)

#### Step 3.1: Review Intended Changes
```bash
# Check what we actually wanted to change
git diff f15987d 377fd1f -- serverless/src/services/tiktok-conversions.ts
git diff f15987d 377fd1f -- serverless/src/services/meta-conversions.ts

# Expected changes:
# 1. Import event-time utility
# 2. Use resolveEventTimeSeconds() in uploadConversions
```

#### Step 3.2: Apply Clean Changes

**For tiktok-conversions.ts:**
```typescript
// Add import at top (line 3):
import { resolveEventTimeSeconds } from '../utils/event-time';

// In uploadConversions method (line ~69):
// Change from:
event_time: conversion.event_time || Math.floor(Date.now() / 1000),

// To:
event_time: resolveEventTimeSeconds({ event_time: conversion.event_time }),
```

**For meta-conversions.ts:**
```typescript
// Already has import, verify it's correct
import { resolveEventTimeSeconds } from '../utils/event-time';

// In processMetaConversionBatch function (line ~160):
// Verify call signature:
event_time: resolveEventTimeSeconds({ timestamp: conv.conversion_time }),
```

#### Step 3.3: Fix event-time.ts Signature (if needed)

Check if `resolveEventTimeSeconds` supports both parameter names:
```typescript
// Current interface may be:
interface EventTimeInput {
  event_time?: number;
}

// May need to support both:
interface EventTimeInput {
  event_time?: number;
  timestamp?: string; // For Meta (ISO string)
}
```

**Success Criteria:**
- [ ] Only intended changes applied
- [ ] No duplicate code blocks
- [ ] Files compile with TypeScript

---

### Phase 4: Validation (15 min)

**Goal:** Verify everything works

#### Step 4.1: Type Check
```bash
cd serverless
pnpm types:check
```

**Expected:** No errors

#### Step 4.2: Lint Check
```bash
cd serverless
pnpm lint
```

**Expected:** No errors (warnings OK)

#### Step 4.3: Run Tests
```bash
cd serverless
pnpm test
```

**Expected:** All tests pass

#### Step 4.4: LSP Diagnostics
```bash
# Check all files for errors
lsp_diagnostics serverless/src/services/tiktok-conversions.ts
lsp_diagnostics serverless/src/services/meta-conversions.ts
lsp_diagnostics serverless/src/routes/index.ts
```

**Expected:** No errors

**Success Criteria:**
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] All tests pass
- [ ] No LSP errors

---

### Phase 5: Commit & Push (10 min)

**Goal:** Deploy fix to trigger CI

#### Step 5.1: Create Fix Commit
```bash
git add serverless/src/services/tiktok-conversions.ts
git add serverless/src/services/meta-conversions.ts
git add serverless/src/routes/index.ts

git commit -m "fix: Restore corrupted service files and reapply event-time changes

- Restore tiktok-conversions.ts with single class definition
- Fix missing imports in routes/index.ts
- Reapply event-time utility integration
- All TypeScript and lint errors resolved"
```

#### Step 5.2: Push to Trigger CI
```bash
git push origin main
```

#### Step 5.3: Monitor CI
```bash
# Watch runs
gh run watch

# Or list and check status
gh run list --limit 5
sleep 30
gh run view <latest-run-id>
```

**Success Criteria:**
- [ ] Commit pushed successfully
- [ ] CI/CD pipeline starts
- [ ] No immediate failures

---

## Contingency Plans

### Contingency A: File Never Existed
If `tiktok-conversions.ts` is a NEW file created during this session:

```bash
# Delete the corrupted file
rm serverless/src/services/tiktok-conversions.ts

# Recreate from scratch with correct structure:
# - Single TikTokConversionsAPI class
# - Proper event-time integration
# - All existing methods intact
```

### Contingency B: Multiple Files Corrupted
If more than 2 files have issues:

```bash
# Reset entire serverless/src to last known good state
git checkout f15987d -- serverless/src/

# Reapply only the sGTM changes (not the corruption)
# These are the ONLY intended changes:
# - wrangler.jsonc (observability)
# - sgtm-forwarder.ts (new file)
# - dev-guard.ts (new file)
# - onboarding.ts (GA4 instructions)
# - event-time.ts (new file)
# - 0020_sgtm_config.sql (new migration)
```

### Contingency C: routes/index.ts Cannot Be Fixed
If router imports cannot be resolved:

```bash
# Check what router files actually exist
ls serverless/src/routes/*.ts

# Compare with what index.ts expects
# Document missing routers
# Create stub files for missing routers OR remove from index.ts

# Example stub:
// serverless/src/routes/leads.ts
export const leadsRouter = new Hono();
leadsRouter.get('/test', (c) => c.json({ status: 'ok' }));
```

---

## Execution Checklist

Use this checklist to track progress:

### Phase 1: Investigation
- [ ] Checked file history
- [ ] Understood corruption scope
- [ ] Identified last known good state

### Phase 2: Restoration
- [ ] Restored tiktok-conversions.ts
- [ ] Verified single class definition
- [ ] Checked routes/index.ts imports
- [ ] All LSP errors resolved

### Phase 3: Reapply Changes
- [ ] Reviewed intended changes
- [ ] Added event-time import to tiktok-conversions
- [ ] Updated resolveEventTimeSeconds call
- [ ] Verified meta-conversions integration

### Phase 4: Validation
- [ ] `pnpm types:check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] No LSP errors

### Phase 5: Deployment
- [ ] Files staged
- [ ] Commit created
- [ ] Pushed to origin/main
- [ ] CI/CD triggered
- [ ] Monitoring for success

---

## Expected Timeline

| Phase | Estimated Time | Dependencies |
|--------|----------------|-------------|
| Phase 1: Investigation | 15 min | None |
| Phase 2: Restoration | 10 min | Phase 1 |
| Phase 3: Reapply Changes | 20 min | Phase 2 |
| Phase 4: Validation | 15 min | Phase 3 |
| Phase 5: Commit & Push | 10 min | Phase 4 |
| **Total** | **70 min** | Sequential |

---

## Success Metrics

**Fix is complete when:**
1. No TypeScript compilation errors
2. No LSP errors in changed files
3. All tests pass locally
4. CI/CD pipeline runs without syntax errors
5. CI/CD pipeline reaches backend-test stage
6. CI/CD pipeline reaches frontend-test stage

---

## Post-Fix Actions

After CI passes, next steps:

1. **Apply Database Migration**
   ```bash
   cd serverless
   doppler run -- wrangler d1 migrations apply adsengineer-db
   ```

2. **Start Sprint 1**
   - Create `serverless/src/services/ga4-measurement.ts`
   - Build event normalizer
   - Update onboarding for Direct Mode

3. **Monitor Production**
   - Watch for any runtime errors
   - Check event ingestion metrics
   - Verify sGTM forwarder still works

---

## Questions to Answer Before Starting

1. **Do we have a backup of the files?** (git history)
2. **What's the last known good commit?** (likely f15987d)
3. **Are there any other corrupted files?** (check all modified files)
4. **Is event-time.ts correct?** (verify interface)

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|-------|---------|-------------|------------|
| File cannot be restored | High | Low | Use git history or recreate from scratch |
| Missing router files | Medium | Medium | Create stub files or remove from index |
| event-time signature mismatch | Medium | High | Update utility to support both formats |
| CI fails for different reason | Medium | Low | Monitor logs, iterate fix |
| Other files also corrupted | High | Medium | Reset entire src directory if needed |

---

## Command Reference

**Quick fix execution:**
```bash
cd /home/webadmin/coding/ads-engineer

# Phase 1-2: Restore
git checkout f15987d -- serverless/src/services/tiktok-conversions.ts
git checkout f15987d -- serverless/src/services/meta-conversions.ts
git checkout f15987d -- serverless/src/routes/index.ts

# Phase 3: Reapply sGTM changes only (skip corruption)
# These are the ONLY intended changes:
git checkout 377fd1f -- serverless/src/services/sgtm-forwarder.ts
git checkout 377fd1f -- serverless/src/middleware/dev-guard.ts
git checkout 377fd1f -- serverless/src/utils/event-time.ts
git checkout 377fd1f -- serverless/migrations/0020_sgtm_config.sql
git checkout 377fd1f -- serverless/wrangler.jsonc

# Phase 4: Validate
cd serverless && pnpm types:check && pnpm lint && pnpm test

# Phase 5: Commit
git add serverless/src
git add serverless/migrations
git add serverless/wrangler.jsonc
git commit -m "fix: Restore corrupted files, keep sGTM implementation"
git push origin main

# Monitor
gh run watch
```

---

## Status Tracking

| Step | Status | Time | Notes |
|------|--------|-------|-------|
| Phase 1: Investigation | ⏳ Pending | - |
| Phase 2: Restoration | ⏳ Pending | - |
| Phase 3: Reapply Changes | ⏳ Pending | - |
| Phase 4: Validation | ⏳ Pending | - |
| Phase 5: Commit & Push | ⏳ Pending | - |

**Last Updated:** 2026-01-17
**Next Action:** Start Phase 1
