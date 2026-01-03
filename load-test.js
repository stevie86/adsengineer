#!/usr/bin/env node

// Cloudflare Workers Load Testing Script
// Tests AdsEngineer endpoints with fake data

import https from 'https';
import crypto from 'crypto';
import { createHmac } from 'crypto';

// Configuration
const CONFIG = {
  baseUrl: 'https://advocate-cloud.adsengineer.workers.dev',
  localUrl: 'http://localhost:8090',
  useLocal: process.env.USE_LOCAL === 'true',
  concurrency: parseInt(process.env.CONCURRENCY || '10'),
  totalRequests: parseInt(process.env.TOTAL_REQUESTS || '100'),
  rampUpTime: parseInt(process.env.RAMP_UP_TIME || '5'), // seconds
  testDuration: parseInt(process.env.TEST_DURATION || '30'), // seconds
};

// Test results
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitedRequests: 0,
  invalidSignatureRequests: 0,
  responseTimes: [],
  errors: [],
  statusCodes: {},
};

// Fake data generators
class FakeDataGenerator {
  static agencies = [
    { id: 'agency_loadtest_001', shopify_domain: 'loadtest-shop-1.myshopify.com', secret: 'fake_secret_1', isTestData: true },
    { id: 'agency_loadtest_002', shopify_domain: 'loadtest-shop-2.myshopify.com', secret: 'fake_secret_2', isTestData: true },
    { id: 'agency_loadtest_003', shopify_domain: 'loadtest-shop-3.myshopify.com', secret: 'fake_secret_3', isTestData: true },
  ];

  // Test data marker for easy identification
  static TEST_DATA_MARKER = 'LOAD_TEST_DATA_v1';

  static productTitles = [
    'Premium Marketing Service',
    'Advanced Analytics Tool',
    'Conversion Optimization Package',
    'Lead Generation System',
    'Customer Retention Platform'
  ];

  static customerEmails = [
    'john.doe@loadtest-example.com',
    'jane.smith@loadtest-test.com',
    'bob.wilson@loadtest-demo.com',
    'alice.brown@loadtest-sample.com'
  ];

  static getRandomAgency() {
    return this.agencies[Math.floor(Math.random() * this.agencies.length)];
  }

  static generateShopifyOrder() {
    const agency = this.getRandomAgency();
    const orderId = Math.floor(Math.random() * 1000000) + 100000;
    const customerEmail = this.customerEmails[Math.floor(Math.random() * this.customerEmails.length)];

    return {
      id: orderId,
      email: customerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_price: (Math.random() * 500 + 50).toFixed(2),
      subtotal_price: (Math.random() * 400 + 40).toFixed(2),
      total_tax: (Math.random() * 50 + 5).toFixed(2),
      currency: 'EUR',
      financial_status: 'paid',
      fulfillment_status: null,
      // Test data marker
      _loadTestMarker: this.TEST_DATA_MARKER,
      _testTimestamp: Date.now(),
      line_items: [
        {
          id: Math.floor(Math.random() * 1000000),
          variant_id: Math.floor(Math.random() * 1000000),
          title: this.productTitles[Math.floor(Math.random() * this.productTitles.length)],
          quantity: Math.floor(Math.random() * 3) + 1,
          price: (Math.random() * 200 + 20).toFixed(2),
          sku: `SKU-LOADTEST-${Math.floor(Math.random() * 1000)}`,
          variant_title: null,
          // Test data marker on line items
          _isTestData: true
        }
      ],
      customer: {
        id: Math.floor(Math.random() * 1000000),
        email: customerEmail,
        first_name: customerEmail.split('.')[0],
        last_name: customerEmail.split('@')[0].split('.')[1] || 'Customer',
        orders_count: Math.floor(Math.random() * 10) + 1,
        // Test data marker
        _loadTestMarker: this.TEST_DATA_MARKER
      },
      shipping_address: {
        first_name: customerEmail.split('.')[0],
        last_name: customerEmail.split('@')[0].split('.')[1] || 'Customer',
        address1: `${Math.floor(Math.random() * 100) + 1} Main St`,
        city: 'Test City',
        province: 'Test Province',
        country: 'Test Country',
        zip: `${Math.floor(Math.random() * 90000) + 10000}`,
        // Test data marker
        _isTestAddress: true
      }
    };
  }

