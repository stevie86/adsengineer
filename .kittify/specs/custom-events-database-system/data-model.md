# Custom Events Database System - Data Model

## Overview
This document defines the complete data model for the AdsEngineer custom events tracking system, including database schema, relationships, and data flow patterns.

## Core Entities

### 1. Custom Event Definitions (`custom_event_definitions`)

**Purpose**: Stores configurable event definitions that can be used across organizations and sites.

**Schema**:
```sql
CREATE TABLE custom_event_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,                    -- 'system' for defaults, org ID for custom

  -- Event Identity
  event_name TEXT NOT NULL,                -- Unique identifier (e.g., 'subscription_start')
  display_name TEXT NOT NULL,              -- Human-readable name
  description TEXT NOT NULL,               -- What this event tracks

  -- Trigger Configuration
  trigger_type TEXT NOT NULL,              -- 'webhook', 'frontend', 'api', 'manual'
  trigger_conditions TEXT NOT NULL,        -- JSON: platform-specific conditions

  -- Platform Support
  supported_platforms TEXT NOT NULL,       -- JSON array: ['shopify', 'woocommerce']

  -- Google Ads Integration
  google_ads_conversion_action TEXT,       -- Conversion action name
  google_ads_category TEXT,                -- 'PURCHASE', 'SIGN_UP', 'LEAD'

  -- Business Context
  strategic_value TEXT,                    -- Business value description
  priority INTEGER DEFAULT 1,              -- 1=High, 2=Medium, 3=Low

  -- Status
  is_active BOOLEAN DEFAULT 1,             -- Enable/disable
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE(org_id, event_name),
  FOREIGN KEY (org_id) REFERENCES agencies(id)
);
```

**Key Features**:
- **System Defaults**: org_id = 'system' for built-in events
- **Organization Customization**: org-specific overrides and additions
- **Platform Flexibility**: JSON-based trigger conditions per platform
- **Google Ads Ready**: Pre-configured conversion mapping

### 2. Site Custom Events (`site_custom_events`)

**Purpose**: Manages assignments of event definitions to specific sites with custom configurations.

**Schema**:
```sql
CREATE TABLE site_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  event_definition_id INTEGER NOT NULL,

  -- Assignment Identity (supports multiple assignments)
  assignment_name TEXT,                    -- Optional: distinguish assignments
  assignment_description TEXT,             -- Optional: describe this assignment

  -- Configuration Overrides
  is_enabled BOOLEAN DEFAULT 1,
  custom_conditions TEXT,                  -- JSON: override trigger conditions
  custom_conversion_action TEXT,           -- Override Google Ads action

  -- Thresholds & Parameters
  thresholds TEXT,                         -- JSON: {"value_threshold": 150}

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Relationships (NO unique constraint - allows multiple assignments)
  FOREIGN KEY (org_id) REFERENCES agencies(id),
  FOREIGN KEY (event_definition_id) REFERENCES custom_event_definitions(id)
);
```

**Key Features**:
- **Multiple Assignments**: Same event can be assigned multiple times to same site
- **Flexible Configuration**: Override any aspect of the event definition
- **Site-Specific**: Configurations scoped to specific sites
- **Optional Naming**: Assignment names help distinguish multiple uses

### 3. Custom Events (`custom_events`)

**Purpose**: Stores actual tracked events with full context and metadata.

**Schema**:
```sql
CREATE TABLE custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,

  -- Event References
  event_definition_id INTEGER,             -- Links to definition (optional for flexibility)
  site_id TEXT NOT NULL,
  assignment_id INTEGER,                   -- Links to specific assignment

  -- Event Identity
  event_name TEXT NOT NULL,                -- Event identifier
  platform TEXT NOT NULL,                  -- 'shopify', 'woocommerce', 'custom'

  -- Event Data
  event_data TEXT NOT NULL,                -- JSON: event-specific data

  -- Attribution Data
  gclid TEXT,                              -- Google Click ID
  fbclid TEXT,                             -- Facebook Click ID
  utm_source TEXT,                         -- UTM parameters
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Processing Metadata
  processed_at TEXT,                       -- When event was processed
  conversion_uploaded BOOLEAN DEFAULT 0,   -- Google Ads upload status
  conversion_id TEXT,                      -- Google Ads conversion ID

  -- Timestamps
  event_timestamp TEXT NOT NULL,           -- When event occurred
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Relationships
  FOREIGN KEY (org_id) REFERENCES agencies(id),
  FOREIGN KEY (event_definition_id) REFERENCES custom_event_definitions(id),
  FOREIGN KEY (assignment_id) REFERENCES site_custom_events(id)
);
```

**Key Features**:
- **Flexible Linking**: Can reference definition, assignment, or both
- **Complete Attribution**: Full UTM and click ID tracking
- **Processing Status**: Track Google Ads upload status
- **Audit Trail**: Timestamps for event occurrence and processing

## Relationship Model

```
agencies (1) ──── (M) custom_event_definitions
    │                      │
    │                      └── (M) site_custom_events (multiple per site/event)
    │                             │
    └── (M) sites ────────────────┘
           │
           └── (M) custom_events
                  │
                  └── (1) conversion_queue (for Google Ads)
```

## Data Flow Patterns

### 1. Event Definition Creation
```
Organization Admin → Create Event Definition → Store in custom_event_definitions
                      ↓
System validates → Sets defaults → Ready for assignment
```

### 2. Site Assignment
```
Site Owner → Select Event Definition → Configure Assignment → Store in site_custom_events
                ↓
System validates → Applies overrides → Enables event processing
```

