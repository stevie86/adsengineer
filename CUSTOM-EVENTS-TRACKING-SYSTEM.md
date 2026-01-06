# Custom Events Tracking System - AdsEngineer

## 🎯 **Overview**

This document defines standardized custom events for AdsEngineer that can be tracked across multiple platforms (Shopify, WooCommerce, custom sites) with consistent naming, triggering, and data structure.

## 📊 **Custom Events Specification**

| Event Name | Platform Trigger | Google Ads Conversion | Data Fields | Strategic Value |
|------------|------------------|----------------------|-------------|-----------------|
| `subscription_start` | Shopify: Order with subscription product<br>WooCommerce: Subscription order created | Purchase (Subscription) | `value`, `currency`, `subscription_id`, `product_ids` | Priority 1: Separates one-time vs subscription purchases. Enables bidding optimization for high-LTV subscribers. |
| `returning_customer_purchase` | Customer exists in database<br>Shopify: `customer.orders_count > 1`<br>WooCommerce: Previous orders exist | Purchase (Repeat) | `value`, `currency`, `customer_id`, `order_count`, `days_since_first_purchase` | Customer retention optimization. Helps Google find profiles that purchase >1x. |
| `high_value_transaction` | Cart value > €150 (or 1.5x AOV)<br>Shopify: `total_price > 150`<br>WooCommerce: `order_total > 150` | Purchase (High Value) | `value`, `currency`, `threshold`, `aov_ratio` | Identifies "whale" customers. Google targets high-value buyers. |
| `subscription_intent` | Click on "Abo & Sparen" option<br>Shopify: Product page interaction<br>WooCommerce: Subscription button click | Custom Conversion (Intent) | `product_id`, `page_url`, `interaction_type` | Micro-conversion for retargeting. Follow up on subscription interest. |
| `loyalty_register` | Loyalty program signup / Account creation<br>Shopify: Customer account created<br>WooCommerce: User registration with loyalty | Custom Conversion (Registration) | `registration_method`, `referrer`, `loyalty_tier` | Long-term repeat rate increase (Phase 2). Builds customer database. |

## 🏗️ **Technical Implementation**

### **Database Schema for Configurable Events**

The system supports configurable custom events that can be assigned multiple times with different settings:

#### **Custom Event Definitions Table**
```sql
CREATE TABLE custom_event_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  event_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'webhook', 'frontend', 'api', 'manual'
  trigger_conditions TEXT NOT NULL, -- JSON conditions
  supported_platforms TEXT NOT NULL, -- JSON array
  google_ads_conversion_action TEXT,
  google_ads_category TEXT,
  strategic_value TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1
);
```

#### **Site Assignments Table (Multiple Assignments Allowed)**
```sql
CREATE TABLE site_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  event_definition_id INTEGER NOT NULL,
  assignment_name TEXT, -- Optional: distinguish multiple assignments
  assignment_description TEXT, -- Optional: describe this assignment
  is_enabled BOOLEAN DEFAULT 1,
  custom_conditions TEXT, -- JSON overrides
  custom_conversion_action TEXT, -- Override conversion action
  thresholds TEXT -- JSON: custom thresholds
  -- Note: No UNIQUE constraint - same event can be assigned multiple times
);
```

### **Event Data Structure**

All custom events follow this standardized format:

```typescript
interface CustomEvent {
  event_name: string;           // One of the defined event names
  event_timestamp: string;      // ISO 8601 timestamp
  platform: string;             // 'shopify', 'woocommerce', 'custom'
  site_id: string;              // Site identifier
  user_id?: string;             // Platform user ID
  session_id?: string;          // Session tracking
  gclid?: string;               // Google Click ID
  fbclid?: string;              // Facebook Click ID
  utm_parameters?: {            // UTM tracking
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  event_data: {                 // Event-specific data
    [key: string]: any;
  };
}
```

### **Multiple Assignment Examples**

Since events can be assigned multiple times, you can have different configurations:

```json
// Assignment 1: High-value purchases for premium customers
{
  "event_definition_id": 3,
  "assignment_name": "Premium High Value",
  "assignment_description": "High value tracking for premium segment",
  "thresholds": {"value_threshold": 200, "aov_multiplier": 2.0},
  "custom_conversion_action": "premium_high_value_purchase"
}

// Assignment 2: High-value purchases for regular customers
{
  "event_definition_id": 3,
  "assignment_name": "Regular High Value",
  "assignment_description": "High value tracking for regular customers",
  "thresholds": {"value_threshold": 150, "aov_multiplier": 1.5},
  "custom_conversion_action": "regular_high_value_purchase"
}
```

### **Shopify Implementation**

#### **Webhook Triggers**

```javascript
// shopify-plugin/index.js - Enhanced webhook processing
const CUSTOM_EVENT_MAPPINGS = {
  'orders/create': (order) => {
    const events = [];

    // Check for subscription products
    const hasSubscription = order.line_items?.some(item =>
      item.product_type?.includes('subscription') ||
      item.title?.includes('Abo') ||
      item.sku?.startsWith('SUB-')
    );

    if (hasSubscription) {
      events.push({
        event_name: 'subscription_start',
        event_data: {
          subscription_id: order.id,
          product_ids: order.line_items?.map(item => item.product_id),
          billing_interval: 'monthly' // Could be extracted from product
        }
      });
    }

    // Check for returning customer
    if (order.customer?.orders_count > 1) {
      events.push({
        event_name: 'returning_customer_purchase',
        event_data: {
          customer_id: order.customer.id,
          order_count: order.customer.orders_count,
          days_since_first_purchase: calculateDaysSinceFirst(order.customer.created_at)
        }
      });
    }

    // Check for high value transaction
    const orderValue = parseFloat(order.total_price);
    const HIGH_VALUE_THRESHOLD = 150; // Configurable

    if (orderValue > HIGH_VALUE_THRESHOLD) {
      events.push({
        event_name: 'high_value_transaction',
        event_data: {
          value: orderValue,
          threshold: HIGH_VALUE_THRESHOLD,
          currency: order.currency || 'EUR'
        }
      });
    }

    return events;
  },

  'customers/create': (customer) => {
    // Loyalty registration event
    return [{
      event_name: 'loyalty_register',
      event_data: {
        registration_method: 'account_creation',
        customer_id: customer.id,
        referrer: customer.source_name
      }
    }];
  }
};

// Enhanced webhook processing
async function processOrderWebhook(body, shop) {
  try {
    const order = JSON.parse(body);
    const events = [];

    // Get platform-specific events
    const webhookType = 'orders/create'; // From headers
    if (CUSTOM_EVENT_MAPPINGS[webhookType]) {
      events.push(...CUSTOM_EVENT_MAPPINGS[webhookType](order));
    }

    // Send each event to AdsEngineer
    for (const event of events) {
      await sendCustomEventToAdsEngineer({
        ...event,
        event_timestamp: order.created_at,
        platform: 'shopify',
        site_id: shop,
        gclid: extractGclid(order),
        user_id: order.customer?.id,
        event_data: {
          ...event.event_data,
          order_id: order.id,
          order_value: parseFloat(order.total_price),
          currency: order.currency || 'EUR'
        }
      });
    }

    // Send to existing AdsEngineer endpoint
    const response = await fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': shop,
        'X-Shopify-Topic': 'orders/create'
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      console.error('Failed to send to AdsEngineer:', response.statusText);
    } else {
      console.log(`Processed ${events.length} custom events for order ${order.id}`);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}
```

#### **Frontend Tracking for Subscription Intent**

