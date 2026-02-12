# GA4 Tracking for hopekurse.at/bibel-kostenlos

This directory contains GA4 tracking implementation for the page https://www.hopekurse.at/bibel-kostenlos/

## Current Setup

✅ **GTM4WP (Google Tag Manager for WordPress)** is already installed and active
✅ **Google Tag Manager** container is loading on the page
✅ **Quentn newsletter signup form** is present on the page

## What You Need to Track

1. **Quentn Newsletter Form Submissions** → `generate_lead` event in GA4
2. **Page Engagement** → Page views, scroll depth, time on page
3. **Button Clicks** → Download CTA clicks
4. **Form Interactions** → Form start, field completion

## Implementation

### Option 1: DataLayer Events (Recommended)

Since GTM4WP is already active, push events to the dataLayer and let GTM send them to GA4.

Add this JavaScript to the page (via WPCode or custom HTML block):

```javascript
<script>
(function() {
  'use strict';
  
  // Wait for DOM to be ready
  function initTracking() {
    trackQuentnForm();
    trackDownloadButtons();
    trackScrollDepth();
  }
  
  // Track Quentn Newsletter Form
  function trackQuentnForm() {
    // Find the Quentn form (adjust selector based on actual form structure)
    var forms = document.querySelectorAll('form');
    
    forms.forEach(function(form) {
      // Check if this is the Quentn newsletter form
      var isQuentnForm = form.action && form.action.includes('quentn') || 
                         form.classList.contains('quentn-form') ||
                         form.id && form.id.includes('quentn');
      
      if (isQuentnForm || form.querySelector('input[name*="email"], input[type="email"]')) {
        
        // Track form start
        var emailInput = form.querySelector('input[type="email"], input[name*="email"]');
        if (emailInput) {
          emailInput.addEventListener('focus', function() {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              'event': 'form_start',
              'form_name': 'quentn_newsletter',
              'form_id': form.id || 'quentn_form',
              'page_path': window.location.pathname,
              'page_title': document.title
            });
          }, { once: true });
        }
        
        // Track form submission
        form.addEventListener('submit', function(e) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            'event': 'form_submit',
            'form_name': 'quentn_newsletter',
            'form_id': form.id || 'quentn_form',
            'form_destination': form.action || window.location.href,
            'form_length': form.querySelectorAll('input, select, textarea').length,
            'page_path': window.location.pathname,
            'page_title': document.title
          });
          
          // Also push the GA4 recommended event
          window.dataLayer.push({
            'event': 'generate_lead',
            'value': 1,
            'currency': 'EUR',
            'lead_source': 'bibel_kostenlos_page',
            'form_type': 'newsletter'
          });
        });
      }
    });
  }
  
  // Track Download/CTA Button Clicks
  function trackDownloadButtons() {
    var ctaButtons = document.querySelectorAll(
      'a[href*="download"], a[href*=".pdf"], .download-btn, .cta-button, ' +
      'button:contains("Download"), a:contains("Download"), ' +
      'button:contains("Bibel"), a:contains("Bibel")'
    );
    
    ctaButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'cta_click',
          'cta_name': button.textContent.trim() || 'download_button',
          'cta_id': button.id || '',
          'cta_url': button.href || '',
          'page_path': window.location.pathname
        });
      });
    });
  }
  
  // Track Scroll Depth (25%, 50%, 75%, 90%)
  function trackScrollDepth() {
    var scrollMarks = [25, 50, 75, 90];
    var trackedMarks = [];
    
    window.addEventListener('scroll', function() {
      var scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      scrollMarks.forEach(function(mark) {
        if (scrollPercent >= mark && !trackedMarks.includes(mark)) {
          trackedMarks.push(mark);
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            'event': 'scroll_depth',
            'scroll_percentage': mark,
            'page_path': window.location.pathname
          });
        }
      });
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }
})();
</script>
```

### Option 2: Custom HTML Tag in GTM

Instead of adding code to WordPress, create a Custom HTML Tag in GTM:

1. Go to GTM → Tags → New
2. Choose "Custom HTML"
3. Paste the JavaScript code above (without `<script>` tags)
4. Set trigger: All Pages (or Page Path equals `/bibel-kostenlos/`)
5. Save and publish

## GTM Configuration

### 1. Import Container (Recommended)

Import the provided `gtm-container-config.json` file:

1. Go to GTM → Admin → Import Container
2. Choose `gtm-container-config.json`
3. Select workspace: Default Workspace
4. Import option: Merge
5. Rename conflicting tags, triggers, variables: False

### 2. Manual Configuration

If you prefer manual setup, create these elements:

#### Variables

Create these Data Layer Variables:

| Variable Name | Data Layer Variable Name |
|--------------|-------------------------|
| DLV - Form Name | `form_name` |
| DLV - Form ID | `form_id` |
| DLV - CTA Name | `cta_name` |
| DLV - Scroll Percentage | `scroll_percentage` |
| DLV - Lead Source | `lead_source` |

