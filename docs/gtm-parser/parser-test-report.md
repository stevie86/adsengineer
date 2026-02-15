# GTM Parser Test Report

**Date:** 2026-02-13  
**Test Container:** [TheNextWeb GTM Container](https://github.com/thenextweb/gtm/blob/master/container-web.json)  
**Research Sources:** [MeasureSchool GTM Tags](https://measureschool.com/google-tag-manager-tags/), [justusbluemer/gtm-guidelines](https://github.com/justusbluemer/gtm-guidelines)

---

## Test Results

### Command
```bash
cd admin-dashboard
pnpm tsx src/cli.ts extract /tmp/thenextweb-container.json -o /tmp/thenextweb-config.json -c thenextweb
```

### Output
```
Extracted 18 unique variables from tags
Extracted 0 macro definitions with dataLayer paths
Config written to: /tmp/thenextweb-config.json
Events detected: 0
```

### Verdict: FAIL — Parser extracts variable references but cannot resolve them

| Metric | Result | Expected |
|--------|--------|----------|
| `{{variable}}` references from tags | 18 ✅ | — |
| Data Layer Variable definitions parsed | **0** ❌ | 7 |
| Constant definitions parsed | **0** ❌ | 1 |
| Custom JS definitions parsed | **0** ❌ | 6 |
| Events detected | **0** ❌ | ≥1 (custom events with eventCategory/Action/Label) |
| Config output | Empty `events: []` ❌ | Event mappings |

---

## Root Cause Analysis

### Bug: `extractMacroDefinitions()` only handles GTM v1 format

**Our code** (`extractor/variable-extractor.ts` line 73):
```typescript
if (param.key === 'dataLayerVariable' && param.value) {
  return param.value;
}
```

**GTM v1 format** (what we handle — `macro` array):
```json
{
  "name": "Purchase Value",
  "type": "GTM_VARIABLE",
  "parameter": [{ "key": "dataLayerVariable", "value": "ecommerce.purchase.total" }]
}
```

**GTM v2 format** (what real containers use — `variable` array):
```json
{
  "name": "DLV - eventAction",
  "type": "v",
  "parameter": [
    { "key": "name", "value": "eventAction" },
    { "key": "dataLayerVersion", "value": "2" },
    { "key": "setDefaultValue", "value": "false" }
  ]
}
```

**The CLI does handle the wrapper** (`exportData.macro || exportData.variable`), but `extractMacroDefinitions()` only checks for `param.key === 'dataLayerVariable'` — GTM v2 uses `param.key === 'name'` with `type: 'v'`.

### What the TNW container actually contains

**7 Data Layer Variables (type: `v`)** — all missed:
| Variable Name | DataLayer Path | Would Help Detect |
|--------------|----------------|-------------------|
| DLV - eventAction | `eventAction` | GA event tracking |
| DLV - eventCategory | `eventCategory` | GA event tracking |
| DLV - eventLabel | `eventLabel` | GA event tracking |
| DLV - eventValue | `eventValue` | GA event tracking |
| DLV - eventNonInteraction | `eventNonInteraction` | GA event tracking |
| DLV - Video Action | `attributes.videoAction` | Video tracking |
| DLV - Video URL | `attributes.videoUrl` | Video tracking |

**1 Constant (type: `c`)** — missed:
| Variable Name | Value |
|--------------|-------|
| Google Analytics - Tracking ID | UA-XXXXXXX-X |

**6 Custom JavaScript (type: `jsm`)** — missed (expected, no dataLayer path):
| Variable Name | Purpose |
|--------------|---------|
| JS - Client ID | Extracts GA client ID |
| JS - Hit Timestamp | Current timestamp |
| JS - Hour | Current hour |
| JS - Session ID | Random session ID |
| JS - Visibility Hidden | Page visibility API |
| JS - Visibility Prefix | Vendor prefix detection |

**11 Tags** — variable references extracted correctly:
| Tag Name | Type | Variables Referenced |
|----------|------|---------------------|
| AB Test | `html` | `{{Random Number}}` |
| Google Analytics - Event - JavaScript Errors | `ua` | `{{Error Message}}`, `{{Error URL}}`, `{{Error Line}}` |
| Google Analytics - Event - Outbound Click | `ua` | `{{Click URL}}`, `{{Click Text}}` |
| Google Analytics - Event - Riveted, ScrollDistance, ScrollTiming | `ua` | `{{DLV - eventCategory}}`, `{{DLV - eventAction}}`, `{{DLV - eventLabel}}`, `{{DLV - eventValue}}`, `{{DLV - eventNonInteraction}}` |
| Google Analytics - Event - YouTube Tracking | `ua` | `{{DLV - Video Action}}`, `{{DLV - Video URL}}` |
| Google Analytics - Event - visibilityChange | `ua` | `{{JS - Visibility Hidden}}`, `{{JS - Visibility Prefix}}` |
| Google Analytics - Pageview | `ua` | `{{Google Analytics - Tracking ID}}`, `{{Page URL}}` |

**10 Triggers** — not parsed at all (parser ignores triggers):
| Trigger Name | Type |
|-------------|------|
| DOM Ready | `DOM_READY` |
| Event - YouTube Tracking | `CUSTOM_EVENT` |
| JavaScript Errors | `JS_ERROR` |
| Outbound Click | `LINK_CLICK` |
| Pageview - All Pages - 50 Percent | `PAGEVIEW` |
| Riveted | `CUSTOM_EVENT` |
| ScrollDistance | `CUSTOM_EVENT` |
| ScrollTiming | `CUSTOM_EVENT` |
| Window Loaded | `WINDOW_LOADED` |
| visibilityChange | `CUSTOM_EVENT` |

---

## GTM Variable Type Taxonomy

From research (justusbluemer/gtm-guidelines + GTM API docs + real container analysis):

### Variable Types in Export JSON

| `type` value | Name | Has DataLayer Path? | Parameter Key |
|-------------|------|---------------------|---------------|
| `v` | Data Layer Variable | **YES** | `name` → dataLayer path |
| `c` | Constant | No (static value) | `value` → constant value |
| `jsm` | Custom JavaScript | No (computed) | `javascript` → JS function |
| `ed` | Event Data (server-side) | **YES** | `keyPath` → event key |
| `smm` | Shopify Meta Model | **YES** | Shopify-specific |
| `k` | 1st Party Cookie | No | `name` → cookie name |
| `j` | JavaScript Variable | **YES** | `name` → JS global path |
| `d` | DOM Element | No (DOM query) | `elementId` or `elementSelector` |
| `f` | Custom Function | No (computed) | — |
| `gas` | Google Analytics Settings | No (config) | — |
| `r` | HTTP Referrer | No (built-in) | — |
| `u` | URL | No (built-in) | `component` → URL part |
| `aev` | Auto-Event Variable | No (built-in) | — |
| `ctv` | Container Version Number | No (built-in) | — |
| `e` | Custom Event | No (built-in) | — |
| `vis` | Element Visibility | No (DOM) | — |

### Tag Types in Export JSON

| `type` value | Name | Platform |
|-------------|------|----------|
| `ua` | Universal Analytics | Google Analytics |
| `gaaw` | GA4 Configuration | Google Analytics 4 |
| `gaawe` | GA4 Event | Google Analytics 4 |
| `html` | Custom HTML | Any |
| `cvt_*` | Community Template | Various |
| `img` | Custom Image | Pixel tracking |
| `awct` | Google Ads Conversion | Google Ads |
| `sp` | Google Ads Remarketing | Google Ads |
| `flc` | Floodlight Counter | Campaign Manager |
| `fls` | Floodlight Sales | Campaign Manager |
| `hjtc` | Hotjar | Hotjar |
| `ogt` | Optimizely | Optimizely |
| `sgtmgaaw` | GA4 (Server-Side) | sGTM |
| `sgtmadsct` | Google Ads (Server-Side) | sGTM |

### Trigger Types in Export JSON

| `type` value | Name |
|-------------|------|
| `PAGEVIEW` | Page View |
| `DOM_READY` | DOM Ready |
| `WINDOW_LOADED` | Window Loaded |
| `CLICK` | All Clicks |
| `LINK_CLICK` | Just Links |
| `FORM_SUBMIT` | Form Submission |
| `CUSTOM_EVENT` | Custom Event (dataLayer push) |
| `HISTORY_CHANGE` | History Change (SPA) |
| `JS_ERROR` | JavaScript Error |
| `TIMER` | Timer |
| `SCROLL_DEPTH` | Scroll Depth |
| `ELEMENT_VISIBILITY` | Element Visibility |
| `YOUTUBE_VIDEO` | YouTube Video |

### GTM Naming Conventions (from gtm-guidelines)

Variables follow `type.[tool.]name` pattern:
- `dl.eventCategory` → Data Layer Variable
- `js.clientId` → Custom JavaScript
- `const.ga.trackingId` → Constant for GA
- `cookie.sessionId` → 1st Party Cookie
- `dom.cta.text` → DOM Element

Tags follow `Tool Type - Description`:
- `GA event - outbound link click`
- `GA pageview - all pages`
- `HTML FB - like`

---

## Required Fixes

### Fix 1: Support GTM v2 Variable Format (CRITICAL)

`extractMacroDefinitions()` must handle both formats:

```typescript
function extractDataLayerPathFromMacro(macro: any): string | null {
  if (!macro.parameter || !Array.isArray(macro.parameter)) {
    return null;
  }

  // Only extract paths from Data Layer Variables (type: 'v') and GTM v1 macros
  const isDataLayerVar = macro.type === 'v' || macro.type === 'GTM_VARIABLE';
  if (!isDataLayerVar && macro.type !== undefined) {
    return null;
  }

  for (const param of macro.parameter) {
    // GTM v1: key === 'dataLayerVariable'
    if (param.key === 'dataLayerVariable' && param.value) {
      return param.value;
    }
    // GTM v2: key === 'name' (for type: 'v' variables)
    if (param.key === 'name' && param.value && isDataLayerVar) {
      return param.value;
    }
  }

  return null;
}
```

### Fix 2: Extract Constants (HIGH)

Constants (`type: 'c'`) contain config values like tracking IDs. Store separately:

```typescript
function extractConstants(variables: any[]): Map<string, string> {
  const constants = new Map<string, string>();
  for (const v of variables) {
    if (v.type === 'c' && v.parameter) {
      const valueParam = v.parameter.find((p: any) => p.key === 'value');
      if (valueParam) {
        constants.set(v.name, valueParam.value);
      }
    }
  }
  return constants;
}
```

### Fix 3: Extract Event Data Variables for Server-Side (HIGH)

Server-side GTM exports use `type: 'ed'` with `keyPath`:

```typescript
function extractEventDataPaths(variables: any[]): Map<string, string> {
  const paths = new Map<string, string>();
  for (const v of variables) {
    if (v.type === 'ed' && v.parameter) {
      const keyPath = v.parameter.find((p: any) => p.key === 'keyPath');
      if (keyPath) {
        paths.set(v.name, keyPath.value);
      }
    }
  }
  return paths;
}
```

### Fix 4: Parse Triggers (MEDIUM)

Currently ignored entirely. Triggers define WHEN events fire — essential for mapping:

```typescript
function extractTriggers(triggers: any[]): TriggerInfo[] {
  return triggers.map(t => ({
    id: t.triggerId,
    name: t.name,
    type: t.type,  // CUSTOM_EVENT, PAGEVIEW, LINK_CLICK, etc.
    customEventName: t.type === 'CUSTOM_EVENT'
      ? t.customEventFilter?.[0]?.parameter?.find((p: any) => p.key === 'arg1')?.value
      : null,
    filters: t.filter || [],
  }));
}
```

### Fix 5: Detect GA Event Patterns (MEDIUM)

The TNW container has 5 `ua` type tags with event category/action/label — a common pattern our `detectEventPatterns()` doesn't recognize because it only looks for purchase/lead/view_item:

```typescript
// Add GA event pattern detection
if (hasVariable(macroDefinitions, ['eventcategory', 'eventaction'])) {
  patterns.push({
    eventName: 'ga_event',
    platformMappings: {
      ga4: {
        category_path: findPath(macroDefinitions, ['eventcategory']),
        action_path: findPath(macroDefinitions, ['eventaction']),
        label_path: findPath(macroDefinitions, ['eventlabel']),
        value_path: findPath(macroDefinitions, ['eventvalue']),
      },
    },
  });
}
```

### Fix 6: Improve `config-generator.ts` — Remove `fs` Import (LOW)

`config-generator.ts` imports `fs` which breaks in the browser (admin dashboard is Vite/React). Split into:
- `config-generator.ts` — pure logic, no I/O
- `config-writer.ts` — Node.js file writer (CLI only)

---

## Expected Results After Fixes

Running the same TNW container through a fixed parser should produce:

```json
{
  "customerId": "thenextweb",
  "containerId": "GTM-W6PDPW",
  "events": [
    {
      "eventName": "ga_event",
      "platformMappings": {
        "ga4": {
          "category_path": "eventCategory",
          "action_path": "eventAction",
          "label_path": "eventLabel",
          "value_path": "eventValue"
        }
      }
    }
  ],
  "variables": {
    "dataLayer": {
      "DLV - eventCategory": "eventCategory",
      "DLV - eventAction": "eventAction",
      "DLV - eventLabel": "eventLabel",
      "DLV - eventValue": "eventValue",
      "DLV - eventNonInteraction": "eventNonInteraction",
      "DLV - Video Action": "attributes.videoAction",
      "DLV - Video URL": "attributes.videoUrl"
    },
    "constants": {
      "Google Analytics - Tracking ID": "UA-XXXXXXX-X"
    },
    "customJs": ["JS - Client ID", "JS - Hit Timestamp", "JS - Hour", "JS - Session ID", "JS - Visibility Hidden", "JS - Visibility Prefix"]
  },
  "tags": [
    { "name": "Google Analytics - Pageview", "type": "ua", "triggeredBy": ["Pageview - All Pages - 50 Percent"] },
    { "name": "Google Analytics - Event - Outbound Click", "type": "ua", "triggeredBy": ["Outbound Click"] },
    { "name": "Google Analytics - Event - JavaScript Errors", "type": "ua", "triggeredBy": ["JavaScript Errors"] },
    { "name": "Google Analytics - Event - Riveted, ScrollDistance, ScrollTiming", "type": "ua", "triggeredBy": ["Riveted", "ScrollDistance", "ScrollTiming"] },
    { "name": "Google Analytics - Event - YouTube Tracking", "type": "ua", "triggeredBy": ["Event - YouTube Tracking"] },
    { "name": "Google Analytics - Event - visibilityChange", "type": "ua", "triggeredBy": ["visibilityChange"] }
  ],
  "triggers": [
    { "name": "Pageview - All Pages - 50 Percent", "type": "PAGEVIEW" },
    { "name": "Outbound Click", "type": "LINK_CLICK" },
    { "name": "JavaScript Errors", "type": "JS_ERROR" },
    { "name": "Riveted", "type": "CUSTOM_EVENT" },
    { "name": "ScrollDistance", "type": "CUSTOM_EVENT" },
    { "name": "ScrollTiming", "type": "CUSTOM_EVENT" },
    { "name": "Event - YouTube Tracking", "type": "CUSTOM_EVENT" },
    { "name": "visibilityChange", "type": "CUSTOM_EVENT" }
  ],
  "version": "1.0.0"
}
```

---

## Priority Order

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | GTM v2 variable format support | **Critical** — parser is broken without it | 30 min |
| 2 | Extract constants | High — tracking IDs needed for config | 15 min |
| 3 | Event Data (`ed`) variables | High — needed for server-side GTM | 15 min |
| 4 | GA event pattern detection | Medium — most common tag pattern | 30 min |
| 5 | Trigger parsing | Medium — needed for event→trigger mapping | 45 min |
| 6 | Remove `fs` from config-generator | Low — only blocks browser usage | 15 min |

**Total estimated effort: ~2.5 hours**
