# GDPR Landing Page Compliance - Implementation Guide

**Status:** Phase 1 Implementation Ready  
**Target:** Landing page in `../landing-page/` directory  
**Estimated Time:** 3-5 days

---

## Overview

This guide provides step-by-step instructions for implementing all Phase 1 GDPR compliance fixes. Since the docs workspace cannot directly modify the landing page code, this document serves as the implementation blueprint.

---

## Task 1: Privacy Policy Update ✅ COMPLETE

**File:** `landing-page/src/pages/privacy-policy.astro`  
**Status:** Content ready in `gdpr-compliant-privacy-policy-content.md`  
**Action:** Replace entire file content with the new Astro component

---

## Task 2: Calculator Form Disclaimers

**File:** `landing-page/src/components/RoiCalculator.astro` (or equivalent calculator component)  
**Effort:** 2-4 hours

### Implementation

Add the following disclaimer block immediately after the calculator form, before the submit button:

```astro
<!-- GDPR Business Data Disclaimer -->
<div class="mt-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
  <p class="text-xs text-gray-400 leading-relaxed">
    <strong class="text-gray-300">Disclaimer:</strong> By using this calculator, you confirm you have authority to share this business data. 
    Results are estimates for informational purposes only. We are not liable for business decisions based on calculator output. 
    <a href="/privacy-policy" class="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
  </p>
</div>
```

### Alternative (if form is in a different location)

If the calculator is embedded in a page rather than a component, add this before the form's closing tag:

```html
<p class="text-xs text-gray-500 mt-2">
  By using this calculator, you confirm you have authority to share business data. 
  Results are estimates only. 
  <a href="/privacy-policy" class="underline">Privacy Policy</a>
</p>
```

### Validation
- [ ] Disclaimer appears below calculator form
- [ ] Privacy policy link works
- [ ] Text is readable (not too small)
- [ ] Styling matches site design

---

## Task 3: Cookie Banner Enhancement

**File:** `landing-page/src/components/CookieConsent.astro`  
**Effort:** 2-4 hours

### Current State Analysis

Based on the privacy policy, the current cookie banner has:
- Necessary cookies
- Analytics cookies  
- Marketing cookies

### Required Changes

Add two new cookie categories:

#### 3.1 Security Category

```typescript
{
  id: 'security',
  name: 'Security',
  description: 'reCAPTCHA fraud prevention (required for form submission)',
  required: true,
  enabled: true
}
```

#### 3.2 Functionality Category

```typescript
{
  id: 'functionality',
  name: 'Functionality',
  description: 'Calculator state persistence and language preferences',
  required: false,
  enabled: false
}
```

### Implementation Example

If using a TypeScript/JavaScript cookie consent library:

```typescript
const cookieCategories = [
  {
    id: 'necessary',
    name: 'Necessary',
    description: 'Required for website to function',
    required: true,
    enabled: true
  },
  {
    id: 'security',  // NEW
    name: 'Security',
    description: 'reCAPTCHA fraud prevention (required)',
    required: true,
    enabled: true
  },
  {
    id: 'functionality',  // NEW
    name: 'Functionality',
    description: 'Calculator state and preferences',
    required: false,
    enabled: false
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Website usage statistics',
    required: false,
    enabled: false
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Personalized advertisements',
    required: false,
    enabled: false
  }
];
```

### Verify "Reject All" Button

Ensure the cookie banner has a prominent "Reject All" button:

```astro
<div class="flex gap-4">
  <button 
    class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
    onclick="rejectAllCookies()"
  >
    Reject All
  </button>
  <button 
    class="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg font-semibold"
    onclick="acceptAllCookies()"
  >
    Accept All
  </button>
</div>
```

### Validation
- [ ] Security category appears in banner
- [ ] Functionality category appears in banner
- [ ] "Reject All" button is equally prominent as "Accept All"
- [ ] Clicking "Reject All" disables optional categories
- [ ] Cookie preferences persist across page loads

---

## Task 4: Double Opt-In Implementation

**File:** `landing-page/src/pages/api/waitlist.ts` (or equivalent API route)  
**Effort:** 30 minutes

### Current Implementation (Single Opt-In)

```typescript
fetch('https://api.brevo.com/v3/contacts', {
  method: 'POST',
  headers: {
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    email: email,
    listIds: [2],
    attributes: attributes,
    updateEnabled: true
  })
});
```

### Updated Implementation (Double Opt-In)

```typescript
fetch('https://api.brevo.com/v3/contacts', {
  method: 'POST',
  headers: {
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    email: email,
    listIds: [2],
    attributes: attributes,
    updateEnabled: true,
    doubleOptin: true,        // ADD THIS
    templateId: 1             // ADD THIS - get actual ID from Brevo dashboard
  })
});
```

### Get Brevo Template ID

