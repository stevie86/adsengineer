# Phase 1: Fix WooCommerce Plugin

**Goal:** Merge two plugins into one production-ready plugin with correct webhook URL and bundled GCLID capture.

---

## Context

### Original Request
Fix WooCommerce plugin to be production-ready for sGTM integration (Phase 1 of 4).

### Current State

Two separate plugins with different approaches:

| File | Approach | Issues |
|------|----------|--------|
| `adsengineer-woocommerce.php` | Direct webhook via `wp_remote_post` | Wrong URL (`/webhooks/woo`), no GCLID capture |
| `adsengineer-tracking.php` | Uses snippet.js + WooCommerce native webhooks | Requires manual webhook setup |

### Research Findings
- `adsengineer-tracking.php` has better GCLID capture (via snippet.js cookies)
- `adsengineer-woocommerce.php` has better webhook sending (direct, no manual setup)
- Need to merge best of both into single plugin

---

## Work Objectives

### Core Objective
Create single unified WooCommerce plugin with correct webhook URL and automatic GCLID capture.

### Concrete Deliverables
- Fixed webhook URLs in backend services
- Merged plugin file with all features
- Updated ZIP generator
- Cleaned up obsolete files
- Updated documentation

### Definition of Done
- [ ] Plugin downloads with correct webhook URL (`/api/v1/woocommerce/webhook`)
- [ ] GCLID capture works without manual functions.php edit
- [ ] Single settings page (not two)
- [ ] Only one plugin file exists

### Must Have
- Correct webhook URL
- Bundled GCLID/UTM capture via snippet.js
- Direct webhook sending on order events
- Settings for Site ID and Webhook URL

### Must NOT Have (Guardrails)
- Manual functions.php code required
- Two separate plugins
- Wrong webhook URL anywhere
- Missing nonce verification

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **User wants tests**: Manual verification for PHP plugin
- **QA approach**: Manual verification with curl + WordPress install

### Verification Procedures

**For webhook URL fix:**
```bash
# After deploy, verify ZIP contains correct URL
curl -s "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/zip" -o /tmp/test.zip
unzip -p /tmp/test.zip adsengineer-woocommerce/adsengineer-woocommerce.php | grep "api/v1/woocommerce/webhook"
# Should return matches, NOT /webhooks/woo
```

**For plugin functionality:**
```bash
# Check plugin info endpoint
curl -s "https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/info" | jq .
```

---

## TODOs

