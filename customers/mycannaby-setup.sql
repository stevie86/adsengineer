-- ============================================================================
-- Customer Setup SQL for mycannaby
-- Run this in D1 Console or via wrangler d1 execute
-- ============================================================================

-- Insert or update agency
INSERT INTO agencies (id, name, config, created_at, updated_at)
VALUES (
  'mycannaby-mk059g16',
  'mycannaby',
  '{"shopify_domain":"mycannaby.myshopify.com","shopify_webhook_secret":"shpat_demo_secret_xxxxxxxx","google_ads_config":"{\"clientId\":\"mock_client_id_12345\",\"clientSecret\":\"mock_client_secret_67890\",\"developerToken\":\"mock_developer_token_abc\",\"customerId\":\"123-456-7890\",\"conversionActionId\":\"123456789\"}","secondary_google_ads_config":"{\"customerId\":\"987-654-3210\",\"conversionActionId\":\"987654321\"}","ga4_config":"{\"measurementId\":\"G-XXXXXXXXXX\",\"apiSecret\":\"mock_ga4_api_secret\",\"eventName\":\"purchase\"}","conversion_tracking_mode":"parallel","route_primary":"google_ads","route_secondary":"ga4","attribution_click_days":30,"attribution_view_days":1}',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  config = excluded.config,
  updated_at = datetime('now');

-- Verify insertion
SELECT id, name, json_extract(config, '$.shopify_domain') as shopify_domain,
       json_extract(config, '$.google_ads_config') as google_ads_config
FROM agencies WHERE name = 'mycannaby';
