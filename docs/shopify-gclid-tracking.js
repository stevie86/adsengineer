/**
 * AdsEngineer GCLID Tracking Script for Shopify
 *
 * Captures Google Click ID (GCLID) from URL parameters and preserves it
 * through the customer's journey to checkout.
 *
 * Usage:
 * 1. Add this script to your Shopify theme.liquid or checkout settings
 * 2. The script automatically captures GCLID from URL parameters
 * 3. On checkout, GCLID is added to note_attributes for webhook processing
 */

(function() {
  'use strict';

  const ADSENGINEER_GCLID_KEY = 'adsengineer_gclid';
  const ADSENGINEER_SESSION_KEY = 'adsengineer_session';

  /**
   * Get GCLID from URL parameters
   */
  function getGclidFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gclid');
  }

  /**
   * Store GCLID in localStorage with timestamp
   */
  function storeGclid(gclid) {
    if (!gclid) return;
    try {
      localStorage.setItem(ADSENGINEER_GCLID_KEY, JSON.stringify({
        value: gclid,
        timestamp: Date.now()
      }));
      console.log('[AdsEngineer] GCLID stored:', gclid.substring(0, 20) + '...');
    } catch (e) {
      console.warn('[AdsEngineer] Failed to store GCLID:', e);
    }
  }

  /**
   * Retrieve stored GCLID
   */
  function getStoredGclid() {
    try {
      const stored = localStorage.getItem(ADSENGINEER_GCLID_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // GCLID expires after 90 days (Google Ads click window)
        const ninetyDays = 90 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < ninetyDays) {
          return data.value;
        }
      }
    } catch (e) {
      console.warn('[AdsEngineer] Failed to retrieve stored GCLID:', e);
    }
    return null;
  }

  /**
   * Add GCLID to Shopify checkout note attributes
   */
  function addGclidToCheckout(gclid) {
    if (!gclid) return;

    // Check if we're on checkout
    const isCheckout = window.ShopifyCheckout || window.location.pathname.indexOf('/checkout') !== -1;

    if (isCheckout && typeof window.ShopifyCheckout !== 'undefined') {
      // For new checkout (2019+)
      if (window.ShopifyCheckout.addAttribute) {
        window.ShopifyCheckout.addAttribute('gclid', gclid);
        console.log('[AdsEngineer] GCLID added to checkout attributes');
      }
    }

    // Also try to add as a tag (backup method)
    if (typeof window.ShopifyCheckout !== 'undefined' && window.ShopifyCheckout.orderId) {
      // This will be picked up by the orders/create webhook
      const checkoutForm = document.querySelector('#checkout_form');
      if (checkoutForm) {
        // Create hidden input for gclid
        let gclidInput = checkoutForm.querySelector('input[name="note[gclid]"]');
        if (!gclidInput) {
          gclidInput = document.createElement('input');
          gclidInput.type = 'hidden';
          gclidInput.name = 'note[gclid]';
          checkoutForm.appendChild(gclidInput);
        }
        gclidInput.value = gclid;
        console.log('[AdsEngineer] GCLID added to checkout form');
      }
    }
  }

  /**
   * Initialize tracking
   */
  function init() {
    // Priority 1: Get from current URL
    let gclid = getGclidFromUrl();

    // Priority 2: Get from stored session (if no GCLID in URL)
    if (!gclid) {
      gclid = getStoredGclid();
    }

    // Store GCLID if found
    if (gclid) {
      storeGclid(gclid);

      // Add to checkout when user proceeds
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          addGclidToCheckout(gclid);
        });
      } else {
        addGclidToCheckout(gclid);
      }
    }

    // Listen for checkout navigation
    document.addEventListener('click', function(e) {
      // Check if clicking checkout button
      const checkoutBtn = e.target.closest('form[action="/checkout"] button, .checkout-button, [name="checkout"]');
      if (checkoutBtn) {
        const storedGclid = getStoredGclid();
        if (storedGclid) {
          addGclidToCheckout(storedGclid);
        }
      }
    });

    // Also handle form submission
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && form.action.includes('/checkout')) {
        const storedGclid = getStoredGclid();
        if (storedGclid) {
          addGclidToCheckout(storedGclid);
        }
      }
    });
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging (remove in production)
  window.AdsEngineerGCLID = {
    get: getStoredGclid,
    store: storeGclid,
    addToCheckout: addGclidToCheckout
  };

})();
