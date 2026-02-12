/**
 * GA4 Tracking for hopekurse.at/bibel-kostenlos
 * Works with GTM4WP (Google Tag Manager for WordPress)
 * 
 * Installation:
 * 1. Add this code via WPCode plugin or custom HTML block
 * 2. Import gtm-container-config.json into GTM
 */

(function() {
  'use strict';

  const CONFIG = {
    formSelectors: [
      'form[class*="quentn"]',
      'form[id*="quentn"]',
      'form[action*="quentn"]',
      '.quentn-form',
      '#quentn-form',
      'form.newsletter-form',
      'form.wpcf7-form',
      'form'
    ],
    ctaSelectors: [
      'a[href*="download"]:not([href*="javascript"])',
      'a[href*=".pdf"]',
      '.download-button',
      '.cta-button',
      '.button-download',
      'a[href*="bibel"]'
    ],
    scrollMarks: [25, 50, 75, 90],
    debug: false
  };

  function log() {
    if (CONFIG.debug && console && console.log) {
      console.log.apply(console, ['[GA4 Tracking]',].concat(Array.prototype.slice.call(arguments)));
    }
  }

  function initTracking() {
    log('Initializing tracking...');
    trackQuentnForm();
    trackDownloadButtons();
    trackScrollDepth();
    trackOutboundLinks();
    log('Tracking initialized');
  }

  function trackQuentnForm() {
    const forms = findQuentnForms();
    
    if (forms.length === 0) {
      log('No Quentn forms found');
      return;
    }
    
    log('Found', forms.length, 'form(s)');
    
    forms.forEach(function(form, index) {
      const formId = form.id || 'quentn_form_' + index;
      const formName = getFormName(form);
      
      log('Tracking form:', formId, formName);
      
      const firstField = form.querySelector('input, select, textarea');
      if (firstField) {
        firstField.addEventListener('focus', function() {
          pushEvent('form_start', {
            form_name: formName,
            form_id: formId,
            form_field: firstField.name || firstField.id || 'first_field',
            page_path: window.location.pathname,
            page_title: document.title
          });
        }, { once: true });
      }
      
      const emailField = form.querySelector('input[type="email"], input[name*="email"], input[name*="mail"]');
      if (emailField) {
        emailField.addEventListener('focus', function() {
          pushEvent('form_field_focus', {
            form_name: formName,
            form_id: formId,
            field_name: 'email',
            page_path: window.location.pathname
          });
        }, { once: true });
      }
      
      form.addEventListener('submit', function(e) {
        log('Form submitted:', formId);
        
        pushEvent('form_submit', {
          form_name: formName,
          form_id: formId,
          form_destination: form.action || window.location.href,
          form_length: form.querySelectorAll('input, select, textarea').length,
          page_path: window.location.pathname,
          page_title: document.title
        });
        
        pushEvent('generate_lead', {
          value: 1,
          currency: 'EUR',
          lead_source: 'bibel_kostenlos_page',
          form_type: 'newsletter',
          form_name: formName
        });
        
        pushEvent('email_subscribe', {
          newsletter_name: 'bibel_kostenlos',
          page_path: window.location.pathname
        });
      });
      
      observeFormSubmission(form, formId, formName);
    });
  }

  function findQuentnForms() {
    const foundForms = [];
    const processedForms = new Set();
    
    CONFIG.formSelectors.forEach(function(selector) {
      try {
        const forms = document.querySelectorAll(selector);
        forms.forEach(function(form) {
          if (!processedForms.has(form)) {
            if (selector === 'form') {
              if (isNewsletterForm(form)) {
                foundForms.push(form);
                processedForms.add(form);
              }
            } else {
              foundForms.push(form);
              processedForms.add(form);
            }
          }
        });
      } catch (e) {
        log('Error with selector:', selector, e);
      }
    });
    
    return foundForms;
  }

  function isNewsletterForm(form) {
    const emailFields = form.querySelectorAll('input[type="email"], input[name*="email"], input[name*="mail"]');
    const hasEmail = emailFields.length > 0;
    
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const buttonText = submitButton ? (submitButton.textContent || submitButton.value || '').toLowerCase() : '';
    const hasNewsletterKeywords = /newsletter|anmelden|subscribe|abo|bibel/i.test(buttonText);
    
    return hasEmail && (hasNewsletterKeywords || form.querySelectorAll('input').length <= 3);
  }

  function getFormName(form) {
    return form.dataset.formName || form.id || form.className.split(' ')[0] || form.getAttribute('name') || 'newsletter_form';
  }

  function observeFormSubmission(form, formId, formName) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            const nodeText = node.textContent || '';
            const isSuccessMessage = /danke|thank|erfolgreich|success|bestätigung|confirmation/i.test(nodeText);
            
            if (isSuccessMessage) {
              log('Success message detected for form:', formId);
              
              pushEvent('form_submit_success', {
                form_name: formName,
                form_id: formId,
                success_message: nodeText.substring(0, 100),
                page_path: window.location.pathname
              });
              
              pushEvent('generate_lead', {
                value: 1,
                currency: 'EUR',
                lead_source: 'bibel_kostenlos_page',
                form_type: 'newsletter',
                submission_type: 'ajax'
              });
            }
          }
        });
      });
    });
    
    observer.observe(form.parentElement || form, {
      childList: true,
      subtree: true
    });
  }

  function trackDownloadButtons() {
    const buttons = findCTAButtons();
    
    log('Found', buttons.length, 'CTA button(s)');
    
    buttons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        const buttonText = (button.textContent || button.value || 'unknown').trim();
        const buttonUrl = button.href || '';
        const buttonId = button.id || '';
        const buttonClass = button.className || '';
        
        log('CTA clicked:', buttonText);
        
        pushEvent('cta_click', {
          cta_name: buttonText,
          cta_id: buttonId,
          cta_class: buttonClass,
          cta_url: buttonUrl,
          cta_type: getCTAType(button, buttonText),
          page_path: window.location.pathname
        });
        
        if (buttonUrl.match(/\.(pdf|doc|docx|epub|mobi)$/i)) {
          pushEvent('file_download', {
            file_name: buttonUrl.split('/').pop(),
            file_extension: buttonUrl.split('.').pop(),
            file_url: buttonUrl,
            link_text: buttonText,
            page_path: window.location.pathname
          });
        }
      });
    });
  }

  function findCTAButtons() {
    const buttons = [];
    const processed = new Set();
    
    const selectors = [
      'a[href*="download"]',
      'a[href$=".pdf"]',
      'a[href*="bibel"]',
      '.download-btn',
      '.cta-button',
      '.button-download',
      'a[class*="download"]',
      'button[class*="download"]'
    ];
    
    selectors.forEach(function(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(function(el) {
          if (!processed.has(el)) {
            buttons.push(el);
            processed.add(el);
          }
        });
      } catch (e) {}
    });
    
    const allButtons = document.querySelectorAll('a, button');
    allButtons.forEach(function(btn) {
      if (processed.has(btn)) return;
      
      const text = (btn.textContent || '').toLowerCase();
      const hasCTAKeywords = /download|herunterladen|bibel|kostenlos|jetzt|anmelden|gratis/i.test(text);
      
      if (hasCTAKeywords) {
        buttons.push(btn);
        processed.add(btn);
      }
    });
    
    return buttons;
  }

  function getCTAType(button, text) {
    const url = button.href || '';
    const lowerText = text.toLowerCase();
    
    if (url.match(/\.pdf$/)) return 'pdf_download';
    if (url.match(/download/)) return 'file_download';
    if (lowerText.includes('bibel')) return 'bibel_cta';
    if (lowerText.includes('anmelden') || lowerText.includes('subscribe')) return 'subscribe';
    if (button.tagName === 'BUTTON' && button.type === 'submit') return 'form_submit';
    return 'generic_cta';
  }

  function trackScrollDepth() {
    const trackedMarks = [];
    const scrollThresholds = CONFIG.scrollMarks;
    
    const scrollHandler = function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      scrollThresholds.forEach(function(mark) {
        if (scrollPercent >= mark && trackedMarks.indexOf(mark) === -1) {
          trackedMarks.push(mark);
          
          log('Scroll depth reached:', mark + '%');
          
          pushEvent('scroll_depth', {
            scroll_percentage: mark,
            page_path: window.location.pathname,
            page_title: document.title
          });
          
          pushEvent('scroll', {
            percent_scrolled: mark,
            page_path: window.location.pathname
          });
        }
      });
      
      if (trackedMarks.length === scrollThresholds.length) {
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          scrollHandler();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  function trackOutboundLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(function(link) {
      const url = link.href;
      const hostname = new URL(url).hostname;
      
      if (hostname !== window.location.hostname) {
        link.addEventListener('click', function() {
          pushEvent('outbound_click', {
            link_url: url,
            link_domain: hostname,
            link_text: (link.textContent || '').trim(),
            page_path: window.location.pathname
          });
        });
      }
    });
  }

  function pushEvent(eventName, eventData) {
    window.dataLayer = window.dataLayer || [];
    
    const eventPayload = {
      event: eventName,
      ...eventData,
      event_timestamp: new Date().toISOString(),
      event_id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    window.dataLayer.push(eventPayload);
    log('Event pushed:', eventName, eventData);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
