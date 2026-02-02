# GTM Parser Architecture - Config Extraction Only

## Executive Summary

**Old Approach (WRONG):** Parser generates complex Cloudflare Worker code for each customer
**New Approach (CORRECT):** Parser extracts variable mappings ONLY, universal Worker handles all customers

## The Architecture

### Two-Component System

```
┌─────────────────────────────────────────────────────────────────┐
│                     GTM Export Parser (Migration Tool)              │
│                                                                   │
│  Input: GTM JSON Export from Google Tag Manager                │
│                                                                   │
│  Process:                                                         │
│  1. Scan tags (GA4, Facebook, Google Ads)                        │
│  2. Extract dataLayer variable references                        │
│  3. Build path maps (where to find data in dataLayer)            │
│                                                                   │
│  Output: config.json (small mapping file)                         │
│           {                                                      │
│             "purchase": {                                          │
│               "value_path": "ecommerce.checkout.total",          │
│               "currency_path": "ecommerce.currencyCode"           │
│             },                                                    │
│             "lead": {                                            │
│               "email_path": "user.hashedEmail"                  │
│             }                                                    │
│           }                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Universal Engine (Single Worker Code)               │
│                                                                   │
│  Code contains:                                                │
│  1. Platform integrations (Facebook, GA4, Google Ads)            │
│  2. Data hashing (SHA-256)                                     │
│  3. Error handling                                             │
│  4. Event routing                                               │
│  5. Rate limiting                                               │
│  6. All critical tracking logic (written ONCE)                   │
│                                                                   │
│  Runtime:                                                        │
│  1. Load customer config.json from KV/Environment             │
│  2. Extract data from dataLayer using config paths            │
│  3. Send events to platforms                                    │
│                                                                   │
│  Benefits:                                                     │
│  - Single codebase for ALL customers                           │
│  - Bug fixes = fixes for everyone                              │
│  - Faster deployments                                         │
│  - No fragile code generation                                  │
│  - Stable, maintainable                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component 1: GTM Parser (Config Extraction)

### Purpose

Extract variable path mappings from GTM container export JSON.

### Input

```json
// GTM Export from Google Tag Manager
{
  "containerVersion": {
    "tag": [
      {
        "name": "Purchase - Facebook",
        "type": "html",
        "parameter": [
          {
            "key": "html",
            "type": "template",
            "value": "fbq('track', 'Purchase', {\n  value: {{dlv - checkout total}},\n  currency: {{dlv - checkout currency}}\n})"
          }
        ],
        "firingTriggerId": ["TRIGGER-123"]
      },
      {
        "name": "GA4 - Purchase Events",
        "type": "gaawe",
        "parameter": [
          {
            "key": "currency",
            "value": "{{dlv - checkout currency}}",
            "type": "template"
          },
          {
            "key": "value",
            "value": "{{dlv - checkout total}}",
            "type": "template"
          }
        ]
      }
    ]
  }
}
```

### Process

```typescript
/**
 * GTM Parser - Extract Variable Paths
 * 
 * Maps dataLayer variable references to dataLayer paths, not code generation.
 */
export class GTMConfigParser {
  /**
   * Parse GTM export JSON
   */
  parse(exportData: string): VariableMapping {
    const parsed = JSON.parse(exportData);
    
    // 1. Find all tags
    const tags = parsed.containerVersion.tag || [];
    
    // 2. For each event, extract variable paths
    const eventMappings: EventMapping = {};
    
    for (const event of ['purchase', 'add_to_cart', 'begin_checkout', 'generate_lead', 'signup']) {
      const eventTags = tags.filter(tag => 
        this.isEventTag(tag.type, event) || 
        tag.name.toLowerCase().includes(event)
      );
      
      const mapping: PathMapping = {};
      
      eventTags.forEach(tag => {
        const variables = this.extractVariables(tag);
        
        for (const [key, variableRef] of Object.entries(variables)) {
          const dataLayerPath = this.variableToDataLayerPath(variableRef);
          
          if (dataLayerPath) {
            mapping[key] = dataLayerPath;
          }
        }
      });
      
      if (Object.keys(mapping).length > 0) {
        eventMappings[event] = mapping;
      }
    }
    
    return eventMappings;
  }
  
