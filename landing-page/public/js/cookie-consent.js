// Cookie Consent Integration with GTM
window.CookieConsent = {
  consentKey: 'adsengineer_cookie_consent',
  consent: null,

  init() {
    const stored = localStorage.getItem(this.consentKey);
    if (stored) {
      this.consent = JSON.parse(stored);
    }
    return this.consent;
  },

  acceptAll() {
    this.consent = { necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() };
    localStorage.setItem(this.consentKey, JSON.stringify(this.consent));
    this.updateConsentInGTM();
    this.dispatchEvent();
    return this.consent;
  },

  rejectAll() {
    this.consent = { necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() };
    localStorage.setItem(this.consentKey, JSON.stringify(this.consent));
    this.updateConsentInGTM();
    this.dispatchEvent();
    return this.consent;
  },

  savePreferences(prefs) {
    this.consent = { ...prefs, necessary: true, timestamp: new Date().toISOString() };
    localStorage.setItem(this.consentKey, JSON.stringify(this.consent));
    this.updateConsentInGTM();
    this.dispatchEvent();
    return this.consent;
  },

  hasConsent(type) {
    if (!this.consent) this.init();
    return this.consent?.[type] === true;
  },

  updateConsentInGTM() {
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        'event': 'cookie_consent_update',
        'consent_granted': {
          'analytics_storage': this.hasConsent('analytics') ? 'granted' : 'denied',
          'ad_storage': this.hasConsent('marketing') ? 'granted' : 'denied',
          'ad_user_data': this.hasConsent('marketing') ? 'granted' : 'denied',
          'ad_personalization': this.hasConsent('marketing') ? 'granted' : 'denied'
        }
      });
    }
  },

  dispatchEvent() {
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: this.consent
    }));
  }
};

// Initialize immediately
window.CookieConsent.init();