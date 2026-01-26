# Landing Page - Tracking Scripts

**Source:** `landing-page/src/layouts/Layout.astro` (embedded scripts)

---

## Page Visit Tracking

### API Endpoint
```
POST https://adsengineer-cloud.adsengineer.workers.dev/api/v1/tracking/page-visit
```

### Data Collected

#### On Page Load
```javascript
{
  sessionId: "session_1706234567890_abc123xyz",
  userId: "user_1706234567890_xyz789abc",
  pageUrl: "https://adsengineer.cloud/about",
  pageTitle: "About AdsEngineer",
  referrer: "https://google.com/search?q=attribution",
  userAgent: "Mozilla/5.0...",
  screenResolution: "1920x1080",
  viewportSize: "1200x800",
  timeZone: "Europe/Vienna",
  language: "en-US",
  isEntryPage: true,
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "attribution-q1",
  utmContent: "ad-variant-a",
  utmTerm: "marketing attribution",
  gclid: "EAIaIQobChMI...",
  fbclid: null
}
```

#### On Page Exit
```javascript
{
  sessionId: "session_1706234567890_abc123xyz",
  userId: "user_1706234567890_xyz789abc",
  pageUrl: "https://adsengineer.cloud/about",
  pageTitle: "About AdsEngineer",
  timeOnPage: 45,        // seconds
  scrollDepth: 78,       // percentage
  interactions: 12,      // click/keydown count
  isExitPage: true
}
```

---

## Full Tracking Script

```javascript
// AdsEngineer Page Visit Tracking
(function() {
  'use strict';

  const API_BASE = 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/tracking';

  // Generate anonymous user ID (persistent across sessions)
  function getUserId() {
    let userId = localStorage.getItem('adsengineer_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('adsengineer_user_id', userId);
    }
    return userId;
  }

  // Generate session ID (new per browser session)
  function getSessionId() {
    let sessionId = sessionStorage.getItem('adsengineer_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('adsengineer_session_id', sessionId);
    }
    return sessionId;
  }

  // Get UTM parameters from URL
  function getUtmParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign'),
      utmContent: urlParams.get('utm_content'),
      utmTerm: urlParams.get('utm_term'),
      gclid: urlParams.get('gclid'),
      fbclid: urlParams.get('fbclid')
    };
  }

  // Track page visit
  function trackPageVisit() {
    const data = {
      sessionId: getSessionId(),
      userId: getUserId(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      isEntryPage: !sessionStorage.getItem('adsengineer_page_tracked'),
      ...getUtmParams()
    };

    sessionStorage.setItem('adsengineer_page_tracked', 'true');

    fetch(`${API_BASE}/page-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.log('Tracking error:', err));
  }

  // Engagement metrics
  let startTime = Date.now();
  let interactions = 0;
  let scrollDepth = 0;

  function trackInteraction() {
    interactions++;
  }

  function trackScroll() {
    const scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
    scrollDepth = Math.max(scrollDepth, scrolled);
  }

  // Track exit data with keepalive
  window.addEventListener('beforeunload', function() {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);

    fetch(`${API_BASE}/page-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        userId: getUserId(),
        pageUrl: window.location.href,
        pageTitle: document.title,
        timeOnPage: timeOnPage,
        scrollDepth: Math.round(scrollDepth),
        interactions: interactions,
        isExitPage: true
      }),
      keepalive: true // Critical: Send even after page unload
    }).catch(err => console.log('Exit tracking error:', err));
  });

  // Event listeners
  document.addEventListener('click', trackInteraction);
  document.addEventListener('scroll', trackScroll);
  document.addEventListener('keydown', trackInteraction);

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageVisit);
  } else {
    trackPageVisit();
  }
})();
```

---

## Cal.com Integration

### Initialization
```javascript
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.q = cal.q || [];
      cal.loaded = true;
    }
    if (ar[0] === "init") {
      let api = d.createElement("script");
      api.src = A;
      api.async = true;
      d.head.appendChild(api);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "Cal");

Cal("init", { origin: "https://app.cal.com" });
```

### UI Configuration
```javascript
Cal("ui", { 
  styles: { branding: { brandColor: "#000000" } }, 
  hideEventTypeDetails: false, 
  layout: "month_view" 
});
```

### Floating Button
```javascript
Cal("floatingButton", {
  calLink: "stefan-pirker-nmurov/30min",
  buttonText: "Book a Call",
  buttonColor: "#9333ea",      // Purple
  buttonTextColor: "#ffffff",
  buttonPosition: "bottom-left"
});
```

### Inline Button Usage
```html
<button 
  data-cal-link="stefan-pirker-nmurov/30min" 
  data-cal-config='{"layout":"month_view"}'
>
  Book a Call
</button>
```

---

## Particles.js Configuration

```javascript
particlesJS('particles-js', {
  "particles": {
    "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
    "color": { "value": "#ffffff" },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.5, "random": false },
    "size": { "value": 3, "random": true },
    "line_linked": { 
      "enable": true, 
      "distance": 150, 
      "color": "#ffffff", 
      "opacity": 0.4, 
      "width": 1 
    },
    "move": { 
      "enable": true, 
      "speed": 2, 
      "direction": "none", 
      "random": false, 
      "straight": false, 
      "out_mode": "out", 
      "bounce": false 
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": { 
      "onhover": { "enable": true, "mode": "repulse" }, 
      "onclick": { "enable": true, "mode": "push" }, 
      "resize": true 
    },
    "modes": { 
      "repulse": { "distance": 200, "duration": 0.4 }, 
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});
```

---

## Storage Keys

| Key | Storage | Purpose |
|-----|---------|---------|
| `adsengineer_user_id` | localStorage | Persistent anonymous user ID |
| `adsengineer_session_id` | sessionStorage | Per-session ID |
| `adsengineer_page_tracked` | sessionStorage | Entry page flag |
| `adsengineer_cookie_consent` | localStorage | Cookie preferences |
