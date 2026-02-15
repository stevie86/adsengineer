# GDPR-Compliant Privacy Policy Content

**Purpose:** Complete privacy policy content for `landing-page/src/pages/privacy-policy.astro`  
**Status:** Ready for implementation  
**Addresses:** All 7 critical compliance issues from legal review

---

## Implementation Instructions

Replace the content in `landing-page/src/pages/privacy-policy.astro` with the Astro component below. This addresses all missing sections identified in the legal review:

- ✅ Data collection disclosure (contact, calculator, technical)
- ✅ Data processor disclosure (Brevo, Google reCAPTCHA)
- ✅ Lawful basis documentation
- ✅ Data retention periods
- ✅ Business data disclaimer
- ✅ International transfer safeguards
- ✅ Article 30 processing record

---

## Complete Astro Component

```astro
---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="Privacy Policy - AdsEngineer">
  <Header />
  <main class="container mx-auto px-4 py-16 max-w-4xl">
    <h1 class="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
    
    <div class="prose prose-invert prose-purple max-w-none">
      <p class="text-gray-300 mb-8">Last updated: February 13, 2026</p>

      <!-- Section 1: Introduction -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p class="text-gray-300 mb-4">
          AdsEngineer ("we", "our", or "us") is committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
        </p>
        <p class="text-gray-300">
          <strong class="text-white">Data Controller:</strong> AdsEngineer GmbH<br />
          <strong class="text-white">Contact:</strong> <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a><br />
          <strong class="text-white">Data Protection Officer:</strong> <a href="mailto:dpo@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">dpo@adsengineer.cloud</a>
        </p>
      </section>

      <!-- Section 2: Information We Collect -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
        
        <h3 class="text-xl font-semibold text-white mb-3">2.1 Contact Information</h3>
        <p class="text-gray-300 mb-4">
          When you join our waitlist or contact us, we collect:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Name</li>
          <li>Email address</li>
          <li>Preferred language (locale)</li>
        </ul>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Lawful Basis:</strong> Consent (Article 6(1)(a) GDPR)<br />
          <strong class="text-white">Purpose:</strong> To communicate with you about our services, send product updates, and respond to your inquiries
        </p>

        <h3 class="text-xl font-semibold text-white mb-3">2.2 Calculator Data (Optional)</h3>
        <p class="text-gray-300 mb-4">
          With your explicit consent, when you use our ROI calculator, we may collect:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Monthly advertising budget</li>
          <li>Shop sales figures</li>
          <li>Google Ads reported sales</li>
          <li>Calculated metrics (blindness factor, wasted budget estimates)</li>
        </ul>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Lawful Basis:</strong> Consent (Article 6(1)(a) GDPR) - separate from contact consent<br />
          <strong class="text-white">Purpose:</strong> To analyze tracking gaps and provide personalized recommendations<br />
          <strong class="text-white">Note:</strong> Calculator data collection is entirely optional and separate from waitlist signup
        </p>

        <h3 class="text-xl font-semibold text-white mb-3">2.3 Technical Data</h3>
        <p class="text-gray-300 mb-4">
          For security and functionality purposes, we automatically collect:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>IP address (for reCAPTCHA security verification)</li>
          <li>Browser information and device type</li>
          <li>Cookie preferences</li>
          <li>Pages visited and interaction data</li>
        </ul>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Lawful Basis:</strong> Legitimate Interest (Article 6(1)(f) GDPR)<br />
          <strong class="text-white">Purpose:</strong> Security, fraud prevention, and website functionality
        </p>
      </section>

      <!-- Section 3: Data Processors -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">3. Data Processors and Third Parties</h2>
        <p class="text-gray-300 mb-4">
          We use the following third-party data processors to provide our services:
        </p>
        
        <div class="overflow-x-auto mb-4">
          <table class="min-w-full bg-gray-800/50 border border-gray-700 rounded-lg">
            <thead>
              <tr class="bg-gray-700/50">
                <th class="px-4 py-3 text-left text-white font-semibold">Processor</th>
                <th class="px-4 py-3 text-left text-white font-semibold">Purpose</th>
                <th class="px-4 py-3 text-left text-white font-semibold">Location</th>
                <th class="px-4 py-3 text-left text-white font-semibold">DPA</th>
              </tr>
            </thead>
            <tbody class="text-gray-300">
              <tr class="border-t border-gray-700">
                <td class="px-4 py-3">Brevo (Sendinblue)</td>
                <td class="px-4 py-3">Email marketing and contact management</td>
                <td class="px-4 py-3">France (EU)</td>
                <td class="px-4 py-3">
                  <a href="https://www.brevo.com/legal/termsofuse/" class="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener">View DPA</a>
                </td>
              </tr>
              <tr class="border-t border-gray-700">
                <td class="px-4 py-3">Google reCAPTCHA</td>
                <td class="px-4 py-3">Security and fraud prevention</td>
                <td class="px-4 py-3">USA</td>
                <td class="px-4 py-3">
                  <a href="https://cloud.google.com/terms/data-processing-addendum" class="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener">View DPA</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-gray-300">
          All data processors are contractually bound to process your data only according to our instructions and in compliance with GDPR requirements.
        </p>
      </section>

      <!-- Section 4: Data Retention -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">4. Data Retention Periods</h2>
        <p class="text-gray-300 mb-4">
          We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong class="text-white">Waitlist data:</strong> 24 months after last contact, then automatically deleted</li>
          <li><strong class="text-white">Calculator data:</strong> 12 months or upon request, whichever comes first</li>
          <li><strong class="text-white">Analytics data:</strong> 26 months (anonymized after 14 months)</li>
          <li><strong class="text-white">Consent records:</strong> 5 years after withdrawal (for legal compliance)</li>
        </ul>
        <p class="text-gray-300">
          You can request deletion of your data at any time by contacting <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a>.
        </p>
      </section>

      <!-- Section 5: Your GDPR Rights -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">5. Your Rights Under GDPR</h2>
        <p class="text-gray-300 mb-4">
          Under the General Data Protection Regulation, you have the following rights:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-3 mb-4">
          <li>
            <strong class="text-white">Right to Access (Article 15):</strong> Request a copy of all personal data we hold about you
          </li>
          <li>
            <strong class="text-white">Right to Rectification (Article 16):</strong> Correct any inaccurate or incomplete data
          </li>
          <li>
            <strong class="text-white">Right to Erasure (Article 17):</strong> Request deletion of your personal data ("right to be forgotten")
          </li>
          <li>
            <strong class="text-white">Right to Restrict Processing (Article 18):</strong> Request that we pause processing of your data
          </li>
          <li>
            <strong class="text-white">Right to Data Portability (Article 20):</strong> Receive your data in a machine-readable format
          </li>
          <li>
            <strong class="text-white">Right to Object (Article 21):</strong> Object to processing based on legitimate interests
          </li>
          <li>
            <strong class="text-white">Right to Withdraw Consent:</strong> Withdraw your consent at any time without affecting prior processing
          </li>
        </ul>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">How to Exercise Your Rights:</strong><br />
          Email us at <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a> with your request. We will respond within 30 days as required by GDPR.
        </p>
        <p class="text-gray-300">
          <strong class="text-white">Right to Lodge a Complaint:</strong><br />
          If you believe we have not handled your data properly, you have the right to lodge a complaint with your local supervisory authority. For Austria: <a href="https://www.dsb.gv.at/" class="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener">Österreichische Datenschutzbehörde</a>
        </p>
      </section>

      <!-- Section 6: Business Data Disclaimer -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">6. Business Data Disclaimer</h2>
        <p class="text-gray-300 mb-4">
          Our ROI calculator processes business financial data. By using the calculator, you confirm and agree that:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>You have the authority to share the business data you enter</li>
          <li>Calculator results are estimates for informational purposes only</li>
          <li>We are not liable for business decisions made based on calculator output</li>
          <li>The calculator does not constitute financial, legal, or business advice</li>
        </ul>
        <p class="text-gray-300">
          <strong class="text-white">Limitation of Liability:</strong> AdsEngineer is not responsible for any losses, damages, or consequences arising from the use of calculator estimates or recommendations.
        </p>
      </section>

      <!-- Section 7: International Data Transfers -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">7. International Data Transfers</h2>
        <p class="text-gray-300 mb-4">
          Some of our data processors are located outside the European Economic Area (EEA):
        </p>
        
        <h3 class="text-xl font-semibold text-white mb-3">7.1 Transfers to the USA</h3>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Google reCAPTCHA:</strong> Data is transferred to Google LLC in the United States for security verification purposes.
        </p>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Safeguards in Place:</strong>
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>
            <strong class="text-white">Standard Contractual Clauses (SCCs):</strong> Google has implemented EU-approved Standard Contractual Clauses as required by the Schrems II ruling. 
            <a href="https://cloud.google.com/terms/eu-model-contract-clause" class="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener">View Google SCCs</a>
          </li>
          <li>
            <strong class="text-white">Technical Safeguards:</strong> Data encryption in transit (TLS 1.3) and at rest (AES-256)
          </li>
          <li>
            <strong class="text-white">Minimization:</strong> Only IP address and browser fingerprint are transferred, no personal identifiers
          </li>
        </ul>

        <h3 class="text-xl font-semibold text-white mb-3">7.2 EU Data Residency</h3>
        <p class="text-gray-300">
          All other data (contact information, calculator data, consent records) is stored exclusively within the European Union via Brevo (France) and Cloudflare (EU data centers).
        </p>
      </section>

      <!-- Section 8: Cookie Usage -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">8. Cookie Usage</h2>
        <p class="text-gray-300 mb-4">
          We use cookies to enhance your browsing experience. You have full control over cookie preferences through our consent banner.
        </p>
        
        <h3 class="text-xl font-semibold text-white mb-3">Cookie Categories</h3>
        <ul class="list-disc list-inside text-gray-300 space-y-3 mb-4">
          <li>
            <strong class="text-white">Necessary Cookies:</strong> Required for the website to function (e.g., session management, cookie consent preferences). These cannot be disabled.
          </li>
          <li>
            <strong class="text-white">Security Cookies:</strong> reCAPTCHA fraud prevention (required for form submission, but disclosed for transparency).
          </li>
          <li>
            <strong class="text-white">Functionality Cookies:</strong> Calculator state persistence, language preferences (optional, requires consent).
          </li>
          <li>
            <strong class="text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our website (optional, requires consent).
          </li>
          <li>
            <strong class="text-white">Marketing Cookies:</strong> Used to deliver personalized advertisements (optional, requires consent).
          </li>
        </ul>
        <p class="text-gray-300">
          You can update your cookie preferences at any time by clicking "Cookie Settings" in our footer.
        </p>
      </section>

      <!-- Section 9: Data Security -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">9. Data Security</h2>
        <p class="text-gray-300 mb-4">
          We implement appropriate technical and organizational measures to protect your personal data:
        </p>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong class="text-white">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
          <li><strong class="text-white">Access Controls:</strong> Role-based access with multi-factor authentication</li>
          <li><strong class="text-white">Audit Logging:</strong> All data access and processing activities are logged</li>
          <li><strong class="text-white">Regular Security Audits:</strong> Penetration testing and vulnerability assessments</li>
          <li><strong class="text-white">Data Minimization:</strong> We only collect data that is necessary for our services</li>
        </ul>
      </section>

      <!-- Section 10: Records of Processing Activities (Article 30) -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">10. Records of Processing Activities (Article 30 GDPR)</h2>
        <p class="text-gray-300 mb-4">
          As required by Article 30 GDPR, we maintain records of all data processing activities:
        </p>
        
        <h3 class="text-xl font-semibold text-white mb-3">Data Controller Information</h3>
        <p class="text-gray-300 mb-4">
          <strong class="text-white">Name:</strong> AdsEngineer GmbH<br />
          <strong class="text-white">Contact:</strong> <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a><br />
          <strong class="text-white">DPO:</strong> <a href="mailto:dpo@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">dpo@adsengineer.cloud</a>
        </p>

        <h3 class="text-xl font-semibold text-white mb-3">Processing Purposes</h3>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Waitlist management and customer communication</li>
          <li>ROI calculator analysis and personalized recommendations</li>
          <li>Website analytics and performance optimization</li>
          <li>Security and fraud prevention</li>
          <li>GDPR compliance and audit logging</li>
        </ul>

        <h3 class="text-xl font-semibold text-white mb-3">Data Categories Processed</h3>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Contact information (name, email, locale)</li>
          <li>Business financial data (optional, calculator only)</li>
          <li>Technical data (IP address, browser info, cookies)</li>
          <li>Consent records and timestamps</li>
        </ul>

        <h3 class="text-xl font-semibold text-white mb-3">Data Recipients</h3>
        <ul class="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Brevo (email marketing processor, France)</li>
          <li>Google (reCAPTCHA security processor, USA with SCCs)</li>
          <li>Cloudflare (hosting and CDN, EU data centers)</li>
        </ul>
      </section>

      <!-- Section 11: Changes to This Policy -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">11. Changes to This Privacy Policy</h2>
        <p class="text-gray-300">
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new policy on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
        </p>
      </section>

      <!-- Section 12: Contact Us -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
        <p class="text-gray-300 mb-4">
          For any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
        </p>
        <p class="text-gray-300">
          <strong class="text-white">Email:</strong> <a href="mailto:privacy@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">privacy@adsengineer.cloud</a><br />
          <strong class="text-white">Data Protection Officer:</strong> <a href="mailto:dpo@adsengineer.cloud" class="text-purple-400 hover:text-purple-300">dpo@adsengineer.cloud</a><br />
          <strong class="text-white">Response Time:</strong> We will respond to all requests within 30 days as required by GDPR
        </p>
      </section>
    </div>
  </main>
  <Footer />
</Layout>
```

