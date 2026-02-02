# WooCommerce Plugin Settings Page - Code Reference

## File Locations

```
woocommerce-plugin/
├── adsengineer-woocommerce/
│   └── adsengineer-woocommerce.php    (213 lines)
├── adsengineer-tracking.php            (94 lines)
└── README.md
```

---

## Plugin 1: Main Plugin (`adsengineer-woocommerce.php`)

### Plugin Header (Lines 1-14)
```php
<?php
/**
 * Plugin Name: AdsEngineer Conversion Tracking for WooCommerce
 * Plugin URI: https://adsengineer.com
 * Description: Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking.
 * Version: 1.0.0
 * Author: AdsEngineer
 * License: GPL v2 or later
 * Text Domain: adsengineer-woocommerce
 * Domain Path: languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */
```

### Class Initialization (Lines 20-25)
```php
class AdsEngineer_WooCommerce {
  public function __construct() {
    add_action('plugins_loaded', array($this, 'init'));
    add_action('admin_menu', array($this, 'add_settings_menu'));
    add_action('admin_init', array($this, 'register_settings'));
  }
```

**Hooks Used:**
- `plugins_loaded` - Initialize plugin after all plugins loaded
- `admin_menu` - Add menu item to admin
- `admin_init` - Register settings

### Menu Registration (Lines 132-140)
```php
public function add_settings_menu() {
  add_options_page(
    'AdsEngineer Settings',      // Page title
    'AdsEngineer',               // Menu title
    'manage_options',            // Capability
    'adsengineer-woocommerce',   // Menu slug
    array($this, 'render_settings_page')  // Callback
  );
}
```

**Parameters:**
- `add_options_page()` - Adds submenu under Settings
- Capability: `manage_options` (admin only)
- Slug: `adsengineer-woocommerce`

### Settings Registration (Lines 208-210)
```php
public function register_settings() {
  register_setting('adsengineer', 'adsengineer_webhook_url');
}
```

**Parameters:**
- Option group: `adsengineer`
- Option name: `adsengineer_webhook_url`

### Settings Page Render (Lines 142-206)

#### Permission Check (Lines 143-145)
```php
public function render_settings_page() {
  if (!current_user_can('manage_options')) {
    return;
  }
```

#### Form Submission Handler (Lines 147-150)
```php
if (isset($_POST['submit'])) {
  update_option('adsengineer_webhook_url', sanitize_text_field($_POST['adsengineer_webhook_url']));
  echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
}
```

**Security:**
- Checks `$_POST['submit']` (button name)
- Sanitizes with `sanitize_text_field()`
- Stores in options table
- Shows success notice

**Note:** Missing nonce verification in POST handler (should check `wp_verify_nonce()`)

#### Data Retrieval (Lines 152-153)
```php
$webhook_url = get_option('adsengineer_webhook_url', '');
?>
```

#### Page Wrapper (Lines 154-156)
```html
<div class="wrap">
  <h1>AdsEngineer for WooCommerce</h1>
  <p>Configure your AdsEngineer integration to automatically track WooCommerce orders.</p>
```

#### Form Structure (Lines 158-174)
```html
<form method="post" action="">
  <table class="form-table">
    <tr>
      <th scope="row">Webhook URL</th>
      <td>
        <input type="url" 
               name="adsengineer_webhook_url" 
               value="<?php echo esc_attr($webhook_url); ?>" 
               class="regular-text" 
               placeholder="https://your-domain.workers.dev/webhooks/woo" />
        <p class="description">
          Your AdsEngineer webhook URL. Leave empty to use the default.<br>
          <strong>Default:</strong> https://adsengineer-cloud.adsengineer.workers.dev/webhooks/woo
        </p>
      </td>
    </tr>
  </table>

  <?php wp_nonce_field('adsengineer_settings'); ?>
  <?php submit_button('Save Settings'); ?>
</form>
```

**Form Elements:**
- `method="post"` - POST submission
- `action=""` - Submit to same page
- `type="url"` - URL validation
- `class="regular-text"` - Standard width
- `wp_nonce_field()` - Security token
- `submit_button()` - WordPress button

#### Setup Instructions (Lines 178-183)
```html
<h2>Setup Instructions</h2>
<ol>
  <li>Enter your AdsEngineer webhook URL above</li>
  <li>Make sure your site can capture GCLID parameters (Google Ads click IDs)</li>
  <li>Orders will be automatically sent to AdsEngineer when created or status changes</li>
</ol>
```

