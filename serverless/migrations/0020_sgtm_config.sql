-- Add sGTM configuration and client tier tracking to customers table
ALTER TABLE customers ADD COLUMN sgtm_config TEXT;
ALTER TABLE customers ADD COLUMN client_tier TEXT DEFAULT 'tier2';

-- sgtm_config JSON structure:
-- {
--   "container_url": "https://gtm.customer.com",
--   "measurement_id": "G-XXXXXXX",
--   "api_secret": "optional-secret"
-- }

-- client_tier values:
-- "internal" - Our test accounts
-- "tier1" - Premium customers (enterprise plan)
-- "tier2" - Standard customers (starter/professional)

CREATE INDEX IF NOT EXISTS idx_customers_client_tier ON customers(client_tier);
