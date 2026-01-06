-- Page Visit Tracking Migration
-- Adds page visit tracking for landing page analytics

CREATE TABLE IF NOT EXISTS page_visits (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT, -- Anonymous user identifier
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,
  time_zone TEXT,
  language TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  entry_page BOOLEAN DEFAULT FALSE, -- Is this the first page of the session
  exit_page BOOLEAN DEFAULT FALSE, -- Is this the last page of the session
  time_on_page INTEGER, -- Time spent on page in seconds
  scroll_depth INTEGER DEFAULT 0, -- Percentage of page scrolled (0-100)
  interactions INTEGER DEFAULT 0, -- Number of interactions (clicks, etc.)
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- Indexes for performance and analytics queries
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_url ON page_visits(page_url);
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_country ON page_visits(country);
CREATE INDEX IF NOT EXISTS idx_page_visits_device_type ON page_visits(device_type);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_source ON page_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_campaign ON page_visits(utm_campaign);

-- Session tracking table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,
  screen_resolution TEXT,
  time_zone TEXT,
  language TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  session_start TEXT NOT NULL,
  session_end TEXT,
  page_views INTEGER DEFAULT 1,
  total_time INTEGER DEFAULT 0, -- Total session time in seconds
  bounce BOOLEAN DEFAULT TRUE, -- Single page session
  conversion BOOLEAN DEFAULT FALSE, -- Did they convert (signup, etc.)
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_country ON sessions(country);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_source ON sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_sessions_utm_campaign ON sessions(utm_campaign);

-- Migration completed
INSERT INTO conversion_logs (job_id, agency_id, batch_size, success_count, failure_count, retry_count, errors, processing_time, created_at)
SELECT 'migration-page-visit-tracking-v1', 'system', 0, 0, 0, 0, 'Page visit and session tracking implemented for landing page analytics', 0, datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM conversion_logs WHERE job_id = 'migration-page-visit-tracking-v1');