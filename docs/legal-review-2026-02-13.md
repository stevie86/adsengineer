# Legal Review: AdsEngineer Landing Page

**Review Date:** February 13, 2026  
**Jurisdiction:** EU (GDPR/DSGVO), Austria, Germany  
**Risk Level:** 🔴 **HIGH - Immediate Action Required**

---

## Executive Summary

Your landing page has **significant GDPR compliance gaps** that could result in fines up to €20M or 4% of annual revenue. The privacy policy is inadequate for your actual data processing activities.

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Privacy Policy Incomplete 
**Risk:** €20M fine potential  
**Status:** HIGH PRIORITY

**What's Missing:**
- No mention of calculator data collection
- No data processor disclosure (Brevo)
- No lawful basis stated (Legitimate Interest vs Consent)
- No data retention periods
- No mention of business financial data processing
- No international transfer safeguards (reCAPTCHA = US company Google)

**Current Policy:** 61 lines, generic template  
**Required:** Comprehensive policy covering all processing activities

---

### 2. Lawful Basis Unclear
**Risk:** GDPR Article 6 violation  
**Status:** HIGH PRIORITY

**Problem:** You're collecting data under unclear legal basis:
- Contact data → Should be **Consent** (marketing)
- Calculator data → Could be **Legitimate Interest** OR **Consent**

**Current State:** Checkbox says "I agree to be contacted" (implies consent)  
**Issue:** But calculator data checkbox is separate and optional

**Fix Required:**
- Primary processing (waitlist): Consent ✓
- Secondary processing (calculator analysis): Separate explicit consent OR legitimate interest with opt-out

---

### 3. Data Processor Agreement Missing
**Risk:** Joint liability with Brevo  
**Status:** HIGH PRIORITY

**What You're Doing:**
```typescript
fetch('https://api.brevo.com/v3/contacts', ...)
```

**Missing:**
- Data Processing Agreement (DPA) reference
- Brevo not disclosed in privacy policy
- No safeguards for EU data transfer (Brevo = Sendinblue, EU-based but processes globally)

**Required:** Section 3. Data Processors listing Brevo with DPA link

---

### 4. Sensitive Business Data Collection
**Risk:** Trade secret exposure, liability  
**Status:** MEDIUM-HIGH PRIORITY

**What You're Collecting:**
- Monthly ad spend (€)
- Actual shop sales numbers
- Google Ads performance data

**Legal Issues:**
1. This is **business-sensitive data** (not just personal data)
2. If user enters data for a business they don't own = potential fraud
3. No disclaimers about data accuracy
4. No liability limitation for business decisions based on calculator

**Fix Required:**
- Disclaimer: "Enter data only for businesses you own/manage"
- Disclaimer: "Calculator estimates for informational purposes only"
- Limitation of liability clause

---

## 🟡 MEDIUM RISK ISSUES

### 5. reCAPTCHA Compliance
**Risk:** Unlawful data transfer to US  
**Status:** MEDIUM PRIORITY

**Issue:** Google reCAPTCHA sends data to US servers  
**Problem:** Schrems II ruling - US is not an adequate data protection country  
**Required:** 
- Explicit mention in privacy policy
- Alternative: EU-based CAPTCHA (hCaptcha with EU option, or Friendly Captcha)

---

### 6. Cookie Consent Banner
**Risk:** Insufficient granularity  
**Status:** MEDIUM PRIORITY

**Current:** Necessary, Analytics, Marketing  
**Missing:**
- reCAPTCHA (should be separate category)
- Calculator functionality cookies
- No "Reject All" prominent option (required in EU)

---

### 7. Data Retention Not Stated
**Risk:** GDPR Article 5(1)(e) violation  
**Status:** MEDIUM PRIORITY

**Missing:**
- How long do you keep waitlist data?
- How long do you keep calculator data?
- When do you delete inactive contacts?

**Required:** Clear retention periods (e.g., "24 months after last contact")

---

## ✅ COMPLIANT ELEMENTS

**What You're Doing Right:**
1. ✓ Explicit consent checkbox (not pre-checked)
2. ✓ Double opt-in ready (Brevo supports this)
3. ✓ GDPR rights listed (access, erasure, etc.)
4. ✓ Contact email provided (privacy@adsengineer.cloud)
5. ✓ Cookie banner present
6. ✓ Calculator data is optional (user choice)

---

## 🛠️ REQUIRED FIXES

### Priority 1: Privacy Policy Rewrite

Create new sections:

