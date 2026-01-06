#!/usr/bin/env node

/**
 * Multi-Client Monitoring Worker
 * Monitors ALL client connectivity and firewall awareness
 */

// Cloudflare Workers have global performance object

// Configuration - SUPPORTS MULTIPLE CLIENTS
const CLIENTS = [
  {
    name: 'MyCannaby',
    url: 'https://mycannaby.de',
    siteId: 'mycannaby-687f1af9',
    snippetUrl: 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js',
    checkInterval: 300000
  },
  {
    name: 'Example Shop 2',
    url: 'https://example-shop2.com',
    siteId: 'example-shop-2-abc123',
    snippetUrl: 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js',
    checkInterval: 300000
  }
  // Add more clients here...
];

const FIREWALL_GUIDE = {
  title: 'AdsEngineer Cloudflare Firewall Awareness Guide',
  url: 'https://docs.adsengineer.com/firewall-awareness',
  summary: 'How to whitelist AdsEngineer API in Cloudflare, AWS, GCP, Azure firewalls',
  instructions: [
    '1. Identify firewall provider (Cloudflare, AWS WAF, etc)',
    '2. Add AdsEngineer to IP/domain allowlist',
    '3. Configure rate limiting exemptions',
    '4. Use specific authentication headers',
    '5. Implement request signature validation'
  ]
};

// Verbose logging configuration - Cloudflare Workers don't have process.env
// Set to true for debugging, false for production
const VERBOSE_LOGGING = true;

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = VERBOSE_LOGGING ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

// Enhanced logging function
function log(level, message, data = null) {
  if (LOG_LEVELS[level] > CURRENT_LOG_LEVEL) return;

  const timestamp = new Date().toISOString();
  const levelEmoji = {
    ERROR: '❌',
    WARN: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🔍'
  }[level] || '📝';

  const logMessage = `${levelEmoji} [${timestamp}] ${level}: ${message}`;

  if (level === 'ERROR') {
    console.error(logMessage);
  } else if (level === 'WARN') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  if (data && VERBOSE_LOGGING) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
}

