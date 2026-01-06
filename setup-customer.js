#!/usr/bin/env node
/**
 * Customer Setup Script
 * 
 * Usage:
 *   node setup-customer.js                        # Interactive mode
 *   node setup-customer.js mycannaby              # From customers/mycannaby.env
 *   node setup-customer.js /path/to/customer.env  # From absolute path
 * 
 * Example .env file:
 *   CUSTOMER_NAME=mycannaby
 *   CUSTOMER_DOMAIN=mycannaby.de
 *   SHOPIFY_DOMAIN=mycannaby.myshopify.com
 *   SHOPIFY_WEBHOOK_SECRET=shpat_xxxxxxxxxxxxx
 *   
 *   # Customer Contact (for setup email)
 *   CUSTOMER_EMAIL=admin@mycannaby.de
 *   
 *   # Google Ads - Primary Conversion
 *   GOOGLE_ADS_CLIENT_ID=mock_client_id
 *   GOOGLE_ADS_CLIENT_SECRET=mock_client_secret
 *   GOOGLE_ADS_DEVELOPER_TOKEN=mock_developer_token
 *   GOOGLE_ADS_CUSTOMER_ID=123-456-7890
 *   GOOGLE_ADS_CONVERSION_ACTION_ID=123456789
 *   
 *   # Google Ads - Secondary (Comparison) Conversion - runs alongside primary
 *   SECONDARY_GOOGLE_ADS_ENABLED=true
 *   SECONDARY_GOOGLE_ADS_CUSTOMER_ID=987-654-3210
 *   SECONDARY_GOOGLE_ADS_CONVERSION_ACTION_ID=987654321
 *   
 *   # GA4 Configuration (Optional - for web analytics comparison)
 *   GA4_ENABLED=true
 *   GA4_MEASUREMENT_ID=G-XXXXXXXXXX
 *   GA4_API_SECRET=mock_api_secret
 *   GA4_DEBUG_MODE=false
 *   
 *   # Conversion Routes - Choose where conversions fire
 *   # Options: google_ads, ga4, both
 *   ROUTE_CONVERSION_PRIMARY=google_ads
 *   ROUTE_CONVERSION_SECONDARY=ga4
 *   
 *   # Attribution Windows
 *   ATTRIBUTION_WINDOW_CLICK=30
 *   ATTRIBUTION_WINDOW_VIEW=1
 *   
 *   # MailerSend Configuration (for setup emails)
 *   MAILERSEND_API_KEY=keyxxxxx.xxxxxx
 *   MAILERSEND_FROM_EMAIL=setup@adsengineer.cloud
 *   MAILERSEND_FROM_NAME=AdsEngineer Setup
 *   MAILERSEND_REPLY_TO=support@adsengineer.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateWebhookSecret() {
  // Shopify format: shpat_ + 32 hex chars
  return 'shpat_' + generateSecret(16);
}

function generateJwtSecret() {
  return 'jwt_' + generateSecret(32);
}

function generateEncryptionKey() {
  return btoa(generateSecret(32));
}

// Base64 encode for env file
function btoa(str) {
  return Buffer.from(str).toString('base64');
}

// Parse .env file
function parseEnvFile(filePath) {
  const config = {};
  const content = fs.readFileSync(filePath, 'utf-8');
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      config[key.trim()] = valueParts.join('=').trim();
    }
  }
  
  return config;
}

// Generate Shopify webhook URL
function getWebhookUrl(customerDomain) {
  return `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook`;
}

// Generate customer-specific subdomain
function getCustomerSubdomain(customerName) {
  return `${customerName}.adsengineer.workers.dev`;
}

async function setupCustomer(configPath) {
  logSection('🚀 Customer Setup Script');
  
  // Load configuration
  let config;
  if (configPath.startsWith('/')) {
    // Absolute path
    if (!fs.existsSync(configPath)) {
      log(`❌ Config file not found: ${configPath}`, 'red');
      process.exit(1);
    }
    config = parseEnvFile(configPath);
    log(`📄 Loaded config from: ${configPath}`, 'green');
  } else {
    // Relative to customers directory
    const customersDir = path.join(__dirname, 'customers');
    const fullPath = path.join(customersDir, configPath.endsWith('.env') ? configPath : `${configPath}.env`);
    
    if (!fs.existsSync(fullPath)) {
      log(`❌ Config file not found: ${fullPath}`, 'red');
      log(`💡 Create it at: ${fullPath}`, 'yellow');
      process.exit(1);
    }
    config = parseEnvFile(fullPath);
    log(`📄 Loaded config from: ${fullPath}`, 'green');
  }
  
  // Extract configuration
  const customerName = config.CUSTOMER_NAME || path.basename(configPath, '.env');
  const customerDomain = config.CUSTOMER_DOMAIN || config.SHOPIFY_DOMAIN?.replace('.myshopify.com', '') || customerName;
  const shopifyDomain = config.SHOPIFY_DOMAIN || `${customerDomain}.myshopify.com`;
  
  logSection(`📋 Customer: ${customerName}`);
  log(`   Domain: ${customerDomain}`);
  log(`   Shopify: ${shopifyDomain}`);
  
  // Generate secrets if not provided
  const secrets = {
    SHOPIFY_WEBHOOK_SECRET: config.SHOPIFY_WEBHOOK_SECRET || generateWebhookSecret(),
    JWT_SECRET: config.JWT_SECRET || generateJwtSecret(),
    BACKUP_ENCRYPTION_KEY: config.BACKUP_ENCRYPTION_KEY || generateEncryptionKey(),
    ENCRYPTION_KEY: config.ENCRYPTION_KEY || generateEncryptionKey(),
  };
  
  logSection('🔐 Generated Secrets');
  log(`   SHOPIFY_WEBHOOK_SECRET=${secrets.SHOPIFY_WEBHOOK_SECRET}`, 'yellow');
  log(`   JWT_SECRET=${secrets.JWT_SECRET.substring(0, 20)}...`, 'yellow');
  log(`   BACKUP_ENCRYPTION_KEY=***hidden***`, 'yellow');
  log(`   ENCRYPTION_KEY=***hidden***`, 'yellow');
  
  // Google Ads Configuration
  const googleAdsConfig = {
    enabled: config.GOOGLE_ADS_ENABLED !== 'false',
    clientId: config.GOOGLE_ADS_CLIENT_ID || 'mock_client_id',
    clientSecret: config.GOOGLE_ADS_CLIENT_SECRET || 'mock_client_secret',
    developerToken: config.GOOGLE_ADS_DEVELOPER_TOKEN || 'mock_developer_token',
    customerId: config.GOOGLE_ADS_CUSTOMER_ID || '000-000-0000',
    conversionActionId: config.GOOGLE_ADS_CONVERSION_ACTION_ID || '000000000',
    // Secondary (comparison) configuration
    secondaryEnabled: config.SECONDARY_GOOGLE_ADS_ENABLED === 'true',
    secondaryCustomerId: config.SECONDARY_GOOGLE_ADS_CUSTOMER_ID || '',
    secondaryConversionActionId: config.SECONDARY_GOOGLE_ADS_CONVERSION_ACTION_ID || '',
  };
  
  // GA4 Configuration
  const ga4Config = {
    enabled: config.GA4_ENABLED === 'true',
    measurementId: config.GA4_MEASUREMENT_ID || '',
    apiSecret: config.GA4_API_SECRET || generateSecret(16),
    debugMode: config.GA4_DEBUG_MODE === 'true',
    // Event settings
    eventName: config.GA4_EVENT_NAME || 'purchase',
    sendAt: config.GA4_SEND_AT || 'immediate', // immediate, server, or both
  };
  
  // MailerSend Configuration (for setup emails)
  const mailerSendConfig = {
    enabled: config.MAILERSEND_ENABLED === 'true' || config.MAILERSEND_API_KEY ? true : false,
    apiKey: config.MAILERSEND_API_KEY || '',
    fromEmail: config.MAILERSEND_FROM_EMAIL || 'setup@adsengineer.cloud',
    fromName: config.MAILERSEND_FROM_NAME || 'AdsEngineer Setup',
    replyTo: config.MAILERSEND_REPLY_TO || config.CUSTOMER_EMAIL || '',
  };
  
  // Customer contact for setup email
  const customerEmail = config.CUSTOMER_EMAIL || '';
  
  // Conversion Routing Configuration
  const routingConfig = {
    primary: config.ROUTE_CONVERSION_PRIMARY || 'google_ads',
    secondary: config.ROUTE_CONVERSION_SECONDARY || 'ga4',
    attributionClickDays: parseInt(config.ATTRIBUTION_WINDOW_CLICK || '30', 10),
    attributionViewDays: parseInt(config.ATTRIBUTION_WINDOW_VIEW || '1', 10),
  };
  
  logSection('📧 MailerSend Configuration');
  if (mailerSendConfig.enabled) {
    log(`   Enabled: Yes`, 'green');
    log(`   From: ${mailerSendConfig.fromName} <${mailerSendConfig.fromEmail}>`, 'green');
    log(`   API Key: ${mailerSendConfig.apiKey.substring(0, 10)}...`, 'yellow');
    if (customerEmail) {
      log(`   Will send setup email to: ${customerEmail}`, 'green');
    } else {
      log(`   No customer email configured`, 'yellow');
    }
  } else {
    log(`   MailerSend: Not configured (emails will not be sent)`, 'yellow');
  }
  
  logSection('📊 Conversion Configuration');
  log(`   Primary Route: ${routingConfig.primary.toUpperCase()}`, 'cyan');
  log(`   Secondary Route: ${routingConfig.secondary.toUpperCase()}`, 'cyan');
  log(`   Attribution Click Window: ${routingConfig.attributionClickDays} days`, 'yellow');
  log(`   Attribution View Window: ${routingConfig.attributionViewDays} days`, 'yellow');
  
  logSection('📊 Google Ads Configuration');
  log(`   Primary Customer ID: ${googleAdsConfig.customerId}`);
  log(`   Primary Conversion Action: ${googleAdsConfig.conversionActionId}`);
  if (googleAdsConfig.secondaryEnabled) {
    log(`   🔄 Secondary Customer ID: ${googleAdsConfig.secondaryCustomerId}`, 'blue');
    log(`   🔄 Secondary Conversion Action: ${googleAdsConfig.secondaryConversionActionId}`, 'blue');
    log(`   Mode: PARALLEL - Both conversions will fire`, 'green');
  } else {
    log(`   Secondary: Not configured`, 'yellow');
  }
  
  logSection('📊 GA4 Configuration');
  if (ga4Config.enabled) {
    log(`   Measurement ID: ${ga4Config.measurementId}`, 'green');
    log(`   API Secret: ${ga4Config.apiSecret.substring(0, 8)}...`, 'green');
    log(`   Event Name: ${ga4Config.eventName}`, 'green');
    log(`   Send Mode: ${ga4Config.sendAt}`, 'green');
  } else {
    log(`   GA4: Not enabled`, 'yellow');
  }
  
  // Database configuration (JSON for D1)
  const agencyConfig = JSON.stringify({
    shopify_domain: shopifyDomain,
    shopify_webhook_secret: secrets.SHOPIFY_WEBHOOK_SECRET,
    google_ads_config: JSON.stringify({
      clientId: googleAdsConfig.clientId,
      clientSecret: googleAdsConfig.clientSecret,
      developerToken: googleAdsConfig.developerToken,
      customerId: googleAdsConfig.customerId,
      conversionActionId: googleAdsConfig.conversionActionId,
    }),
    // Include secondary config for parallel conversions
    secondary_google_ads_config: googleAdsConfig.secondaryEnabled ? JSON.stringify({
      customerId: googleAdsConfig.secondaryCustomerId,
      conversionActionId: googleAdsConfig.secondaryConversionActionId,
    }) : null,
    // GA4 config
    ga4_config: ga4Config.enabled ? JSON.stringify({
      measurementId: ga4Config.measurementId,
      apiSecret: ga4Config.apiSecret,
      eventName: ga4Config.eventName,
    }) : null,
    // Routing config
    conversion_tracking_mode: googleAdsConfig.secondaryEnabled ? 'parallel' : 'primary_only',
    route_primary: routingConfig.primary,
    route_secondary: routingConfig.secondary,
    attribution_click_days: routingConfig.attributionClickDays,
    attribution_view_days: routingConfig.attributionViewDays,
  });
  
  // ============================================================================
  // Send Setup Email via MailerSend
  // ============================================================================
  
  async function sendSetupEmail() {
    if (!mailerSendConfig.enabled || !customerEmail) {
      log('\n📧 Skipping email (MailerSend not configured or no customer email)', 'yellow');
      return { sent: false, reason: 'not_configured' };
    }
    
    log('\n📧 Generating setup email...', 'cyan');
    
    const webhookUrl = getWebhookUrl(customerDomain);
    const setupToken = Buffer.from(`${customerName}:${Date.now()}`).toString('base64');
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdsEngineer Setup Instructions</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-top: 0;">🚀 AdsEngineer Setup Complete!</h1>
    
    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
      Hi there! Your <strong>${customerName}</strong> account has been configured.
      Here's what you need to do to get started:
    </p>
    
    <div style="background: #f0f7ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #0066cc; margin-top: 0;">📋 Your Webhook URL</h3>
      <code style="background: #e6f2ff; padding: 8px 12px; border-radius: 4px; display: block; word-break: break-all; font-size: 14px;">
        ${webhookUrl}
      </code>
    </div>
    
    <h2 style="color: #1a1a1a; font-size: 18px;">🔧 Step 1: Configure Shopify Webhooks</h2>
    
    <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
      Run these commands in your Shopify store's terminal to register webhooks:
    </p>
    
    <pre style="background: #1a1a1a; color: #00ff00; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
# Install Shopify CLI if you haven't already
npm install -g @shopify/cli

# Login to your store
shopify auth login

# Register webhooks
shopify webhooks create --topic=orders/create --address=${webhookUrl} --api-version=2024-01
shopify webhooks create --topic=orders/paid --address=${webhookUrl} --api-version=2024-01
shopify webhooks create --topic=customers/create --address=${webhookUrl} --api-version=2024-01</pre>
    
    <h2 style="color: #1a1a1a; font-size: 18px;">📝 Step 2: Add GCLID Tracking Script</h2>
    
    <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
      Add this to your Shopify theme's <code>theme.liquid</code> before <code>&lt;/head&gt;</code>:
    </p>
    
    <pre style="background: #1a1a1a; color: #00ff00; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
&lt;script&gt;
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');
  if (gclid) {
    localStorage.setItem('adsengineer_gclid', gclid);
    if (window.Shopify && Shopify.checkout) {
      const existing = Shopify.checkout.noteAttributes?.find(a => a.name === 'gclid');
      if (!existing && Shopify.checkout.noteAttributes) {
        Shopify.checkout.noteAttributes.push({ name: 'gclid', value: gclid });
      }
    }
  }
})();
&lt;/script&gt;</pre>
    
    <h2 style="color: #1a1a1a; font-size: 18px;">📊 Conversion Tracking</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
      <tr style="background: #f5f5f5;">
        <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>Primary Route</strong></td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${routingConfig.primary.toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>Secondary Route</strong></td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${routingConfig.secondary.toUpperCase()}</td>
      </tr>
      ${googleAdsConfig.secondaryEnabled ? `
      <tr style="background: #e6ffe6;">
        <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>Mode</strong></td>
        <td style="padding: 8px; border: 1px solid #e0e0e0; color: #006600;">🔄 PARALLEL (Comparison)</td>
      </tr>
      ` : ''}
      ${ga4Config.enabled ? `
      <tr style="background: #fff0e6;">
        <td style="padding: 8px; border: 1px solid #e0e0e0;"><strong>GA4 Measurement ID</strong></td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${ga4Config.measurementId}</td>
      </tr>
      ` : ''}
    </table>
    
    <h2 style="color: #1a1a1a; font-size: 18px;">🧪 Test Your Setup</h2>
    
    <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
      Send a test webhook to verify everything works:
    </p>
    
    <pre style="background: #1a1a1a; color: #00ff00; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px;">
curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Shopify-Shop-Domain: ${shopifyDomain}" \\
  -H "X-Shopify-Topic: orders/create" \\
  -d '{
    "id": 1234567890,
    "email": "test@${customerDomain}",
    "created_at": "'$(date -Iseconds)'",
    "total_price": "99.00",
    "currency": "EUR",
    "customer": {"id": 1, "email": "test@${customerDomain}"},
    "note_attributes": [{"name": "gclid", "value": "GCLID_TestDemo12345678901234567890"}]
  }'</pre>
    
    <div style="background: #fff3cd; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h4 style="color: #856404; margin-top: 0;">⚠️ Important Notes</h4>
      <ul style="color: #856404; font-size: 14px; margin: 0; padding-left: 20px;">
        <li>Replace mock credentials with real Google Ads API credentials</li>
        <li>GA4 events will be sent to ${ga4Config.enabled ? ga4Config.measurementId : 'your GA4 property'}</li>
        <li>Secondary conversions run in parallel for comparison</li>
        <li>GCLIDs are hashed for privacy compliance</li>
      </ul>
    </div>
    
    <p style="color: #888; font-size: 12px; margin-top: 32px; text-align: center;">
      Questions? Reply to this email or open a GitHub issue.<br>
      AdsEngineer - Enterprise Conversion Tracking
    </p>
  </div>
</body>
</html>
`;
    
    const emailText = `
AdsEngineer Setup Complete - ${customerName}

Hi there!

Your ${customerName} account has been configured. Here's what you need to do:

1. CONFIGURE SHOPIFY WEBHOOKS
   URL: ${webhookUrl}
   
   Run these commands:
   shopify webhooks create --topic=orders/create --address=${webhookUrl}
   shopify webhooks create --topic=orders/paid --address=${webhookUrl}
   shopify webhooks create --topic=customers/create --address=${webhookUrl}

2. ADD GCLID TRACKING SCRIPT
   Add to theme.liquid before </head>:
   <script>
   (function() {
     const urlParams = new URLSearchParams(window.location.search);
     const gclid = urlParams.get('gclid');
     if (gclid) {
       localStorage.setItem('adsengineer_gclid', gclid);
     }
   })();
   </script>

3. CONVERSION ROUTING
   Primary: ${routingConfig.primary.toUpperCase()}
   Secondary: ${routingConfig.secondary.toUpperCase()}
   ${googleAdsConfig.secondaryEnabled ? 'Mode: PARALLEL (Comparison)' : ''}
   ${ga4Config.enabled ? `GA4: ${ga4Config.measurementId}` : ''}

4. TEST YOUR SETUP
   curl -X POST ${webhookUrl} \\
     -H "Content-Type: application/json" \\
     -H "X-Shopify-Shop-Domain: ${shopifyDomain}" \\
     -d '{"id": 123, "email": "test@${customerDomain}", "created_at": "2024-01-01T00:00:00Z", "total_price": "99.00", "currency": "EUR", "customer": {"id": 1, "email": "test@${customerDomain}"}}'

Questions? Reply to this email.

- AdsEngineer Team
`;
    
    // Generate the email payload for the Worker to send via MailerSend
    const emailPayload = {
      to: [{ email: customerEmail, name: customerName }],
      from: {
        email: mailerSendConfig.fromEmail,
        name: mailerSendConfig.fromName,
      },
      subject: `🚀 AdsEngineer Setup Complete - ${customerName}`,
      html: emailHtml,
      text: emailText,
      reply_to: mailerSendConfig.replyTo ? { email: mailerSendConfig.replyTo } : undefined,
      custom_args: {
        customerName,
        setupToken,
      },
    };
    
    // Return email data for Worker to send
    return {
      sent: true,
      provider: 'mailersend',
      payload: emailPayload,
      workerEndpoint: '/api/v1/admin/send-setup-email',
    };
  }
  
  // Send the email
  const emailResult = await sendSetupEmail();
  
  logSection('🗄️ Database Configuration');
  log(`   Agency Config (JSON):`, 'cyan');
  console.log('   ' + agencyConfig.substring(0, 100).replace(/\n/g, '\n   ') + '...');
  
  // Generate SQL for manual execution
  const sql = `-- ============================================================================
-- Customer Setup SQL for ${customerName}
-- Run this in D1 Console or via wrangler d1 execute
-- ============================================================================

-- Insert or update agency
INSERT INTO agencies (id, name, config, created_at, updated_at)
VALUES (
  '${customerName}-${Date.now().toString(36)}',
  '${customerName}',
  '${agencyConfig.replace(/'/g, "''")}',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  config = excluded.config,
  updated_at = datetime('now');

-- Verify insertion
SELECT id, name, json_extract(config, '$.shopify_domain') as shopify_domain,
       json_extract(config, '$.google_ads_config') as google_ads_config
FROM agencies WHERE name = '${customerName}';
`;
  
  logSection('📝 Database SQL (D1)');
  console.log(sql);
  
  // Write SQL to file
  const sqlPath = path.join(__dirname, 'customers', `${customerName}-setup.sql`);
  fs.writeFileSync(sqlPath, sql);
  log(`💾 SQL saved to: ${sqlPath}`, 'green');
  
  // Generate .env.prod file for secrets
  const envProdContent = `# ============================================================================
# Production Environment - ${customerName}
# Generated by setup-customer.js
# ============================================================================

# Customer
CUSTOMER_NAME=${customerName}
CUSTOMER_DOMAIN=${customerDomain}
CUSTOMER_EMAIL=${customerEmail}

# Shopify
SHOPIFY_WEBHOOK_SECRET=${secrets.SHOPIFY_WEBHOOK_SECRET}

# JWT
JWT_SECRET=${secrets.JWT_SECRET}

# Encryption
BACKUP_ENCRYPTION_KEY=${secrets.BACKUP_ENCRYPTION_KEY}
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}

# Google Ads - Primary
GOOGLE_ADS_CLIENT_ID=${googleAdsConfig.clientId}
GOOGLE_ADS_CLIENT_SECRET=${googleAdsConfig.clientSecret}
GOOGLE_ADS_DEVELOPER_TOKEN=${googleAdsConfig.developerToken}
GOOGLE_ADS_CUSTOMER_ID=${googleAdsConfig.customerId}
GOOGLE_ADS_CONVERSION_ACTION_ID=${googleAdsConfig.conversionActionId}

# Google Ads - Secondary (Parallel Comparison)
SECONDARY_GOOGLE_ADS_ENABLED=${googleAdsConfig.secondaryEnabled}
SECONDARY_GOOGLE_ADS_CUSTOMER_ID=${googleAdsConfig.secondaryCustomerId}
SECONDARY_GOOGLE_ADS_CONVERSION_ACTION_ID=${googleAdsConfig.secondaryConversionActionId}

# GA4 Configuration
GA4_ENABLED=${ga4Config.enabled}
GA4_MEASUREMENT_ID=${ga4Config.measurementId}
GA4_API_SECRET=${ga4Config.apiSecret}
GA4_DEBUG_MODE=${ga4Config.debugMode}
GA4_EVENT_NAME=${ga4Config.eventName}

# Conversion Routing Mode
# Options: primary_only, parallel, secondary_only
CONVERSION_TRACKING_MODE=${googleAdsConfig.secondaryEnabled ? 'parallel' : 'primary_only'}
ROUTE_CONVERSION_PRIMARY=${routingConfig.primary}
ROUTE_CONVERSION_SECONDARY=${routingConfig.secondary}
ATTRIBUTION_WINDOW_CLICK=${routingConfig.attributionClickDays}
ATTRIBUTION_WINDOW_VIEW=${routingConfig.attributionViewDays}

# SendGrid (for setup emails) - DEPRECATED, use MailerSend
SENDGRID_ENABLED=false
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=
SENDGRID_REPLY_TO=

# MailerSend (for setup emails)
MAILERSEND_ENABLED=${mailerSendConfig.enabled}
MAILERSEND_API_KEY=${mailerSendConfig.apiKey}
MAILERSEND_FROM_EMAIL=${mailerSendConfig.fromEmail}
MAILERSEND_FROM_NAME=${mailerSendConfig.fromName}
MAILERSEND_REPLY_TO=${mailerSendConfig.replyTo}
`;
  
  const envProdPath = path.join(__dirname, 'customers', `.env.${customerName}.prod`);
  fs.writeFileSync(envProdPath, envProdContent);
  log(`💾 Production env saved to: ${envProdPath}`, 'green');
  
  // Shopify Webhook Configuration
  logSection('🛒 Shopify Webhook Setup');
  log(`   URL: ${getWebhookUrl(customerDomain)}`, 'cyan');
  log(`   Topics:`, 'cyan');
  log(`   - customers/create`, 'yellow');
  log(`   - customers/update`, 'yellow');
  log(`   - orders/create`, 'yellow');
  log(`   - orders/paid`, 'yellow');
  
  // Shopify CLI command
  const shopifyWebhookCmd = `# Shopify CLI Command to register webhooks
shopify webhooks create \
  --topic=orders/create \
  --address=${getWebhookUrl(customerDomain)} \
  --api-version=2024-01

shopify webhooks create \
  --topic=orders/paid \
  --address=${getWebhookUrl(customerDomain)} \
  --api-version=2024-01

shopify webhooks create \
  --topic=customers/create \
  --address=${getWebhookUrl(customerDomain)} \
  --api-version=2024-01
`;
  
  logSection('🔧 Shopify CLI Commands');
  console.log(shopifyWebhookCmd);
  
  // JavaScript Snippet for GCLID Capture
  const gclidSnippet = `<!-- 
  Add this to Shopify theme.liquid or checkout.liquid 
  before closing </head> tag
-->
<script>
(function() {
  // Capture GCLID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');
  
  if (gclid) {
    // Store in localStorage for persistence
    localStorage.setItem('adsengineer_gclid', gclid);
    
    // Add to checkout note attributes when available
    if (window.Shopify && Shopify.checkout) {
      addGclidToCheckout(gclid);
    }
    
    // Listen for checkout initialization
    document.addEventListener('shopify:checkout', function() {
      addGclidToCheckout(gclid);
    });
  }
  
  function addGclidToCheckout(gclid) {
    // Try multiple methods to add GCLID to checkout
    if (typeof Shopify !== 'undefined' && Shopify.checkout) {
      // Method 1: Add to noteAttributes
      if (Shopify.checkout.noteAttributes) {
        const existing = Shopify.checkout.noteAttributes.find(a => a.name === 'gclid');
        if (!existing) {
          Shopify.checkout.noteAttributes.push({ name: 'gclid', value: gclid });
        }
      }
    }
    
    // Method 2: Store in additionalData for API
    if (window.additionalData && typeof additionalData === 'function') {
      additionalData({ gclid: gclid });
    }
  }
  
  // Also capture FBCLID and MSCLKID
  const fbclid = urlParams.get('fbclid');
  const msclkid = urlParams.get('msclkid');
  
  if (fbclid) localStorage.setItem('adsengineer_fbclid', fbclid);
  if (msclkid) localStorage.setItem('adsengineer_msclkid', msclkid);
})();
</script>
`;
  
  logSection('📋 GCLID Capture Snippet (Add to Shopify Theme)');
  console.log(gclidSnippet);
  
  // Conversion Tracking Flow Diagram
  logSection('🔄 Conversion Flow (Parallel Mode)');
  console.log(`
  Shopify Order
       │
       ▼
  ┌─────────────────────────────────────┐
  │  AdsEngineer Webhook Handler        │
  │  • Extract GCLID/FBCLID             │
  │  • Hash GCLID for storage           │
  │  • Create lead record               │
  └─────────────────────────────────────┘
       │
       ├── Primary Conversion ───────────────────┐
       │   Customer ID: ${googleAdsConfig.customerId.padEnd(15)} │
       │   Conversion ID: ${googleAdsConfig.conversionActionId.padEnd(10)} │
       │   Google Ads API → Attribution          │
       ▼                                          ▼
  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
  │  Primary Conversion Result      │    │  Secondary Conversion (Parallel)│
  │  • Conversion credited          │    │  Customer ID: ${googleAdsConfig.secondaryCustomerId || 'Not Configured'.padEnd(15)} │
  │  • ROI calculated               │    │  Conversion ID: ${googleAdsConfig.secondaryConversionActionId || 'N/A'.padEnd(10)} │
  └─────────────────────────────────┘    │  • Compare attribution          │
                                         │  • Validate primary accuracy    │
                                         └─────────────────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────────┐
                                    │  Comparison Report      │
                                    │  • Delta between both    │
                                    │  • Attribution insights  │
                                    └─────────────────────────┘
  `);
  
  // Summary
  logSection('✅ Setup Complete');
  log(`   Customer: ${customerName}`, 'green');
  log(`   Domain: ${customerDomain}`, 'green');
  log(`   Shopify: ${shopifyDomain}`, 'green');
  log(`   Webhook URL: ${getWebhookUrl(customerDomain)}`, 'green');
  log(`   Primary Conversion: ${googleAdsConfig.conversionActionId}`, 'green');
  if (googleAdsConfig.secondaryEnabled) {
    log(`   Secondary Conversion: ${googleAdsConfig.secondaryConversionActionId}`, 'blue');
    log(`   Mode: PARALLEL (comparison mode)`, 'blue');
  }
  if (ga4Config.enabled) {
    log(`   GA4: ${ga4Config.measurementId}`, 'cyan');
  }
  if (mailerSendConfig.enabled && customerEmail) {
    log(`   📧 Setup email will be sent to: ${customerEmail}`, 'magenta');
  }
  
  log('\n📁 Generated Files:', 'cyan');
  console.log(`   - ${sqlPath}`);
  console.log(`   - ${envProdPath}`);
  
  log('\n⚠️  Next Steps:', 'yellow');
  console.log(`   1. Run SQL in D1: wrangler d1 execute adsengineer --file=${sqlPath}`);
  console.log(`   2. Add secrets to Doppler or .env.prod`);
  console.log(`   3. Deploy: cd serverless && pnpm deploy`);
  console.log(`   4. Configure Shopify webhooks (see commands above)`);
  console.log(`   5. Add GCLID snippet to Shopify theme`);
  if (mailerSendConfig.enabled && customerEmail) {
    console.log(`   6. Send setup email:`);
    console.log(`      curl -X POST https://adsengineer-cloud.adsengineer.workers.dev/api/v1/admin/send-setup-email \\`);
    console.log(`        -H "Authorization: Bearer <admin_token>" \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '${JSON.stringify(emailResult.payload).substring(0, 80)}...'`);
  }
  
  // Save email payload for worker API
  if (emailResult.sent) {
    const emailPayloadPath = path.join(__dirname, 'customers', `${customerName}-email-payload.json`);
    fs.writeFileSync(emailPayloadPath, JSON.stringify(emailResult.payload, null, 2));
    log(`\n📧 Email payload saved to: ${emailPayloadPath}`, 'magenta');
    log(`   Send via Worker API: POST /api/v1/admin/send-setup-email`, 'magenta');
  }
  
  return {
    customerName,
    customerDomain,
    shopifyDomain,
    secrets,
    googleAdsConfig,
    sqlPath,
    envProdPath,
  };
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`
🏪 Customer Setup Script
========================

Usage:
  node setup-customer.js <customer_config>

Arguments:
  <customer_config>  Customer name (looks in customers/) or path to .env file

Examples:
  node setup-customer.js mycannaby                    # Uses customers/mycannaby.env
  node setup-customer.js /path/to/mycustomer.env     # Uses absolute path

Interactive Mode (no args):
  Creates a new customer config interactively

Output Files:
  - customers/<name>-setup.sql    # SQL for D1 database
  - customers/.env.<name>.prod    # Production environment file
`);
  process.exit(0);
}

const configPath = args[0];
setupCustomer(configPath).catch(err => {
  log(`❌ Error: ${err.message}`, 'red');
  process.exit(1);
});
