# Shopify SEO Auditor with Universal SST

A comprehensive SEO analysis tool for Shopify stores with integrated server-side tracking implementation.

## 🎯 Overview

This package provides two main components:
1. **Shopify SEO Auditor** - Advanced SEO analysis with Shopify-specific insights
2. **Universal SST Snippet** - Server-side tracking with authentication

## 🚀 Installation

```bash
npm install shopify-seo-auditor
```

## 📋 Shopify SEO Auditor Usage

### Command Line
```bash
# Audit any Shopify store
shopify-seo-auditor -u https://store.com -d store.myshopify.com

# Save report to file
shopify-seo-auditor -u https://store.com -o report.json

# Skip performance for faster analysis
shopify-seo-auditor -u https://store.com --no-performance
```

### Programmatic
```javascript
import ShopifySEOAuditor from 'shopify-seo-auditor';

const auditor = new ShopifySEOAuditor();
const report = await auditor.auditStore('https://store.com', 'store.myshopify.com');
```

## 🌐 Universal SST Implementation

### Step 1: Add Snippet to Any Website
```html
<!-- Universal tracking - works on any platform -->
<script>
  // Automatically handles site ID detection and authentication
  // Add your unique site ID here
  var siteId = 'your-unique-site-id';
  
  // Or use meta tag
  /*
  <meta name="adsengineer-site-id" content="your-unique-site-id">
  */
  
  (function() {
    var script = document.createElement('script');
    script.src = 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js';
    script.setAttribute('data-site-id', siteId);
    document.head.appendChild(script);
  })();
</script>
```

### Step 2: Register Site on Server
```javascript
// Site registration API
const response = await fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/sst/sites', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domain: 'your-domain.com',
    name: 'Your Site Name'
  })
});

const { siteId } = await response.json();
console.log('Site registered:', siteId);
```

### Step 3: Use Universal Tracking API
```javascript
// Once authenticated, tracking becomes available
AdsEngineer.pageView({
  source: 'google',
  campaign: 'spring_sale'
});

AdsEngineer.track('button_click', {
  element: 'cta_button',
  text: 'Buy Now'
});

AdsEngineer.conversion({
  value: 99.99,
  currency: 'USD',
  orderId: 'ORDER_123',
  products: [
    { id: 'PROD_1', name: 'Product 1', price: 49.99 },
    { id: 'PROD_2', name: 'Product 2', price: 50.00 }
  ]
});

// User identification
AdsEngineer.identify('user_123', {
  email: 'customer@example.com',
  plan: 'premium'
});
```

## 🔐 Authentication & Security

### Server-Side Validation
- Site ID verification against registered domains
- Domain matching enforcement
- Session-based authentication with expiration
- API key management for dashboard access

### Privacy by Design
- No PII sent without explicit tracking
- Local cookie storage only
- GDPR-compliant consent integration
- Automatic data cleanup

## 📊 Combined Implementation Example

```javascript
// 1. SEO Auditor with SST Integration
import ShopifySEOAuditor from 'shopify-seo-auditor';

const auditor = new ShopifySEOAuditor();

async function auditAndTrack(storeUrl, siteId) {
  // Run comprehensive SEO audit
  const auditReport = await auditor.auditStore(storeUrl);
  
  // Set up tracking on the same site
  const trackingScript = `
    <script>
      window.adsengineer_site_id = '${siteId}';
      (function() {
        var script = document.createElement('script');
        script.src = 'https://adsengineer-cloud.adsengineer.workers.dev/universal-tracking-snippet.js';
        document.head.appendChild(script);
      })();
    </script>
  `;
  
  console.log('SEO Score:', auditReport.scores.overall);
  console.log('Tracking Script Ready');
  
  return {
    audit: auditReport,
    trackingCode: trackingScript
  };
}

// Usage
const result = await auditAndTrack(
  'https://mystore.com',
  'site-abc-123-def'
);
```

## 🛠️ Deployment

### SEO Auditor API (Cloudflare Workers)
```bash
# Deploy SST API
npm install
wrangler deploy

# With custom environment
wrangler deploy --env production
```

