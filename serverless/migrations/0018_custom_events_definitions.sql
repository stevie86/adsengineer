-- Custom Events Definitions Table
-- Stores configurable custom events that can be assigned to sites/platforms

CREATE TABLE custom_event_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,

  -- Event identification
  event_name TEXT NOT NULL,        -- Unique identifier (e.g., 'subscription_start')
  display_name TEXT NOT NULL,      -- Human-readable name (e.g., 'Subscription Start')
  description TEXT NOT NULL,       -- Description of what this event tracks

  -- Trigger configuration
  trigger_type TEXT NOT NULL,      -- 'webhook', 'frontend', 'api', 'manual'
  trigger_conditions TEXT NOT NULL,-- JSON conditions for when to trigger

  -- Platform support
  supported_platforms TEXT NOT NULL,-- JSON array: ['shopify', 'woocommerce', 'custom']

  -- Google Ads integration
  google_ads_conversion_action TEXT,-- Conversion action name for Google Ads
  google_ads_category TEXT,        -- 'PURCHASE', 'SIGN_UP', 'LEAD', etc.

  -- Strategic value
  strategic_value TEXT,            -- Business value description
  priority INTEGER DEFAULT 1,      -- 1=High, 2=Medium, 3=Low

  -- Status and metadata
  is_active BOOLEAN DEFAULT 1,     -- Whether this event is enabled
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE(org_id, event_name),
  FOREIGN KEY (org_id) REFERENCES agencies(id)
);

-- Default custom events for all organizations
INSERT INTO custom_event_definitions (
  org_id, event_name, display_name, description, trigger_type, trigger_conditions,
  supported_platforms, google_ads_conversion_action, google_ads_category,
  strategic_value, priority, is_active
) VALUES
(
  'system', -- Special org_id for system defaults
  'subscription_start',
  'Subscription Start',
  'Abschluss eines Abo-Produkts im Checkout',
  'webhook',
  '{"shopify": {"webhook": "orders/create", "conditions": {"line_items": {"product_type": "subscription"}}}, "woocommerce": {"hook": "woocommerce_order_status_completed", "conditions": {"subscription": true}}}',
  '["shopify", "woocommerce", "custom"]',
  'subscription_purchase',
  'PURCHASE',
  'Prio 1: Trennung von Einmalkauf und Abo. Erlaubt Gebotsoptimierung auf Abonnenten (höchster LTV).',
  1,
  1
),
(
  'system',
  'returning_customer_purchase',
  'Returning Customer Purchase',
  'Kauf durch einen Kunden, der bereits in der DB existiert',
  'webhook',
  '{"shopify": {"webhook": "orders/create", "conditions": {"customer": {"orders_count": {"gt": 1}}}}, "woocommerce": {"hook": "woocommerce_order_status_completed", "conditions": {"customer_orders": {"gt": 1}}}}',
  '["shopify", "woocommerce", "custom"]',
  'repeat_purchase',
  'PURCHASE',
  'Optimierung auf Kundenbindung. Hilft Google, Profile zu finden, die öfter als 1x kaufen.',
  1,
  1
),
(
  'system',
  'high_value_transaction',
  'High Value Transaction',
  'Kauf mit einem Warenkorbwert > 150 € (oder 1.5x AOV)',
  'webhook',
  '{"shopify": {"webhook": "orders/create", "conditions": {"total_price": {"gt": 150}}}, "woocommerce": {"hook": "woocommerce_order_status_completed", "conditions": {"order_total": {"gt": 150}}}}',
  '["shopify", "woocommerce", "custom"]',
  'high_value_purchase',
  'PURCHASE',
  'Signal für "Whales". Google soll gezielt nach zahlungskräftigen Kunden suchen.',
  2,
  1
),
(
  'system',
  'subscription_intent',
  'Subscription Intent',
  'Klick auf "Abo & Sparen" Option auf der Produktseite',
  'frontend',
  '{"frontend": {"selector": "[data-subscription], .subscription-button", "event": "click"}, "api": {"endpoint": "/api/v1/track", "conditions": {"event_name": "subscription_intent"}}}',
  '["shopify", "woocommerce", "custom"]',
  'subscription_intent',
  'SIGN_UP',
  'Micro-Conversion für Retargeting. Wer Interesse am Abo zeigt, aber nicht kauft, muss spezifisch nachgefasst werden.',
  2,
  1
),
(
  'system',
  'loyalty_register',
  'Loyalty Registration',
  'Anmeldung zum Treueprogramm / Account-Erstellung',
  'webhook',
  '{"shopify": {"webhook": "customers/create"}, "woocommerce": {"hook": "user_register", "conditions": {"loyalty_program": true}}}',
  '["shopify", "woocommerce", "custom"]',
  'loyalty_registration',
  'SIGN_UP',
  'Führt langfristig zur Steigerung der Repeat-Rate (Phase 2 des Plans).',
  3,
  1
);

-- Site-specific custom event assignments
-- Note: Same event can be assigned multiple times with different configurations
CREATE TABLE site_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  event_definition_id INTEGER NOT NULL,

  -- Assignment identification
  assignment_name TEXT,            -- Optional name to distinguish multiple assignments of same event
  assignment_description TEXT,     -- Optional description of this specific assignment

  -- Configuration overrides
  is_enabled BOOLEAN DEFAULT 1,
  custom_conditions TEXT,          -- JSON overrides for trigger conditions
  custom_conversion_action TEXT,   -- Override Google Ads conversion action

  -- Thresholds and parameters
  thresholds TEXT,                 -- JSON: {"value_threshold": 150, "aov_multiplier": 1.5}

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  FOREIGN KEY (org_id) REFERENCES agencies(id),
  FOREIGN KEY (event_definition_id) REFERENCES custom_event_definitions(id)
);

-- Indexes for performance
CREATE INDEX idx_custom_event_definitions_org_active ON custom_event_definitions(org_id, is_active);
CREATE INDEX idx_custom_event_definitions_name ON custom_event_definitions(event_name);
CREATE INDEX idx_site_custom_events_org_site ON site_custom_events(org_id, site_id);
CREATE INDEX idx_site_custom_events_enabled ON site_custom_events(is_enabled);