```javascript
// Enhanced snippet.js - Add to adsengineer-cloud snippet
(function() {
  'use strict';

  // ... existing code ...

  // Track subscription intent
  function trackSubscriptionIntent(productId, interactionType) {
    sendTrackingData({
      event_name: 'subscription_intent',
      event_data: {
        product_id: productId,
        interaction_type: interactionType, // 'button_click', 'option_select'
        page_url: window.location.href
      }
    });
  }

  // Add event listeners for subscription buttons
  document.addEventListener('DOMContentLoaded', function() {
    // Listen for clicks on subscription-related elements
    document.addEventListener('click', function(event) {
      const target = event.target;

      // Check for subscription buttons
      if (target.matches('[data-subscription], .subscription-button, [href*="abo"], [href*="subscription"]') ||
          target.closest('[data-subscription], .subscription-button')) {

        const productElement = target.closest('[data-product-id]') ||
                              document.querySelector('[data-product-id]');
        const productId = productElement?.getAttribute('data-product-id') ||
                         getProductIdFromUrl();

        trackSubscriptionIntent(productId, 'button_click');
      }
    });

    // Listen for subscription option selection
    document.addEventListener('change', function(event) {
      if (event.target.matches('select[name*="subscription"], input[name*="abo"]')) {
        const productId = getProductIdFromPage();
        trackSubscriptionIntent(productId, 'option_select');
      }
    });
  });

  // Helper functions
  function getProductIdFromUrl() {
    const match = window.location.pathname.match(/\/products\/([^\/]+)/);
    return match ? match[1] : null;
  }

  function getProductIdFromPage() {
    return document.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
           getProductIdFromUrl();
  }

  // ... existing code ...
})();
```

### **AdsEngineer API Enhancement**

#### **Event Definitions Management API**

```typescript
// POST /api/v1/custom-event-definitions/definitions - Create custom event definition
// GET /api/v1/custom-event-definitions/definitions - List available definitions
// PUT /api/v1/custom-event-definitions/definitions/:id - Update definition
// DELETE /api/v1/custom-event-definitions/definitions/:id - Delete definition

// POST /api/v1/custom-event-definitions/sites/:siteId/assign - Assign event to site
// GET /api/v1/custom-event-definitions/sites/:siteId - Get all assignments for site
// DELETE /api/v1/custom-event-definitions/sites/:siteId/events/:eventDefinitionId - Remove assignment

// POST /api/v1/custom-events - Track custom events
// GET /api/v1/custom-events - Retrieve tracked events

// Event validation uses database-driven definitions
// Supports multiple assignments of same event with different settings
```

#### **Database-Driven Event Processing**

Events are now processed based on site assignments rather than hardcoded logic:

```typescript
// Dynamic event processing based on site assignments
async function processEventWithAssignments(event, siteId, db) {
  // Get all assignments for this event on this site
  const assignments = await db.prepare(`
    SELECT * FROM site_custom_events sce
    JOIN custom_event_definitions ced ON sce.event_definition_id = ced.id
    WHERE sce.site_id = ? AND ced.event_name = ? AND sce.is_enabled = 1
  `).bind(siteId, event.event_name).all();

  // Process each assignment with its specific configuration
  for (const assignment of assignments) {
    const config = {
      ...assignment,
      thresholds: assignment.thresholds ? JSON.parse(assignment.thresholds) : {},
      custom_conditions: assignment.custom_conditions ? JSON.parse(assignment.custom_conditions) : {}
    };

    // Apply custom logic based on assignment configuration
    await processEventWithConfig(event, config);
  }
}
```

#### **Database Schema**

```sql
-- Custom events table
CREATE TABLE custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_timestamp TEXT NOT NULL,
  platform TEXT NOT NULL,
  site_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  gclid TEXT,
  fbclid TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  event_data TEXT NOT NULL, -- JSON string
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES agencies(id)
);

-- Indexes for performance
CREATE INDEX idx_custom_events_org_timestamp ON custom_events(org_id, event_timestamp);
CREATE INDEX idx_custom_events_name ON custom_events(event_name);
CREATE INDEX idx_custom_events_platform ON custom_events(platform, site_id);
CREATE INDEX idx_custom_events_gclid ON custom_events(gclid);
```

### **Google Ads Conversion Setup**

#### **Required Conversion Actions**

