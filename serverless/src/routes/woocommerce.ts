import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { webhookRateLimit } from '../middleware/rate-limit';
import { Logger } from '../services/logging';
import type { AppEnv } from '../types';
import { hashGCLID } from '../utils/gclid';
import { generateWooCommercePluginZip } from '../services/woocommerce-zip';

export const woocommerceRoutes = new Hono<AppEnv>();

async function validateWooCommerceSignature(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const bodyData = encoder.encode(body);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedSignature = btoa(String.fromCharCode(...signatureArray));

  return calculatedSignature === signature;
}

woocommerceRoutes.get('/info', async (c) => {
  const host = c.req.header('Host') || 'localhost';
  const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  return c.json({
    success: true,
    message: 'Plugin information retrieved successfully',
    host,
    protocol,
    endpoints: {
      info: `${baseUrl}/api/v1/woocommerce/info`,
      download: `${baseUrl}/api/v1/woocommerce/download`,
      zip: `${baseUrl}/api/v1/woocommerce/zip`,
      webhook: `${baseUrl}/api/v1/woocommerce/webhook`,
    },
    plugin: {
      name: 'AdsEngineer WooCommerce Plugin',
      version: '1.0.0',
      description: 'WooCommerce plugin for offline conversion tracking',
      features: [
        'Automatic order tracking',
        'GCLID capture from order metadata',
        'Real-time webhook processing',
        'Settings page for custom webhook URL',
      ],
    },
  });
});

woocommerceRoutes.get('/download', async (c) => {
  const host = c.req.header('Host') || 'localhost';
  const protocol = c.req.header('X-Forwarded-Proto') || c.req.header('x-forwarded-proto') || 'http';
  const apiUrl = `${protocol}://${host}/api/v1/woocommerce/webhook`;

  const WOOCOMMERCE_PLUGIN_PHP = `<?php
/**
 * Plugin Name: AdsEngineer Conversion Tracking for WooCommerce
 * Plugin URI: ${apiUrl}
 * Description: Automatically tracks WooCommerce orders and captures Google Click IDs for offline conversion tracking.
 * Version: 1.0.0
 * Author: AdsEngineer
 * License: GPL v2 or later
 * Text Domain: adsengineer-woocommerce
 * Domain Path: languages
 */

if (!defined('ABSPATH')) {
  exit;
}

class AdsEngineer_WooCommerce {
  public function __construct() {
    add_action('plugins_loaded', array($this, 'init'));
  }

  public function init() {
    $this->add_webhook_handler();
  }

  private function add_webhook_handler() {
    $site_url = get_site_url();

    $webhook_url = $this->get_webhook_url($site_url);

    if (empty($webhook_url)) {
      error_log('AdsEngineer: Webhook URL not configured. Please configure plugin in your AdsEngineer dashboard.');
      return;
    }

    add_action('woocommerce_order_status_changed', array($this, 'handle_order_status_change'), 10, 2);
    add_action('woocommerce_new_order', array($this, 'handle_new_order'), 10, 2);

    error_log('AdsEngineer: Webhook handler initialized. Webhook URL: ' . $webhook_url);
  }

  private function get_webhook_url($site_url) {
    $domain = parse_url($site_url, PHP_URL_HOST);

    $webhook_url = get_option('adsengineer_webhook_url');
    if (empty($webhook_url)) {
      $webhook_url = '${apiUrl}';
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

    $meta_data = $order->get_meta_data();
    if (!empty($meta_data)) {
      $gclid = null;
      foreach ($meta_data as $meta) {
        if (isset($meta['key']) && ($meta['key'] === '_gclid' || $meta['key'] === 'gclid')) {
          $gclid = $meta['value'];
          break;
        }
      }

      if (!empty($gclid)) {
        $data['meta_data'][] = array('key' => '_gclid', 'value' => $gclid);
      }
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
      }
    }
  }

  public function add_settings_menu() {
    add_options_page('adsengineer', 'AdsEngineer Settings', 'manage_options', array($this, 'render_settings_page'));
  }

  public function render_settings_page() {
    ?>
    <div class="wrap">
      <h1>AdsEngineer for WooCommerce</h1>
      <form method="post" action="options.php">
        <table class="form-table">
          <tr>
            <th scope="row">Webhook URL</th>
            <td><input type="text" name="adsengineer_webhook_url" value="<?php echo esc_attr(get_option('adsengineer_webhook_url')); ?>" class="regular-text" /></td>
          </tr>
        </table>
        <?php submit_button('Save Settings'); ?>
      </form>
      <p><strong>Default webhook URL:</strong> ${apiUrl}</p>
      <p><strong>Your site URL:</strong> <?php echo esc_html(get_site_url()); ?></p>
    </div>
    <?php
  }

  public function register_settings() {
    register_setting('adsengineer', 'adsengineer_webhook_url', 'Webhook URL', 'adsengineer_woocommerce', 'render_webhook_url_field');
  }

  public function render_webhook_url_field() {
    $value = get_option('adsengineer_webhook_url');
    ?>
    <input type="text" name="adsengineer_webhook_url" value="<?php echo esc_attr($value); ?>" class="regular-text" />
    <p class="description">Custom webhook URL (leave empty for default)</p>
    <?php
  }
}

new AdsEngineer_WooCommerce();
`;

  c.header('Content-Type', 'application/x-php');
  c.header('Content-Disposition', `attachment; filename="adsengineer-woocommerce-plugin.php"`);

  return c.body(WOOCOMMERCE_PLUGIN_PHP);
});