  /**
   * Extract variable references from tag parameters
   */
  private extractVariables(tag: any): Record<string, string> {
    const params = tag.parameter || [];
    const variables: Record<string, string> = {};
    
    params.forEach((param: any) => {
      if (param.type === 'template' && param.value) {
        // Match GTM variable references: {{variable-name}}
        const matches = param.value.match(/\{\{([a-zA-Z0-9_- .]+)\}\}/g) || [];
        
        matches.forEach(match => {
          const cleaned = match.replace(/\{\{|\}\}/g, '');
          
          if (cleaned.includes('dlv - ')) {          // dataLayer variable
            variables['value'] = cleaned.replace('dlv - ', '');
          } else if (cleaned.startsWith('jsm ')) { // JavaScript variable
            variables['value'] = cleaned.replace('jsm ', '');
          }
        });
      }
    });
    
    return variables;
  }
  
  /**
   * Convert GTM variable reference to dataLayer path
   * 
   * Examples:
   *   dlv - checkout total → ecommerce.checkout.total
   *   dlv - checkout currency → ecommerce.currencyCode
   *   dlv - checkout items → ecommerce.items
   */
  private variableToDataLayerPath(gtmVariable: string): string | null {
    // Parse the variable format
    const parts = gtmVariable.split(' - ');
    
    if (parts[0] === 'dlv') {  // dataLayer variable
      const variableName = parts[1];
      
      // Common mappings
      const pathMap: Record<string, string> = {
        'checkout total': 'ecommerce.checkout.total',
        'checkout currency': 'ecommerce.currencyCode',
        'checkout items': 'ecommerce.items',
        'page path': 'pagePath',
        'page title': 'pageTitle',
        'event name': 'event',
        'user hashed email': 'user.hashedEmail',
        'user email': 'user.email',
        // Add more mappings as needed
      };
      
      return pathMap[variableName.split('.').join('.')] || null;
    }
    
    return null;
  }
  
  /**
   * Check if tag is for a specific event
   */
  private isEventTag(tagType: string, event: string): boolean {
    const eventMap: Record<string, RegExp> = {
      'purchase': /purchase/i,
      'add_to_cart': /add.*cart/i,
      'begin_checkout': /begin.*checkout/i,
      'generate_lead': /lead/i,
      'signup': /sign.?up/i,
    };
    
    const pattern = eventMap[event];
    return pattern ? pattern.test(tagType) : false;
  }
}
```

### Output

```json
{
  "purchase": {
    "value_path": "ecommerce.checkout.total",
    "currency_path": "ecommerce.currencyCode",
    "content_ids_path": "ecommerce.items.0.id",
    "tracking_id": null
  },
  "add_to_cart": {
    "items_path": "ecommerce.items",
    "item_id_path": "ecommerce.items.0.id",
    "value_path": null
  },
  "generate_lead": {
    "email_path": "user.hashedEmail",
    "phone_path": "user.phone"
  },
  "signup": {
    "email_path": "user.email",
    "signup_method_path": "user.signupMethod"
  }
}
```

---

## Component 2: Universal Engine (Single Worker)

### Purpose

Single worker code that handles ALL customers by reading their config.json at runtime.

### Architecture

```typescript
/**
 * Universal Tracking Engine
 * 
 * Handles all customer tracking by loading customer-specific config at runtime.
 * 
 * Benefits:
 * - Single codebase for 1000s of customers
 * - Bug fixes = updates for everyone
 * - No fragile code generation
 * - Stable, maintainable
 */

interface CustomerConfig {
  customerId: string;
  purchase: {
    value_path: string;
    currency_path: string;
  };
  add_to_cart: {
    items_path: string;
  };
  // ... other events
}