```javascript
// Google Ads API - Conversion Actions to Create
const CONVERSION_ACTIONS = [
  {
    name: 'subscription_purchase',
    category: 'PURCHASE',
    attribution_model: 'DATA_DRIVEN',
    click_through_lookback_window_days: 90,
    view_through_lookback_window_days: 30
  },
  {
    name: 'repeat_purchase',
    category: 'PURCHASE',
    attribution_model: 'DATA_DRIVEN',
    click_through_lookback_window_days: 90,
    view_through_lookback_window_days: 30
  },
  {
    name: 'high_value_purchase',
    category: 'PURCHASE',
    attribution_model: 'DATA_DRIVEN',
    click_through_lookback_window_days: 90,
    view_through_lookback_window_days: 30
  },
  {
    name: 'subscription_intent',
    category: 'SIGN_UP',
    attribution_model: 'LAST_CLICK',
    click_through_lookback_window_days: 30,
    view_through_lookback_window_days: 7
  },
  {
    name: 'loyalty_registration',
    category: 'SIGN_UP',
    attribution_model: 'FIRST_CLICK',
    click_through_lookback_window_days: 90,
    view_through_lookback_window_days: 30
  }
];
```

## 🔄 **Multiple Event Assignments**

### **Why Multiple Assignments?**

Custom events can be assigned multiple times to the same site with different configurations:

- **Different Thresholds**: High-value events with different value thresholds
- **Segment-Specific**: Different conversion actions for different customer segments
- **A/B Testing**: Test different configurations simultaneously
- **Platform Variations**: Different settings for different platforms

### **API Examples**

#### **Assign Same Event Multiple Times**
```bash
# First assignment: Premium high-value purchases
curl -X POST https://api.adsengineer.com/api/v1/custom-event-definitions/sites/mycannaby.de/assign \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "event_definition_id": 3,
    "assignment_name": "Premium High Value",
    "assignment_description": "High value tracking for premium customers",
    "thresholds": {"value_threshold": 200},
    "custom_conversion_action": "premium_purchase"
  }'

# Second assignment: Regular high-value purchases
curl -X POST https://api.adsengineer.com/api/v1/custom-event-definitions/sites/mycannaby.de/assign \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "event_definition_id": 3,
    "assignment_name": "Regular High Value",
    "assignment_description": "High value tracking for regular customers",
    "thresholds": {"value_threshold": 150},
    "custom_conversion_action": "regular_purchase"
  }'
```

#### **Retrieve All Assignments for a Site**
```bash
curl https://api.adsengineer.com/api/v1/custom-event-definitions/sites/mycannaby.de
# Returns both assignments of the high_value_transaction event
```

## 📚 **Platform-Specific Implementation Guides**

### **Shopify Integration Guide**

#### **Step 1: Enhanced Webhook Configuration**

In Shopify Partner Dashboard → Your App → Webhooks:

```
Event: Order creation
URL: https://your-plugin-url.com/webhooks/orders-create
Format: JSON
API Version: 2024-10

Event: Customer creation
URL: https://your-plugin-url.com/webhooks/customers-create
Format: JSON
API Version: 2024-10
```

#### **Step 2: Product Configuration**

For subscription products, ensure they have:
- Product type: "Subscription" or "Abo"
- SKU prefix: "SUB-" (optional)
- Tags: "subscription" (optional)

#### **Step 3: Theme Customization**

Add to product pages for subscription intent tracking:

```liquid
<!-- In Shopify theme, product.liquid -->
<button class="subscription-button"
        data-product-id="{{ product.id }}"
        data-subscription="true">
  Abo & Sparen
</button>
```

### **WooCommerce Integration Guide**

#### **Webhooks Setup**