1. Log into Brevo dashboard
2. Go to Campaigns → Templates
3. Find or create a "Double Opt-In Confirmation" template
4. Copy the template ID
5. Replace `templateId: 1` with the actual ID

### Update Success Response

Change the success message to indicate confirmation email was sent:

```typescript
return new Response(JSON.stringify({
  success: true,
  message: 'Please check your email to confirm your subscription'
}), {
  status: 200,
  headers: { 'Content-Type': 'application/json' }
});
```

### Validation
- [ ] Submit waitlist form
- [ ] Verify confirmation email is sent
- [ ] Click confirmation link in email
- [ ] Verify user is added to Brevo list only after confirmation
- [ ] Test with multiple email addresses

---

## Task 5: Privacy Policy Links Verification

**Files:** Multiple  
**Effort:** 1-2 hours

### 5.1 Waitlist Form

**File:** `landing-page/src/components/WaitlistForm.astro` (or equivalent)

Add privacy policy link near consent checkbox:

```astro
<label class="flex items-start gap-3">
  <input type="checkbox" name="consent" required class="mt-1" />
  <span class="text-sm text-gray-300">
    I agree to be contacted about AdsEngineer. 
    <a href="/privacy-policy" class="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
  </span>
</label>
```

### 5.2 Calculator Form

**Status:** Covered in Task 2 (disclaimer includes privacy link)

### 5.3 Cookie Banner

**File:** `landing-page/src/components/CookieConsent.astro`

Add privacy policy link in banner footer:

```astro
<div class="mt-4 text-center">
  <a href="/privacy-policy" class="text-sm text-gray-400 hover:text-gray-300 underline">
    Privacy Policy
  </a>
</div>
```

### 5.4 Footer

**File:** `landing-page/src/components/Footer.astro`

Verify privacy policy link exists (likely already present):

```astro
<nav class="flex gap-6">
  <a href="/about" class="text-gray-400 hover:text-white">About</a>
  <a href="/privacy-policy" class="text-gray-400 hover:text-white">Privacy Policy</a>
  <a href="mailto:privacy@adsengineer.cloud" class="text-gray-400 hover:text-white">Contact</a>
</nav>
```

### Validation Checklist
- [ ] Waitlist form has privacy policy link
- [ ] Calculator form has privacy policy link (Task 2)
- [ ] Cookie banner has privacy policy link
- [ ] Footer has privacy policy link
- [ ] All links point to `/privacy-policy`
- [ ] All links work when clicked

---

## Task 6: Consent Checkbox Defaults

**Files:** All forms with consent checkboxes  
**Effort:** 30 minutes

### Verification Steps

1. **Waitlist Form Checkbox**

Check that consent checkbox is NOT pre-checked:

```astro
<!-- CORRECT -->
<input type="checkbox" name="contactConsent" required />

<!-- INCORRECT - DO NOT USE -->
<input type="checkbox" name="contactConsent" checked required />
```

2. **Calculator Consent Checkbox**

If calculator has a separate consent checkbox:

```astro
<!-- CORRECT -->
<input type="checkbox" name="calculatorConsent" />

<!-- INCORRECT - DO NOT USE -->
<input type="checkbox" name="calculatorConsent" checked />
```

### Validation
- [ ] Load waitlist form in browser
- [ ] Verify contact consent checkbox is unchecked
- [ ] Load calculator form in browser
- [ ] Verify calculator consent checkbox is unchecked (if exists)
- [ ] Test form submission requires checking the box

---

## Task 7: Testing and Validation

**Effort:** 4-6 hours

### 7.1 Manual Content Review

Use this checklist to review the privacy policy:

- [ ] Section 1: Introduction present
- [ ] Section 2: Information We Collect (3 subsections)
- [ ] Section 3: Data Processors table with Brevo and Google
- [ ] Section 4: Data Retention periods specified
- [ ] Section 5: GDPR rights listed
- [ ] Section 6: Business data disclaimer
- [ ] Section 7: International transfers with SCCs
- [ ] Section 8: Cookie usage
- [ ] Section 9: Data security
- [ ] Section 10: Article 30 processing record
- [ ] Section 11: Changes to policy
- [ ] Section 12: Contact information
- [ ] All DPA links work
- [ ] All email addresses are correct

### 7.2 Playwright Smoke Tests (Optional)