/**
 * Example worker file structure:
 */
```

### Worker Code

```typescript
// workers/universal-engine/index.ts

/**
 * Load customer config from KV storage
 */
async function getCustomerConfig(customerId: string, KV: KVNamespace): Promise<Context> {
  const cacheKey = `customer:${customerId}:config`;
  
  const cached = await KV.get(cacheKey, { type: 'json', cacheTtl: 3600 });
  
  if (cached) {
    return cached as CustomerConfig;
  }
  
  // If not in KV, use environment variable (for deployment)
  const configEnvVar = Deno.env.get(`CONFIG_${customerId}`);
  
  if (!configEnvVar) {
    throw new Error(`No config found for customer ${customerId}`);
  }
  
  const config = JSON.parse(configEnvVar);
  
  // Cache it
  await KV.put(cacheKey, JSON.stringify(config), { expirationTtl: 3600 });
  
  return config;
}

/**
 * Navigate dataLayer paths using customer config
 */
function getFromDataLayer(dataLayer: any, path: string): any {
  const parts = path.split('.');
  let current: any = dataLayer;
  
  for (const part of parts) {
    if (current && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Generate Facebook purchase event using customer config
 */
async function sendFacebookPurchase(
  dataLayer: any, 
  config: CustomerConfig,
  env: Env
): Promise<void> {
  const value = getFromDataLayer(dataLayer, config.purchase.value_path);
  const currency = getFromDataLayer(dataLayer, config.purchase.currency_path);
  
  if (!value || !currency) {
    throw new Error('Required data missing for Facebook purchase');
  }
  
  // Send to Facebook pixel
  await fetch(
    `https://graph.facebook.com/v18.0/${env.FACEBOOK_PIXEL_ID}/events`,
    {
      method: 'POST',
      headers: {
        'access-token': env.FACEBOOK_ACCESS_TOKEN,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: dataLayer.pageURL,
            event_source: 'web',
            action_source: 'website',
            user_data: {
              em: hashEmail(dataLayer.user?.email),
            },
            custom_data: {
              value,
              currency,
            },
          },
        ],
        test_event_code: env.TEST_EVENT_CODE,
      }),
    }
  );
}

/**
 * GA4 purchase event using customer config
 */
