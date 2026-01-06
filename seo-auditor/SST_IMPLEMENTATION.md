# Universal Server-Side Tracking (SST) Implementation

A generic, reusable tracking snippet that works across all websites with server-side authentication and data processing.

## 🎯 How It Works

### 1. Universal Installation
```html
<!-- Add to every website header -->
<script>
  (function() {
    var siteId = 'your-unique-site-id';
    var script = document.createElement('script');
    script.src = 'https://your-cdn.com/universal-tracking-snippet.js';
    script.setAttribute('data-site-id', siteId);
    document.head.appendChild(script);
  })();
</script>
```

### 2. Server-Side Authentication
- Snippet sends site ID to your SST API endpoint
- Server validates domain and registration status
- Only authenticated sites receive tracking tokens

### 3. Event Processing
- Client-side batching for performance
- Server-side validation and storage
- Real-time data processing and analytics

## 🔐 Security Features

### Domain Verification
```javascript
// Server validates domain matches registration
if (registered.domain !== request.domain) {
  return { error: 'Domain mismatch' };
}
```

### Session Management
```javascript
// Temporary session tokens with expiration
const sessionId = crypto.randomUUID();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
```

### Rate Limiting
```javascript
// Automatic retry with exponential backoff
for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
  await new Promise(resolve => setTimeout(resolve, attempt * config.retryDelay));
}
```

## 📊 Data Collection

### Automatic Tracking
- Page views with UTM parameters
- Click events on CTAs and links
- Form submissions and leads
- E-commerce conversions
- User identification across sessions

### Custom Events
```javascript
// Manual event tracking
AdsEngineer.track('custom_event', {
  property1: 'value1',
  property2: 'value2'
});

// E-commerce conversion
AdsEngineer.conversion({
  value: 99.99,
  currency: 'USD',
  orderId: 'ORDER_123',
  products: [
    { id: 'PROD_1', name: 'Product 1', price: 49.99 },
    { id: 'PROD_2', name: 'Product 2', price: 50.00 }
  ]
});

// Lead capture
AdsEngineer.lead({
  email: 'user@example.com',
  formType: 'contact',
  source: 'homepage'
});
```

## 🛠️ Server Implementation

### Cloudflare Workers
```javascript
// sst-api.js
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};
```

### Database Schema
```sql
-- SQLite D1 schema for Cloudflare Workers
CREATE TABLE sites (
    site_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);

CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    properties TEXT,
    timestamp TEXT NOT NULL
);
```

## 🔧 Configuration Options

### Snippet Configuration
```javascript
var config = {
  apiEndpoint: 'https://your-api.com/api/v1/sst',
  cookiePrefix: '_yourapp_',
  batchSize: 10,
  flushInterval: 5000,
  timeout: 10000
};
```

### Site Registration
```javascript
// Multiple detection methods
var siteId = getParameter('site_id') ||
             getCookie('site_id') ||
             window.yourapp_site_id ||
             document.querySelector('meta[name="yourapp-site-id"]')?.getAttribute('content');
```

## 🌐 Distribution Strategy

### CDN Distribution
```html
<!-- Multiple fallback methods -->
<script src="https://cdn1.com/tracking.js"></script>
<script src="https://cdn2.com/tracking.js"></script>
```

### WordPress Integration
```php
function add_tracking_script() {
    $site_id = get_option('yourapp_site_id');
    if ($site_id) {
        echo '<script src="https://your-cdn.com/universal-tracking-snippet.js" data-site-id="' . esc_attr($site_id) . '"></script>';
    }
}
add_action('wp_head', 'add_tracking_script');
```

### Shopify Integration
```liquid
{% if shop.metafields.yourapp.site_id %}
<script src="https://your-cdn.com/universal-tracking-snippet.js" data-site-id="{{ shop.metafields.yourapp.site_id }}"></script>
{% endif %}
```

## 📈 Analytics Dashboard

### Real-time Metrics
- Active sites and sessions
- Event processing rates
- Error monitoring and alerts
- Performance statistics

### Site Management
```javascript
// Register new sites via API
fetch('https://your-api.com/api/v1/sst/sites', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY' },
  body: JSON.stringify({
    domain: 'example.com',
    name: 'Example Site'
  })
});
```

## 🔒 Privacy & Compliance

### GDPR Features
```javascript
// Automatic cookie consent integration
if (!hasConsent()) {
  console.log('Tracking disabled due to consent');
  return;
}

// Data deletion on request
AdsEngineer.reset(); // Clear all local data
```

### Data Retention
- Session tokens expire after 24 hours
- Event data retained per plan limits
- Automatic cleanup of expired sessions

## 🚀 Performance Optimizations

### Batching Strategy
```javascript
// Client-side batching for reduced network calls
if (state.pendingEvents.length >= config.batchSize) {
  flushEvents();
}
```

### Beacon API Usage
```javascript
// Reliable data transmission on page unload
window.addEventListener('beforeunload', function() {
  navigator.sendBeacon(apiEndpoint, eventData);
});
```

### Lazy Loading
```javascript
// Only initialize tracking when needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

## 🔍 Monitoring & Debugging

### Development Mode
```javascript
// Enable debug logging
window.ADS_ENGINEER_DEBUG = true;

// View internal state
console.log('AdsEngineer state:', state);
```

### Error Handling
```javascript
// Automatic retry with exponential backoff
try {
  await sendRequest(data);
} catch (error) {
  console.warn('Request failed, retrying...');
  setTimeout(() => sendRequest(data), 1000);
}
```

## 📋 Implementation Checklist

### Snippet Requirements
- ✅ Generic installation code
- ✅ Server-side authentication
- ✅ Cross-domain compatibility
- ✅ Privacy by design
- ✅ Performance optimized

### Server Requirements
- ✅ RESTful API endpoints
- ✅ Database schema
- ✅ Session management
- ✅ Rate limiting
- ✅ Error handling

### Security Measures
- ✅ Domain verification
- ✅ API key authentication
- ✅ Session expiration
- ✅ Input validation
- ✅ CORS handling

## 🔄 Deployment

### Cloudflare Workers Deployment
```bash
# Using Wrangler
npm install -g wrangler
wrangler deploy

# With custom environment
wrangler deploy --env production
```

### Environment Variables
```toml
# wrangler.toml
name = "your-sst-service"
compatibility_date = "2024-11-01"
[vars]
ENVIRONMENT = "production"
API_ENDPOINT = "https://your-api.com"
```

## 🎯 Benefits

### For Service Providers
- **Single Codebase**: One tracking script works everywhere
- **Easy Distribution**: Same snippet for all customers
- **Central Control**: Server-side feature management
- **Security**: Authentication prevents unauthorized usage
- **Scalability**: Cloudflare Workers handle millions of requests

### For Customers
- **Simple Setup**: Just add site ID and script
- **Fast Performance**: Optimized for Core Web Vitals
- **Privacy Compliant**: GDPR-ready with consent handling
- **Universal**: Works with any website platform
- **Reliable**: Automatic retry and error recovery

---

This universal tracking system provides a secure, scalable solution for distributed analytics across multiple platforms while maintaining strict authentication and privacy controls.