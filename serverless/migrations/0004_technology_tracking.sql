-- Technology tracking for leads (many-to-many relationship)

CREATE TABLE technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'crm', 'ecommerce', 'ads', 'analytics', etc.
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Junction table for lead-technology relationships
CREATE TABLE lead_technologies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  technology_id INTEGER NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  confidence_score REAL DEFAULT 1.0, -- 0.0 to 1.0, how confident we are in detection

  -- Note: Foreign keys commented out for D1 compatibility
  -- FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  -- FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE CASCADE,
  UNIQUE(lead_id, technology_id) -- Prevent duplicate associations
);

-- Indexes for performance
CREATE INDEX idx_lead_technologies_lead_id ON lead_technologies(lead_id);
CREATE INDEX idx_lead_technologies_technology_id ON lead_technologies(technology_id);
CREATE INDEX idx_lead_technologies_detected_at ON lead_technologies(detected_at);

-- Insert comprehensive technologies with support status
-- Categories: ecommerce, crm, ads, analytics, cms, marketing-automation, payment-processors
INSERT OR IGNORE INTO technologies (name, category, description) VALUES
-- HIGH PRIORITY - ALREADY SUPPORTED
('Shopify', 'ecommerce', 'Shopify e-commerce platform - FULLY SUPPORTED'),
('GoHighLevel', 'crm', 'GoHighLevel CRM and marketing platform - FULLY SUPPORTED'),
('Google Ads', 'ads', 'Google Ads advertising platform - FULLY SUPPORTED'),
('Google Tag Manager', 'analytics', 'Google Tag Manager - FULLY SUPPORTED'),

-- HIGH PRIORITY - NOT YET SUPPORTED (but should be)
('WordPress', 'cms', 'WordPress CMS - NOT SUPPORTED'),
('WooCommerce', 'ecommerce', 'WooCommerce e-commerce plugin - NOT SUPPORTED'),
('HubSpot', 'crm', 'HubSpot CRM platform - NOT SUPPORTED'),
('ActiveCampaign', 'crm', 'ActiveCampaign email marketing - NOT SUPPORTED'),
('Mailchimp', 'crm', 'Mailchimp email marketing - NOT SUPPORTED'),
('Klaviyo', 'marketing-automation', 'Klaviyo email marketing - NOT SUPPORTED'),
('Magento', 'ecommerce', 'Magento e-commerce platform - NOT SUPPORTED'),
('BigCommerce', 'ecommerce', 'BigCommerce e-commerce platform - NOT SUPPORTED'),
('PrestaShop', 'ecommerce', 'PrestaShop e-commerce platform - NOT SUPPORTED'),
('Shopware', 'ecommerce', 'Shopware e-commerce platform - NOT SUPPORTED'),
('OpenCart', 'ecommerce', 'OpenCart e-commerce platform - NOT SUPPORTED'),

-- MEDIUM PRIORITY - ADS & ANALYTICS
('Facebook Ads', 'ads', 'Facebook/Meta advertising platform - PARTIALLY SUPPORTED'),
('Google Analytics', 'analytics', 'Google Analytics tracking - NOT SUPPORTED'),
('Mixpanel', 'analytics', 'Mixpanel analytics - NOT SUPPORTED'),
('Hotjar', 'analytics', 'Hotjar heatmaps and analytics - NOT SUPPORTED'),
('Crazy Egg', 'analytics', 'Crazy Egg heatmaps - NOT SUPPORTED'),
('LinkedIn Ads', 'ads', 'LinkedIn advertising platform - NOT SUPPORTED'),
('Twitter Ads', 'ads', 'Twitter advertising platform - NOT SUPPORTED'),
('TikTok Ads', 'ads', 'TikTok advertising platform - NOT SUPPORTED'),

-- MEDIUM PRIORITY - CRM SYSTEMS
('Salesforce', 'crm', 'Salesforce CRM - NOT SUPPORTED'),
('Pipedrive', 'crm', 'Pipedrive CRM - NOT SUPPORTED'),
('Zoho CRM', 'crm', 'Zoho CRM - NOT SUPPORTED'),
('Monday.com', 'crm', 'Monday.com CRM - NOT SUPPORTED'),
('ClickFunnels', 'crm', 'ClickFunnels CRM - NOT SUPPORTED'),
('Kartra', 'crm', 'Kartra CRM - NOT SUPPORTED'),

-- MEDIUM PRIORITY - MARKETING AUTOMATION
('Zapier', 'automation', 'Zapier automation platform - PARTIALLY SUPPORTED'),
('Make', 'automation', 'Make (formerly Integromat) - NOT SUPPORTED'),
('IFTTT', 'automation', 'IFTTT automation - NOT SUPPORTED'),
('Microsoft Power Automate', 'automation', 'Power Automate - NOT SUPPORTED'),

-- MEDIUM PRIORITY - CMS PLATFORMS
('Drupal', 'cms', 'Drupal CMS - NOT SUPPORTED'),
('Joomla', 'cms', 'Joomla CMS - NOT SUPPORTED'),
('Squarespace', 'cms', 'Squarespace website builder - NOT SUPPORTED'),
('Weebly', 'cms', 'Weebly website builder - NOT SUPPORTED'),
('Wix', 'cms', 'Wix website builder - NOT SUPPORTED'),
('Webflow', 'cms', 'Webflow website builder - NOT SUPPORTED'),
('Bubble', 'cms', 'Bubble no-code platform - NOT SUPPORTED'),

-- MEDIUM PRIORITY - PAYMENT PROCESSORS
('Stripe', 'payment-processors', 'Stripe payment processing - NOT SUPPORTED'),
('PayPal', 'payment-processors', 'PayPal payments - NOT SUPPORTED'),
('Klarna', 'payment-processors', 'Klarna buy now pay later - NOT SUPPORTED'),
('Adyen', 'payment-processors', 'Adyen payment processing - NOT SUPPORTED'),
('Braintree', 'payment-processors', 'Braintree payments - NOT SUPPORTED'),

-- LOW PRIORITY - LANDING PAGE BUILDERS
('Unbounce', 'landing-page', 'Unbounce landing page builder - NOT SUPPORTED'),
('Leadpages', 'landing-page', 'Leadpages landing page builder - NOT SUPPORTED'),
('Instapage', 'landing-page', 'Instapage landing page builder - NOT SUPPORTED'),
('ClickFunnels', 'landing-page', 'ClickFunnels funnel builder - NOT SUPPORTED'),
('Kartra', 'landing-page', 'Kartra landing page builder - NOT SUPPORTED'),
('Systeme.io', 'landing-page', 'Systeme.io all-in-one platform - NOT SUPPORTED'),

-- UTILITY CATEGORIES
('Custom Website', 'cms', 'Custom-built website - NOT SUPPORTED'),
('Unknown', 'unknown', 'Technology not detected - N/A');

-- Add technology tracking to existing migration
INSERT INTO conversion_logs (job_id, agency_id, batch_size, success_count, failure_count, retry_count, errors, processing_time, created_at)
SELECT 'migration-tech-tracking', 'system', 0, 0, 0, 0, 'Technology tracking migration applied', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM conversion_logs WHERE job_id = 'migration-tech-tracking');