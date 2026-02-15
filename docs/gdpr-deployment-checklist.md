# GDPR Phase 1 - Deployment Checklist

**Use this checklist to ensure all compliance fixes are properly implemented and tested before going live.**

---

## Pre-Implementation

- [ ] Read `gdpr-implementation-guide.md` completely
- [ ] Review `gdpr-compliant-privacy-policy-content.md`
- [ ] Understand all 7 tasks in `~/.kiro/specs/gdpr-landing-page-compliance/tasks.md`
- [ ] Backup current landing page code
- [ ] Create feature branch: `git checkout -b gdpr-phase1-compliance`

---

## Task 1: Privacy Policy Update

### Implementation
- [ ] Open `landing-page/src/pages/privacy-policy.astro`
- [ ] Replace entire content with new Astro component from `gdpr-compliant-privacy-policy-content.md`
- [ ] Save file

### Verification
- [ ] Run dev server: `npm run dev`
- [ ] Navigate to http://localhost:4321/privacy-policy
- [ ] Verify page renders without errors
- [ ] Check all 12 sections are present:
  - [ ] 1. Introduction
  - [ ] 2. Information We Collect (3 subsections)
  - [ ] 3. Data Processors (table)
  - [ ] 4. Data Retention Periods
  - [ ] 5. Your GDPR Rights
  - [ ] 6. Business Data Disclaimer
  - [ ] 7. International Data Transfers
  - [ ] 8. Cookie Usage
  - [ ] 9. Data Security
  - [ ] 10. Records of Processing Activities
  - [ ] 11. Changes to This Policy
  - [ ] 12. Contact Us
- [ ] Click all external links (DPA links) - verify they open in new tabs
- [ ] Click all email links - verify they open mail client
- [ ] Check mobile responsiveness
- [ ] No console errors

---

## Task 2: Calculator Form Disclaimers

### Implementation
- [ ] Locate calculator component (likely `landing-page/src/components/RoiCalculator.astro`)
- [ ] Add disclaimer block after calculator form, before submit button
- [ ] Use code from implementation guide
- [ ] Save file

### Verification
- [ ] Navigate to page with calculator (likely homepage)
- [ ] Scroll to calculator section
- [ ] Verify disclaimer text is visible
- [ ] Verify disclaimer includes:
  - [ ] "authority to share business data"
  - [ ] "estimates for informational purposes only"
  - [ ] Privacy Policy link
- [ ] Click privacy policy link - verify it works
- [ ] Check text is readable (not too small)
- [ ] Check styling matches site design
- [ ] Test on mobile - disclaimer still visible
- [ ] No console errors

---

## Task 3: Cookie Banner Enhancement

### Implementation
- [ ] Open `landing-page/src/components/CookieConsent.astro`
- [ ] Add "Security" category to cookie categories array
- [ ] Add "Functionality" category to cookie categories array
- [ ] Verify "Reject All" button exists and is prominent
- [ ] Save file

### Verification
- [ ] Clear browser cookies
- [ ] Reload homepage
- [ ] Verify cookie banner appears
- [ ] Check all 5 categories are listed:
  - [ ] Necessary
  - [ ] Security (NEW)
  - [ ] Functionality (NEW)
  - [ ] Analytics
  - [ ] Marketing
- [ ] Verify "Reject All" button is visible
- [ ] Verify "Reject All" is equally prominent as "Accept All"
- [ ] Click "Reject All" - verify optional categories are disabled
- [ ] Click "Accept All" - verify all categories are enabled
- [ ] Reload page - verify preferences persist
- [ ] Check privacy policy link in banner (if exists)
- [ ] Test on mobile
- [ ] No console errors

---

## Task 4: Double Opt-In Implementation

### Prerequisites
- [ ] Log into Brevo dashboard
- [ ] Navigate to Campaigns → Templates
- [ ] Find or create "Double Opt-In Confirmation" template
- [ ] Copy template ID number

### Implementation
- [ ] Open `landing-page/src/pages/api/waitlist.ts` (or equivalent API route)
- [ ] Locate Brevo API call
- [ ] Add `doubleOptin: true` parameter
- [ ] Add `templateId: <YOUR_ID>` parameter (replace with actual ID)
- [ ] Update success message to "Please check your email to confirm your subscription"
- [ ] Save file

