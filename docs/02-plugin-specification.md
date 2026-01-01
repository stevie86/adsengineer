# AdVocate WordPress Plugin Specification

## Purpose

The WordPress plugin is the **agent** deployed to client sites. It handles:
- Local data capture (leads, events, tracking IDs)
- Admin UI for site owners to see status
- Communication with AdVocate Cloud
- GTM/tracking tag deployment assistance

The plugin does NOT:
- Store API credentials for Google/Meta (Cloud handles this)
- Run optimization algorithms (Cloud handles this)
- Make bid/budget changes directly (Cloud handles this)

## Plugin Structure

```
advocate/
├── advocate.php                 # Main plugin file, hooks, activation
├── includes/
│   ├── class-advocate-core.php              # Shared utilities
│   ├── class-advocate-database.php          # Base DB operations
│   ├── class-advocate-database-enhanced.php # Lead scoring, sync queries
│   ├── class-advocate-api-client.php        # Cloud API communication
│   ├── class-advocate-tracking.php          # GCLID/FBCLID capture
│   ├── class-advocate-forms.php             # Form integration hooks
│   ├── class-advocate-admin.php             # Admin pages
│   ├── class-advocate-dashboard.php         # Main dashboard UI
│   ├── class-advocate-live-sync.php         # Live sync status display
│   ├── class-advocate-gtm-helper.php        # GTM setup assistance
│   └── class-advocate-cron.php              # Scheduled tasks
├── assets/
│   ├── css/
│   │   ├── admin.css
│   │   └── live-sync.css
│   └── js/
│       ├── admin.js
│       ├── live-sync.js
│       └── tracking.js          # Frontend tracking script
├── templates/
│   └── admin/                   # Admin page templates
└── languages/
    └── advocate.pot
```

## Database Schema

### Table: `{prefix}_advocate_leads`