  static generateShopifyCustomer() {
    const agency = this.getRandomAgency();
    const customerId = Math.floor(Math.random() * 1000000) + 100000;
    const customerEmail = this.customerEmails[Math.floor(Math.random() * this.customerEmails.length)];

    return {
      id: customerId,
      email: customerEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      first_name: customerEmail.split('.')[0],
      last_name: customerEmail.split('@')[0].split('.')[1] || 'Customer',
      orders_count: Math.floor(Math.random() * 50) + 1,
      total_spent: (Math.random() * 5000 + 100).toFixed(2),
      verified_email: true,
      // Test data markers
      _loadTestMarker: this.TEST_DATA_MARKER,
      _testTimestamp: Date.now(),
      addresses: [
        {
          address1: `${Math.floor(Math.random() * 100) + 1} Main St`,
          city: 'Test City',
          province: 'Test Province',
          country: 'Test Country',
          zip: `${Math.floor(Math.random() * 90000) + 10000}`,
          // Test data marker
          _isTestAddress: true
        }
      ]
    };
  }

  static generateWebhookPayload(topic, agency = null) {
    const targetAgency = agency || this.getRandomAgency();

    let payload;
    switch (topic) {
      case 'orders/create':
      case 'orders/paid':
        payload = this.generateShopifyOrder();
        break;
      case 'customers/create':
      case 'customers/update':
        payload = this.generateShopifyCustomer();
        break;
      default:
        payload = { id: Math.floor(Math.random() * 1000000), type: 'test' };
    }

    return { payload, agency: targetAgency };
  }

  static generateWebhookSignature(payload, secret, timestamp = null) {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    const message = `${ts}.${JSON.stringify(payload)}`;
    return createHmac('sha256', secret).update(message).digest('base64');
  }
}

// HTTP request utilities
class HttpClient {
  static async makeRequest(method, url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'AdsEngineer-Load-Test/1.0',
          ...options.headers
        },
        timeout: 10000
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: Date.now() - (options.startTime || Date.now())
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  static async sendWebhook(topic, options = {}) {
    const { payload, agency } = FakeDataGenerator.generateWebhookPayload(topic);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = FakeDataGenerator.generateWebhookSignature(payload, agency.secret, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Topic': topic,
      'X-Shopify-Shop-Domain': agency.shopify_domain,
      'X-Shopify-Webhook-Id': `w_${Math.random().toString(36).substr(2, 9)}`,
      'X-Shopify-API-Version': '2024-01',
      'X-Shopify-Hmac-Sha256': signature,
      'User-Agent': 'ShopifyCapable/1.0'
    };

    // Add invalid signature for testing if requested
    if (options.invalidSignature) {
      headers['X-Shopify-Hmac-Sha256'] = 'invalid_signature_123';
    }

    const url = `${CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl}/api/v1/shopify/webhook`;

    const startTime = Date.now();
    try {
      const response = await this.makeRequest('POST', url, {
        headers,
        body: JSON.stringify(payload),
        startTime
      });

      return {
        success: true,
        response,
        agency,
        payload,
        topic
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        agency,
        payload,
        topic,
        responseTime: Date.now() - startTime
      };
    }
  }
}