### Tracking Snippet Distribution
```html
<!-- Option 1: Direct CDN -->
<script src="https://your-cdn.com/universal-tracking-snippet.js" data-site-id="your-site-id"></script>

<!-- Option 2: Dynamic loading -->
<script>
  !function(a,b,c,d){function e(a){return"object"==typeof a?null:a===b?null:"function"==typeof c?c(b):b}function f(a){var b=a.split("."),c=d;2===b.length&&(c=c[b[0]],a=b[1]);1<b.length&&(c=a in c?c[a]:c[a]);return e(c)}function g(a,b,c,d){var e="number"==typeof b[b],f=2===a.length?"":a[0];e&&(b[d]=e);c&&console.warn("Missing required param: "+d)}var h=c;"undefined"!=typeof window?window:this;"undefined"!=typeof window.document&&(h=this.document);var i=function(a,b){a=h.createElement(a);if(b)for(var c in b)b.hasOwnProperty(c)&&a.setAttribute(c,b[c]);return a},j=function(a,b){function c(){if(!d){try{d=setTimeout(c,100)}catch(a){}}b?b():c()}var d=0;return{promise:new Promise(function(e){d=e}),check:c,settle:c}};var k=function(a){return a&&a.then?a():Promise.resolve(a)};var l=function(){var a,b=havigator.userAgent,c={};return/MSIE|Trident/.test(b)?(c.ie=!0,c.version=parseFloat(/MSIE \d+(\.\d+)?;/.exec(b)[1])):/Edge/.test(b)&&(c.edge=!0,c.version=parseFloat(/Edge\/(\d+(\.\d+)?)/.exec(b)[1])):/Chrome/.test(b)&&!/OPR/.test(b)?(c.chrome=!0,c.version=parseFloat(/Chrome\/(\d+(\.\d+)?)/.exec(b)[1])):/Safari/.test(b)?(c.safari=!0,c.version=parseFloat(/Version\/(\d+(\.\d+)?)/.exec(b)[1])):/Firefox/.test(b)?(c.firefox=!0,c.version=parseFloat(/Firefox\/(\d+(\.\d+)?)/.exec(b)[1])):(c.unknown=!0,c.version=0/0),c};var m=function(a,b){var c="";try{c=new ActiveXObject("Msxml2.XMLHTTP")}catch(d){c=new XMLHttpRequest}c.onreadystatechange=b;c.open("GET",a,!0),c.send()},n=function(a,b,c){var d,e;e=void 0===b?!0:b;try{d=new XMLHttpRequest}catch(f){return}d.onreadystatechange=function(){4===d.readyState&&200===d.status?c(d.responseText,0):c(null,1)},d.open("GET",a,!0),d.setRequestHeader("Content-Type","application/json"),d.timeout=e,d.send()},o=function(a,b){var c=a.join("&");return fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b),keepalive:!0}).then(function(a){return a.json()}).then(function(a){return a}).catch(b)},p=function(a,b,c,d,e){var f;if(navigator.sendBeacon)f=navigator.sendBeacon(a,JSON.stringify(c));else{var g=new XMLHttpRequest;g.open("POST",a,!0),g.setRequestHeader("Content-Type","application/json"),g.timeout=e||1e4,g.onreadystatechange=function(){4===g.readyState&&200===g.status&&b&&b(d)},g.send(JSON.stringify(c))}};var q=function(a,b){if(!b||a.length>b)return a.slice(0,b);var c=a.lastIndexOf(".");return-1===c?a:a.substring(c+1)},r=["_gaq","dataLayer","optimizely","fpr","adobe_dc"],s=function(){function a(b,c){function d(){if(!c[b])return;c[b]=!0}var e=setInterval(function(){if(!c[b])return d();try{var a=b in c?c[b]:c.console;a&&a.error&&a.error.call(a,"console is not available")},1e3)}function e(a,b,c){var d=b?e:f;d(a,b,c)}function f(a,b){var c=b?e:f;return c(a,b)}function g(){c.install&&c.install.call(c)}function h(){c.uninstall&&c.uninstall.call(c)}c={install:g,uninstall:h,trigger:d,off:e,on:f}}return a(window,window.document,navigator)};var t=function(a){function b(b,c){try{c?h.trigger(b,c):h.trigger(b)}catch(d){console.error("Unable to trigger event: "+b)}}function c(b,c){var d=window.adsEngineerSiteId||"default";return a+(b?"?"+encodeURIComponent(JSON.stringify(c)):"?site_id="+encodeURIComponent(d))}function d(a){var b=h.createElement("img");b.style.display="none",b.src=a,h.body.appendChild(b)}function e(){function a(){return!0===f?"function"==typeof window.attachEvent:void 0!==window.addEventListener}function b(a,c){var d=c?a:c:"load";window.attachEvent("on"+d,a)}function c(a,c){window.addEventListener?window.addEventListener(c,a,!1):window.attachEvent("on"+c,a)}function g(){var a,b,c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";return a.substring(0,c.length)}function i(a,b){var c,d;for(c=[],a=new Uint8Array(a),b=new Uint8Array(b),d=0;d<a.length;++d)c[d]=a.charCodeAt(d);for(d=0;d<b.length;++d)b[d]=b.charCodeAt(d);return c}function j(a){try{var b={};b.accountId=h.accountId,b.trackingServer=a;b=c?b||window.adsEngineerConfig||{};var d={accountId:b.accountId,trackingServer:b.trackingServer};d.siteId=g.siteId;d.url=window.location.href;d.referrer=document.referrer;d.title=document.title;d.timestamp=(new Date).getTime();n("pageview",d,!0)}catch(k){console.error("Pageview tracking failed",k)}}a.exports={configure:function(a){h=a},init:function(){a&&h.accountId||(h.siteId=f()),e("script",function(a){j(b.trackingServer+"a.js",!0,function(){j(b.trackingServer+"c.js",!0,function(){i(d(a))})})},track:function(a,b,c){if(!a||!h.accountId)return;var d=h.accountId,e=b||{},f=c||{},g=a.toLowerCase();"pageview"===g?j(e):"event"===g?k(a,e):n(a,e,f)},trackPage:j,trackEvent:k}}(this,this.document));
</script>
```

## 📈 Benefits

### For Service Providers
- **Universal Distribution**: One snippet works everywhere
- **Easy Onboarding**: Simple site ID registration
- **Secure Access**: Server-side authentication
- **Scalable**: Cloudflare Workers infrastructure
- **Privacy-First**: No data shared without consent

### For Customers
- **Platform Agnostic**: Works with any website builder
- **Fast Integration**: Copy-paste implementation
- **GDPR Ready**: Built-in consent management
- **Reliable**: Automatic retry and error recovery
- **Performance Optimized**: Batching and beacon API usage

---

This combined solution provides both comprehensive SEO analysis for Shopify stores and a universal tracking system that can be distributed to any website platform with simple authentication.