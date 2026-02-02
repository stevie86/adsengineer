# GTM Parser - Config Extraction: Clarified Requirements

## The Breakthrough Moment

**OLD Understanding (WRONG):**
- Parser generates Cloudflare Worker code for each customer
- Complex code generation with fetch, logic, etc.
- Risky: Code generation is fragile and error-prone

**NEW Understanding (CORRECT):**
- Parser ONLY extracts dataLayer variable paths from GTM JSON
- Single universal Worker ("The Engine") handles ALL customers
- Config-driven: Worker loads customer-specific config.json at runtime
- Parser = Navigation map, Engine = The car

---

## What the Parser Actually Does

### Input
- GTM container export JSON file (from Google Tag Manager dashboard)
- Example: Downloaded via "Workspace > Tag Manager > Export Container"

### Processing
```typescript
1. Scan all tags in GTM export
2. Find variable references in tag parameters
3. Match patterns:
   - {{dlv - checkout total}} → needs ecommerce.checkout.total
   - {{jsm - user.email}} → needs user.email
   - {{dlv - checkout items}} → needs ecommerce.items
4. Build mapping:
   {
     "purchase": {
       "value_path": "ecommerce.checkout.total",
       "currency_path": "ecommerce.currencyCode"
     },
     "lead": {
       "email_path": "user.hashedEmail"
     }
   }
```

### Output
Small config.json file (10-50 lines) with variable path mappings only.

---

## What the Universal Engine Does

### Single Worker Code (Written ONCE)
- Handles Facebook, GA4, Meta, Google Ads integrations
- Data hashing (SHA-256)
- Error handling
- Rate limiting
- Event routing

### Runtime Behavior
```typescript
1. Load customer config.json (from KV/D1/Environment)
2. Extract data from dataLayer using config paths
3. Send events to platforms
```

### Example
```typescript
// Config for customer-a:
{
  "purchase": {
    "value_path": "ecommerce.checkout.total",
    "currency_path": "ecommerce.currencyCode"
  }
}

// Worker runtime:
const config = await loadConfig('customer-a');
const value = dataLayer[config.purchase.value_path];  // ecommerce.checkout.total
const currency = dataLayer[config.purchase.currency_path];  // ecommerce.currencyCode
sendFacebookPurchase({ value, currency });
```

---

## Why This is Better

### Stability
- ❌ Code generation: Fragile, breaks easily
- ✅ Config extraction: Stable, paths only

### Maintenance
- ❌ 1000+ workers to maintain
- ✅ 1 worker to maintain (updates fix all customers)

### Onboarding
- ❌ 4-8 hours per customer (manual investigation)
- ✅ 2 minutes per customer (automated extraction)

### Scalability
- ❌ Limited by maintenance overhead
- ✅ Unlimited customers (no maintenance limit)

### Revenue
- ❌ High manual cost per customer
- ✅ Low automated cost (2-min setup)

---

## Workflow for Sergej

### Old Way (4-8 hours)
```
1. Request Shopify access
2. Wait days for approval
3. Search theme file by file
4. Find dataLayer structure
5. Map variables manually
6. Write custom worker code
7. Test deployment
8. Debug issues
9. Repeat next customer
```

### New Way (2 minutes)
```
1. Sergej uploads GTM export JSON
2. Parser extracts config.json
3. Deploy config to worker
4. Done
```

### Example: Customer X Setup
```bash
# Sergej sends you: customer-x-gtm-export.json

# You run:
$ npx gtm-parser extract customer-x-gtm-export.json

# Parser returns:
{
  "purchase": {
    "value_path": "ecommerce.checkout.total",
    "currency_path": "ecommerce.currencyCode",
    "content_ids_path": "ecommerce.items.0.id"
  },
  "lead": {
    "email_path": "user.hashedEmail"
  }
}

# You deploy:
$ npx deploy-config customer-x config.json

# Done! Worker now knows how to find data for customer X
```

---

## Technical Implementation

### GTM Parser (Migration Tool)
**Location:** `admin-dashboard/src/services/gtm-config-parser/`

**Dependencies:**
- zod (for validation)
- commander (CLI)
- json

**Core Functions:**
```typescript
- parseGTMExport(json): Extract tags and variables
- findVariableReferences(tag): Find {{variable}} patterns
- variableToDataLayerPath(gtmVar): Map to dataLayer structure
- generateConfigJson(mappings): Create output config
```

### Universal Engine (Single Worker)
**Location:** `serverless/src/workers/universal-engine/`

**Key Classes:**
```typescript
- getCustomerConfig(customerId): Load from KV/D1
- getFromDataLayer(dataLayer, path): Navigate paths using config
- sendPlatformEvent(event, config, data): Send to Facebook/GA4/Ads
- hashUserData(data): SHA-256 hashing
```

### Config Storage Options
1. **KV Namespace** (Global, recommended for <1000 customers)
2. **D1 Database** (Recommended for 1000+ customers)
3. **Environment Variables** (Per-customer deployment)

---

## Success Metrics

### Speed
- Customer onboarding: 2 minutes (vs 4-8 hours)

### Reliability
- Code generation: Fragile, 60-80% success rate
- Config extraction: Stable, 99% success rate

### Scalability
- Code generation: Limited by maintenance burden
- Config extraction: Unlimited customers

### Quality
- Code generation: Hard to test all customer variations
- Config extraction: Easier to validate paths

---

## Implementation Timeline

### Week 1: GTM Parser Core
```
Day 1-2: Parse variable references
Day 3: Build path mappings
Day 4: Generate config.json
Day 5: CLI interface and testing
```

### Week 2: Universal Engine
```
Day 1-2: Config loading mechanism
Day 3: DataLayer navigation
Day 4: Platform integrations
Day 5: Testing with sample configs
```

### Week 3: Deployment & Docs
```
Day 1-2: CLI tools (extract + deploy)
Day 3: Documentation for Sergej
Day 4: Onboarding script
Day 5: Testing with real GTM exports
```

---

## Questions for You

### 1. Config Storage Preference
Which approach for storing customer configs?
- A) KV Namespace (simpler, <1000 customers)
- B) D1 Database (more robust, 1000s of customers)
- C) Environment variables (per-worker deployment)

### 2. Parsing Strategy
Should parser handle ALL tag types or focus on common ones?
- A) All 50+ tag types (comprehensive)
- B) Top 10-20 common tag types (faster)

### 3. Variable Mapping Complexity
How detailed should path mappings be?
- A) Simple (ecommerce.checkout.total only)
- B) Complex (handle nested objects, arrays, transformations)

### 4. Priority
What's the highest priority first?
- A) MVP parser for Sergej (fastest to market)
- B) Full production system with everything
- C) Focus on Universal Engine first, parser second

---

## Summary

**The Right Approach:**

✅ Parser = Extraction tool (2-min config generation)  
✅ Engine = Universal worker (handles all customers)  
✅ Config-driven = Scalable, stable, fast  
✅ Single codebase = Easy maintenance  
✅ No code generation = No fragility  

**Revenue Impact:** Can support unlimited customers with minimal operational overhead.

**Competitive Advantage:** "2-minute setup" vs other agencies' "4-8 hour process" = Huge selling point.

---

**Next Step:** Implement Phase 1 (GTM Config Parser) once you confirm the questions above.