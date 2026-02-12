import { zipSync } from 'fflate';

// IMPORTANT: This content must stay in sync with:
// ../../woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php
// Run: ./scripts/sync-woo-plugin.sh to verify sync status
const PLUGIN_PHP_CONTENT = `<?php
/**
 * Plugin Name: AdsEngineer Conversion Tracking for WooCommerce
 * Plugin URI: https://adsengineer.com
 * Description: Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking with AdsEngineer. No code editing required!
 * Version: 1.2.0
 * Build: 2026-02-03
 * Author: AdsEngineer
 * License: GPL v2 or later
 * Text Domain: adsengineer-woocommerce
 * Domain Path: languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
  exit;
}

class AdsEngineer_WooCommerce {
  public function __construct() {
    add_action('plugins_loaded', array($this, 'init'));
    add_action('admin_menu', array($this, 'add_settings_menu'));
    add_action('admin_init', array($this, 'register_settings'));
  }

  public function init() {
    if (!class_exists('WooCommerce')) {
      add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
      return;
    }

    // Add tracking snippet to frontend
    add_action('wp_head', array($this, 'add_tracking_snippet'));

    // Capture GCLID and UTMs from cookies to order
    add_action('woocommerce_checkout_update_order_meta', array($this, 'save_attribution_to_order'));

    // Add webhook handlers
    $this->add_webhook_handler();
  }

  public function woocommerce_missing_notice() {
    ?>
    <div class="error">
      <p><?php _e('AdsEngineer WooCommerce Plugin requires WooCommerce to be installed and active.', 'adsengineer-woocommerce'); ?></p>
    </div>
    <?php
  }

  /**
   * Add AdsEngineer tracking snippet to <head>
   */
  public function add_tracking_snippet() {
    $site_id = get_option('adsengineer_site_id', '');
    if (empty($site_id)) {
      return;
    }
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

  /**
   * Save GCLID and UTM parameters from cookies to order meta
   */
  public function save_attribution_to_order($order_id) {
    // Save GCLID from snippet cookie
    if (isset($_COOKIE['_adsengineer_gclid'])) {
      update_post_meta($order_id, '_gclid', sanitize_text_field($_COOKIE['_adsengineer_gclid']));
    }

    // Save other UTM parameters
    $utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'ttclid'];
    foreach ($utms as $utm) {
      $cookie_name = '_adsengineer_' . $utm;
      if (isset($_COOKIE[$cookie_name])) {
        update_post_meta($order_id, '_' . $utm, sanitize_text_field($_COOKIE[$cookie_name]));
      }
    }
  }

  private function add_webhook_handler() {
    $webhook_url = $this->get_webhook_url();

    if (empty($webhook_url)) {
      error_log('AdsEngineer: Webhook URL not configured. Please configure plugin in WordPress settings.');
      return;
    }

    add_action('woocommerce_order_status_changed', array($this, 'handle_order_status_change'), 10, 4);
    add_action('woocommerce_new_order', array($this, 'handle_new_order'), 10, 2);

    error_log('AdsEngineer: Webhook handler initialized. Webhook URL: ' . $webhook_url);
  }

  private function get_webhook_url() {
    $webhook_url = get_option('adsengineer_webhook_url');
    if (empty($webhook_url)) {
      $webhook_url = 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook';
    }
    return $webhook_url;
  }

  public function handle_order_status_change($order_id, $old_status, $new_status, $order) {
    $this->send_order_to_adsengineer($order);
  }

  public function handle_new_order($order_id, $order) {
    $this->send_order_to_adsengineer($order);
  }

  private function send_order_to_adsengineer($order) {
    if (!$order instanceof WC_Order) {
      return;
    }

    $webhook_url = $this->get_webhook_url();

    $data = array(
      'id' => $order->get_id(),
      'status' => $order->get_status(),
      'currency' => $order->get_currency(),
      'total' => $order->get_total(),
      'billing' => array(
        'email' => $order->get_billing_email(),
        'phone' => $order->get_billing_phone(),
        'first_name' => $order->get_billing_first_name(),
        'last_name' => $order->get_billing_last_name(),
      ),
      'date_created_gmt' => $order->get_date_created()->date('Y-m-d H:i:s'),
    );

    // Extract GCLID from order meta
    $gclid = $order->get_meta('_gclid');
    if (empty($gclid)) {
      $gclid = $order->get_meta('gclid');
    }

    if (!empty($gclid)) {
      $data['meta_data'][] = array('key' => '_gclid', 'value' => $gclid);
    }

    $response = wp_remote_post($webhook_url, array(
      'headers' => array(
        'Content-Type' => 'application/json',
        'x-wc-webhook-source' => get_site_url(),
      ),
      'body' => wp_json_encode($data),
      'timeout' => 30,
    ));

    if (is_wp_error($response)) {
      error_log('AdsEngineer: Failed to send order data. Error: ' . $response->get_error_message());
    } else {
      $body = wp_remote_retrieve_body($response);
      $result = json_decode($body, true);

      if (isset($result['success']) && $result['success']) {
        error_log('AdsEngineer: Order ' . $order->get_id() . ' sent successfully. Lead ID: ' . ($result['lead_id'] ?? 'N/A'));
      } else {
        error_log('AdsEngineer: Failed to send order. Response: ' . $body);
      }
    }
  }

  public function add_settings_menu() {
    add_options_page(
      'AdsEngineer Settings',
      'AdsEngineer',
      'manage_options',
      'adsengineer-woocommerce',
      array($this, 'render_settings_page')
    );
  }

  public function render_settings_page() {
    if (!current_user_can('manage_options')) {
      return;
    }

    // Handle form submission with nonce verification
    if (isset($_POST['adsengineer_save_settings'])) {
      if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'adsengineer_settings')) {
        echo '<div class="notice notice-error"><p>Security check failed.</p></div>';
      } else {
        update_option('adsengineer_site_id', sanitize_text_field($_POST['adsengineer_site_id']));
        update_option('adsengineer_webhook_url', sanitize_text_field($_POST['adsengineer_webhook_url']));
        update_option('adsengineer_webhook_secret', sanitize_text_field($_POST['adsengineer_webhook_secret']));
        echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
      }
    }

    $site_id = get_option('adsengineer_site_id', '');
    $webhook_url = get_option('adsengineer_webhook_url', '');
    $webhook_secret = get_option('adsengineer_webhook_secret', '');

    $default_webhook_url = 'https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook';
    $is_configured = !empty($site_id) && !empty($webhook_url);
    ?>
    <div class="wrap">
      <h1>AdsEngineer for WooCommerce</h1>
      <p>Configure your AdsEngineer integration to automatically track WooCommerce orders.</p>

      <?php if ($is_configured): ?>
        <div class="notice notice-success notice-alt">
          <p><strong>✓ Plugin is configured and tracking!</strong></p>
        </div>
      <?php else: ?>
        <div class="notice notice-warning notice-alt">
          <p><strong>⚠ Setup incomplete:</strong> Please configure your Site ID and Webhook URL below.</p>
        </div>
      <?php endif; ?>

      <form method="post" action="">
        <?php wp_nonce_field('adsengineer_settings'); ?>
        <table class="form-table">
          <tr>
            <th scope="row">Site ID <span class="description">(required)</span></th>
            <td>
              <input type="text" name="adsengineer_site_id" value="<?php echo esc_attr($site_id); ?>" class="regular-text" required />
              <p class="description">Your AdsEngineer site ID. Get this from your AdsEngineer dashboard.</p>
            </td>
          </tr>
          <tr>
            <th scope="row">Webhook URL <span class="description">(required)</span></th>
            <td>
              <input type="url" name="adsengineer_webhook_url" value="<?php echo esc_attr($webhook_url); ?>" class="regular-text" placeholder="<?php echo esc_attr($default_webhook_url); ?>" required />
              <p class="description">Your AdsEngineer webhook URL. Leave empty to use the default.</p>
            </td>
          </tr>
          <tr>
            <th scope="row">Webhook Secret <span class="description">(optional)</span></th>
            <td>
              <input type="text" name="adsengineer_webhook_secret" value="<?php echo esc_attr($webhook_secret); ?>" class="regular-text" />
              <p class="description">Webhook secret for signature verification. Copy from your AdsEngineer dashboard.</p>
            </td>
          </tr>
        </table>

        <?php submit_button('Save Settings', 'primary', 'adsengineer_save_settings'); ?>
      </form>

      <hr>

      <div style="background: #e7f5e7; border-left: 4px solid #46b450; padding: 12px; margin: 20px 0;">
        <p><strong>✅ Automatic Setup Enabled</strong></p>
        <p>This plugin handles everything automatically - no code editing required!</p>
      </div>

      <h2>Setup Instructions</h2>
      <ol>
        <li>Enter your AdsEngineer <strong>Site ID</strong> above (get from dashboard)</li>
        <li>Enter your AdsEngineer <strong>Webhook URL</strong> above (or use default)</li>
        <li>Click <strong>Save Settings</strong></li>
        <li>That's it! The plugin automatically:
          <ul style="margin-top: 8px;">
            <li>Injects tracking snippet on all pages</li>
            <li>Captures GCLIDs and UTM parameters automatically</li>
            <li>Sends orders to AdsEngineer when created</li>
          </ul>
        </li>
      </ol>

      <h2>How It Works</h2>
      <p><strong>Everything is automatic - no manual code changes needed:</strong></p>
      <ul>
        <li><strong>✓ Tracking Snippet:</strong> Automatically injects AdsEngineer script on all pages</li>
        <li><strong>✓ GCLID Capture:</strong> Captures Google Ads click IDs via JavaScript (not PHP)</li>
        <li><strong>✓ UTM Tracking:</strong> Captures all UTM parameters automatically</li>
        <li><strong>✓ Order Sync:</strong> Sends order data with attribution to AdsEngineer</li>
        <li><strong>✓ No Code Required:</strong> No functions.php edits, no theme changes!</li>
      </ul>

      <h2>Plugin Status</h2>
      <table class="wp-list-table widefat fixed striped">
        <thead>
          <tr>
            <th>Setting</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Site ID</td>
            <td><?php echo !empty($site_id) ? '<span style="color:green">✓ Configured</span>' : '<span style="color:red">✗ Not set</span>'; ?></td>
          </tr>
          <tr>
            <td>Webhook URL</td>
            <td><?php echo !empty($webhook_url) ? '<span style="color:green">✓ Configured</span>' : '<span style="color:red">✗ Not set</span>'; ?></td>
          </tr>
          <tr>
            <td>Webhook Secret</td>
            <td><?php echo !empty($webhook_secret) ? '<span style="color:green">✓ Configured</span>' : '<span style="color:orange">Optional</span>'; ?></td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td><strong>Plugin Version</strong></td>
            <td><code>1.2.0 (Build: 2026-02-03)</code></td>
          </tr>
        </tbody>
      </table>
      
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        <strong>Note:</strong> This plugin version includes automatic GCLID capture. No manual theme or functions.php edits are required.
        If you see instructions elsewhere mentioning manual code changes, they are outdated. This plugin handles everything automatically.
      </p>
    </div>
    <?php
  }

  public function register_settings() {
    register_setting('adsengineer', 'adsengineer_site_id');
    register_setting('adsengineer', 'adsengineer_webhook_url');
    register_setting('adsengineer', 'adsengineer_webhook_secret');
  }
}

new AdsEngineer_WooCommerce();
`;

