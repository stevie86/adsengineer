# MyCannaby Shopify Implementation Guide

## 🎯 Overview
Deploy the fixed AdsEngineer tracking snippet to MyCannaby.de Shopify store with enterprise GTM support and fallback logic.

## 📂 Files You Need to Edit

### Primary File
```
theme.liquid (Main theme layout)
```
**Location**: Shopify Admin → Online Store → Themes → Actions → Edit code
**Purpose**: Main HTML layout - contains `<head>` section

### Alternative Files (if theme.liquid is complex)
```
layouts/theme.liquid
sections/header.liquid  
snippets/head.liquid
```
**Use only if**: Your theme uses a modular structure

## 🔍 Finding the Correct File

### Step 1: Identify Theme Structure
1. **Shopify Admin** → **Online Store** → **Themes**
2. **Current theme** → **Actions** → **Edit code**
3. **Look for these patterns**:
   - If you see `{% section 'header' %}` → Look in `sections/header.liquid`
   - If you see `{% include 'head' %}` → Look in `snippets/head.liquid`
   - If you see full HTML structure → You're in `theme.liquid`

### Step 2: Verify You're in the Right Place
**Look for these elements in the file**:
```liquid
<!doctype html>
<html>
<head>
  <!-- META TAGS HERE -->
</head>
<body>
  <!-- PAGE CONTENT HERE -->
</body>
</html>
```

**If you see this** → ✅ **Right file!**

## 📍 Exact Script Placement

### Option 1: Main theme.liquid (Recommended)
**Find this line**: `</head>` (closing head tag)

**Place snippet BEFORE it**:
```liquid
<!doctype html>
<html lang="{{ shop.locale.iso_code }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- ======================================== -->
  <!-- ADSengineer Enterprise Tracking -->
  <!-- ======================================== -->
  
  <script>
  (function() {
    'use strict';
    
    // Configuration for MyCannaby
    var MYCANNABY_CONFIG = {
      siteId: 'mycannaby-687f1af9',
      endpoint: 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads',
      enterprise: true,
      debug: true
    };
    
    // Cookie helpers
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
    
    // Capture click IDs from URL or cookies (90-day persistence)
    var gclid = getParam('gclid') || getCookie('_gclid');
    var fbclid = getParam('fbclid') || getCookie('_fbclid');
    var msclkid = getParam('msclkid') || getCookie('_msclkid');
    
    // Capture UTM parameters
    var utm = {
      source: getParam('utm_source') || getCookie('_utm_source'),
      medium: getParam('utm_medium') || getCookie('_utm_medium'),
      campaign: getParam('utm_campaign') || getCookie('_utm_campaign'),
      term: getParam('utm_term') || getCookie('_utm_term'),
      content: getParam('utm_content') || getCookie('_utm_content')
    };
    
    // Persist tracking data to cookies
    if (gclid) setCookie('_gclid', gclid, 90);
    if (fbclid) setCookie('_fbclid', fbclid, 90);
    if (msclkid) setCookie('_msclkid', msclkid, 90);
    if (utm.source) setCookie('_utm_source', utm.source, 90);
    if (utm.medium) setCookie('_utm_medium', utm.medium, 90);
    if (utm.campaign) setCookie('_utm_campaign', utm.campaign, 90);
    if (utm.term) setCookie('_utm_term', utm.term, 90);
    if (utm.content) setCookie('_utm_content', utm.content, 90);
    
    // Expose tracking data globally
    window.ads_tracking = {
      gclid: gclid || getCookie('_gclid'),
      fbclid: fbclid || getCookie('_fbclid'),
      msclkid: msclkid || getCookie('_msclkid'),
      utm_source: utm.source || getCookie('_utm_source'),
      utm_medium: utm.medium || getCookie('_utm_medium'),
      utm_campaign: utm.campaign || getCookie('_utm_campaign'),
      utm_term: utm.term || getCookie('_utm_term'),
      utm_content: utm.content || getCookie('_utm_content'),
      site_id: MYCANNABY_CONFIG.siteId
    };
    
    // Debug logging for MyCannaby
    if (MYCANNABY_CONFIG.debug) {
      console.log('AdsEngineer Debug - MyCannaby:', {
        config: MYCANNABY_CONFIG,
        tracking: window.ads_tracking
      });
    }
    
    // Enhanced form injection with MyCannaby specific handling
    function injectHiddenFields() {
      var forms = document.querySelectorAll('form');
      forms.forEach(function(form) {
        if (form.dataset.adsInjected) return;
        form.dataset.adsInjected = '1';
        
        var tracking = window.ads_tracking;
        for (var key in tracking) {
          if (tracking[key]) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = tracking[key];
            form.appendChild(input);
          }
        }
        
        // Add MyCannaby specific hidden fields
        var siteIdInput = document.createElement('input');
        siteIdInput.type = 'hidden';
        siteIdInput.name = 'site_id';
        siteIdInput.value = MYCANNABY_CONFIG.siteId;
        form.appendChild(siteIdInput);
        
        var consentInput = document.createElement('input');
        consentInput.type = 'hidden';
        consentInput.name = 'consent_status';
        consentInput.value = 'granted';
        form.appendChild(consentInput);
      });
    }
    
    // Initial injection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectHiddenFields);
    } else {
      injectHiddenFields();
    }
    
    // Watch for dynamically added forms (SPA support)
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) injectHiddenFields();
      });
    });
    observer.observe(document.body || document.documentElement, { 
      childList: true, 
      subtree: true 
    });
    
    // Enterprise GTM Integration for MyCannaby
    function loadServerSideGTM() {
      console.log('Loading Server-Side GTM for MyCannaby');
      
      // Create server-side GTM data layer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'page_view',
        'page_location': window.location.href,
        'page_title': document.title,
        'site_id': MYCANNABY_CONFIG.siteId,
        'customer_tier': 'enterprise',
        'tracking_mode': 'server_side'
      });
      
      // Load server-side GTM script
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://gtm.adsengineer.workers.dev/gtm/server.js?site_id=' + MYCANNABY_CONFIG.siteId;
      script.onload = function() {
        console.log('Server-Side GTM loaded successfully');
      };
      script.onerror = function() {
        console.error('Server-Side GTM failed, falling back to client-side');
        // Already running client-side tracking above
      };
      
      document.head.appendChild(script);
    }
    
    // For MyCannaby: Try server-side first, but keep client-side working
    if (MYCANNABY_CONFIG.enterprise) {
      loadServerSideGTM();
    }
    
  })();
  </script>
  
  <!-- ======================================== -->
  <!-- END AdsEngineer Tracking -->
  <!-- ======================================== -->
  
  <!-- Continue with other head content -->
  {{ content_for_header }}
</head>
```

