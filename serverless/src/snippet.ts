export const gclidSnippet = `
<script>
(function(){
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
  
  w[s]={gclid:gclid||gc('_gclid'),fbclid:fbclid||gc('_fbclid'),msclkid:msclkid||gc('_msclkid'),utm_source:utm.s||gc('_utm_source'),utm_medium:utm.m||gc('_utm_medium'),utm_campaign:utm.c||gc('_utm_campaign'),utm_term:utm.t||gc('_utm_term'),utm_content:utm.n||gc('_utm_content')};
  
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
    });
  }
  
  if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',injectHiddenFields)}else{injectHiddenFields()}
  
  var mo=new MutationObserver(function(m){m.forEach(function(r){if(r.addedNodes.length)injectHiddenFields()})});
  mo.observe(d.body||d.documentElement,{childList:true,subtree:true});
})();
</script>
`;

export const gclidSnippetReadable = `
<!-- AdsEngineer GCLID Capture Snippet v1.0 -->
<script>
(function() {
  var w = window, d = document;
  
  // Cookie helpers
  function getCookie(name) {
    var match = d.cookie.match('(^|;)\\\\s*' + name + '=([^;]*)');
    return match ? decodeURIComponent(match[2]) : null;
  }
  
  function setCookie(name, value, days) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    d.cookie = name + '=' + encodeURIComponent(value) + 
               ';expires=' + expires.toUTCString() + 
               ';path=/;SameSite=Lax';
  }
  
  function getParam(name) {
    var url = new URL(w.location.href);
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
  
  // Persist to cookies (survive page navigation)
  if (gclid) setCookie('_gclid', gclid, 90);
  if (fbclid) setCookie('_fbclid', fbclid, 90);
  if (msclkid) setCookie('_msclkid', msclkid, 90);
  if (utm.source) setCookie('_utm_source', utm.source, 90);
  if (utm.medium) setCookie('_utm_medium', utm.medium, 90);
  if (utm.campaign) setCookie('_utm_campaign', utm.campaign, 90);
  if (utm.term) setCookie('_utm_term', utm.term, 90);
  if (utm.content) setCookie('_utm_content', utm.content, 90);
  
  // Expose to window for manual access
  w.ads_tracking = {
    gclid: gclid || getCookie('_gclid'),
    fbclid: fbclid || getCookie('_fbclid'),
    msclkid: msclkid || getCookie('_msclkid'),
    utm_source: utm.source || getCookie('_utm_source'),
    utm_medium: utm.medium || getCookie('_utm_medium'),
    utm_campaign: utm.campaign || getCookie('_utm_campaign'),
    utm_term: utm.term || getCookie('_utm_term'),
    utm_content: utm.content || getCookie('_utm_content')
  };
  
  // Auto-inject hidden fields into all forms
  function injectHiddenFields() {
    var forms = d.querySelectorAll('form');
    forms.forEach(function(form) {
      if (form.dataset.adsInjected) return;
      form.dataset.adsInjected = '1';
      
      var tracking = w.ads_tracking;
      for (var key in tracking) {
        if (tracking[key]) {
          var input = d.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = tracking[key];
          form.appendChild(input);
        }
      }
    });
  }
  
  // Run on DOM ready
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', injectHiddenFields);
  } else {
    injectHiddenFields();
  }
  
  // Watch for dynamically added forms (SPA support)
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) injectHiddenFields();
    });
  });
  observer.observe(d.body || d.documentElement, { childList: true, subtree: true });
})();
</script>
`;
