import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { leadsRoutes } from './routes/leads';
import { statusRoutes } from './routes/status';
import { ghlRoutes } from './routes/ghl';
import { shopifyRoutes } from './routes/shopify';
import { gdprRoutes } from './routes/gdpr';
import { waitlistRoutes } from './routes/waitlist';
import { adminRoutes } from './routes/admin';
import { onboardingRoutes } from './routes/onboarding';
import { billingRoutes } from './routes/billing';
import { analyticsRoutes } from './routes/analytics';
import { authMiddleware } from './middleware/auth';
import { createDb } from './database';
import { setupDocs } from './openapi';
import { encryptionMiddleware } from './services/encryption';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

app.use('*', cors({
  origin: ['https://app.advocate.com', 'http://localhost:3000', 'http://localhost:8090'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use('*', logger());

// Initialize encryption service
app.use('*', encryptionMiddleware);

app.use('*', async (c, next) => {
  c.set('db', c.env.DB);
  return next();
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// Serve static files
app.get('/snippet.js', async (c) => {
  // Read snippet content from file system
  try {
    // For Cloudflare Workers, we need to use the file directly
    // This is a simplified version - in production you'd want to bundle this
    const snippetContent = `/**
 * AdsEngineer Tracking Snippet
 * Server-side GDPR-compliant conversion tracking
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Configuration
  var config = {
    siteId: getSiteId(),
    apiBase: 'https://advocate-cloud.adsengineer.workers.dev',
    cookiePrefix: '_advocate_',
    cookieExpiry: 90 // days
  };

  // Utility functions
  function getParam(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  function getSiteId() {
    // Get site ID from script tag data attribute
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.src && script.src.indexOf('advocate-cloud.adsengineer.workers.dev/snippet.js') !== -1) {
        return script.getAttribute('data-site-id') || 'default';
      }
    }
    return 'default';
  }

  // Collect tracking parameters
  function collectTrackingData() {
    var data = {
      site_id: config.siteId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    };

    // Google Ads
    var gclid = getParam('gclid') || getCookie(config.cookiePrefix + 'gclid');
    if (gclid) {
      data.gclid = gclid;
      setCookie(config.cookiePrefix + 'gclid', gclid, config.cookieExpiry);
    }

    // Facebook Ads
    var fbclid = getParam('fbclid') || getCookie(config.cookiePrefix + 'fbclid');
    if (fbclid) {
      data.fbclid = fbclid;
      setCookie(config.cookiePrefix + 'fbclid', fbclid, config.cookieExpiry);
    }

    // Microsoft Ads
    var msclkid = getParam('msclkid') || getCookie(config.cookiePrefix + 'msclkid');
    if (msclkid) {
      data.msclkid = msclkid;
      setCookie(config.cookiePrefix + 'msclkid', msclkid, config.cookieExpiry);
    }

    // UTM parameters
    var utm = {
      source: getParam('utm_source'),
      medium: getParam('utm_medium'),
      campaign: getParam('utm_campaign'),
      term: getParam('utm_term'),
      content: getParam('utm_content')
    };

    // Store UTM if present
    if (utm.source || utm.medium || utm.campaign) {
      data.utm_source = utm.source;
      data.utm_medium = utm.medium;
      data.utm_campaign = utm.campaign;
      data.utm_term = utm.term;
      data.utm_content = utm.content;

      // Store in cookies for cross-session attribution
      Object.keys(utm).forEach(function(key) {
        if (utm[key]) {
          setCookie(config.cookiePrefix + 'utm_' + key, utm[key], config.cookieExpiry);
        } else {
          // Restore from cookie if not in URL
          var stored = getCookie(config.cookiePrefix + 'utm_' + key);
          if (stored) {
            data['utm_' + key] = stored;
          }
        }
      });
    }

    return data;
  }

  // Send data to server
  function sendTrackingData(data) {
    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
      navigator.sendBeacon(config.apiBase + '/api/v1/track', blob);
    } else {
      // Fallback to fetch
      fetch(config.apiBase + '/api/v1/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function(error) {
        console.warn('AdsEngineer tracking failed:', error);
      });
    }
  }

  // Initialize tracking
  function init() {
    try {
      var data = collectTrackingData();

      // Send initial page view
      sendTrackingData(data);

      // Track form submissions (leads)
      document.addEventListener('submit', function(event) {
        var form = event.target;
        var email = form.querySelector('input[type="email"]');

        if (email && email.value) {
          var leadData = Object.assign({}, data, {
            email: email.value,
            form_action: 'submit',
            form_id: form.id || form.className || 'unknown'
          });

          sendTrackingData(leadData);
        }
      });

      // Track button clicks (potential leads)
      document.addEventListener('click', function(event) {
        var target = event.target;

        // Track CTA button clicks
        if (target.matches('button, a, input[type="submit"]') ||
            target.closest('button, a, input[type="submit"]')) {

          var buttonData = Object.assign({}, data, {
            action: 'click',
            element: target.tagName.toLowerCase(),
            text: target.textContent ? target.textContent.trim().substring(0, 50) : '',
            class: target.className || '',
            id: target.id || ''
          });

          sendTrackingData(buttonData);
        }
      });

    } catch (error) {
      console.warn('AdsEngineer initialization failed:', error);
    }
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();`;

    c.header('Content-Type', 'application/javascript');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.text(snippetContent);
  } catch (error) {
    return c.text('console.error("AdsEngineer snippet not found");', 404);
  }
});

setupDocs(app);

// Public routes (no auth)
app.route('/api/v1/ghl', ghlRoutes);
app.route('/api/v1/shopify', shopifyRoutes);
app.route('/api/v1/gdpr', gdprRoutes);
app.route('/api/v1/waitlist', waitlistRoutes);

// Public billing routes (pricing info)
app.route('/api/v1/billing', billingRoutes);

// Admin routes (admin token auth - handled in adminRoutes)
app.route('/api/v1/admin', adminRoutes);

// Protected routes (JWT auth)
const api = new Hono<AppEnv>();
api.use('*', authMiddleware());
api.route('/leads', leadsRoutes);
api.route('/status', statusRoutes);
api.route('/analytics', analyticsRoutes);

app.route('/api/v1', api);

app.notFound((c) => {
  return c.json({
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    available: { health: '/health', api: '/api/v1' }
  }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