### Verification
- [ ] Submit waitlist form with test email address
- [ ] Check email inbox
- [ ] Verify confirmation email received
- [ ] Verify email contains confirmation link
- [ ] Click confirmation link
- [ ] Log into Brevo dashboard
- [ ] Navigate to Contacts
- [ ] Verify contact appears with "confirmed" status
- [ ] Verify contact did NOT appear before clicking confirmation
- [ ] Test with multiple email addresses
- [ ] Test with invalid email - verify error handling
- [ ] No console errors

---

## Task 5: Privacy Policy Links Verification

### 5.1 Waitlist Form
- [ ] Open waitlist form component
- [ ] Verify privacy policy link exists near consent checkbox
- [ ] If missing, add link using code from implementation guide
- [ ] Save file
- [ ] Test: Navigate to form, click privacy link, verify it works

### 5.2 Calculator Form
- [ ] Already covered in Task 2 (disclaimer includes link)
- [ ] Verify link works

### 5.3 Cookie Banner
- [ ] Open cookie banner component
- [ ] Verify privacy policy link exists
- [ ] If missing, add link to banner footer
- [ ] Save file
- [ ] Test: Open cookie banner, click privacy link, verify it works

### 5.4 Footer
- [ ] Open footer component
- [ ] Verify privacy policy link exists
- [ ] Link likely already present - just verify
- [ ] Test: Click footer privacy link, verify it works

### Final Verification
- [ ] All 4 locations have working privacy policy links
- [ ] All links point to `/privacy-policy`
- [ ] All links work when clicked
- [ ] Links work on mobile

---

## Task 6: Consent Checkbox Defaults

### Verification
- [ ] Navigate to waitlist form
- [ ] Inspect contact consent checkbox
- [ ] Verify checkbox is NOT checked by default
- [ ] Verify no `checked` attribute in HTML
- [ ] Try to submit form without checking - verify validation error
- [ ] Check the box - verify form submits

### If Calculator Has Consent Checkbox
- [ ] Navigate to calculator
- [ ] Inspect calculator consent checkbox
- [ ] Verify checkbox is NOT checked by default
- [ ] Verify no `checked` attribute in HTML

### Code Review
- [ ] Search codebase for `checked="true"` or `checked={true}`
- [ ] Verify no consent checkboxes are pre-checked
- [ ] If found, remove the checked attribute

---

## Task 7: Testing and Validation

### 7.1 Manual Content Review
- [ ] Open privacy policy in browser
- [ ] Read through entire policy
- [ ] Verify all sections from legal review are addressed:
  - [ ] Contact data collection disclosed
  - [ ] Calculator data collection disclosed
  - [ ] Technical data collection disclosed
  - [ ] Brevo listed as processor with DPA link
  - [ ] Google reCAPTCHA listed as processor with DPA link
  - [ ] Retention periods specified for all data categories
  - [ ] Lawful basis documented for each processing activity
  - [ ] International transfer safeguards documented
  - [ ] Article 30 processing record complete
  - [ ] Business data disclaimer present
- [ ] Verify contact information is correct
- [ ] Verify all links work

### 7.2 Smoke Tests (Manual)
- [ ] **Test 1:** Privacy policy loads and displays all sections
- [ ] **Test 2:** Calculator displays disclaimer with privacy link
- [ ] **Test 3:** Cookie banner displays all 5 categories
- [ ] **Test 4:** Consent checkboxes default to unchecked
- [ ] **Test 5:** Privacy links work from all 4 locations
- [ ] **Test 6:** Double opt-in sends confirmation email
- [ ] **Test 7:** "Reject All" disables optional cookies

### 7.3 Integration Test - Double Opt-In Flow
- [ ] Submit waitlist form with test email
- [ ] Receive confirmation email within 5 minutes
- [ ] Click confirmation link
- [ ] Verify redirect to success page
- [ ] Check Brevo dashboard - contact is confirmed
- [ ] Submit another form - verify second confirmation email

### 7.4 Cross-Browser Testing

#### Chrome
- [ ] Privacy policy renders correctly
- [ ] Forms display disclaimers
- [ ] Cookie banner works
- [ ] All links work
- [ ] No console errors