#### Triggers

Create these triggers:

**Trigger: Form Submit - Quentn**
- Type: Custom Event
- Event Name: `form_submit`
- Fire On: Some Custom Events
- Condition: `DLV - Form Name` equals `quentn_newsletter`

**Trigger: Generate Lead**
- Type: Custom Event
- Event Name: `generate_lead`
- Fire On: All Custom Events

**Trigger: CTA Click**
- Type: Custom Event
- Event Name: `cta_click`
- Fire On: All Custom Events

**Trigger: Scroll Depth**
- Type: Custom Event
- Event Name: `scroll_depth`
- Fire On: All Custom Events

#### Tags

Create these GA4 Event Tags:

**Tag: GA4 - Form Submit**
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-XXXXXXXXXX` (your GA4 ID)
- Event Name: `form_submit`
- Parameters:
  - `form_name` → `{{DLV - Form Name}}`
  - `form_id` → `{{DLV - Form ID}}`
  - `page_location` → `{{Page URL}}`
- Trigger: Form Submit - Quentn

**Tag: GA4 - Generate Lead**
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-XXXXXXXXXX`
- Event Name: `generate_lead`
- Parameters:
  - `value` → `1`
  - `currency` → `EUR`
  - `lead_source` → `{{DLV - Lead Source}}`
- Trigger: Generate Lead

**Tag: GA4 - CTA Click**
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-XXXXXXXXXX`
- Event Name: `cta_click`
- Parameters:
  - `cta_name` → `{{DLV - CTA Name}}`
  - `page_location` → `{{Page URL}}`
- Trigger: CTA Click

**Tag: GA4 - Scroll Depth**
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-XXXXXXXXXX`
- Event Name: `scroll`
- Parameters:
  - `percent_scrolled` → `{{DLV - Scroll Percentage}}`
- Trigger: Scroll Depth

## Verification

### Test in Preview Mode

1. Open GTM → Preview
2. Enter URL: `https://www.hopekurse.at/bibel-kostenlos/`
3. Click Connect
4. Interact with the Quentn form
5. Verify events fire in the Tag Assistant sidebar

### Check GA4 Real-Time Reports

1. Open Google Analytics → Realtime
2. Navigate to the page
3. Submit the Quentn form
4. Verify `generate_lead` event appears

## Enhanced Tracking (Optional)

### Server-Side Tracking with AdsEngineer

For advanced attribution (capturing GCLID, FBCLID, UTM parameters), add the AdsEngineer snippet:

```html
<script src="https://adsengineer-cloud.adsengineer.workers.dev/snippet.js" data-site-id="hopekurse_bibel"></script>
```

This captures:
- Google Click ID (GCLID)
- Facebook Click ID (FBCLID)
- UTM parameters
- MS Click ID (MSCLKID)

And injects them into the Quentn form as hidden fields.

### GTM4WP Built-in Events

GTM4WP automatically pushes these events to dataLayer:

| Event | Description |
|-------|-------------|
| `gtm4wp.pageLoaded` | Page fully loaded |
| `gtm4wp.formSubmit` | Any form submission |
| `gtm4wp.scrollTracking` | Scroll depth (if enabled) |
| `gtm4wp.userEngagement` | User interactions |

You can use these as alternative triggers instead of custom code.

## Files in This Directory

```
hopekurse-bibel-kostenlos/
├── README.md                         # This file
├── dataLayer-tracking.js             # Standalone tracking script
├── gtm-container-config.json         # Importable GTM container
└── QUENTN_FORM_SELECTOR_GUIDE.md     # How to identify Quentn forms
```

## Troubleshooting

### Form Not Tracking?

1. Check browser console for JavaScript errors
2. Verify the form selector matches (see `QUENTN_FORM_SELECTOR_GUIDE.md`)
3. Test dataLayer.push in console:
   ```javascript
   console.log(window.dataLayer);
   ```

### Events Not Showing in GA4?

1. Verify GTM Preview mode shows the tags firing
2. Check GA4 DebugView (Configure → DebugView)
3. Ensure GA4 Measurement ID is correct
4. Check for ad blockers

### Quentn Form Specific Issues

Quentn forms may:
- Load via iframe
- Use JavaScript validation
- Submit via AJAX/XHR

See `QUENTN_FORM_SELECTOR_GUIDE.md` for specific selectors.

## Support

- **GTM4WP Plugin**: [Support Forum](https://wordpress.org/support/plugin/duracelltomi-google-tag-manager/)
- **Quentn Forms**: Check Quentn documentation or contact their support
- **AdsEngineer**: support@adsengineer.com

## Resources

- [GTM4WP Documentation](https://gtm4wp.com/)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [dataLayer Best Practices](https://developers.google.com/tag-platform/devguides/datalayer)