### Option 2: Modular Theme (Alternative)
If your theme uses includes/snippets:

**File**: `snippets/head.liquid` (create if doesn't exist)
```liquid
<!-- AdsEngineer MyCannaby Tracking -->
<script>
[Paste the same JavaScript from above]
</script>

<!-- Then in theme.liquid -->
{{ 'head' | include }}
```

**File**: `sections/header.liquid` (if head snippet doesn't work)
```liquid
<!-- AdsEngineer MyCannaby Tracking -->
<script>
[Paste the same JavaScript from above]
</script>
```

## ✅ Implementation Steps

### Step 1: Backup Current Theme
1. **Shopify Admin** → **Themes** → **Current theme**
2. **Actions** → **Duplicate**
3. **Name**: "Backup - MyCannaby - [Date]"

### Step 2: Edit the Correct File
1. **Actions** → **Edit code**
2. **Navigate to the right file** (see finding guide above)
3. **Copy-paste the entire JavaScript** code

### Step 3: Place Correctly
1. **Find**: `</head>` tag (use Ctrl+F)
2. **Paste**: **BEFORE** `</head>`
3. **Verify**: JavaScript is wrapped in `<script>` tags

### Step 4: Save and Test
1. **Save** the theme (top right button)
2. **Visit**: https://mycannaby.de
3. **Open**: Browser console (F12)
4. **Check for**: "AdsEngineer Debug - MyCannaby:" log

## 🧪 Verification Checklist

### Console Test
- [ ] **Console log appears**: `AdsEngineer Debug - MyCannaby:`
- [ ] **Correct site ID**: `mycannaby-687f1af9`
- [ ] **Enterprise mode**: Shows `enterprise: true`
- [ ] **Tracking data populated**: GCLID, UTM params present

### Form Test
- [ ] **Hidden fields injected**: Check form elements in DevTools
- [ ] **Fields contain correct data**: site_id, gclid, utm_*
- [ ] **Form submission works**: Test with real email

### GTM Test
- [ ] **Server-side attempt**: Console shows "Loading Server-Side GTM"
- [ ] **Fallback works**: "Server-Side GTM failed, falling back"
- [ ] **Client-side continues**: Form injection still works

## ⚠️ Common Issues & Solutions

### Issue: "No Console Output"
**Problem**: Wrong file placement or syntax error
**Solution**: 
1. Check you're editing `theme.liquid` (not a section file)
2. Verify script is inside `<script>` tags
3. Look for JavaScript errors in console

### Issue: "site_id not found"
**Problem**: Wrong site ID or database issue
**Solution**: 
1. Verify site ID is exactly: `mycannaby-687f1af9`
2. Check AdsEngineer agencies table for MyCannaby

### Issue: "Forms not getting fields"
**Problem**: Forms load after script executes
**Solution**:
1. MutationObserver handles dynamic forms (already included)
2. Check for JavaScript errors preventing execution
3. Verify forms exist when script runs

### Issue: "Theme doesn't save"
**Problem**: Liquid syntax error or theme protection
**Solution**:
1. Check all opening/closing brackets match
2. Ensure no Liquid template conflicts
3. Try saving in smaller sections

## 🎯 Expected Results

After successful implementation:
- ✅ **Console shows debug log** with correct MyCannaby config
- ✅ **All forms contain hidden fields** with tracking data
- ✅ **Server-side GTM attempts** (will fail gracefully)
- ✅ **Client-side tracking works** as reliable fallback
- ✅ **MyCannaby ready for enterprise upgrade** when server-side is built

## 📞 Support

If issues persist:
1. **Screenshot console errors**
2. **Note exact file edited** (theme.liquid vs sections)
3. **Share full console output**
4. **Check if other scripts conflict** with AdsEngineer

**Implementation should take 5-10 minutes if correct file is identified.**