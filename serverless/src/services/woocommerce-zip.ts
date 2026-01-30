import { zipSync } from 'fflate';

// IMPORTANT: This content must stay in sync with:
// ../../woocommerce-plugin/adsengineer-woocommerce/adsengineer-woocommerce.php
// Run: ./scripts/sync-woo-plugin.sh to verify sync status
const PLUGIN_PHP_CONTENT = `<?php
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

    $this->add_webhook_handler();
  }

  public function woocommerce_missing_notice() {
    ?>
    <div class="error">
      <p><?php _e('AdsEngineer WooCommerce Plugin requires WooCommerce to be installed and active.', 'adsengineer-woocommerce'); ?></p>
    </div>
    <?php
  }

  private function add_webhook_handler() {
    $site_url = get_site_url();
    $webhook_url = $this->get_webhook_url($site_url);

    if (empty($webhook_url)) {
      error_log('AdsEngineer: Webhook URL not configured. Please configure plugin in WordPress settings.');
      return;
    }

    add_action('woocommerce_order_status_changed', array($this, 'handle_order_status_change'), 10, 4);
    add_action('woocommerce_new_order', array($this, 'handle_new_order'), 10, 2);

    error_log('AdsEngineer: Webhook handler initialized. Webhook URL: ' . $webhook_url);
  }

  private function get_webhook_url($site_url) {
    $domain = parse_url($site_url, PHP_URL_HOST);

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

    $webhook_url = $this->get_webhook_url(get_site_url());

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

    if (isset($_POST['submit'])) {
      update_option('adsengineer_webhook_url', sanitize_text_field($_POST['adsengineer_webhook_url']));
      echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
    }

    $webhook_url = get_option('adsengineer_webhook_url', '');
    ?>
    <div class="wrap">
      <h1>AdsEngineer for WooCommerce</h1>
      <p>Configure your AdsEngineer integration to automatically track WooCommerce orders.</p>

      <form method="post" action="">
        <table class="form-table">
          <tr>
            <th scope="row">Webhook URL</th>
            <td>
<input type="url" name="adsengineer_webhook_url" value="<?php echo esc_attr($webhook_url); ?>" class="regular-text" placeholder="https://your-domain.workers.dev/api/v1/woocommerce/webhook" />
               <p class="description">
                 Your AdsEngineer webhook URL. Leave empty to use the default.<br>
                 <strong>Default:</strong> https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook
              </p>
            </td>
          </tr>
        </table>

        <?php wp_nonce_field('adsengineer_settings'); ?>
        <?php submit_button('Save Settings'); ?>
      </form>

      <hr>

      <h2>Setup Instructions</h2>
      <ol>
        <li>Enter your AdsEngineer webhook URL above</li>
        <li>Make sure your site can capture GCLID parameters (Google Ads click IDs)</li>
        <li>Orders will be automatically sent to AdsEngineer when created or status changes</li>
      </ol>

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
    </div>
    <?php
  }

  public function register_settings() {
    register_setting('adsengineer', 'adsengineer_webhook_url');
  }
}

new AdsEngineer_WooCommerce();
`;

const README_CONTENT = `# AdsEngineer WooCommerce Plugin

Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking with AdsEngineer.

## Features

- Automatic order tracking when orders are created or status changes
- GCLID capture from order metadata (Google Ads click IDs)
- Real-time webhook processing to AdsEngineer API
- WordPress admin settings page for configuration

## Installation

1. Download the plugin ZIP file from your AdsEngineer dashboard
2. In WordPress admin, go to **Plugins > Add New > Upload Plugin**
3. Upload the \`adsengineer-woocommerce.zip\` file
4. Activate the plugin

## Configuration

1. Go to **Settings > AdsEngineer** in WordPress admin
2. Enter your AdsEngineer webhook URL (or leave empty for default)
3. Save settings

## GCLID Capture Setup

To capture Google Ads click IDs, add this code to your theme's \`functions.php\` or use a custom plugin:

\`\`\`php
// Capture GCLID on page load
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
add_action('woocommerce_checkout_update_order_meta', 'save_gclid_to_order');
\`\`\`

## Requirements

- WordPress 5.0+
- WooCommerce 3.0+
- PHP 7.4+

## Changelog

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
  pluginFiles['adsengineer-woocommerce/adsengineer-woocommerce.php'] = new TextEncoder().encode(PLUGIN_PHP_CONTENT);

  // Add the README file
  pluginFiles['adsengineer-woocommerce/README.md'] = new TextEncoder().encode(README_CONTENT);

  // Generate ZIP
  return zipSync(pluginFiles);
}
