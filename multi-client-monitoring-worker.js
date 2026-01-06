#!/usr/bin/env node

/**
 * Multi-Client Monitoring Worker
 * Monitors ALL client connectivity and firewall awareness
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration - SUPPORTS MULTIPLE CLIENTS
const CLIENTS = [
  {
    name: 'MyCannaby',
    url: 'https://mycannaby.de',
    siteId: 'mycannaby-687f1af9',
    snippetUrl: 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js',
    checkInterval: 300000 // 5 minutes
  },
  {
    name: 'Example Shop 2',
    url: 'https://example-shop2.com',
    siteId: 'example-shop-2-abc123',
    snippetUrl: 'https://adsengineer-cloud.adsengineer.workers.dev/snippet.js',
    checkInterval: 300000
  },
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

async function checkAllClients() {
  // Detect if running in production vs localhost for testing
  const isLocalhost = 
    typeof self !== 'undefined' && 
    (self.location.hostname === 'localhost' || 
    self.location.hostname.includes('127.0.0.1'));
  
  console.log(`🌍 Monitoring mode: ${isLocalhost ? 'LOCALHOST TESTING' : 'PRODUCTION'}`);
  console.log('🌍 Checking all client connectivity and firewall awareness...');
  
  const results = [];
  
  for (const client of CLIENTS) {
    console.log(`\n🔍 Checking ${client.name}...`);
    
    try {
      // Test 1: Snippet deployment
      const snippetStatus = await checkClientSnippet(client);
      
      // Test 2: Tracking endpoint with authentication
      const trackingStatus = await checkClientTracking(client);
      
      // Test 3: Firewall detection
      const firewallStatus = await checkFirewallBlocking(client);
      
      results.push({
        client: client.name,
        url: client.url,
        snippet: snippetStatus,
        tracking: trackingStatus,
        firewall: firewallStatus,
        overall: snippetStatus.hasCorrectSnippet && trackingStatus.success && !firewallStatus.isBlocked
      });
      
      console.log(`   ${client.name}: ${snippetStatus.hasSnippet ? '✅' : '❌'} Snippet`);
      console.log(`   ${client.name}: ${trackingStatus.success ? '✅' : '❌'} Tracking`);
      console.log(`   ${client.name}: ${firewallStatus.isBlocked ? '🔥' : '✅'} Firewall`);
      
    } catch (error) {
      console.error(`❌ ${client.name} check failed:`, error.message);
      results.push({
        client: client.name,
        url: client.url,
        error: error.message,
        overall: false
      });
    }
  }
  
  return results;
}

async function checkClientSnippet(client) {
  console.log(`   Checking ${client.name} snippet deployment...`);
  
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = https.get(client.url, (res) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let html = '';
      res.on('data', (chunk) => {
        html += chunk;
      });
      
      res.on('end', () => {
        const hasSnippet = html.includes(`data-site-id="${client.siteId}"`);
        const hasCorrectScript = html.includes(client.snippetUrl);
        
        resolve({
          hasSnippet,
          hasCorrectScript,
          responseTime,
          statusCode: res.statusCode
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        hasSnippet: false,
        hasCorrectScript: false,
        responseTime,
        error: err.message
      });
    });
    
    req.setTimeout(15000);
    req.end();
  });
}

async function checkClientTracking(client) {
  console.log(`   Testing ${client.name} tracking endpoint...`);
  
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
  
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'adsengineer-cloud.adsengineer.workers.dev',
      port: 443,
      path: '/api/v1/leads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Multi-Client-Monitor/1.0',
        'X-Test-Source': 'multi-client-monitoring',
        'X-Client-Name': client.name
      }
    };
    
    const req = https.request(options, (res) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`   ${client.name} tracking response: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            console.log(`   ${client.name} tracking data received:`, response);
            
            const hasLeads = response.data && response.data.some(lead => 
              lead.email === `test-${Date.now()}@${client.url.replace('https://', '').replace(/[/.]/g, '-')}`
            );
            
            resolve({
              success: res.statusCode === 200,
              responseTime,
              statusCode: res.statusCode,
              response
            });
          } catch (e) {
            console.log(`   ${client.name} response parsing error:`, e.message);
            resolve({
              success: false,
              responseTime,
              statusCode: res.statusCode,
              error: 'Invalid JSON response'
            });
          }
        } else {
          console.log(`   ${client.name} tracking error: ${body}`);
          resolve({
            success: false,
            responseTime,
            statusCode: res.statusCode,
            error: body
          });
        }
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        success: false,
        responseTime,
        error: err.message
      });
    });
    
    req.setTimeout(10000);
    req.write(postData);
    req.end();
  });
}

async function checkFirewallBlocking(client) {
  console.log(`   Checking ${client.name} for firewall blocks...`);
  // Test different connection patterns to detect firewall blocking
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
  
  return new Promise((resolve, reject) => {
    let html = '';
    let statusCode = 0;
    let responseTime = 0;
    
    const req = https.get(client.url, {
      headers: {
        'User-Agent': 'Firewall-Detection/1.0',
        'X-Test-Method': test.method
      }
    });
    
    const timeout = setTimeout(() => {
      resolve({
        name: test.name,
        isBlocked: true,
        error: 'Request timeout (15s)',
        responseTime: 15000
      });
    }, 15000);
    
    req.on('data', (chunk) => {
      html += chunk;
    });
    
    req.on('end', () => {
      clearTimeout(timeout);
      const endTime = performance.now();
      responseTime = endTime - startTime;
      statusCode = req.res.statusCode;
      
      // Check for firewall indicators
      const isBlocked = 
        statusCode === 403 || // Forbidden
        statusCode === 429 || // Rate limited
        html.includes('cloudflare') || // Cloudflare block page
        html.includes('blocked') || // Generic block message
        html.includes('waf') || // Web Application Firewall
        responseTime > 5000; // Slow response suggests inspection
      
      resolve({
        name: test.name,
        isBlocked,
        responseTime,
        statusCode
      });
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        name: test.name,
        isBlocked: true,
        error: err.message,
        responseTime: 15000
      });
    });
    
    req.end();
  });
}

async function generateAlert(status, clientResults) {
  const timestamp = new Date().toISOString();
  const blockedClients = clientResults.filter(r => !r.overall);
  const operationalClients = clientResults.filter(r => r.overall);
  const problematicClients = clientResults.filter(r => !r.overall);
  
  console.log(`\n🚨 ${status} ALERT at ${timestamp}`);
  console.log('================================');
  console.log(`Details: ${clientResults.length} clients checked`);
  
  if (status === 'CRITICAL' && blockedClients.length > 0) {
    console.log(`🔥 ${blockedClients.length} clients blocked by firewalls`);
    console.log('Blocked clients:');
    blockedClients.forEach(client => {
      console.log(`   ❌ ${client.client} (${client.url})`);
    });
    console.log('');
    console.log('🔧 IMMEDIATE ACTION REQUIRED:');
    console.log('1. Check firewall settings for each blocked client');
    console.log('2. Provide firewall configuration guide:', FIREWALL_GUIDE.url);
    console.log('3. Consider alternative authentication methods');
  } else if (status === 'WARNING' && operationalClients.length < clientResults.length) {
    console.log(`⚠️ ${clientResults.length - operationalClients.length} clients have issues`);
    console.log('Problematic clients:');
    problematicClients.forEach(client => {
      console.log(`   ⚠️ ${client.client}: ${client.snippet ? '✅' : '❌'} snippet, ${client.tracking ? '✅' : '❌'} tracking, ${client.firewall ? '🔥' : '✅'} firewall`);
    });
    console.log('');
    console.log('🔧 RECOMMENDED ACTIONS:');
    console.log('1. Investigate client-specific issues');
    console.log('2. Schedule follow-up checks');
  }
  
  if (status === 'SUCCESS') {
    console.log(`✅ All ${operationalClients.length} clients operational`);
    console.log('📊 Performance Summary:');
    const avgResponseTime = operationalClients.length > 0 ? 
      operationalClients.reduce((sum, client) => sum + client.responseTime, 0) / operationalClients.length : 0;
    console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
  }
  
  // Send to monitoring system
  const report = {
    timestamp,
    totalClients: clientResults.length,
    operationalClients: operationalClients.length,
    blockedClients: blockedClients.length,
    criticalIssues: blockedClients.length,
    avgResponseTime: avgResponseTime,
    clientDetails: clientResults
  };
  
  if (!isLocalhost) {
    // In production, send alerts to monitoring dashboard
    console.log('\n📈 Sending monitoring report to dashboard...');
    // Here you could send to your monitoring system or external service
  }
  
  return { alert: status, report, clientResults };
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkAllClients,
  checkClientSnippet,
  checkClientTracking,
  checkFirewallBlocking,
  runFirewallTest,
  generateAlert
};