#### GCLID Capture Code Block (Lines 185-203)
```html
<h2>GCLID Capture</h2>
<p>To capture Google Ads click IDs, add this code to your theme's functions.php or use a plugin:</p>
<pre><code>// Capture GCLID on page load
function capture_gclid() {
    if (isset($_GET['gclid'])) {
        setcookie('gclid', $_GET['gclid'], time() + (86400 * 30), "/"); // 30 days
    }
}
add_action('init', 'capture_gclid');

// Save GCLID to order meta
function save_gclid_to_order($order_id) {
    if (isset($_COOKIE['gclid'])) {
        $order = wc_get_order($order_id);
        $order->update_meta_data('_gclid', $_COOKIE['gclid']);
        $order->save();
    }
}
add_action('woocommerce_checkout_update_order_meta', 'save_gclid_to_order');</code></pre>
```

---

## Plugin 2: Tracking Plugin (`adsengineer-tracking.php`)

### Universal Tracking Snippet (Lines 13-30)
```php
add_action('wp_head', 'adsengineer_add_snippet');
function adsengineer_add_snippet() {
  $site_id = get_option('adsengineer_site_id', '');
  if (empty($site_id)) return;
  ?>
  <script>
    (function() {
      var s = document.createElement('script');
      s.src = 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js';
      s.setAttribute('data-site-id', '<?php echo esc_attr($site_id); ?>');
      document.head.appendChild(s);
    })();
  </script>
  <?php
}
```

**Hook:** `wp_head` - Adds script to page head  
**Retrieval:** `get_option('adsengineer_site_id', '')`  
**Escaping:** `esc_attr()` for data attribute

### GCLID Capture (Lines 32-48)
```php
add_action('woocommerce_checkout_update_order_meta', 'adsengineer_save_gclid_to_order');
function adsengineer_save_gclid_to_order($order_id) {
  if (isset($_COOKIE['_adsengineer_gclid'])) {
    update_post_meta($order_id, '_gclid', sanitize_text_field($_COOKIE['_adsengineer_gclid']));
  }
  
  // Also capture other UTMs if available
  $utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  foreach ($utms as $utm) {
    $cookie_name = '_adsengineer_' . $utm;
    if (isset($_COOKIE[$cookie_name])) {
      update_post_meta($order_id, '_' . $utm, sanitize_text_field($_COOKIE[$cookie_name]));
    }
  }
}
```

**Hook:** `woocommerce_checkout_update_order_meta`  
**Captures:** GCLID + UTM parameters  
**Storage:** Order meta data

### Menu Registration (Lines 51-54)
```php
add_action('admin_menu', 'adsengineer_create_menu');
function adsengineer_create_menu() {
  add_menu_page('AdsEngineer', 'AdsEngineer', 'manage_options', 'adsengineer_settings', 'adsengineer_settings_page');
}
```

**Parameters:**
- `add_menu_page()` - Top-level menu (not submenu)
- Slug: `adsengineer_settings`

### Settings Page Render (Lines 56-88)
```php
function adsengineer_settings_page() {
  ?>
  <div class="wrap">
    <h1>AdsEngineer Configuration</h1>
    <form method="post" action="options.php">
      <?php
      settings_fields('adsengineer_options');
      do_settings_sections('adsengineer_options');
      ?>
      <table class="form-table">
        <tr valign="top">
          <th scope="row">Site ID</th>
          <td>
            <input type="text" 
                   name="adsengineer_site_id" 
                   value="<?php echo esc_attr(get_option('adsengineer_site_id')); ?>" />
          </td>
        </tr>
      </table>
      <?php submit_button(); ?>
    </form>
```

**Form Elements:**
- `action="options.php"` - WordPress Settings API
- `settings_fields()` - Nonce + settings group
- `do_settings_sections()` - Render sections
- `valign="top"` - Vertical alignment (deprecated)

#### Webhook Setup Instructions (Lines 74-85)
```html
<hr>
<h3>Webhook Setup</h3>
<p>To finish setup:</p>
<ol>
  <li>Go to <strong>WooCommerce > Settings > Advanced > Webhooks</strong></li>
  <li>Click <strong>Add Webhook</strong></li>
  <li><strong>Name:</strong> AdsEngineer Order Created</li>
  <li><strong>Status:</strong> Active</li>
  <li><strong>Topic:</strong> Order created</li>
  <li><strong>Delivery URL:</strong> <code>https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook</code></li>
  <li><strong>Secret:</strong> (Copy from your AdsEngineer Dashboard)</li>
  <li>Save Hook</li>
</ol>
```

### Settings Registration (Lines 90-93)
```php
add_action('admin_init', 'adsengineer_register_settings');
function adsengineer_register_settings() {
  register_setting('adsengineer_options', 'adsengineer_site_id');
}
```