```sql
CREATE TABLE {prefix}_advocate_leads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    site_id VARCHAR(36) NOT NULL,
    
    -- Tracking IDs (critical for attribution)
    gclid VARCHAR(255),
    fbclid VARCHAR(255),
    msclkid VARCHAR(255),
    
    -- UTM Parameters
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    
    -- Lead Data
    email_hash VARCHAR(64),           -- SHA256 of email
    phone_hash VARCHAR(64),           -- SHA256 of phone
    landing_page VARCHAR(500),
    referrer VARCHAR(500),
    
    -- Scoring & Value
    lead_score TINYINT UNSIGNED DEFAULT 50,
    base_value_cents INT UNSIGNED DEFAULT 0,
    adjusted_value_cents INT UNSIGNED DEFAULT 0,
    value_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- Status
    status ENUM('new','qualified','contacted','won','lost') DEFAULT 'new',
    
    -- Sync Status
    cloud_synced TINYINT(1) DEFAULT 0,
    cloud_synced_at DATETIME,
    google_ads_synced TINYINT(1) DEFAULT 0,
    google_ads_synced_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_gclid (gclid),
    INDEX idx_status (status),
    INDEX idx_cloud_synced (cloud_synced),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Table: `{prefix}_advocate_events`

```sql
CREATE TABLE {prefix}_advocate_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT UNSIGNED,
    
    event_type VARCHAR(50) NOT NULL,     -- page_view, form_start, form_submit, call_click, chat_start
    event_category VARCHAR(50),
    event_label VARCHAR(255),
    event_value INT,
    
    page_url VARCHAR(500),
    session_id VARCHAR(64),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_lead_id (lead_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (lead_id) REFERENCES {prefix}_advocate_leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Table: `{prefix}_advocate_sync_log`

```sql
CREATE TABLE {prefix}_advocate_sync_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    sync_type ENUM('leads','events','status') NOT NULL,
    direction ENUM('push','pull') NOT NULL,
    
    records_processed INT UNSIGNED DEFAULT 0,
    records_succeeded INT UNSIGNED DEFAULT 0,
    records_failed INT UNSIGNED DEFAULT 0,
    
    error_message TEXT,
    
    started_at DATETIME,
    completed_at DATETIME,
    
    INDEX idx_sync_type (sync_type),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Core Classes

### AdVocate_API_Client

Handles all communication with AdVocate Cloud.

```php
class AdVocate_API_Client {
    private string $api_base = 'https://api.advocate.cloud/v1';
    private string $site_id;
    private string $api_token;
    
    public function __construct() {
        $this->site_id = get_option('advocate_site_id');
        $this->api_token = get_option('advocate_api_token');
    }
    
    // Register site with Cloud (initial setup)
    public function register_site(array $site_data): array|WP_Error;
    
    // Push leads to Cloud
    public function sync_leads(array $leads): array|WP_Error;
    
    // Push events to Cloud
    public function sync_events(array $events): array|WP_Error;
    
    // Get current status from Cloud
    public function get_status(): array|WP_Error;
    
    // Get optimization actions taken
    public function get_recent_actions(int $limit = 20): array|WP_Error;
    
    // Get data integrity score
    public function get_integrity_score(): array|WP_Error;
}
```

### AdVocate_Tracking

Captures tracking IDs from URL and cookies.

```php
class AdVocate_Tracking {
    // Capture GCLID/FBCLID from URL on page load
    public function capture_click_ids(): void;
    
    // Store in cookie for cross-page persistence
    public function store_click_ids(array $ids): void;
    
    // Retrieve stored click IDs
    public function get_click_ids(): array;
    
    // Capture UTM parameters
    public function capture_utm_params(): array;
    
    // Generate session ID
    public function get_session_id(): string;
    
    // Enqueue frontend tracking script
    public function enqueue_tracking_script(): void;
}
```

### AdVocate_Forms

Integrates with popular form plugins.

```php
class AdVocate_Forms {
    // Supported form plugins
    private array $supported = [
        'cf7'        => 'Contact Form 7',
        'wpforms'    => 'WPForms',
        'gravityforms' => 'Gravity Forms',
        'elementor'  => 'Elementor Forms',
        'fluentforms' => 'Fluent Forms',
        'ninja'      => 'Ninja Forms',
    ];
    
    // Hook into form submissions
    public function register_form_hooks(): void;
    
    // Process CF7 submission
    public function handle_cf7_submission($contact_form, $result): void;
    
    // Process WPForms submission
    public function handle_wpforms_submission($fields, $entry, $form_data): void;
    
    // Create lead from form data
    public function create_lead_from_form(array $form_data, string $source): int;
}
```

## Admin Pages

### Main Dashboard (`/wp-admin/admin.php?page=advocate`)

Displays:
- Connection status (Cloud connected / disconnected)
- Data integrity score (0-100 with visual gauge)
- Recent leads count and sync status
- Quick stats: leads today, synced today, value protected
- Link to full dashboard in Cloud

### Live Sync Feed (`/wp-admin/admin.php?page=advocate-live-sync`)

Displays:
- Real-time sync activity feed
- Recent optimization actions from Cloud
- Sync health indicators
- Manual sync trigger button
- Demo mode for sales presentations

### Settings (`/wp-admin/admin.php?page=advocate-settings`)

Configuration:
- Site ID (auto-generated or manual)
- API Token (from Cloud dashboard)
- Tracked forms (checkboxes for detected forms)
- Lead value settings (default value, vertical)
- Data retention period
- Debug mode toggle

## Cron Jobs

### `advocate_sync_leads` (every 5 minutes)

```php
function advocate_cron_sync_leads() {
    $db = new AdVocate_Database_Enhanced();
    $api = new AdVocate_API_Client();
    
    // Get unsynced leads (limit 50 per run)
    $leads = $db->get_unsynced_leads(50);
    
    if (empty($leads)) {
        return;
    }
    
    // Push to Cloud
    $result = $api->sync_leads($leads);
    
    if (!is_wp_error($result)) {
        // Mark as synced
        $db->mark_leads_synced(array_column($leads, 'id'));
    }
    
    // Log sync attempt
    $db->log_sync('leads', 'push', count($leads), $result);
}
```

### `advocate_sync_status` (every 15 minutes)

```php
function advocate_cron_sync_status() {
    $api = new AdVocate_API_Client();
    
    // Pull latest status from Cloud
    $status = $api->get_status();
    
    if (!is_wp_error($status)) {
        // Cache status for dashboard display
        set_transient('advocate_cloud_status', $status, 20 * MINUTE_IN_SECONDS);
        
        // Update local data integrity score
        update_option('advocate_integrity_score', $status['integrity_score']);
    }
}
```

## Frontend Tracking Script

Injected on all frontend pages to capture pre-form data.

```javascript
// assets/js/tracking.js
(function() {
    'use strict';
    
    var Advocate = {
        init: function() {
            this.captureClickIds();
            this.trackPageView();
            this.observeForms();
        },
        
        captureClickIds: function() {
            var params = new URLSearchParams(window.location.search);
            var ids = {};
            
            ['gclid', 'fbclid', 'msclkid', 'utm_source', 'utm_medium', 
             'utm_campaign', 'utm_content', 'utm_term'].forEach(function(key) {
                if (params.has(key)) {
                    ids[key] = params.get(key);
                }
            });
            
            if (Object.keys(ids).length > 0) {
                // Store in cookie (30 day expiry)
                document.cookie = 'advocate_tracking=' + 
                    encodeURIComponent(JSON.stringify(ids)) + 
                    '; path=/; max-age=' + (30 * 24 * 60 * 60);
            }
        },
        
        getStoredIds: function() {
            var match = document.cookie.match(/advocate_tracking=([^;]+)/);
            if (match) {
                try {
                    return JSON.parse(decodeURIComponent(match[1]));
                } catch (e) {}
            }
            return {};
        },
        
        trackPageView: function() {
            this.sendEvent('page_view', {
                url: window.location.href,
                referrer: document.referrer,
                title: document.title
            });
        },
        
        observeForms: function() {
            // Inject hidden fields into forms with tracking data
            document.querySelectorAll('form').forEach(function(form) {
                var ids = Advocate.getStoredIds();
                Object.keys(ids).forEach(function(key) {
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'advocate_' + key;
                    input.value = ids[key];
                    form.appendChild(input);
                });
            });
        },
        
        sendEvent: function(eventType, data) {
            if (typeof advocateConfig === 'undefined') return;
            
            var payload = Object.assign({}, data, {
                event_type: eventType,
                session_id: this.getSessionId(),
                timestamp: new Date().toISOString()
            }, this.getStoredIds());
            
            navigator.sendBeacon(advocateConfig.ajaxUrl, new URLSearchParams({
                action: 'advocate_track_event',
                nonce: advocateConfig.nonce,
                data: JSON.stringify(payload)
            }));
        },
        
        getSessionId: function() {
            var sid = sessionStorage.getItem('advocate_session');
            if (!sid) {
                sid = 'sess_' + Math.random().toString(36).substr(2, 16);
                sessionStorage.setItem('advocate_session', sid);
            }
            return sid;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { Advocate.init(); });
    } else {
        Advocate.init();
    }
})();
```

## Installation Flow

1. **User installs plugin** (upload ZIP or via WP marketplace)
2. **Activation hook runs**:
   - Creates database tables
   - Generates unique site ID
   - Schedules cron jobs
3. **User visits AdVocate settings**:
   - Prompted to connect to AdVocate Cloud
   - "Connect Account" button opens Cloud signup/login
   - OAuth flow returns API token
   - Plugin stores token and registers site with Cloud
4. **Plugin begins operation**:
   - Frontend tracking script active
   - Form hooks registered
   - Cron jobs syncing data

## Plugin Settings (wp_options)

| Option Key | Type | Description |
|------------|------|-------------|
| `advocate_site_id` | string | Unique site identifier (UUID) |
| `advocate_api_token` | string | JWT for Cloud API auth (encrypted) |
| `advocate_cloud_connected` | bool | Whether successfully connected |
| `advocate_vertical` | string | Business vertical (dental, legal, etc.) |
| `advocate_default_lead_value` | int | Default lead value in cents |
| `advocate_tracked_forms` | array | List of form IDs/types to track |
| `advocate_integrity_score` | int | Latest data integrity score (0-100) |
| `advocate_last_sync` | datetime | Last successful sync timestamp |
| `advocate_debug_mode` | bool | Enable verbose logging |

## Security Considerations

1. **API Token Storage**: Encrypt token at rest using `wp_salt()`
2. **Data Hashing**: Hash PII (email, phone) before storing and syncing
3. **Nonce Verification**: All AJAX endpoints verify nonces
4. **Capability Checks**: Admin pages require `manage_options`
5. **Input Sanitization**: All inputs sanitized via WP functions
6. **SQL Injection**: All queries use `$wpdb->prepare()`

## Testing Checklist

- [ ] Plugin activates without errors on WP 6.0+
- [ ] Database tables created correctly
- [ ] Frontend tracking script loads on all pages
- [ ] GCLID captured from URL and stored in cookie
- [ ] Form submissions create lead records
- [ ] Lead records include tracking IDs
- [ ] Cron jobs execute and sync to Cloud
- [ ] Admin dashboard displays correctly
- [ ] Live sync feed updates in real-time
- [ ] Settings save and load properly
- [ ] Plugin deactivates cleanly (keeps data)
- [ ] Plugin uninstalls cleanly (removes data)
