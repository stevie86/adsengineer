# Landing Page - Components

**Source:** `landing-page/src/components/`

---

## Header.astro

**Purpose:** Fixed navigation header with logo, nav links, language switcher, CTA

```astro
<header class="fixed top-0 left-0 w-full z-50 bg-[#0B0B15]/80 backdrop-blur-md border-b border-white/5">
  <div class="container mx-auto px-6 py-4 flex justify-between items-center">
    <a href="/" class="flex items-center gap-2 group">
      <span class="text-2xl group-hover:scale-110 transition-transform">⚡</span>
      <span class="font-bold text-xl text-white tracking-tight">AdsEngineer<span class="text-purple-500">.cloud</span></span>
    </a>
    
    <div class="flex items-center gap-8">
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
        <a href="#how-it-works" class="hover:text-white transition-colors" data-i18n="nav.features">Features</a>
        <a href="#pricing" class="hover:text-white transition-colors" data-i18n="nav.pricing">Pricing</a>
      </nav>

      <div class="flex items-center gap-4 border-l border-white/10 pl-8">
        <div class="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <button class="lang-btn" data-lang="en">EN</button>
          <span class="text-gray-600">/</span>
          <button class="lang-btn" data-lang="de">DE</button>
        </div>
        <button data-cal-link="adsengineer/30min" data-cal-config='{"layout":"month_view"}' class="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-cyan-500 hover:to-purple-600 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg hover:shadow-purple-500/20" data-i18n="nav.getStarted">
          Book Call
        </button>
      </div>
    </div>
  </div>
</header>
<div class="h-20"></div>

<style>
  .lang-btn.active {
    @apply text-white;
  }
  .lang-btn:not(.active) {
    @apply text-gray-500 hover:text-gray-300;
  }
</style>
```

### Header Features
- Fixed position with backdrop blur
- Logo with hover animation
- Desktop-only navigation (hidden on mobile)
- EN/DE language switcher
- Gradient CTA button with Cal.com integration

---

## Footer.astro

**Purpose:** Simple footer with copyright, privacy link, cookie settings, deploy ID

```astro
<footer class="bg-gray-800 text-white p-4 text-center">
  <p>&copy; 2026 AdsEngineer. All rights reserved.</p>
  <p class="text-xs text-gray-400 mt-2">
    <a href="/privacy-policy" class="hover:text-white">Privacy Policy</a> · 
    <button id="open-cookie-settings" class="hover:text-white">Cookie Settings</button>
  </p>
  <p id="deploy-id" class="text-[10px] text-gray-600 mt-1 font-mono">
    <!-- Deploy ID injected at build time -->
  </p>
</footer>

<script>
  import { DEPLOY_ID } from '../deploy-id.js';
  
  document.getElementById('deploy-id').textContent = `Deploy: ${DEPLOY_ID}`;

  document.getElementById('open-cookie-settings')?.addEventListener('click', () => {
    localStorage.removeItem('adsengineer_cookie_consent');
    window.location.reload();
  });
</script>
```

### Footer Features
- Copyright notice
- Privacy policy link
- Cookie settings reset button
- Deploy ID for version tracking

---

## CookieConsent.astro

**Purpose:** GDPR-compliant cookie consent banner with granular preferences

```astro
---
interface Props {
  show?: boolean;
}

const { show = true } = Astro.props;
---

{show && (
  <div id="cookie-consent-banner" class="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 hidden">
    <div class="max-w-6xl mx-auto bg-[#1a1a2e] border border-gray-700 rounded-2xl p-6 md:p-8 shadow-2xl">
      <div class="flex flex-col md:flex-row gap-6 items-start">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-white mb-2">🍪 Cookie Preferences</h3>
          <p class="text-gray-300 text-sm mb-4">
            We use cookies to improve your experience. 
            <a href="/privacy-policy" class="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
          </p>
          
          <div id="cookie-preferences" class="hidden space-y-3 mt-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked disabled class="w-4 h-4 accent-purple-500">
              <span class="text-sm text-gray-300">Necessary (always active)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="consent-analytics" class="w-4 h-4 accent-purple-500">
              <span class="text-sm text-gray-300">Analytics - Help us improve</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="consent-marketing" class="w-4 h-4 accent-purple-500">
              <span class="text-sm text-gray-300">Marketing - Personalised content</span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-3 min-w-[200px]">
          <div id="cookie-buttons" class="flex flex-col gap-3">
            <button id="cookie-accept-all" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-all">
              Accept All
            </button>
            <button id="cookie-reject-all" class="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all">
              Reject All
            </button>
            <button id="cookie-manage" class="text-purple-400 hover:text-purple-300 text-sm font-medium">
              Manage Preferences
            </button>
          </div>

          <div id="cookie-save-btn" class="hidden">
            <button id="cookie-save-preferences" class="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-6 rounded-xl transition-all">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

### Cookie Consent API

```javascript
window.CookieConsent = {
  consentKey: 'adsengineer_cookie_consent',
  
  init(),           // Load stored consent
  acceptAll(),      // Accept all cookies
  rejectAll(),      // Reject optional cookies  
  savePreferences(prefs), // Save custom preferences
  hasConsent(type), // Check specific consent
  showBanner(),     // Should banner be shown?
  reset()           // Clear consent
};

// Events
window.addEventListener('cookie-consent-updated', (e) => {
  console.log(e.detail); // { necessary: true, analytics: true, marketing: false }
});
```

### Cookie Categories
| Category | Required | Default | Purpose |
|----------|----------|---------|---------|
| Necessary | Yes | Always on | Session, security |
| Analytics | No | Off | Usage tracking |
| Marketing | No | Off | Personalization |

---

## WhatsAppButton.astro

**Purpose:** Floating WhatsApp contact button with pulse animation

```astro
---
---
<a
  href="https://wa.me/351934743992?text=Hello!%20I%20need%20help%20with%20my%20ad%20attribution%20and%20would%20like%20to%20schedule%20a%20non-binding%20appointment%20to%20discuss%20how%20AdsEngineer%20can%20help."
  target="_blank"
  rel="noopener noreferrer"
  class="whatsapp-float"
  aria-label="Contact us on WhatsApp"
>
  <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..." />
  </svg>
</a>

<style>
  .whatsapp-float {
    position: fixed;
    width: 60px;
    height: 60px;
    bottom: 40px;
    right: 40px;
    background-color: #25d366;
    color: #fff;
    border-radius: 50px;
    text-align: center;
    font-size: 30px;
    box-shadow: 2px 2px 3px #999;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.3s ease;
    animation: pulse-green 2s infinite;
  }

  .whatsapp-float:hover {
    background-color: #128c7e;
    transform: scale(1.1);
  }

  @keyframes pulse-green {
    0% {
      box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
    }
    70% {
      box-shadow: 0 0 0 15px rgba(37, 211, 102, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
    }
  }

  @media (max-width: 768px) {
    .whatsapp-float {
      width: 50px;
      height: 50px;
      bottom: 20px;
      right: 20px;
    }
  }
</style>
```

### WhatsApp Configuration
- **Phone:** +351 934 743 992
- **Pre-filled message:** "Hello! I need help with my ad attribution and would like to schedule a non-binding appointment to discuss how AdsEngineer can help."
- **Position:** Fixed, bottom-right
- **Animation:** Green pulse effect