```php
// functions.php - WooCommerce webhooks
add_action('woocommerce_order_status_completed', 'adsengineer_track_custom_events');

function adsengineer_track_custom_events($order_id) {
    $order = wc_get_order($order_id);
    $customer_id = $order->get_customer_id();

    $events = [];

    // Check for subscription
    if (class_exists('WC_Subscriptions') && wcs_order_contains_subscription($order)) {
        $events[] = [
            'event_name' => 'subscription_start',
            'event_data' => [
                'subscription_id' => $order_id,
                'product_ids' => array_map(function($item) {
                    return $item->get_product_id();
                }, $order->get_items())
            ]
        ];
    }

    // Check for returning customer
    $customer_orders = wc_get_orders([
        'customer' => $customer_id,
        'status' => 'completed',
        'limit' => -1
    ]);

    if (count($customer_orders) > 1) {
        $events[] = [
            'event_name' => 'returning_customer_purchase',
            'event_data' => [
                'customer_id' => $customer_id,
                'order_count' => count($customer_orders)
            ]
        ];
    }

    // Send events to AdsEngineer
    foreach ($events as $event) {
        wp_remote_post('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/custom-events', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer YOUR_API_KEY'
            ],
            'body' => json_encode(array_merge($event, [
                'platform' => 'woocommerce',
                'site_id' => get_site_url(),
                'event_timestamp' => current_time('c'),
                'gclid' => $_COOKIE['_adsengineer_gclid'] ?? null
            ]))
        ]);
    }
}
```

### **Custom Platform Integration**

#### **JavaScript SDK**

```javascript
// adsengineer-custom-events.js
window.AdsEngineer = window.AdsEngineer || {};

window.AdsEngineer.trackEvent = function(eventName, eventData = {}) {
  const event = {
    event_name: eventName,
    event_timestamp: new Date().toISOString(),
    platform: 'custom',
    site_id: window.location.hostname,
    gclid: getCookie('_adsengineer_gclid'),
    fbclid: getCookie('_adsengineer_fbclid'),
    utm_parameters: {
      source: getParam('utm_source'),
      medium: getParam('utm_medium'),
      campaign: getParam('utm_campaign'),
      term: getParam('utm_term'),
      content: getParam('utm_content')
    },
    event_data: eventData
  };

  fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/custom-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify(event)
  }).catch(console.error);
};

// Helper functions
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Usage examples
AdsEngineer.trackEvent('subscription_start', {
  subscription_id: 'sub_123',
  product_ids: [456, 789],
  value: 29.99
});

AdsEngineer.trackEvent('returning_customer_purchase', {
  customer_id: 'cust_123',
  order_count: 3,
  days_since_first_purchase: 45
});

AdsEngineer.trackEvent('high_value_transaction', {
  value: 299.99,
  threshold: 150,
  currency: 'EUR'
});

AdsEngineer.trackEvent('subscription_intent', {
  product_id: 456,
  interaction_type: 'button_click'
});

AdsEngineer.trackEvent('loyalty_register', {
  registration_method: 'account_creation',
  referrer: 'newsletter_signup'
});
```

## 📊 **Analytics & Reporting**

### **Custom Events Dashboard**

```sql
-- Custom events summary
SELECT
  event_name,
  platform,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CAST(json_extract(event_data, '$.value') AS FLOAT)) as avg_value,
  SUM(CASE WHEN gclid IS NOT NULL THEN 1 ELSE 0 END) as attributed_events
FROM custom_events
WHERE created_at >= date('now', '-30 days')
GROUP BY event_name, platform
ORDER BY total_events DESC;
```

### **Conversion Funnel Analysis**

```sql
-- Track user journey
SELECT
  user_id,
  GROUP_CONCAT(event_name ORDER BY event_timestamp) as event_sequence,
  MIN(event_timestamp) as first_event,
  MAX(event_timestamp) as last_event,
  COUNT(*) as total_events
FROM custom_events
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total_events DESC;
```

## 🔧 **Configuration & Thresholds**

### **Configurable Parameters**

```javascript
const CUSTOM_EVENTS_CONFIG = {
  high_value_threshold: 150, // €150 threshold
  high_value_aov_multiplier: 1.5, // 1.5x average order value
  subscription_keywords: ['abo', 'subscription', 'monatlich'],
  loyalty_registration_events: ['account_created', 'newsletter_signup', 'loyalty_join']
};
```

## 🎯 **Testing & Validation**

### **Test Cases**