Create `tests/gdpr-compliance.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance', () => {
  test('Privacy policy page loads and contains required sections', async ({ page }) => {
    await page.goto('/privacy-policy');
    
    // Check all required sections exist
    await expect(page.locator('h2:has-text("Information We Collect")')).toBeVisible();
    await expect(page.locator('h2:has-text("Data Processors")')).toBeVisible();
    await expect(page.locator('h2:has-text("Data Retention")')).toBeVisible();
    await expect(page.locator('h2:has-text("Your Rights")')).toBeVisible();
    await expect(page.locator('h2:has-text("Business Data Disclaimer")')).toBeVisible();
    await expect(page.locator('h2:has-text("International Data Transfers")')).toBeVisible();
    
    // Check data processors table
    await expect(page.locator('text=Brevo')).toBeVisible();
    await expect(page.locator('text=Google reCAPTCHA')).toBeVisible();
  });

  test('Calculator form displays disclaimer', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to calculator (adjust selector as needed)
    await page.locator('[data-testid="calculator"]').scrollIntoViewIfNeeded();
    
    // Check disclaimer is visible
    await expect(page.locator('text=you have authority to share this business data')).toBeVisible();
    await expect(page.locator('a[href="/privacy-policy"]')).toBeVisible();
  });

  test('Cookie banner displays all categories', async ({ page }) => {
    await page.goto('/');
    
    // Check cookie banner appears
    await expect(page.locator('text=Cookie')).toBeVisible();
    
    // Check all categories
    await expect(page.locator('text=Necessary')).toBeVisible();
    await expect(page.locator('text=Security')).toBeVisible();
    await expect(page.locator('text=Functionality')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Marketing')).toBeVisible();
    
    // Check Reject All button
    await expect(page.locator('button:has-text("Reject All")')).toBeVisible();
  });

  test('Consent checkboxes default to unchecked', async ({ page }) => {
    await page.goto('/');
    
    // Check waitlist consent checkbox
    const consentCheckbox = page.locator('input[name="contactConsent"]');
    await expect(consentCheckbox).not.toBeChecked();
  });

  test('Privacy policy links work from all locations', async ({ page }) => {
    // Test footer link
    await page.goto('/');
    await page.locator('footer a[href="/privacy-policy"]').click();
    await expect(page).toHaveURL('/privacy-policy');
    
    // Test calculator link
    await page.goto('/');
    await page.locator('[data-testid="calculator"] a[href="/privacy-policy"]').click();
    await expect(page).toHaveURL('/privacy-policy');
  });
});
```

Run tests:
```bash
npx playwright test tests/gdpr-compliance.spec.ts
```

### 7.3 Integration Test - Double Opt-In

Manual test procedure:

1. Submit waitlist form with test email
2. Check email inbox for confirmation email
3. Click confirmation link
4. Log into Brevo dashboard
5. Verify contact appears in list with "confirmed" status
6. Verify contact does NOT appear before confirmation

### 7.4 Cross-Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Check:
- [ ] Privacy policy renders correctly
- [ ] Forms display disclaimers
- [ ] Cookie banner works
- [ ] All links work
- [ ] No console errors

---

## Deployment Checklist

Before deploying to production:

- [ ] All 7 tasks completed
- [ ] Privacy policy content reviewed and approved
- [ ] All links tested and working
- [ ] Brevo double opt-in template configured
- [ ] Cookie banner displays all categories
- [ ] Forms display disclaimers
- [ ] Consent checkboxes default to unchecked
- [ ] Manual content review passed
- [ ] Smoke tests passed (if implemented)
- [ ] Cross-browser testing completed
- [ ] No console errors
- [ ] Legal review checklist verified

---

## Post-Deployment Verification

After deploying to production:

1. **Privacy Policy**
   - [ ] Visit https://adsengineer.cloud/privacy-policy
   - [ ] Verify all sections render correctly
   - [ ] Click all DPA links to verify they work

2. **Forms**
   - [ ] Submit waitlist form
   - [ ] Verify confirmation email received
   - [ ] Check calculator disclaimer appears

3. **Cookie Banner**
   - [ ] Clear cookies and reload site
   - [ ] Verify banner appears with all categories
   - [ ] Test "Reject All" functionality

4. **Links**
   - [ ] Click privacy policy link from footer
   - [ ] Click privacy policy link from calculator
   - [ ] Click privacy policy link from cookie banner

---

## Risk Level Assessment

**Before Phase 1:** 🔴 HIGH (€20M fine potential)  
**After Phase 1:** 🟢 LOW (landing page compliant)

### Remaining Risks (Out of Scope)

- Phase 2: GDPR Portal (blocked - needs authentication)
- Phase 3: CAPTCHA evaluation (deferred - reCAPTCHA with disclosure is compliant)

---

## Support and Questions

For implementation questions or issues:
- **Email:** privacy@adsengineer.cloud
- **Spec Location:** `~/.kiro/specs/gdpr-landing-page-compliance/`
- **Documentation:** This file + `gdpr-compliant-privacy-policy-content.md`

---

## Success Criteria

Phase 1 is complete when:
✅ All 7 critical/medium issues from legal review are addressed  
✅ Privacy policy contains all required sections  
✅ Forms display proper disclaimers  
✅ Cookie banner includes all categories  
✅ Double opt-in is implemented  
✅ All privacy policy links work  
✅ Consent checkboxes default to unchecked  
✅ Manual content review passes  
✅ Basic smoke tests pass (if implemented)

**Estimated completion: 3-5 days**