// Load testing logic
class LoadTester {
  static async runTest(testConfig) {
    console.log(`🚀 Starting ${testConfig.name}...`);
    console.log(`📊 Configuration: ${testConfig.description}`);
    console.log(`🎯 Target: ${CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl}`);
    console.log('');

    const startTime = Date.now();
    let completedRequests = 0;
    const activeRequests = new Set();

    // Progress tracking
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rps = completedRequests / elapsed;
      process.stdout.write(`\r📈 Progress: ${completedRequests}/${testConfig.totalRequests} requests | ${rps.toFixed(1)} req/sec | Active: ${activeRequests.size}`);
    }, 1000);

    // Execute test
    await testConfig.runner(activeRequests);

    clearInterval(progressInterval);
    console.log('\n✅ Test completed!\n');

    // Calculate results
    const totalTime = (Date.now() - startTime) / 1000;
    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    const rps = results.totalRequests / totalTime;

    console.log('📊 RESULTS:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total Requests:     ${results.totalRequests}`);
    console.log(`Successful:         ${results.successfulRequests}`);
    console.log(`Failed:            ${results.failedRequests}`);
    console.log(`Rate Limited:      ${results.rateLimitedRequests}`);
    console.log(`Invalid Signatures: ${results.invalidSignatureRequests}`);
    console.log(`Average Response:   ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Requests/Second:    ${rps.toFixed(2)}`);
    console.log(`Total Time:         ${totalTime.toFixed(2)}s`);
    console.log('');

    if (results.errors.length > 0) {
      console.log('❌ ERRORS:');
      results.errors.slice(0, 10).forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`... and ${results.errors.length - 10} more`);
      }
      console.log('');
    }

    console.log('📊 STATUS CODE DISTRIBUTION:');
    Object.entries(results.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count} requests`);
    });
  }

  static async runConcurrencyTest() {
    const promises = [];

    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const promise = this.sendRequestWithDelay(i);
      promises.push(promise);
    }

    await Promise.all(promises);
  }

  static async sendRequestWithDelay(index) {
    // Add random delay to simulate real traffic patterns
    const delay = Math.random() * CONFIG.rampUpTime * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    await this.sendTestRequest();
  }

  static async sendTestRequest(options = {}) {
    results.totalRequests++;

    try {
      const response = await HttpClient.sendWebhook('orders/create', options);

      if (response.success) {
        results.successfulRequests++;
        results.responseTimes.push(response.response.responseTime);

        const statusCode = response.response.statusCode;
        results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;

        if (statusCode === 429) {
          results.rateLimitedRequests++;
        } else if (statusCode === 401) {
          results.invalidSignatureRequests++;
        }
      } else {
        results.failedRequests++;
        results.errors.push(`${response.topic}: ${response.error}`);
      }
    } catch (error) {
      results.failedRequests++;
      results.errors.push(`Request failed: ${error.message}`);
    }
  }

  // Test scenarios
  static getTestScenarios() {
    return [
      {
        name: 'Basic Load Test',
        description: `${CONFIG.totalRequests} requests with ${CONFIG.concurrency} concurrent users`,
        totalRequests: CONFIG.totalRequests,
        runner: async (activeRequests) => {
          await this.runConcurrencyTest();
        }
      },
      {
        name: 'Rate Limiting Test',
        description: 'High-frequency requests to test rate limiting',
        totalRequests: 200,
        runner: async (activeRequests) => {
          // Send requests in rapid succession
          const promises = [];
          for (let i = 0; i < 200; i++) {
            promises.push(this.sendTestRequest());
            // Small delay to create bursts
            if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 100));
          }
          await Promise.all(promises);
        }
      },
      {
        name: 'Invalid Signature Test',
        description: 'Test security with invalid webhook signatures',
        totalRequests: 50,
        runner: async (activeRequests) => {
          const promises = [];
          for (let i = 0; i < 50; i++) {
            promises.push(this.sendTestRequest({ invalidSignature: true }));
          }
          await Promise.all(promises);
        }
      },
      {
        name: 'Mixed Topic Test',
        description: 'Test different webhook topics',
        totalRequests: 60,
        runner: async (activeRequests) => {
          const topics = ['orders/create', 'orders/paid', 'customers/create', 'customers/update'];
          const promises = [];

          for (let i = 0; i < 60; i++) {
            const topic = topics[Math.floor(Math.random() * topics.length)];
            // Override the sendWebhook call to use specific topic
            promises.push((async () => {
              results.totalRequests++;
              try {
                const response = await HttpClient.sendWebhook(topic);

                if (response.success) {
                  results.successfulRequests++;
                  results.responseTimes.push(response.response.responseTime);

                  const statusCode = response.response.statusCode;
                  results.statusCodes[statusCode] = (results.statusCodes[statusCode] || 0) + 1;

                  if (statusCode === 429) results.rateLimitedRequests++;
                  else if (statusCode === 401) results.invalidSignatureRequests++;
                } else {
                  results.failedRequests++;
                  results.errors.push(`${response.topic}: ${response.error}`);
                }
              } catch (error) {
                results.failedRequests++;
                results.errors.push(`Request failed: ${error.message}`);
              }
            })());
          }

          await Promise.all(promises);
        }
      }
    ];
  }
}

// Main execution
async function main() {
  console.log('🔧 AdsEngineer Cloudflare Workers Load Tester');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target: ${CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl}`);
  console.log(`Mode: ${CONFIG.useLocal ? 'Local Development' : 'Production'}`);
  console.log('');

  const scenarios = LoadTester.getTestScenarios();

  // Run all scenarios
  for (const scenario of scenarios) {
    // Reset results for each scenario
    Object.assign(results, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      invalidSignatureRequests: 0,
      responseTimes: [],
      errors: [],
      statusCodes: {}
    });

    await LoadTester.runTest(scenario);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  console.log('🎉 All load tests completed!');
  console.log('');
  console.log('💡 Tips:');
  console.log('  - Use USE_LOCAL=true to test against localhost');
  console.log('  - Adjust CONCURRENCY and TOTAL_REQUESTS for different load levels');
  console.log('  - Monitor Cloudflare dashboard for worker performance metrics');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AdsEngineer Load Tester