#### Firefox
- [ ] Privacy policy renders correctly
- [ ] Forms display disclaimers
- [ ] Cookie banner works
- [ ] All links work
- [ ] No console errors

#### Safari
- [ ] Privacy policy renders correctly
- [ ] Forms display disclaimers
- [ ] Cookie banner works
- [ ] All links work
- [ ] No console errors

#### Edge (optional)
- [ ] Privacy policy renders correctly
- [ ] Forms display disclaimers
- [ ] Cookie banner works
- [ ] All links work
- [ ] No console errors

### 7.5 Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify all elements are responsive
- [ ] Verify text is readable
- [ ] Verify links are tappable

---

## Pre-Deployment Final Checks

### Code Quality
- [ ] No console errors in any browser
- [ ] No console warnings (or documented as acceptable)
- [ ] All TypeScript/JavaScript lints pass
- [ ] All tests pass (if test suite exists)
- [ ] Code formatted consistently

### Content Quality
- [ ] All text is grammatically correct
- [ ] No typos in privacy policy
- [ ] All email addresses are correct
- [ ] All links work
- [ ] All external links open in new tabs

### Legal Compliance
- [ ] All 7 issues from legal review are addressed
- [ ] Privacy policy is comprehensive
- [ ] Data processors are disclosed
- [ ] Retention periods are specified
- [ ] Lawful basis is documented
- [ ] International transfers are documented
- [ ] Business disclaimer is present
- [ ] Double opt-in is implemented

### Git
- [ ] All changes committed
- [ ] Commit messages are descriptive
- [ ] Branch is up to date with main
- [ ] No merge conflicts

---

## Deployment

### Staging Deployment (if available)
- [ ] Deploy to staging environment
- [ ] Run full test suite on staging
- [ ] Verify all changes work on staging
- [ ] Get stakeholder approval

### Production Deployment
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Monitor deployment logs for errors
- [ ] Verify deployment successful

---

## Post-Deployment Verification

### Immediate Checks (within 5 minutes)
- [ ] Visit https://adsengineer.cloud/privacy-policy
- [ ] Verify page loads without errors
- [ ] Check homepage loads correctly
- [ ] Submit test waitlist form
- [ ] Verify confirmation email received

### Detailed Checks (within 1 hour)
- [ ] Test all 7 tasks on production:
  - [ ] Privacy policy complete
  - [ ] Calculator disclaimer visible
  - [ ] Cookie banner has 5 categories
  - [ ] Double opt-in works
  - [ ] Privacy links work from all locations
  - [ ] Consent checkboxes unchecked
  - [ ] No console errors

### Monitoring (first 24 hours)
- [ ] Monitor error logs
- [ ] Check form submission rates
- [ ] Verify confirmation emails are being sent
- [ ] Check Brevo dashboard for confirmed contacts
- [ ] Monitor user feedback/complaints

---

## Rollback Plan (if needed)

If critical issues are discovered:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Notify Stakeholders**
   - Email privacy@adsengineer.cloud
   - Document the issue

3. **Fix and Redeploy**
   - Fix the issue in feature branch
   - Re-run all tests
   - Deploy again

---

## Success Criteria

Phase 1 is successfully deployed when:

✅ All 7 tasks are complete  
✅ All tests pass  
✅ No console errors  
✅ Privacy policy is comprehensive  
✅ Forms display disclaimers  
✅ Cookie banner has all categories  
✅ Double opt-in works  
✅ All privacy links work  
✅ Consent checkboxes default to unchecked  
✅ Production deployment successful  
✅ Post-deployment verification complete

---

## Risk Assessment

**Before Phase 1:** 🔴 HIGH (€20M fine potential)  
**After Phase 1:** 🟢 LOW (landing page compliant)

---

## Documentation

After successful deployment:

- [ ] Update `gdpr-phase1-summary.md` with deployment date
- [ ] Document any issues encountered and solutions
- [ ] Update team on completion
- [ ] Archive this checklist with completion date

---

## Completion

**Deployed By:** _______________  
**Deployment Date:** _______________  
**Production URL:** https://adsengineer.cloud  
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete

---

**Congratulations! Phase 1 GDPR compliance is complete. The landing page is now legally compliant and the risk of fines has been reduced from HIGH to LOW.**