### 3. Event Processing
```
Platform Event → Match Site Assignments → Validate Conditions → Store in custom_events
                  ↓
Apply thresholds → Calculate conversion value → Queue for Google Ads upload
```

## Platform-Specific Data Structures

### Shopify Events
```json
{
  "event_name": "subscription_start",
  "platform": "shopify",
  "event_data": {
    "order_id": 12345,
    "customer_id": 67890,
    "subscription_id": "sub_abc123",
    "product_ids": [111, 222],
    "value_cents": 2999,
    "currency": "EUR"
  },
  "gclid": "EAIaIQv3i3m8e7vO-1234567890",
  "event_timestamp": "2024-01-15T10:30:00Z"
}
```

### WooCommerce Events
```json
{
  "event_name": "high_value_transaction",
  "platform": "woocommerce",
  "event_data": {
    "order_id": 98765,
    "customer_id": 54321,
    "value_cents": 19999,
    "threshold": 15000,
    "currency": "EUR"
  },
  "fbclid": "fbclid_abcdef123456",
  "event_timestamp": "2024-01-15T11:15:00Z"
}
```

### Custom Platform Events
```json
{
  "event_name": "loyalty_register",
  "platform": "custom",
  "event_data": {
    "user_id": "user_999",
    "registration_method": "account_creation",
    "loyalty_tier": "bronze",
    "referrer": "newsletter_campaign"
  },
  "utm_source": "newsletter",
  "utm_campaign": "welcome_series",
  "event_timestamp": "2024-01-15T12:00:00Z"
}
```

## Configuration Examples

### Multiple Assignments of Same Event
```sql
-- Premium high-value purchases (€200+)
INSERT INTO site_custom_events (org_id, site_id, event_definition_id, assignment_name, thresholds)
VALUES ('org_123', 'mycannaby.de', 3, 'Premium High Value', '{"value_threshold": 200}');

-- Standard high-value purchases (€150+)
INSERT INTO site_custom_events (org_id, site_id, event_definition_id, assignment_name, thresholds)
VALUES ('org_123', 'mycannaby.de', 3, 'Standard High Value', '{"value_threshold": 150}');

-- VIP high-value purchases (€500+)
INSERT INTO site_custom_events (org_id, site_id, event_definition_id, assignment_name, thresholds)
VALUES ('org_123', 'mycannaby.de', 3, 'VIP High Value', '{"value_threshold": 500}');
```

### Platform-Specific Conditions
```json
{
  "shopify": {
    "webhook": "orders/create",
    "conditions": {
      "line_items": {
        "some": {
          "product_type": "subscription"
        }
      }
    }
  },
  "woocommerce": {
    "hook": "woocommerce_order_status_completed",
    "conditions": {
      "subscription": true
    }
  }
}
```

## Indexing Strategy

### Performance Indexes
```sql
-- Event definition lookups
CREATE INDEX idx_custom_event_definitions_org_active
ON custom_event_definitions(org_id, is_active);

CREATE INDEX idx_custom_event_definitions_name
ON custom_event_definitions(event_name);

-- Site assignment lookups
CREATE INDEX idx_site_custom_events_org_site
ON site_custom_events(org_id, site_id);

CREATE INDEX idx_site_custom_events_enabled
ON site_custom_events(is_enabled);

-- Event processing lookups
CREATE INDEX idx_custom_events_org_timestamp
ON custom_events(org_id, event_timestamp);

CREATE INDEX idx_custom_events_definition
ON custom_events(event_definition_id);

CREATE INDEX idx_custom_events_gclid
ON custom_events(gclid);
```

## Data Validation Rules

### Event Definition Validation
- `event_name`: Required, unique per org, lowercase with underscores
- `trigger_type`: Must be one of: 'webhook', 'frontend', 'api', 'manual'
- `supported_platforms`: Must be array with at least one platform
- `trigger_conditions`: Must be valid JSON with platform-specific structure

### Assignment Validation
- `event_definition_id`: Must reference active event definition
- `thresholds`: Must be valid JSON if provided
- `custom_conditions`: Must be valid JSON if provided

### Event Validation
- `event_name`: Must match assigned event or system default
- `platform`: Must be supported by event definition
- `event_data`: Must be valid JSON
- `event_timestamp`: Must be valid ISO 8601 date

## Migration Strategy

### Safe Migration Pattern
```sql
-- 1. Create new tables
CREATE TABLE custom_event_definitions_new (...);

-- 2. Migrate data
INSERT INTO custom_event_definitions_new SELECT * FROM old_table;

-- 3. Add system defaults
INSERT INTO custom_event_definitions_new (...) VALUES (...);

-- 4. Rename tables
ALTER TABLE custom_event_definitions RENAME TO custom_event_definitions_old;
ALTER TABLE custom_event_definitions_new RENAME TO custom_event_definitions;

-- 5. Update indexes and constraints
-- 6. Run validation checks
-- 7. Drop old tables (after verification)
```

## Monitoring & Analytics

### Key Metrics
- **Event Processing Rate**: Events processed per minute by platform
- **Assignment Utilization**: Percentage of assignments actively used
- **Configuration Changes**: Frequency of definition/assignment updates
- **Google Ads Upload Success**: Conversion upload success rates

### Health Checks
- **Definition Integrity**: All definitions have valid JSON
- **Assignment Consistency**: All assignments reference valid definitions
- **Event Processing**: No events stuck in processing queue
- **Platform Connectivity**: All platform integrations healthy

This data model provides the foundation for a flexible, scalable custom events tracking system that can adapt to diverse business needs while maintaining data integrity and performance.