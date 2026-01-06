<!-- AdsEngineer Keyword Tracking for MyCannaby -->
<!-- Version: 1.0.0 - Simple Implementation -->
<script>
(function() {
  'use strict';

  // Configuration for MyCannaby
  var CONFIG = {
    siteId: 'mycannaby-687f1af9',
    debug: false,
    storagePrefix: 'adsengineer_'
  };

  // Enhanced tracking data structure
  var trackingData = {
    // Google Ads
    gclid: null,
    keyword: null, // Search keyword from utm_term
    matchtype: null, // broad|phrase|exact
    network: null, // g|d (Google/Display)

    // Facebook Ads
    fbclid: null,
    adset: null,
    campaign: null,

    // Microsoft Ads
    msclkid: null,

    // UTM parameters
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null, // Usually contains keyword
    utm_content: null,

    // Technical
    landing_page: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId()
  };

  // Utility functions
  function getCookie(name) {
    var match = document.cookie.match('(^|;)\\\\s*' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + encodeURIComponent(value) +
                     ';expires=' + expires.toUTCString() +
                     ';path=/;SameSite=Lax';
  }

  function getParam(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Enhanced keyword extraction
  function extractKeywordData() {
    // Google Ads search keywords
    var utm_term = getParam('utm_term') || getCookie(CONFIG.storagePrefix + 'utm_term');
    if (utm_term) {
      trackingData.keyword = utm_term;
      trackingData.utm_term = utm_term;
    }

    // Google Ads match type (if available)
    var matchtype = getParam('matchtype') || getCookie(CONFIG.storagePrefix + 'matchtype');
    if (matchtype) {
      trackingData.matchtype = matchtype;
    }

    // Network type
    var network = getParam('network') || getCookie(CONFIG.storagePrefix + 'network');
    if (network) {
      trackingData.network = network;
    }

    // Facebook Ads data
    var fbclid = getParam('fbclid') || getCookie(CONFIG.storagePrefix + 'fbclid');
    if (fbclid) {
      trackingData.fbclid = fbclid;
    }

    var adset = getParam('adset_name') || getCookie(CONFIG.storagePrefix + 'adset');
    if (adset) {
      trackingData.adset = adset;
    }

    var campaign = getParam('campaign_name') || getCookie(CONFIG.storagePrefix + 'campaign');
    if (campaign) {
      trackingData.campaign = campaign;
    }

    // Microsoft Ads
    var msclkid = getParam('msclkid') || getCookie(CONFIG.storagePrefix + 'msclkid');
    if (msclkid) {
      trackingData.msclkid = msclkid;
    }

    // Standard UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function(param) {
      var value = getParam(param) || getCookie(CONFIG.storagePrefix + param);
      if (value) {
        trackingData[param] = value;
      }
    });
  }

  // Store tracking data in Shopify (firewall-safe)
  function storeInShopify() {
    // Method 1: Local storage (client-side only)
    try {
      localStorage.setItem(CONFIG.storagePrefix + 'tracking', JSON.stringify(trackingData));
      localStorage.setItem(CONFIG.storagePrefix + 'session', trackingData.session_id);
    } catch (e) {
      console.warn('AdsEngineer: Local storage not available');
    }

    // Method 2: Cookies (server-accessible)
    setCookie(CONFIG.storagePrefix + 'keyword', trackingData.keyword || '', 30);
    setCookie(CONFIG.storagePrefix + 'gclid', trackingData.gclid || '', 90);
    setCookie(CONFIG.storagePrefix + 'fbclid', trackingData.fbclid || '', 90);
    setCookie(CONFIG.storagePrefix + 'msclkid', trackingData.msclkid || '', 90);

    // Method 3: URL parameters for form submission
    // This will be handled by form injection below
  }

  // Enhanced form injection with keyword data
  function injectHiddenFields() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
      if (form.dataset.adsInjected) return;
      form.dataset.adsInjected = '1';

      // Add all tracking data as hidden fields
      Object.keys(trackingData).forEach(function(key) {
        if (trackingData[key]) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'ads_' + key; // Prefix to avoid conflicts
          input.value = trackingData[key];
          form.appendChild(input);
        }
      });

      // Special handling for keywords (most important)
      if (trackingData.keyword) {
        var keywordInput = document.createElement('input');
        keywordInput.type = 'hidden';
        keywordInput.name = 'ads_keyword';
        keywordInput.value = trackingData.keyword;
        form.appendChild(keywordInput);
      }
    });
  }

  // Debug logging
  function debugLog() {
    if (CONFIG.debug) {
      console.log('AdsEngineer Keyword Tracking:', {
        config: CONFIG,
        tracking: trackingData,
        hasKeyword: !!trackingData.keyword,
        hasGclid: !!trackingData.gclid,
        formsInjected: document.querySelectorAll('form[data-ads-injected]').length
      });
    }
  }

  // Initialize tracking
  function init() {
    extractKeywordData();
    storeInShopify();
    injectHiddenFields();
    debugLog();

    // Watch for dynamically added forms
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          injectHiddenFields();
        }
      });
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
</script>
<!-- End AdsEngineer Keyword Tracking -->