const README_CONTENT = `# AdsEngineer WooCommerce Plugin

Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking with AdsEngineer.

## Features

- **Automatic order tracking** - Orders are sent to AdsEngineer when created or status changes
- **GCLID capture** - Captures Google Ads click IDs and UTM parameters via snippet.js
- **No code required** - Everything works automatically, no manual functions.php edits needed
- **Real-time webhook processing** - Sends order data to AdsEngineer API
- **WordPress admin settings** - Easy configuration dashboard with status indicators

## Installation

1. Download the plugin ZIP file from your AdsEngineer dashboard
2. In WordPress admin, go to **Plugins > Add New > Upload Plugin**
3. Upload the \`adsengineer-woocommerce.zip\` file
4. Activate the plugin

## Configuration

1. Go to **Settings > AdsEngineer** in WordPress admin
2. Enter your **Site ID** (get from your AdsEngineer dashboard)
3. Enter your **Webhook URL** (or leave empty for default)
4. Click **Save Settings**

That's it! The plugin will automatically:
- Inject the AdsEngineer tracking snippet on all pages
- Capture GCLIDs and UTM parameters from visitors
- Send order data with attribution to AdsEngineer

## How It Works

The plugin handles everything automatically:

1. **Tracking Snippet**: Automatically injects \`snippet.js\` on all pages of your site
2. **Cookie Capture**: The snippet saves GCLIDs and UTM parameters to cookies
3. **Order Attribution**: When customers complete orders, GCLIDs are attached to the order
4. **Webhook Sending**: Order data (including GCLID) is sent to AdsEngineer

## Requirements

- WordPress 5.0+
- WooCommerce 3.0+
- PHP 7.4+

## Changelog

### 1.1.0
- Merged tracking functionality into single plugin
- Automatic GCLID capture via snippet.js (no manual code needed)
- Added Site ID configuration
- Added webhook secret support
- Improved settings page with status indicators

### 1.0.0
- Initial release
- Automatic order tracking
- GCLID capture support
- WordPress admin settings
`;

/**
 * Generate a ZIP file containing the WooCommerce plugin
 */
export async function generateWooCommercePluginZip(): Promise<Uint8Array> {
  const pluginFiles: Record<string, Uint8Array> = {};

  // Add the main plugin file
  pluginFiles['adsengineer-woocommerce/adsengineer-woocommerce.php'] = new TextEncoder().encode(
    PLUGIN_PHP_CONTENT
  );

  // Add the README file
  pluginFiles['adsengineer-woocommerce/README.md'] = new TextEncoder().encode(README_CONTENT);

  // Generate ZIP
  return zipSync(pluginFiles);
}