**Hook:** `admin_init`  
**Option Group:** `adsengineer_options`  
**Option Name:** `adsengineer_site_id`

---

## Key Functions Used

### WordPress Core Functions

| Function | Purpose | Plugin |
|----------|---------|--------|
| `add_action()` | Hook into WordPress events | Both |
| `add_options_page()` | Add Settings submenu | Main |
| `add_menu_page()` | Add top-level menu | Tracking |
| `add_admin_notice()` | Show admin notification | Main |
| `register_setting()` | Register option for Settings API | Both |
| `get_option()` | Retrieve option value | Both |
| `update_option()` | Save option value | Main |
| `current_user_can()` | Check user capability | Main |
| `wp_nonce_field()` | Output nonce field | Main |
| `wp_verify_nonce()` | Verify nonce (missing!) | Main |
| `sanitize_text_field()` | Sanitize text input | Both |
| `esc_attr()` | Escape HTML attribute | Both |
| `submit_button()` | Output submit button | Both |
| `settings_fields()` | Output nonce for Settings API | Tracking |
| `do_settings_sections()` | Render settings sections | Tracking |

### WooCommerce Functions

| Function | Purpose | Plugin |
|----------|---------|--------|
| `wc_get_order()` | Get order object | Main |
| `update_post_meta()` | Save order meta | Tracking |

---

## Security Analysis

### ✅ Implemented
- `sanitize_text_field()` - Input sanitization
- `esc_attr()` - Output escaping
- `current_user_can('manage_options')` - Permission check
- `wp_nonce_field()` - CSRF token generation

### ❌ Missing
- `wp_verify_nonce()` - CSRF token verification (Main plugin)
- Input validation - No URL format validation
- Error handling - No try/catch blocks
- Rate limiting - No protection against spam

### ⚠️ Concerns
- Main plugin uses custom POST handler instead of Settings API
- No error messages for failed operations
- Webhook URL not validated before saving
- No logging of configuration changes

---

## Data Flow

### Main Plugin: Webhook URL
```
User Input
    ↓
$_POST['adsengineer_webhook_url']
    ↓
sanitize_text_field()
    ↓
update_option('adsengineer_webhook_url', ...)
    ↓
WordPress Options Table
    ↓
get_option('adsengineer_webhook_url', '')
    ↓
esc_attr() for display
    ↓
HTML output
```

### Tracking Plugin: Site ID
```
User Input
    ↓
$_POST['adsengineer_site_id']
    ↓
WordPress Settings API
    ↓
register_setting() sanitization
    ↓
WordPress Options Table
    ↓
get_option('adsengineer_site_id')
    ↓
esc_attr() for display
    ↓
HTML output
```

---

## CSS Classes Reference

### Layout Classes
```css
.wrap                    /* Main page container */
.form-table              /* Form field table */
.form-table th           /* Field label */
.form-table td           /* Field input */
```

### Input Classes
```css
.regular-text            /* Standard input width (25em) */
.large-text              /* Large input width (99%) */
.small-text              /* Small input width (100px) */
```

### Text Classes
```css
.description             /* Help text styling */
.error                   /* Error message */
.notice                  /* Notice container */
.notice-success          /* Success message (green) */
.notice-error            /* Error message (red) */
.notice-warning          /* Warning message (yellow) */
.notice-info             /* Info message (blue) */
```

---

## Hooks Reference

### Admin Hooks Used
```php
add_action('plugins_loaded', ...)           // Plugin initialization
add_action('admin_menu', ...)               // Add menu items
add_action('admin_init', ...)               // Admin initialization
add_action('wp_head', ...)                  // Add to page head
add_action('woocommerce_checkout_update_order_meta', ...)  // Order processing
```

### Hooks Available for Enhancement
```php
add_action('admin_enqueue_scripts', ...)    // Enqueue CSS/JS
add_action('admin_notices', ...)            // Show admin notices
add_action('admin_footer', ...)             // Add to admin footer
add_filter('sanitize_option_...', ...)      // Custom sanitization
add_filter('pre_update_option_...', ...)    // Pre-save validation
```

---

## Next Steps for Enhancement

1. **Add nonce verification** to main plugin POST handler
2. **Implement Settings API** in main plugin for consistency
3. **Add form validation** with error messages
4. **Create custom CSS** for better styling
5. **Add status indicators** for webhook connectivity
6. **Consolidate** both plugins into single settings page
7. **Add logging** for configuration changes
8. **Implement error handling** with user feedback
