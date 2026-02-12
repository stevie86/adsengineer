# Quentn Form Selector Guide

This guide helps you identify the correct selectors for the Quentn newsletter form on hopekurse.at/bibel-kostenlos

## Finding the Form

### Method 1: Browser DevTools

1. Navigate to https://www.hopekurse.at/bibel-kostenlos/
2. Right-click on the newsletter signup form
3. Select "Inspect" or "Inspect Element"
4. Look at the HTML structure

### Common Quentn Form Patterns

Quentn forms typically use one of these patterns:

#### Pattern 1: Class-based
```html
<form class="quentn-form" id="form_12345">
  <input type="email" name="email" />
  <button type="submit">Anmelden</button>
</form>
```

**Selector:** `form.quentn-form` or `#form_12345`

#### Pattern 2: Action-based
```html
<form action="https://app.quentn.com/form/submit" method="post">
  <input type="email" name="email" />
  <button type="submit">Newsletter anmelden</button>
</form>
```

**Selector:** `form[action*="quentn"]`

#### Pattern 3: Data attributes
```html
<form data-form-id="quentn-123" class="newsletter-form">
  <input type="email" name="email" />
  <button type="submit">Jetzt anmelden</button>
</form>
```

**Selector:** `form[data-form-id*="quentn"]`

#### Pattern 4: Iframe-based
```html
<iframe src="https://app.quentn.com/form/embed/..." class="quentn-iframe">
  <!-- Form is inside iframe -->
</iframe>
```

**Note:** If the form is in an iframe, you'll need to add tracking code inside the iframe or use the Quentn webhook integration.

## Console Test

Open browser console (F12) and run this JavaScript to test selectors:

```javascript
// Test if form exists
console.log('Quentn forms found:', document.querySelectorAll('form[class*="quentn"]').length);

// Test all common selectors
var selectors = [
  'form[class*="quentn"]',
  'form[id*="quentn"]',
  'form[action*="quentn"]',
  '.quentn-form',
  'form.newsletter-form',
  'form'
];

selectors.forEach(function(selector) {
  var elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log('✓ Selector "' + selector + '" found ' + elements.length + ' element(s):');
    elements.forEach(function(el, i) {
      console.log('  [' + i + ']', el.id || el.className || el.tagName);
    });
  }
});
```

## Updating the Tracking Code

Once you identify the correct selector, update `dataLayer-tracking.js`:

```javascript
const CONFIG = {
  formSelectors: [
    // Add your specific selector here
    '#your-quentn-form-id',
    '.your-quentn-form-class',
    
    // Keep existing fallbacks
    'form[class*="quentn"]',
    'form[id*="quentn"]',
    'form[action*="quentn"]',
    '.quentn-form',
    '#quentn-form',
    'form.newsletter-form',
    'form'
  ],
  // ... rest of config
};
```

## Quentn Webhook Integration (Alternative)

If the form is in an iframe or difficult to track via JavaScript, use Quentn's webhook feature:

1. Log into your Quentn account
2. Go to Forms → Your Form → Settings
3. Enable "Webhook on Submit"
4. Set webhook URL to: `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/webhook/quentn`
5. Configure the webhook to send:
   - Email address
   - Form submission timestamp
   - UTM parameters (if available)

## Testing Form Tracking

After implementing:

1. Open the page in Chrome
2. Open DevTools → Console
3. Enable debug mode by running: `localStorage.setItem('ga4_debug', 'true')`
4. Refresh the page
5. Interact with the form
6. Look for `[GA4 Tracking]` messages in console
7. Check that events are pushed to dataLayer:
   ```javascript
   console.log(window.dataLayer);
   ```

## Troubleshooting

### Form Not Found

If the selector doesn't find the form:

1. Check if the form loads dynamically (after page load)
2. Verify the page URL is correct
3. Look for JavaScript errors in console
4. Try the generic `form` selector as fallback

### Multiple Forms Detected

If multiple forms are found:

1. Use a more specific selector (ID preferred over class)
2. Check the form's position in the DOM
3. Add additional filtering logic

### AJAX/Async Forms

Quentn forms often submit via AJAX. The tracking code includes:

- Standard `submit` event listener
- MutationObserver for success messages
- Fallback timeout detection

If tracking still doesn't work, add:

```javascript
// Add to dataLayer-tracking.js trackQuentnForm function

// Additional AJAX detection
var originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  var xhr = new originalXHR();
  var originalSend = xhr.send;
  
  xhr.send = function(body) {
    if (body && body.toString().includes('quentn')) {
      console.log('Quentn AJAX submission detected');
      // Push event to dataLayer
    }
    return originalSend.apply(xhr, arguments);
  };
  
  return xhr;
};
```

## Support

- Quentn Documentation: https://docs.quentn.com/
- Quentn Support: support@quentn.com
- AdsEngineer Integration: support@adsengineer.com
