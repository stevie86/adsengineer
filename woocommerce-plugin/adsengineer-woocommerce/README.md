# AdsEngineer WooCommerce Plugin

Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking with AdsEngineer.

## Features

- Automatic order tracking when orders are created or status changes
- GCLID capture from order metadata (Google Ads click IDs)
- Real-time webhook processing to AdsEngineer API
- WordPress admin settings page for configuration

## Installation

1. Download the plugin ZIP file from your AdsEngineer dashboard
2. In WordPress admin, go to **Plugins > Add New > Upload Plugin**
3. Upload the `adsengineer-woocommerce.zip` file
4. Activate the plugin

## Configuration

1. Go to **Settings > AdsEngineer** in WordPress admin
2. Enter your AdsEngineer webhook URL (or leave empty for default)
3. Save settings

## GCLID Capture Setup

To capture Google Ads click IDs, add this code to your theme's `functions.php` or use a custom plugin:

```php
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
```

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