- [ ] 1. Fix webhook URLs in backend services

  **What to do**:
  - Edit `serverless/src/services/woocommerce-zip.ts`
    - Line 69: Change `/webhooks/woo` to `/api/v1/woocommerce/webhook`
    - Line 171: Change `/webhooks/woo` to `/api/v1/woocommerce/webhook`
  - Edit `serverless/src/routes/woocommerce.ts`
    - Line 117: Change `/webhooks/woo` to `/api/v1/woocommerce/webhook`

  **Must NOT do**:
  - Change the actual webhook endpoint path (it's correct at `/api/v1/woocommerce/webhook`)

  **References**:
  - `serverless/src/services/woocommerce-zip.ts:69` - Default URL in plugin PHP
  - `serverless/src/services/woocommerce-zip.ts:171` - Default URL in settings page
  - `serverless/src/routes/woocommerce.ts:117` - Default URL in download endpoint

  **Acceptance Criteria**:
  - [ ] `grep -r "webhooks/woo" serverless/` returns no matches
  - [ ] `grep -r "api/v1/woocommerce/webhook" serverless/src/services/woocommerce-zip.ts` returns 2+ matches

  **Commit**: YES
  - Message: `fix(woocommerce): correct default webhook URL in plugin`
  - Files: `serverless/src/services/woocommerce-zip.ts`, `serverless/src/routes/woocommerce.ts`

---

- [ ] 2. Create merged unified plugin

  **What to do**:
  - Rewrite `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php` to include:
    
    **From `adsengineer-tracking.php`:**
    - Snippet injection in `wp_head` (lines 14-30)
    - GCLID/UTM capture from `_adsengineer_*` cookies (lines 34-48)
    - Site ID setting
    
    **From existing `adsengineer-woocommerce.php`:**
    - Direct webhook sending via `wp_remote_post`
    - `woocommerce_order_status_changed` hook
    - `woocommerce_new_order` hook
    - Webhook URL setting
    
    **New additions:**
    - Nonce verification: `wp_verify_nonce($_POST['_wpnonce'], 'adsengineer_settings')`
    - Combined settings page with: Site ID, Webhook URL, Webhook Secret
    - Status indicator showing if webhook is configured

  **Must NOT do**:
  - Require manual functions.php code
  - Create two settings pages
  - Use wrong webhook URL

  **References**:
  - `woocommerce-plugin/adsengineer-tracking.php:14-48` - Snippet + GCLID capture pattern
  - `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php:70-129` - Webhook sending pattern
  - `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php:142-206` - Settings page pattern

  **Acceptance Criteria**:
  - [ ] Single PHP file < 350 lines
  - [ ] Contains `wp_head` action for snippet
  - [ ] Contains `woocommerce_checkout_update_order_meta` for GCLID capture
  - [ ] Contains `woocommerce_new_order` for webhook sending
  - [ ] Contains `wp_verify_nonce` for security
  - [ ] Default webhook URL is `/api/v1/woocommerce/webhook`

  **Commit**: YES
  - Message: `feat(woocommerce): merge plugins with bundled GCLID capture`
  - Files: `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php`

---

- [ ] 3. Update ZIP generator with merged plugin

  **What to do**:
  - Update `PLUGIN_PHP_CONTENT` in `serverless/src/services/woocommerce-zip.ts`
  - Copy the new merged plugin content
  - Update `README_CONTENT` with simplified setup instructions

  **Must NOT do**:
  - Have plugin content out of sync between local file and ZIP generator

  **References**:
  - `serverless/src/services/woocommerce-zip.ts:6-219` - PLUGIN_PHP_CONTENT constant
  - `serverless/src/services/woocommerce-zip.ts:221-282` - README_CONTENT constant
  - `woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php` - Source of truth

  **Acceptance Criteria**:
  - [ ] `PLUGIN_PHP_CONTENT` matches local plugin file
  - [ ] README mentions snippet.js (automatic GCLID capture)
  - [ ] README does NOT mention manual functions.php code
  - [ ] Unit test passes: `pnpm test woocommerce-zip`

  **Commit**: YES
  - Message: `chore(woocommerce): sync ZIP generator with merged plugin`
  - Files: `serverless/src/services/woocommerce-zip.ts`

---

- [ ] 4. Delete obsolete tracking plugin

  **What to do**:
  - Delete `woocommerce-plugin/adsengineer-tracking.php`
  - Verify no references to it remain

  **Must NOT do**:
  - Delete the main plugin directory
  - Delete README or documentation files

  **References**:
  - `woocommerce-plugin/adsengineer-tracking.php` - File to delete

  **Acceptance Criteria**:
  - [ ] File does not exist: `ls woocommerce-plugin/adsengineer-tracking.php` returns error
  - [ ] `grep -r "adsengineer-tracking" woocommerce-plugin/` returns no matches

  **Commit**: YES
  - Message: `chore(woocommerce): remove obsolete tracking plugin (merged)`
  - Files: `woocommerce-plugin/adsengineer-tracking.php` (deleted)

---

- [ ] 5. Update documentation

  **What to do**:
  - Update `woocommerce-plugin/adsengineer-woocommerce/README.md`:
    - Remove manual GCLID capture instructions
    - Add Site ID configuration step
    - Simplify setup flow
  - Update `woocommerce-plugin/TESTING.md`:
    - Remove functions.php requirement
    - Update test checklist

  **Must NOT do**:
  - Leave outdated manual GCLID instructions
  - Reference deleted tracking plugin

  **References**:
  - `woocommerce-plugin/adsengineer-woocommerce/README.md` - Plugin README
  - `woocommerce-plugin/TESTING.md` - Testing guide

  **Acceptance Criteria**:
  - [ ] README does not contain `functions.php`
  - [ ] TESTING.md checklist updated
  - [ ] No references to `adsengineer-tracking.php`

  **Commit**: YES
  - Message: `docs(woocommerce): update setup instructions for merged plugin`
  - Files: `woocommerce-plugin/adsengineer-woocommerce/README.md`, `woocommerce-plugin/TESTING.md`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `fix(woocommerce): correct default webhook URL in plugin` | woocommerce-zip.ts, woocommerce.ts |
| 2 | `feat(woocommerce): merge plugins with bundled GCLID capture` | adsengineer-woocommerce.php |
| 3 | `chore(woocommerce): sync ZIP generator with merged plugin` | woocommerce-zip.ts |
| 4 | `chore(woocommerce): remove obsolete tracking plugin (merged)` | adsengineer-tracking.php |
| 5 | `docs(woocommerce): update setup instructions for merged plugin` | README.md, TESTING.md |

---

## Success Criteria

### Verification Commands
```bash
# 1. Check no wrong URLs remain
grep -r "webhooks/woo" serverless/
# Expected: no output

# 2. Check plugin has correct URL
grep -r "api/v1/woocommerce/webhook" serverless/src/services/woocommerce-zip.ts
# Expected: 2+ matches

# 3. Check obsolete file removed
ls woocommerce-plugin/adsengineer-tracking.php 2>&1
# Expected: No such file or directory

# 4. Run tests
cd serverless && pnpm test woocommerce-zip
# Expected: All tests pass
```

### Final Checklist
- [ ] All "Must Have" features present
- [ ] All "Must NOT Have" items absent
- [ ] All 5 commits made
- [ ] Tests pass