```javascript
// Test data for validation
const TEST_EVENTS = [
  {
    event_name: 'subscription_start',
    event_data: { subscription_id: 'test_sub', product_ids: [123] },
    expected_conversion: 'subscription_purchase'
  },
  {
    event_name: 'returning_customer_purchase',
    event_data: { customer_id: 'test_cust', order_count: 3 },
    expected_conversion: 'repeat_purchase'
  },
  {
    event_name: 'high_value_transaction',
    event_data: { value: 299.99, threshold: 150 },
    expected_conversion: 'high_value_purchase'
  },
  {
    event_name: 'subscription_intent',
    event_data: { product_id: 456, interaction_type: 'button_click' },
    expected_conversion: 'subscription_intent'
  },
  {
    event_name: 'loyalty_register',
    event_data: { registration_method: 'account_creation' },
    expected_conversion: 'loyalty_registration'
  }
];
```

### **Multiple Assignment Testing**

```javascript
// Test multiple assignments of same event
const MULTI_ASSIGNMENT_TEST = {
  event_name: 'high_value_transaction',
  site_assignments: [
    {
      assignment_name: 'Premium Threshold',
      thresholds: { value_threshold: 200 },
      custom_conversion_action: 'premium_high_value'
    },
    {
      assignment_name: 'Standard Threshold',
      thresholds: { value_threshold: 150 },
      custom_conversion_action: 'standard_high_value'
    }
  ],
  test_cases: [
    { order_value: 120, expected_matches: [] },
    { order_value: 180, expected_matches: ['Standard Threshold'] },
    { order_value: 250, expected_matches: ['Premium Threshold', 'Standard Threshold'] }
  ]
};
```

## 📊 **Custom Events Database - Complete System**

### **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Event Triggers │───▶│  Site Assignments │───▶│ Google Ads API  │
│  (Shopify/WC)   │    │  (Multiple OK)    │    │ Conversions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Event Definitions│    │  Custom Events   │    │ Conversion Queue│
│ (Configurable)   │    │  (Tracked Data)  │    │ (Upload Queue)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Database Relationships**

```
custom_event_definitions (system + org-specific)
    │
    ├── system defaults: subscription_start, returning_customer_purchase, etc.
    │
    └── org-specific: custom business events
        │
        └── site_custom_events (multiple assignments allowed)
            │
            ├── Assignment 1: Premium high-value (€200+)
            ├── Assignment 2: Standard high-value (€150+)
            └── Assignment 3: Custom configuration
                │
                └── custom_events (actual tracked events)
                    │
                    └── conversion_queue (Google Ads uploads)
```

### **Key Features**

✅ **Configurable Events**: Database-driven event definitions
✅ **Multiple Assignments**: Same event can be assigned multiple times
✅ **Flexible Thresholds**: Custom value thresholds per assignment
✅ **Platform Support**: Shopify, WooCommerce, Custom platforms
✅ **Google Ads Integration**: Automatic conversion action mapping
✅ **Organization Isolation**: Each org has own definitions and assignments
✅ **Strategic Value Tracking**: Business impact documentation

### **API Endpoints Summary**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/custom-event-definitions/definitions` | GET/POST | Manage event definitions |
| `/custom-event-definitions/definitions/:id` | PUT/DELETE | Update/delete definitions |
| `/custom-event-definitions/sites/:siteId` | GET | Get site assignments |
| `/custom-event-definitions/sites/:siteId/assign` | POST | Assign event to site |
| `/custom-event-definitions/sites/:siteId/events/:id` | DELETE | Remove assignment |
| `/custom-events` | GET/POST | Track/retrieve events |

---

**This database-driven custom events system provides unlimited flexibility for tracking and optimization across all platforms.**

## 🚀 **Deployment Checklist**

- [ ] Add custom events routes to AdsEngineer API
- [ ] Create database tables for custom events
- [ ] Update Shopify plugin with custom event logic
- [ ] Configure Google Ads conversion actions
- [ ] Test webhook processing for each event type
- [ ] Validate frontend tracking for subscription intent
- [ ] Set up analytics dashboards
- [ ] Document platform-specific implementations
- [ ] Create testing procedures
- [ ] Update monitoring for custom events

---

**This custom events system provides standardized, cross-platform tracking with strategic value for optimization and retargeting campaigns.**