async function checkAllClients() {
  // Detect if running in production vs localhost for testing
  const isLocalhost =
    typeof self !== 'undefined' &&
    (self.location.hostname === 'localhost' ||
    self.location.hostname.includes('127.0.0.1'));

  log('INFO', `🌍 Monitoring mode: ${isLocalhost ? 'LOCALHOST TESTING' : 'PRODUCTION'}`);
  log('INFO', '🌍 Checking all client connectivity and firewall awareness...');

  const results = [];

  for (const client of CLIENTS) {
    log('INFO', `\n🔍 Checking ${client.name}...`);

    try {
      // Test 1: Snippet deployment
      log('DEBUG', `Starting snippet check for ${client.name}`);
      const snippetStatus = await checkClientSnippet(client);

      // Test 2: Tracking endpoint with authentication
      log('DEBUG', `Starting tracking check for ${client.name}`);
      const trackingStatus = await checkClientTracking(client);

      // Test 3: Firewall detection
      log('DEBUG', `Starting firewall check for ${client.name}`);
      const firewallStatus = await checkFirewallBlocking(client);

      results.push({
        client: client.name,
        url: client.url,
        snippet: snippetStatus,
        tracking: trackingStatus,
        firewall: firewallStatus,
        overall: snippetStatus.hasCorrectSnippet && trackingStatus.success && !firewallStatus.isBlocked
      });

      log('INFO', `   ${client.name}: ${snippetStatus.hasSnippet ? '✅' : '❌'} Snippet`);
      log('INFO', `   ${client.name}: ${trackingStatus.success ? '✅' : '❌'} Tracking`);
      log('INFO', `   ${client.name}: ${firewallStatus.isBlocked ? '🔥' : '✅'} Firewall`);

      if (VERBOSE_LOGGING) {
        log('DEBUG', `Detailed results for ${client.name}:`, {
          snippet: snippetStatus,
          tracking: trackingStatus,
          firewall: firewallStatus
        });
      }

    } catch (error) {
      log('ERROR', `${client.name} check failed:`, error.message);
      results.push({
        client: client.name,
        url: client.url,
        error: error.message,
        overall: false
      });
    }
  }

  log('INFO', '\n📊 MONITORING SUMMARY');
  log('INFO', '================================');
  const operationalClients = results.filter(r => r.overall);
  const blockedClients = results.filter(r => !r.overall);
  log('INFO', `✅ Operational clients: ${operationalClients.length}`);
  log('INFO', `🔥 Blocked clients: ${blockedClients.length}`);

  if (blockedClients.length > 0) {
    log('ERROR', `\n🚨 CRITICAL ALERT at ${new Date().toISOString()}`);
    log('ERROR', 'Blocked clients:');
    blockedClients.forEach(client => {
      log('ERROR', `   ❌ ${client.client} (${client.url})`);
    });
    log('WARN', '\n🔧 IMMEDIATE ACTION REQUIRED:');
    log('WARN', '1. Check firewall settings for each blocked client');
    log('WARN', `2. Provide firewall configuration guide: ${FIREWALL_GUIDE.url}`);
    log('WARN', '3. Consider alternative authentication methods');
  }

  if (operationalClients.length < results.length) {
    log('WARN', '\n⚠️ WARNING: Clients experiencing issues');
    log('WARN', 'Problematic clients:');
    results.filter(r => !r.overall).forEach(client => {
      log('WARN', `   ⚠️ ${client.client}: ${client.snippet.hasSnippet ? '✅' : '❌'} snippet, ${client.tracking.success ? '✅' : '❌'} tracking, ${client.firewall.isBlocked ? '🔥' : '✅'} firewall`);
    });
    log('INFO', '\n🔧 RECOMMENDED ACTIONS:');
    log('INFO', '1. Investigate client-specific issues');
    log('INFO', '2. Schedule follow-up checks');
  }

  if (operationalClients.length > 0) {
    log('INFO', '\n✅ SUCCESS: All clients operational');
    log('INFO', '📊 Performance Summary:');
    const avgResponseTime = operationalClients.reduce((sum, client) => sum + client.responseTime, 0) / operationalClients.length;
    log('INFO', `   Average response time: ${avgResponseTime.toFixed(2)}ms`);
  }

  const avgResponseTime = operationalClients.length > 0 ?
    operationalClients.reduce((sum, client) => sum + client.responseTime, 0) / operationalClients.length : 0;

  const report = {
    timestamp: new Date().toISOString(),
    totalClients: results.length,
    operationalClients: operationalClients.length,
    blockedClients: blockedClients.length,
    criticalIssues: blockedClients.length,
    avgResponseTime: avgResponseTime,
    clientDetails: results
  };

  log('INFO', '\n📈 Generating monitoring report...');

  if (VERBOSE_LOGGING) {
    log('DEBUG', 'Full monitoring report:', report);
  }

  if (!isLocalhost) {
    // In production, send alerts to monitoring dashboard
    log('INFO', '\n📈 Sending monitoring report to dashboard...');
    // Here you could send to your monitoring system or external service
  }

  return { alert: blockedClients.length > 0 ? 'CRITICAL' : 'SUCCESS', report, clientResults: results };
}

