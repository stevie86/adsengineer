(function() {
  'use strict';

  var config = {
    apiEndpoint: 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/sst',
    cookiePrefix: '_adsengineer_',
    cookieExpiry: 90,
    retryAttempts: 3,
    retryDelay: 1000,
    batchSize: 10,
    flushInterval: 5000
  };

  var state = {
    siteId: null,
    authenticated: false,
    pendingEvents: [],
    lastFlush: Date.now(),
    sessionId: null,
    userId: null,
    initialized: false
  };

  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax; Secure";
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getParameter(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  function detectSiteRegistration() {
    var siteId = getParameter('site_id') || 
                 getParameter('siteid') || 
                 getCookie(config.cookiePrefix + 'site_id') ||
                 window.adsengineer_site_id ||
                 document.querySelector('meta[name="adsengineer-site-id"]')?.getAttribute('content');

    if (siteId) {
      state.siteId = siteId;
      setCookie(config.cookiePrefix + 'site_id', siteId, config.cookieExpiry);
    }

    return siteId;
  }

  async function authenticateSite() {
    if (!state.siteId) return false;

    try {
      var response = await fetch(config.apiEndpoint + '/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '2.0.0'
        },
        body: JSON.stringify({
          siteId: state.siteId,
          domain: window.location.hostname,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        var data = await response.json();
        
        if (data.success && data.authenticated) {
          state.authenticated = true;
          state.sessionId = data.sessionId;
          
          setCookie(config.cookiePrefix + 'auth', data.sessionId, config.cookieExpiry);
          setCookie(config.cookiePrefix + 'site_id', state.siteId, config.cookieExpiry);
          
          return true;
        }
      }
    } catch (error) {
      console.warn('AdsEngineer authentication failed:', error);
    }

    return false;
  }

  function trackEvent(eventName, properties) {
    if (!state.authenticated) return;

    var event = {
      eventName: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      sessionId: state.sessionId,
      userId: state.userId,
      pageViewId: state.pageViewId
    };

    state.pendingEvents.push(event);

    if (state.pendingEvents.length >= config.batchSize) {
      flushEvents();
    }
  }

  function pageView(properties) {
    state.pageViewId = generateUUID();
    
    trackEvent('page_view', {
      title: document.title,
      path: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height
      },
      ...properties
    });
  }

  function trackConversion(properties) {
    trackEvent('conversion', {
      value: properties.value || 0,
      currency: properties.currency || 'USD',
      orderId: properties.orderId,
      products: properties.products || [],
      ...properties
    });
  }

  function trackLead(properties) {
    trackEvent('lead', {
      email: properties.email,
      phone: properties.phone,
      formType: properties.formType,
      source: properties.source,
      ...properties
    });
  }

  function trackClick(element, properties) {
    trackEvent('click', {
      element: element.tagName.toLowerCase(),
      text: element.textContent?.substring(0, 100),
      href: element.href,
      className: element.className,
      id: element.id,
      ...properties
    });
  }

  function trackFormSubmit(form, properties) {
    trackEvent('form_submit', {
      formId: form.id || form.className || 'unknown',
      formAction: form.action,
      fields: Array.from(form.elements).map(el => ({
        name: el.name,
        type: el.type,
        required: el.required
      })),
      ...properties
    });
  }

  async function flushEvents() {
    if (state.pendingEvents.length === 0 || !state.authenticated) return;

    try {
      var response = await fetch(config.apiEndpoint + '/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + state.sessionId,
          'X-Client-Version': '2.0.0'
        },
        body: JSON.stringify({
          siteId: state.siteId,
          events: state.pendingEvents,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        state.pendingEvents = [];
        state.lastFlush = Date.now();
      } else {
        console.warn('Failed to flush events:', response.status);
      }
    } catch (error) {
      console.warn('Error flushing events:', error);
    }
  }

  function setupEventListeners() {
    if (!state.authenticated) return;

    document.addEventListener('click', function(event) {
      var target = event.target;
      if (target.matches('a, button, input[type="button"], input[type="submit"]')) {
        trackClick(target);
      }
    }, true);

    document.addEventListener('submit', function(event) {
      var form = event.target;
      if (form.tagName === 'FORM') {
        trackFormSubmit(form);
      }
    }, true);

    window.addEventListener('beforeunload', function() {
      if (state.pendingEvents.length > 0) {
        navigator.sendBeacon(
          config.apiEndpoint + '/events',
          JSON.stringify({
            siteId: state.siteId,
            events: state.pendingEvents,
            timestamp: new Date().toISOString()
          })
        );
      }
    });

    setInterval(function() {
      if (Date.now() - state.lastFlush >= config.flushInterval) {
        flushEvents();
      }
    }, config.flushInterval);
  }

  function collectAdParameters() {
    var adParams = {};
    var params = ['gclid', 'fbclid', 'msclkid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    params.forEach(function(param) {
      var value = getParameter(param);
      if (value) {
        adParams[param] = value;
        setCookie(config.cookiePrefix + param, value, config.cookieExpiry);
      }
    });

    params.forEach(function(param) {
      if (!adParams[param]) {
        var stored = getCookie(config.cookiePrefix + param);
        if (stored) {
          adParams[param] = stored;
        }
      }
    });

    return adParams;
  }

  window.AdsEngineer = {
    track: trackEvent,
    pageView: pageView,
    conversion: trackConversion,
    lead: trackLead,
    click: trackClick,
    form: trackFormSubmit,
    flush: flushEvents,
    
    identify: function(userId, traits) {
      state.userId = userId;
      setCookie(config.cookiePrefix + 'user_id', userId, config.cookieExpiry);
      
      trackEvent('identify', { traits: traits || {} });
    },
    
    reset: function() {
      state.userId = null;
      state.sessionId = null;
      state.authenticated = false;
      
      var cookies = document.cookie.split(';');
      cookies.forEach(function(cookie) {
        var eqPos = cookie.indexOf('=');
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie.trim();
        if (name.indexOf(config.cookiePrefix) === 0) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        }
      });
    }
  };

  async function initialize() {
    if (state.initialized) return;

    try {
      var siteId = detectSiteRegistration();
      
      if (!siteId) {
        console.log('AdsEngineer: No site ID found - tracking disabled');
        return;
      }

      var authenticated = await authenticateSite();
      
      if (authenticated) {
        console.log('AdsEngineer: Authenticated successfully for site:', siteId);
        
        var adParams = collectAdParameters();
        
        pageView({ adParams: adParams });
        
        setupEventListeners();
        
        state.initialized = true;
      } else {
        console.log('AdsEngineer: Authentication failed - site not registered or inactive');
      }
    } catch (error) {
      console.error('AdsEngineer: Initialization failed:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();