Usage: node load-test.js [options]

Options:
  --local          Test against localhost instead of production
  --concurrency N  Number of concurrent requests (default: 10)
  --requests N     Total number of requests (default: 100)
  --scenario NAME  Run specific scenario (basic, rate-limit, invalid-sig, mixed)
  --help           Show this help

Environment Variables:
  USE_LOCAL=true              Test against localhost
  CONCURRENCY=20               Set concurrency level
  TOTAL_REQUESTS=500           Set total requests
  TEST_DURATION=60             Test duration in seconds

Examples:
  node load-test.js --local --concurrency 5 --requests 50
  USE_LOCAL=true CONCURRENCY=20 node load-test.js
  `);
  process.exit(0);
}

// Parse arguments
if (args.includes('--local')) {
  CONFIG.useLocal = true;
}

const concurrencyIndex = args.indexOf('--concurrency');
if (concurrencyIndex !== -1 && args[concurrencyIndex + 1]) {
  CONFIG.concurrency = parseInt(args[concurrencyIndex + 1]);
}

const requestsIndex = args.indexOf('--requests');
if (requestsIndex !== -1 && args[requestsIndex + 1]) {
  CONFIG.totalRequests = parseInt(args[requestsIndex + 1]);
}

const scenarioIndex = args.indexOf('--scenario');
if (scenarioIndex !== -1 && args[scenarioIndex + 1]) {
  const scenarioName = args[scenarioIndex + 1];
  const scenarios = LoadTester.getTestScenarios();
  const scenario = scenarios.find(s => s.name.toLowerCase().includes(scenarioName));
  if (scenario) {
    // Run single scenario
    console.log(`Running single scenario: ${scenario.name}`);
    LoadTester.runTest(scenario).then(() => process.exit(0)).catch(console.error);
  } else {
    console.error(`Scenario "${scenarioName}" not found. Available: ${scenarios.map(s => s.name.toLowerCase().replace(' ', '-')).join(', ')}`);
    process.exit(1);
  }
} else {
  main().catch(console.error);
}