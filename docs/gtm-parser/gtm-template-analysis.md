# GTM Template Analysis Summary

## Overview

Analyzed 3 production GTM templates from stape.io:

| Template | Target | Tags | Variables | Events |
|----------|--------|------|-----------|--------|
| ga4-gads-server.json | Google SSGT | 6 | 4 | purchase, add_to_cart, begin_checkout, page_view |
| fb-server.json | Facebook SSGT | 7 | 21 | purchase, add_to_cart, begin_checkout, search, page_view |
| fb-ga4-gads-server.json | Hybrid | 13 | 30 | All above events |

## Key Finding: No Explicit DataLayer Paths

**Critical difference from our test sample:**

**Our sample had:**
```json
{
  "name": "Purchase Value",
  "type": "GTM_VARIABLE",
  "parameter": [{
    "key": "dataLayerVariable",
    "value": "ecommerce.purchase.total"
  }]
}
```

**Production templates use:**
```json
{
  "name": "ed - value",
  "type": "ed",
  "parameter": [{
    "key": "keyPath",
    "value": "value"
  }]
}
```

### Variable Types

| Type | Meaning | Examples from stape |
|------|---------|----------------------|
| `ed` | Event Data | value, currency, content_ids, user_id |
| `c` | Constant | PUT_YOUR_VALUE_HERE placeholders |
| `smm` | Shopify Meta Model | Shopify-specific structures |

**Event Data (`ed`) structure:**
- Direct keyPath mapping: `keyPath: value` means "use event.value"
- No explicit dataLayer path notation like `ecommerce.purchase.total`
- Server-side templates assume standardized Shopify event payloads

### Tag Templates

| Tag Type | Platform | Usage |
|----------|----------|-------|
| `sgtmadsct` | Google Ads Server | Automatically reads event data |
| `cvt_19364345_14` | Facebook Custom | Full API mapping internally |
| `sgtmgaaw` | GA4 Analytics | Base configuration |

**Key observation:** These templates use **config-only parameters**:
- pixelId, accessToken (Facebook)
- conversionId, conversionLabel (Google Ads)
- **NOT value_path, currency_path like our config**

## What This Means

### Our Implementation Status

**Working:**
- ✅ CLI extracts variables from GTM exports
- ✅ Generates config.json with platform mappings
- ✅ Event pattern detection (purchase, lead, view_item)
- ✅ Universal Engine loads configs → reads dataLayer → sends

**Gap Identified:**
- ❌ Production GTM exports don't contain dataLayer paths
- ❌ They reference event keys (value, currency, content_ids) instead
- ❌ Server-side templates expect Shopify webhook JSON, not browser dataLayer

### Two Deployment Strategies

**Strategy A: Template-Based (what stape.io does)**

```
GTM Export → Variable names (value, currency) → Known Shopify event schema → Auto-config
```

Pros:
- Zero configuration per customer
- Uses Shopify's standardized JSON format
- Templates handle all platform mappings

Cons:
- Shopify-specific format
- Can't support custom dataLayer structures
- No customer flexibility

**Strategy B: Explicit Mapping (our current approach)**

```
GTM Export with macro definitions → config.json with dataLayer paths → Universal Engine
```

Pros:
- Works with any dataLayer structure
- Customer-controlled mappings
- Platform-agnostic

Cons:
- Requires GTM exports to have macro definitions
- Customer must define paths first
- More overhead

### Hybrid Approach (Recommended)

For each customer:

1. **Check for known platform:**
   - Shopify → Use Shopify event schema templates
   - WooCommerce → Use WooCommerce event schema templates
   - Custom → Require explicit macro definitions

2. **Template definitions:**

```json
// templates/shopify.json
{
  "eventName": "purchase",
  "platformMappings": {
    "facebook": {
      "value_path": "value",
      "currency_path": "currency",
      "content_ids_path": "content_ids"
    },
    "googleAds": {
      "value_path": "value",
      "currency_path": "currency"
    }
  }
}
```

3. **Fallback to explicit macro parsing** if no template matches

## Recommended Next Steps

> **Updated 2026-02-13** — Previous options were based on the assumption that macro parsing worked. Testing against [TheNextWeb's production container](https://github.com/thenextweb/gtm/blob/master/container-web.json) revealed the parser fails on all real GTM v2 exports. See [Parser Test Report](../gtm-parser/parser-test-report.md) for full details.

### Step 1: Fix the Parser (BLOCKING — ~2.5 hours)

The parser cannot handle real containers. 6 fixes needed, in priority order:

1. **GTM v2 variable format** — `type: 'v'` variables use `key: 'name'` not `key: 'dataLayerVariable'`. This is why 0 out of 7 dataLayer paths were extracted from the TNW container.
2. **Extract constants** (`type: 'c'`) — tracking IDs and config values.
3. **Event Data variables** (`type: 'ed'`) — needed for server-side GTM.
4. **GA event pattern detection** — most common tag pattern (eventCategory/Action/Label) is unrecognized.
5. **Trigger parsing** — currently ignored entirely; needed for event→trigger mapping.
6. **Remove `fs` import** from `config-generator.ts` — breaks browser usage in admin dashboard.

### Step 2: Choose Strategic Direction

Only after Step 1 makes the parser functional:

- **Option A: Universal Parser** — Fix parser + add platform templates (Shopify/WooCommerce) for known event schemas. Fallback to parsed GTM variables for custom setups. Best long-term flexibility.
- **Option B: Shopify-first** — Build Shopify webhook receiver, generate configs from Shopify schema directly. Faster time-to-value for primary customer segment, but skips GTM parsing entirely.
- **Option C: Hybrid** — Fix parser (Step 1), ship Shopify templates immediately, add WooCommerce/custom later. Recommended balance of speed and coverage.