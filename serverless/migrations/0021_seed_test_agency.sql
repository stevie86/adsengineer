INSERT INTO agencies (id, name, customer_id, google_ads_config, config, status, created_at, updated_at) 
VALUES (
  'agency-test-stefan', 
  'Stefan Test Agency',
  'cust_stefan', 
  '{}',
  '{"woocommerce_domain": "stefan.mastersmarket.eu", "woocommerce_webhook_secret": "adsengineer_secret_123"}', 
  'active',
  datetime('now'),
  datetime('now')
);
