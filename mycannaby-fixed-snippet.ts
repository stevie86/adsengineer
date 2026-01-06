export const mycannabySnippet = `
<!-- AdsEngineer Enterprise Tracking for MyCannaby -->
<script>
(function() {
  'use strict';
  
  // Configuration for MyCannaby
  var MYCANNABY_CONFIG = {
    siteId: 'mycannaby-687f1af9',
    endpoint: 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads',
    enterprise: true, // MyCannaby gets server-side GTM
    debug: true // Enable debugging
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
      consentInput.value = 'granted'; // MyCannaby operates under GDPR compliance
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
      loadClientSideTracking();
    };
    
    document.head.appendChild(script);
  }
  
  function loadClientSideTracking() {
    console.log('Using client-side tracking fallback');
    // Your existing client-side logic here
  }
  
  // For MyCannaby: Always try server-side first
  if (MYCANNABY_CONFIG.enterprise) {
    loadServerSideGTM();
  } else {
    loadClientSideTracking();
  }
  
})();
</script>
<!-- End AdsEngineer Tracking -->
`;

export const mycannabySnippetSimple = `
<!-- AdsEngineer Simple Tracking for MyCannaby -->
<script>
(function() {
  var w=window,d=document,s='ads_tracking',e=encodeURIComponent;
  
  function gc(n){var m=d.cookie.match('(^|;)\\\\s*'+n+'=([^;]*)');return m?decodeURIComponent(m[2]):null}
  function sc(n,v,days){var ex=new Date();ex.setTime(ex.getTime()+(days*864e5));d.cookie=n+'='+e(v)+';expires='+ex.toUTCString()+';path=/;SameSite=Lax'}
  function gp(n){var u=new URL(w.location.href);return u.searchParams.get(n)}
  
  var gclid=gp('gclid')||gc('_gclid');
  var fbclid=gp('fbclid')||gc('_fbclid');
  var msclkid=gp('msclkid')||gc('_msclkid');
  var utm={s:gp('utm_source')||gc('_utm_source'),m:gp('utm_medium')||gc('_utm_medium'),c:gp('utm_campaign')||gc('_utm_campaign'),t:gp('utm_term')||gc('_utm_term'),n:gp('utm_content')||gc('_utm_content')};
  
  if(gclid)sc('_gclid',gclid,90);
  if(fbclid)sc('_fbclid',fbclid,90);
  if(msclkid)sc('_msclkid',msclkid,90);
  if(utm.s)sc('_utm_source',utm.s,90);
  if(utm.m)sc('_utm_medium',utm.m,90);
  if(utm.c)sc('_utm_campaign',utm.c,90);
  if(utm.t)sc('_utm_term',utm.t,90);
  if(utm.n)sc('_utm_content',utm.n,90);
  
  w[s]={gclid:gclid||gc('_gclid'),fbclid:fbclid||gc('_fbclid'),msclkid:msclkid||gc('_msclkid'),utm_source:utm.s||gc('_utm_source'),utm_medium:utm.m||gc('_utm_medium'),utm_campaign:utm.c||gc('_utm_campaign'),utm_term:utm.t||gc('_utm_term'),utm_content:utm.n||gc('_utm_content'),site_id:'mycannaby-687f1af9'};
  
  function injectHiddenFields(){
    var forms=d.querySelectorAll('form');
    forms.forEach(function(f){
      if(f.dataset.adsInjected)return;
      f.dataset.adsInjected='1';
      var t=w[s];
      for(var k in t){
        if(t[k]){
          var i=d.createElement('input');
          i.type='hidden';i.name=k;i.value=t[k];
          f.appendChild(i);
        }
      }
      // Add MyCannaby specific fields
      var siteInput=d.createElement('input');siteInput.type='hidden';siteInput.name='site_id';siteInput.value='mycannaby-687f1af9';f.appendChild(siteInput);
      var consentInput=d.createElement('input');consentInput.type='hidden';consentInput.name='consent_status';consentInput.value='granted';f.appendChild(consentInput);
    });
  }
  
  if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',injectHiddenFields)}else{injectHiddenFields()}
  
  var mo=new MutationObserver(function(m){m.forEach(function(r){if(r.addedNodes.length)injectHiddenFields()})});
  mo.observe(d.body||d.documentElement,{childList:true,subtree:true});
})();
</script>
<!-- End AdsEngineer Tracking -->
`;