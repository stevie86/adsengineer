-- Add lead counting tables and indexes

CREATE TABLE lead_counts (
  id TEXT PRIMARY KEY,  -- Composite key: org_id|site_id|date|metric
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  count_date DATE NOT NULL,
  metric TEXT NOT NULL,  -- 'total_leads', 'qualified_leads', 'won_leads', 'lost_leads'
  count_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, site_id, count_date, metric)
);

CREATE INDEX idx_lead_counts_composite ON lead_counts(org_id, site_id, count_date, metric);

-- Table to track daily snapshots for analytics
CREATE TABLE daily_lead_snapshots (
  id TEXT PRIMARY KEY,  -- Composite: org_id|site_id|date
  org_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  total_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  won_leads INTEGER DEFAULT 0,
  lost_leads INTEGER DEFAULT 0,
  lead_score_avg INTEGER,  -- Average lead quality score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_snapshots_org_site_date ON daily_lead_snapshots(org_id, site_id, snapshot_date);

-- Function to update lead count
CREATE TRIGGER update_lead_count AFTER INSERT ON leads
FOR EACH ROW
BEGIN
  -- Insert or update count for the org/site/date/metric
  INSERT INTO lead_counts (org_id, site_id, count_date, metric, count_value)
  VALUES (
    NEW.org_id,
    NEW.site_id,
    CURRENT_DATE,
    'total_leads',
    COALESCE(
      (SELECT count_value FROM lead_counts
       WHERE org_id = NEW.org_id
       AND site_id = NEW.site_id
       AND count_date = CURRENT_DATE
       AND metric = 'total_leads'
       LIMIT 1 FOR UPDATE SKIP LOCKED),
      0
    )
  )
  ON CONFLICT(count_value) DO
    UPDATE SET
      count_value = count_value + 1,
      updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND site_id = NEW.site_id
      AND count_date = CURRENT_DATE
      AND metric = 'total_leads';

  -- Insert qualified lead count separately
  INSERT INTO lead_counts (org_id, site_id, count_date, metric, count_value)
  VALUES (
    NEW.org_id,
    NEW.site_id,
    CURRENT_DATE,
    'qualified_leads',
    CASE
      WHEN NEW.lead_score >= 70 THEN 1
      ELSE 0
    END
  )
  ON CONFLICT(count_value) DO
    UPDATE SET
      count_value = count_value + 1,
      updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND site_id = NEW.site_id
      AND count_date = CURRENT_DATE
      AND metric = 'qualified_leads';

  -- Insert won lead count separately
  INSERT INTO lead_counts (org_id, site_id, count_date, metric, count_value)
  VALUES (
    NEW.org_id,
    NEW.site_id,
    CURRENT_DATE,
    'won_leads',
    CASE
      WHEN NEW.status = 'won' THEN 1
      ELSE 0
    END
  )
  ON CONFLICT(count_value) DO
    UPDATE SET
      count_value = count_value + 1,
      updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND site_id = NEW.site_id
      AND count_date = CURRENT_DATE
      AND metric = 'won_leads';

  -- Insert lost lead count separately
  INSERT INTO lead_counts (org_id, site_id, count_date, metric, count_value)
  VALUES (
    NEW.org_ID,
    NEW.site_id,
    CURRENT_DATE,
    'lost_leads',
    CASE
      WHEN NEW.status = 'lost' THEN 1
      ELSE 0
    END
  )
  ON CONFLICT(count_value) DO
    UPDATE SET
      count_value = count_value + 1,
      updated_at = NOW()
    WHERE org_ID = NEW.org_ID
      AND site_id = NEW.site_id
      AND count_date = CURRENT_DATE
      AND metric = 'lost_leads';

  -- Update daily snapshot at end of day
  INSERT INTO daily_lead_snapshots (org_id, site_id, snapshot_date, total_leads, qualified_leads, won_leads, lost_leads, lead_score_avg)
  VALUES (
    NEW.org_id,
    NEW.site_id,
    CURRENT_DATE,
    COALESCE(
      (SELECT SUM(count_value) FROM lead_counts
       WHERE org_id = NEW.org_id
       AND site_id = NEW.site_id
       AND count_date = CURRENT_DATE
       AND metric IN ('total_leads', 'qualified_leads', 'won_leads', 'lost_leads')
    ),
      0
    ),
    COALESCE(
      (SELECT SUM(CASE WHEN lead_score >= 70 THEN count_value ELSE 0 END) FROM leads
       WHERE org_id = NEW.org_id
       AND site_id = NEW.site_id
       AND DATE(created_at) = CURRENT_DATE
       AND status = 'new'
    ),
      0
    ),
    COALESCE(
      (SELECT SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) FROM leads
       WHERE org_id = NEW.org_id
       AND site_id = NEW.site_id
       AND DATE(created_at) = CURRENT_DATE
       AND status = 'new'
    ),
      0
    ),
    COALESCE(
      (SELECT SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) FROM leads
       WHERE org_id = NEW.org_ID
       AND site_id = NEW.site_id
       AND DATE(created_at) = CURRENT_DATE
       AND status = 'new'
    ),
      0
    );
END;