```markdown
## 2. Information We Collect

### 2.1 Contact Information
When you join our waitlist, we collect:
- Name
- Email address
- Preferred language (locale)

Lawful basis: Consent (Art. 6(1)(a) GDPR)

### 2.2 Calculator Data (Optional)
With your explicit consent, we collect:
- Monthly advertising budget
- Shop sales figures
- Google Ads reported sales
- Calculated metrics (blindness factor, wasted budget)

Lawful basis: Consent (Art. 6(1)(a) GDPR) - separate from contact consent

Purpose: To analyze tracking gaps and provide personalized recommendations

### 2.3 Technical Data
- IP address (for reCAPTCHA security)
- Cookie preferences
- Browser information

Lawful basis: Legitimate Interest (security, Art. 6(1)(f) GDPR)

## 3. Data Processors

We use the following data processors:

| Processor | Purpose | Location | DPA |
|-----------|---------|----------|-----|
| Brevo (Sendinblue) | Email marketing | France | Yes |
| Google | reCAPTCHA security | USA | Standard Contractual Clauses |

[Link to Brevo DPA]
[Link to Google SCCs]

## 4. Data Retention

- Waitlist data: 24 months after last contact, then deleted
- Calculator data: Deleted after 12 months or upon request
- Analytics data: 26 months (anonymized after 14 months)

## 5. Your Rights

[Existing rights - KEEP]

## 6. Business Data Disclaimer

The calculator processes business financial data. By using it:
- You confirm you have authority to share this data
- Results are estimates for informational purposes only
- We are not liable for business decisions based on calculator output

## 7. International Transfers

Some data (reCAPTCHA) is processed in the USA. We use:
- Standard Contractual Clauses (SCCs)
- Additional technical safeguards
```

---

### Priority 2: Add Form Disclaimers

Add to calculator form:

```html
<p class="text-xs text-gray-500 mt-2">
  By using this calculator, you confirm you have authority to share business data. 
  Results are estimates only. 
  <a href="/privacy-policy" class="underline">Privacy Policy</a>
</p>
```

---

### Priority 3: Update Cookie Banner

Add category:
- **Security** (reCAPTCHA) - Always required, but disclosed

---

### Priority 4: Implement Double Opt-In

**Current:** Single opt-in (immediate addition to Brevo)  
**Required for EU:** Double opt-in (confirm email before adding)

Update Brevo API call:
```typescript
body: JSON.stringify({
  email: email,
  listIds: [2],
  attributes: attributes,
  updateEnabled: true,
  doubleOptin: true  // Add this
})
```

---

## 📊 Risk Assessment Matrix

| Issue | Risk Level | Fine Potential | Effort to Fix |
|-------|-----------|----------------|---------------|
| Incomplete Privacy Policy | 🔴 HIGH | Up to €20M | Medium |
| Missing DPA Reference | 🔴 HIGH | Joint liability | Low |
| Unclear Lawful Basis | 🔴 HIGH | Processing unlawful | Low |
| Business Data Liability | 🟡 MEDIUM | Lawsuit risk | Low |
| reCAPTCHA Transfer | 🟡 MEDIUM | Data transfer fine | Medium |
| Data Retention Missing | 🟡 MEDIUM | Storage limitation | Low |
| No Double Opt-In | 🟡 MEDIUM | Marketing violations | Low |

---

## 🎯 Action Plan

### Week 1 (Immediate):
1. [ ] Rewrite privacy policy with all required sections
2. [ ] Add business data disclaimer to calculator
3. [ ] Update cookie banner with security category

### Week 2:
4. [ ] Implement double opt-in for waitlist
5. [ ] Add DPA links to privacy policy
6. [ ] Test form submission with new privacy policy link

### Week 3:
7. [ ] Consider EU-based CAPTCHA alternative (Friendly Captcha)
8. [ ] Create data retention/deletion workflow
9. [ ] Document processing activities (Art. 30 GDPR record)

---

## 💡 Strategic Recommendation

**Short-term:** Fix privacy policy immediately (copy can be adapted from competitors like Plausible Analytics or Simple Analytics - both are GDPR-compliant and open source their policies)

**Long-term:** Consider a **"Privacy-First" positioning**:
- "Unlike competitors, we don't store your business data"
- "Calculator runs entirely in your browser"
- "No Google services (reCAPTCHA) - we use EU alternatives"

This could be a **competitive advantage** in the privacy-conscious EU market.

---

## Bottom Line

You're currently at HIGH legal risk. The fixes are straightforward but must be implemented before you start actively marketing. The good news: your consent mechanism is already compliant (separate, explicit, not pre-checked). You just need to document what you're doing properly.

---

**Disclaimer:** This review is for informational purposes and does not constitute legal advice. Consult with a qualified data protection attorney before implementing changes.