woocommerceRoutes.get('/zip', async (c) => {
  try {
    const zipBuffer = await generateWooCommercePluginZip();

    c.header('Content-Type', 'application/zip');
    c.header('Content-Disposition', 'attachment; filename="adsengineer-woocommerce-plugin.zip"');
    c.header('Content-Length', zipBuffer.byteLength.toString());

    return c.body(zipBuffer);
  } catch (error) {
    console.error('Failed to generate ZIP:', error);
    return c.json(
      { 
        success: false, 
        error: 'Failed to generate plugin ZIP file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
});

woocommerceRoutes.post('/webhook', webhookRateLimit, async (c) => {
  const signature = c.req.header('x-wc-webhook-signature');
  const source = c.req.header('x-wc-webhook-source');

  if (!signature || !source) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  const rawBody = await c.req.text();
  const db = c.env.DB;

  let domain = source;
  try {
    const url = new URL(source);
    domain = url.hostname;
  } catch (e) {
    // Keep as is
  }

  const agencies = await db.prepare('SELECT id, config FROM agencies').all();
  let matchedAgency: any = null;
  let webhookSecret = '';

  for (const agency of agencies.results) {
    try {
      const config = typeof agency.config === 'string' ? JSON.parse(agency.config) : agency.config;
      if (
        config.woocommerce_domain === domain ||
        (config.woocommerce_url && config.woocommerce_url.includes(domain))
      ) {
        matchedAgency = agency;
        webhookSecret = config.woocommerce_webhook_secret;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!matchedAgency || !webhookSecret) {
    Logger.logWebhookFailure(c, source || 'Unknown domain', 'Missing webhook headers');
    return c.json({ error: 'Site not configured' }, 404);
  }

  const isValid = await validateWooCommerceSignature(webhookSecret, rawBody, signature);
  if (!isValid) {
    Logger.logWebhookFailure(c, source || 'Unknown domain', 'Invalid signature');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch (e) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  Logger.logWebhookSuccess(
    c,
    'WooCommerce',
    `orderId: ${order.id}, status: ${order.status}, domain: ${domain}`
  );

  let gclid = null;
  if (order.meta_data && Array.isArray(order.meta_data)) {
    const gclidMeta = order.meta_data.find((m: any) => m.key === '_gclid' || m.key === 'gclid');
    if (gclidMeta) {
      gclid = gclidMeta.value;
    }
  }

  const gclidHash = gclid ? await hashGCLID(gclid) : null;

  try {
    const leadData = {
      org_id: matchedAgency.id,
      site_id: domain,
      email: order.billing.email,
      phone: order.billing.phone || null,
      gclid_hash: gclidHash,
      value_cents: Math.round(parseFloat(order.total) * 100),
      currency: order.currency,
      status: order.status === 'completed' || order.status === 'processing' ? 'won' : 'new',
      vertical: 'ecommerce',
      metadata: JSON.stringify({
        source: 'woocommerce',
        order_id: order.id,
        raw_gclid: gclid,
      }),
    };

    const result = await db
      .prepare(`
      INSERT INTO leads (
        id, org_id, site_id, email, phone, gclid_hash,
        base_value_cents, status, vertical, metadata, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)
      .bind(
        crypto.randomUUID(),
        leadData.org_id,
        leadData.site_id,
        leadData.email,
        leadData.phone,
        leadData.gclid_hash,
        leadData.value_cents,
        leadData.status,
        leadData.vertical,
        leadData.metadata,
        new Date().toISOString()
      )
      .run();

    if (gclid) {
      Logger.logWebhookSuccess(
        c,
        'WooCommerce',
        `orderId: ${order.id}, status: ${order.status}, domain: ${domain}, gclid: ${gclid.substring(0, 10)}...`
      );
    }

    return c.json({ success: true, lead_id: result.meta.last_row_id });
  } catch (error) {
    Logger.logPayloadError(
      c,
      'WooCommerce',
      'Processing WooCommerce Order',
      `Failed to store WooCommerce lead: ${error}`,
      `Error details: ${error}`
    );
    return c.json({ error: 'Internal processing failed' }, 500);
  }
});
