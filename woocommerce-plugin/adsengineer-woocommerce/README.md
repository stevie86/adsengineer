# AdsEngineer WooCommerce Plugin

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
3. Upload the `adsengineer-woocommerce.zip` file
4. Activate the plugin

## Configuration

1. Go to **Settings > AdsEngineer** in WordPress admin
2. Enter your **Site ID** (get from your AdsEngineer dashboard)
3. Enter your **Webhook URL** (or leave empty for default)
4. Click **Save Settings**

That's it! The plugin will automatically:
- Inject AdsEngineer tracking snippet on all pages
- Capture GCLIDs and UTM parameters from visitors
- Send order data with attribution to AdsEngineer

## How It Works

The plugin handles everything automatically:

1. **Tracking Snippet**: Automatically injects `snippet.js` on all pages of your site
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
