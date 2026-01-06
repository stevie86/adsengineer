CREATE TABLE IF NOT EXISTS sites (
    site_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'starter',
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    last_activity TEXT,
    event_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'starter',
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    FOREIGN KEY (site_id) REFERENCES sites (site_id)
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    properties TEXT,
    timestamp TEXT NOT NULL,
    url TEXT NOT NULL,
    user_id TEXT,
    page_view_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (session_id),
    FOREIGN KEY (site_id) REFERENCES sites (site_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_site_id ON sessions (site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events (site_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites (user_id);