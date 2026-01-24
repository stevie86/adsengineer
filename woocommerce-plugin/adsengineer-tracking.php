<?php
/**
 * Plugin Name: AdsEngineer Tracking
 * Description: Connects WooCommerce to AdsEngineer for server-side conversion tracking. Captures GCLID and sends it via Webhooks.
 * Version: 1.0.0
 * Author: AdsEngineer
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. Add Universal Tracking Snippet to <head>
add_action('wp_head', 'adsengineer_add_snippet');
function adsengineer_add_snippet() {
    // You can make this dynamic via settings later
    // For now, hardcoded or pulled from options
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

// 2. Capture GCLID from Cookie and save to Order Meta
// The snippet saves a cookie '_adsengineer_gclid'
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

// 3. Add Settings Page to input Site ID and Webhook Secret (optional UI)
add_action('admin_menu', 'adsengineer_create_menu');
function adsengineer_create_menu() {
    add_menu_page('AdsEngineer', 'AdsEngineer', 'manage_options', 'adsengineer_settings', 'adsengineer_settings_page');
}

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
                    <td><input type="text" name="adsengineer_site_id" value="<?php echo esc_attr(get_option('adsengineer_site_id')); ?>" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
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
    </div>
    <?php
}

add_action('admin_init', 'adsengineer_register_settings');
function adsengineer_register_settings() {
    register_setting('adsengineer_options', 'adsengineer_site_id');
}