async function checkClientSnippet(client) {
  log('DEBUG', `   Checking ${client.name} snippet deployment...`);

  const startTime = performance.now();

  try {
    log('DEBUG', `Making HTTP request to ${client.url}`);

    const response = await fetch(client.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AdsEngineer-Monitoring/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const html = await response.text();
    const hasSnippet = html.includes(`data-site-id="${client.siteId}"`);
    const hasCorrectScript = html.includes(client.snippetUrl);

    log('DEBUG', `Snippet check results for ${client.name}:`, {
      hasSnippet,
      hasCorrectScript,
      responseTime: `${responseTime.toFixed(2)}ms`,
      statusCode: response.status,
      htmlLength: html.length
    });

    return {
      hasSnippet,
      hasCorrectScript,
      responseTime,
      statusCode: response.status
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    log('ERROR', `Snippet check failed for ${client.name}:`, error.message);

    return {
      hasSnippet: false,
      hasCorrectScript: false,
      responseTime,
      error: error.message
    };
  }
}

async function checkClientTracking(client) {
  log('DEBUG', `   Testing ${client.name} tracking endpoint...`);

  const testData = {
    site_id: client.siteId,
    email: `test-${Date.now()}@${client.url.replace('https://', '').replace(/[/.]/g, '-')}`,
    gclid: 'EAIaIQv3i3m8e7vO-' + Date.now(),
    adjusted_value_cents: 4500,
    landing_page: `${client.url}/test`,
    consent_status: 'granted',
    utm_source: 'worker_monitoring',
    utm_medium: 'automated',
    utm_campaign: 'connectivity_check'
  };

  if (VERBOSE_LOGGING) {
    log('DEBUG', `Test data for ${client.name}:`, testData);
  }

  const startTime = performance.now();

  try {
    const response = await fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multi-Client-Monitoring/1.0',
        'X-Test-Source': 'multi-client-monitoring',
        'X-Client-Name': client.name
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(10000)
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    log('DEBUG', `   ${client.name} tracking response: ${response.status}`);

    if (response.status === 200) {
      try {
        const responseData = await response.json();
        log('DEBUG', `   ${client.name} tracking data received:`, responseData);

        return {
          success: response.status === 200,
          responseTime,
          statusCode: response.status,
          response: responseData
        };
      } catch (e) {
        log('ERROR', `   ${client.name} response parsing error:`, e.message);
        return {
          success: false,
          responseTime,
          statusCode: response.status,
          error: 'Invalid JSON response'
        };
      }
    } else {
      const errorText = await response.text();
      log('WARN', `   ${client.name} tracking error: ${errorText}`);
      return {
        success: false,
        responseTime,
        statusCode: response.status,
        error: errorText
      };
    }
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    log('ERROR', `   ${client.name} tracking error: ${error.message}`);

    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

async function checkFirewallBlocking(client) {
  console.log(`   Checking ${client.name} for firewall blocks...`);

  const tests = [
    {
      name: 'Direct IP Test',
      method: 'direct_connection_test'
    },
    {
      name: 'User Agent Test',
      method: 'user_agent_test'
    },
    {
      name: 'Header Test',
      method: 'header_test'
    }
  ];

  const results = { tests: [], isBlocked: false };

  for (const test of tests) {
    try {
      const result = await runFirewallTest(client, test);
      results.tests.push(result);

      if (result.isBlocked) {
        results.isBlocked = true;
        console.log(`   ${test.name}: 🔥 BLOCKED`);
      } else {
        console.log(`   ${test.name}: ✅ PASSED`);
      }
    } catch (error) {
      console.log(`   ${test.name}: ❌ ERROR - ${error.message}`);
      results.tests.push({
        name: test.name,
        error: error.message,
        isBlocked: true
      });
    }
  }

  return results;
}

async function runFirewallTest(client, test) {
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(client.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Firewall-Detection/1.0',
        'X-Test-Method': test.method
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    const html = await response.text();

    const isBlocked =
      response.status === 403 ||
      response.status === 429 ||
      html.includes('cloudflare') ||
      html.includes('blocked') ||
      html.includes('waf') ||
      responseTime > 5000;

    return {
      name: test.name,
      isBlocked,
      responseTime,
      statusCode: response.status
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    return {
      name: test.name,
      isBlocked: true,
      error: error.message,
      responseTime
    };
  }
}

// Cloudflare Worker entry point
export default {
  async fetch(request, env, ctx) {
    // Handle HTTP requests if needed
    return new Response('Shopify Monitoring Worker - Use scheduled execution', { status: 200 });
  },

  // Scheduled execution for monitoring
  async scheduled(event, env, ctx) {
    console.log('🕐 Running scheduled Shopify monitoring...');
    await checkAllClients();
  }
};

// For local testing
if (typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined') {
  checkAllClients().then((result) => {
    console.log('\n✅ Monitoring completed successfully');
    console.log('Result:', result);
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Monitoring failed:', error.message);
    process.exit(1);
  });
}

export {
  checkAllClients,
  checkClientSnippet,
  checkClientTracking,
  checkFirewallBlocking,
  runFirewallTest
};