async function sendGA4Purchase(
  dataLayer: any,
  config: CustomerConfig,
  env: Env
): Promise<void> {
  const value = getFromDataLayer(dataLayer, config.purchase.value_path);
  const currency = getFromDataLayer(dataLayer, config.purchase.currency_path);
  
  await fetch(
    `https://www.google-analytics.com/mp/collect` +
    `?measurement_id=${env.GA4_MEASUREMENT_ID}` +
    `&api_secret=${env.GA4_API_SECRET}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: dataLayer.clientId || generateUUID(),
        events: [{
          name: 'purchase',
          params: {
            transaction_id: dataLayer.transactionId,
            value,
            currency,
            items: getFromDataLayer(dataLayer, config.purchase.content_ids_path) || [],
          }
        }]
      })
    }
  );
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Extract customer ID from hostname
    const customerId = url.hostname.replace('.adsengineer.workers.dev', '');
    
    // Load customer config
    const config = await getCustomerConfig(customerId, env.KV);
    
    // Parse incoming data (from customer's website)
    const dataLayer = await request.json();
    
    // Determine event type
    const eventType = dataLayer.event || 'unknown';
    
    // Process based on event and config
    switch (eventType) {
      case 'purchase':
        await Promise.all([
          sendFacebookPurchase(dataLayer, config, env),
          sendGA4Purchase(dataLayer, config, env),
        ]);
        break;
        
      case 'lead':
        // Use config to find email
        const email = getFromDataLayer(dataLayer, config.generate_lead.email_path);
        // ... process lead
        break;
    }
    
    return Response.json({
      success: true,
      eventProcessed: eventType,
      customerId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Key Properties

1. **Single codebase:** All customers use same worker
2. **Config-driven:** Customer specific behavior from config.json
3. **Stable logic:** No code generation, just path extraction
4. **Fast deployment:** 2 minutes per customer
5. **Easy maintenance:** Bug fixes = fixes for all customers
6. **Scalable:** 1000s of customers without code duplication

---

## Deployment Workflow

### For Sergej (Onboarding New Customer)

**OLD WAY (4-8 hours):**
1. Request access to customer's Shopify backend
2. Manually inspect theme files
3. Find dataLayer variable names
4. Write custom worker code for customer
5. Test deployment
6. Debug issues
7. Repeat on every new customer

**NEW WAY (2 minutes):**
```bash
# 1. Sergej uploads GTM export
curl -X POST https://parser.adsengineer.com/parse \
  -H "Content-Type: application/json" \
  -d @customer-x-gtm-export.json \
  -H "Authorization: Bearer YOUR-API-TOKEN"

# 2. Parser returns config.json
{
  "purchase": {
    "value_path": "ecommerce.checkout.total",
    "currency_path": "ecommerce.currencyCode"
  },
  "lead": {
    "email_path": "user.hashedEmail"
  }
}

# 3. Deploy specific config to customer's worker
curl -X POST https://deploy.adsengineer.com/update-config \
  -H "Authorization: Bearer YOUR-API-TOKEN" \
  -d '{ 
    "customerId": "customer-x",
    "config": {
      "purchase": {
        "value_path": "ecommerce.checkout.total",
        "currency_path": "ecommerce.currencyCode"
      }
    }
  }'

# 4. Done! Worker now knows:
#   - Where to find purchase value
#   - Where to find currency
#   - How to send to Facebook/GA4 for THIS customer
```

### Config Storage Options

**Option A: KV Namespace (Global)**
```typescript
// One KV namespace for all customers
const customerConfigs = env.KV;

// Customer config stored at key: `customer:{id}:config`
await customerConfigs.put(
  `customer:customer-x:config`,
  JSON.stringify(config),
  { expirationTtl: 86400 }
);
```

**Option B: Environment Variables (Per-Customer Worker)**
```json
// wrangler.toml for customer-x
[[kv_namespaces]]
binding = "KV"
id = "xxx"

[env.vars]
CONFIG_CUSTOMER_X = '{ "purchase": { "value_path": "ecommerce.checkout.total" } }'
```

**Option C: D1 Database (Recommended for Multi-Customer)**
```sql
CREATE TABLE customer_configs (
  id INTEGER PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  config_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

SELECT config_json 
FROM customer_configs 
WHERE customer_id = 'customer-x';
```

---

## Implementation Plan

### Phase 1 (Week 1): GTM Parser Core
1. Implement `GTMConfigParser` class
2. Variable reference extraction ({{variable}} patterns)
3. Path mapping (variable → dataLayer)
4. Config JSON generation
5. CLI interface: Upload GTM JSON → Extract config

### Phase 2 (Week 1-2): Universal Engine
1. Create `workers/universal-engine/index.ts`
2. Config loading mechanism (KV/D1/Environment)
3. DataLayer path traversal
4. Platform integrations (Facebook, GA4, Google Ads)
5. Error handling & logging

### Phase 3 (Week 2): Deployment Workflow
1. Parse CLI command
2. Deployment API (update customer config)
3. Worker deployment pipeline
4. Testing on real GTM exports

### Phase 4 (Week 2-3): Documentation & Onboarding
1. Sergej workflow documentation
2. GTM export documentation
3. FAQ for variable mapping
4. Common patterns for different shops

---

## Example: Full Flow

### Original GTM Export (Sample)

```json
{
  "containerVersion": {
    "tag": [
      {
        "name": "Facebook Purchase",
        "type": "html",
        "parameter": [{
          "key": "html",
          "type": "template",
          "value": "fbq('track', 'Purchase', {\n  value: {{dlv - checkout total}},\n  currency: {{dlv - checkout currency}}\n})"
        }]
      },
      {
        "name": "GA4 Purchase",
        "type": "gaawe",
        "parameter": [
          {
            "key": "value",
            "value": "{{dlv - checkout total}}",
            "type": "template"
          },
          {
            "key": "currency",
            "value": "{{dlv - checkout currency}}",
            "type": "template"
          }
        ]
      }
    ]
  }
}
```

### Parser Output (config.json)

```bash
$ npx gtm-parser extract customer-a-gtm-export.json

✓ Found 2 tags for 'purchase' event
✓ Extracted 2 variable references
✓ Generated customer config

{
  "purchase": {
    "value_path": "ecommerce.checkout.total",
    "currency_path": "ecommerce.currencyCode"
  },
  "lead": {
    "email_path": "user.hashedEmail"
  }
}

📄 Saved to: configs/customer-a/config.json
```

### Deployment

```bash
# Deploy config to customer's worker
$ npx deploy-config customer-a configs/customer-a/config.json

✓ Config uploaded to KV: customer:customer-a:config
✓ Worker redeployed with new config
✓ Ready for traffic
```

### Worker Runtime Behavior

```typescript
// worker sees incoming purchase event
{
  "event": "purchase",
  "dataLayer": {
    "client_id": "abc123",
    "ecommerce": {
      "checkout": {
        "total": 99.99,
        "currency": "EUR",
        "items": [{
          "id": "SKU-123",
          "name": "Product"
        }]
      },
      "currencyCode": "EUR"
    }
  }
}

// Worker loads config
const config = await getCustomerConfig('customer-a', KV);

// Uses config to navigate dataLayer
const value = getFromDataLayer(dataLayer, config.purchase.value_path);
// value = 99.99 (from ecommerce.checkout.total via config)

// Sends to platforms
await sendFacebookPurchase({ value, currency });
await sendGA4Purchase({ value, currency });

// Returns success
{
  "success": true,
  "eventProcessed": "purchase",
  "customerId": "customer-a",
  "dataExtracted": {
    "value": 99.99,
    "currency": "EUR"
  }
}
```

---

## Comparison: Approach Differences

| Feature | Code Generation (OLD) | Config Extraction (NEW) |
|---------|---------------------|---------------------|
| Worker code per customer | ✅ Yes (fragile) | ❌ No (single worker) |
| Customer onboarding time | 4-8 hours | 2 minutes |
| Bug fix scope | Per-customer updates | Single update for all |
| Maintenance burden | High (1000+ workers) | Low (1 worker + configs) |
| Deployment reliability | Medium | High |
| Sergej's required access | Shopify backend | GTM export only |
| Variable mapping | Manual investigation | Automatic extraction |
| Scalability | Limited (10-20 customers) | Unlimited (1000+ customers) |

---

## Benefits Summary

### For You (Maintainability)
- **Single codebase:** 1 worker vs 1000+ workers
- **Easy debugging:** One place to investigate issues
- **Fast fixes:** Bug fix = instant fix for all customers
- **Stable platform:** No code generation fragility

### For Sergej (Speed)
- **Fast onboarding:** 2 minutes vs 4-8 hours
- **No Shopify access:** Only needs GTM export
- **No debugging burden:** Automated extraction
- **Scalable:** Can onboard 10 customers/day

### For AdsEngineer (Revenue)
- **Higher margin:** Less manual time per customer
- **Competitive advantage:** 2-minute setup is huge selling point
- **Enterprise scale:** Support 1000+ customers easily
- **Recurring revenue:** Config updates on GTM changes (low churn)

---

## Next Steps

1. **Review this architecture document**
2. **Decide on config storage:** KV, D1, or Environment variables?
3. **Start Phase 1:** Implement `GTMConfigParser` (1 week)
4. **Test with real GTM exports** from current customers
5. **Deploy Universal Engine** (single worker codebase)

**Timeline:** 3 weeks for full production system

**Revenue Impact:** Can support unlimited customers with 2-minute onboarding = revenue growth without headcount increase.