---

## Validation Checklist

Before deploying, verify the following:

- [ ] All 7 sections from legal review are present
- [ ] Data processors table includes Brevo and Google with DPA links
- [ ] Retention periods are specified for each data category
- [ ] Lawful basis is documented for each processing activity
- [ ] International transfer safeguards are documented
- [ ] Article 30 processing record information is complete
- [ ] Contact information is correct (privacy@adsengineer.cloud)
- [ ] All internal links work
- [ ] All external links open in new tabs with rel="noopener"
- [ ] Content is readable and professionally formatted

---

## Legal Review Compliance Matrix

| Legal Issue | Section | Status |
|-------------|---------|--------|
| Incomplete privacy policy | Sections 2-10 | ✅ Fixed |
| Missing DPA reference | Section 3 (table) | ✅ Fixed |
| Unclear lawful basis | Section 2 (all subsections) | ✅ Fixed |
| Business data liability | Section 6 | ✅ Fixed |
| reCAPTCHA compliance | Section 7.1 | ✅ Fixed |
| Data retention missing | Section 4 | ✅ Fixed |
| Article 30 record | Section 10 | ✅ Fixed |

---

## Next Steps

1. Copy this content to `landing-page/src/pages/privacy-policy.astro`
2. Test the page renders correctly
3. Verify all links work
4. Update DPA links if Brevo/Google URLs change
5. Proceed to Task 2 (Calculator Form Disclaimers)
