#!/usr/bin/env node

/**
 * MyCannaby Connection Tester
 * Tests AdsEngineer connectivity to MyCannaby webshop
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const MYCANNABY_URL = 'https://mycannaby.de';
const API_BASE = 'https://adsengineer-cloud.adsengineer.workers.dev';
const TEST_EMAIL = 'test@mycannaby.de';
const TEST_GCLID = 'EAIaIQv3i3m8e7vO-' + Date.now();

async function testMyCannabyReachability() {
  console.log('🔍 Testing MyCannaby webshop reachability...');
  
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = https.get(MYCANNABY_URL, (res) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log('✅ MyCannaby reachable');
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      
      if (res.statusCode === 200) {
        resolve({
          reachable: true,
          responseTime,
          statusCode: res.statusCode,
          headers: res.headers
        });
      } else {
        resolve({
          reachable: false,
          responseTime,
          statusCode: res.statusCode,
          error: `HTTP ${res.statusCode}`
        });
      }
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log('❌ MyCannaby unreachable');
      console.log(`   Error: ${err.message}`);
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      
      resolve({
        reachable: false,
        responseTime,
        error: err.message
      });
    });
    
    req.setTimeout(10000); // 10 second timeout
    req.end();
  });
}

async function testTrackingEndpoint() {
  console.log('\n📡 Testing AdsEngineer tracking endpoint...');
  
  const testData = {
    site_id: 'mycannaby-687f1af9',
    email: TEST_EMAIL,
    gclid: TEST_GCLID,
    adjusted_value_cents: 4500, // €45
    landing_page: 'https://mycannaby.de/test',
    consent_status: 'granted',
    utm_source: 'adsengineer_test',
    utm_medium: 'test',
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
        'User-Agent': 'AdsEngineer-Connectivity-Tester/1.0'
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
        console.log('✅ Tracking endpoint reachable');
        console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            console.log('   Response:', response);
            resolve({
              success: true,
              responseTime,
              statusCode: res.statusCode,
              response
            });
          } catch (e) {
            console.log('   Response parsing error:', e.message);
            resolve({
              success: false,
              responseTime,
              statusCode: res.statusCode,
              error: 'Invalid JSON response'
            });
          }
        } else {
          console.log('   Error response:', body);
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
      
      console.log('❌ Tracking endpoint unreachable');
      console.log(`   Error: ${err.message}`);
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      
      resolve({
        success: false,
        responseTime,
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      console.log('❌ Request timeout');
      resolve({
        success: false,
        error: 'Request timeout (10s)'
      });
    });
    
    req.setTimeout(10000);
    req.write(postData);
    req.end();
  });
}

async function testSnippetRetrieval() {
  console.log('\n📄 Testing snippet retrieval endpoint...');
  
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'adsengineer-cloud.adsengineer.workers.dev',
      port: 443,
      path: '/api/v1/snippet/mycannaby-687f1af9',
      method: 'GET',
      headers: {
        'User-Agent': 'AdsEngineer-Connectivity-Tester/1.0'
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
        console.log('✅ Snippet endpoint reachable');
        console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Content length: ${body.length} characters`);
        
        if (res.statusCode === 200 && body.includes('<script>')) {
          console.log('   Valid JavaScript snippet received');
          resolve({
            success: true,
            responseTime,
            statusCode: res.statusCode,
            contentLength: body.length
          });
        } else {
          console.log('   Invalid or missing snippet');
          resolve({
            success: false,
            responseTime,
            statusCode: res.statusCode,
            error: 'Invalid snippet response'
          });
        }
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log('❌ Snippet endpoint unreachable');
      console.log(`   Error: ${err.message}`);
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      
      resolve({
        success: false,
        responseTime,
        error: err.message
      });
    });
    
    req.setTimeout(10000);
    req.end();
  });
}

async function generateReport() {
  console.log('\n📊 Running comprehensive connectivity test...\n');
  
  const results = {};
  
  // Test 1: MyCannaby Reachability
  results.mycannaby = await testMyCannabyReachability();
  
  // Test 2: Tracking Endpoint
  results.tracking = await testTrackingEndpoint();
  
  // Test 3: Snippet Retrieval
  results.snippet = await testSnippetRetrieval();
  
  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('================');
  
  const mycannabyStatus = results.mycannaby.reachable ? '✅ REACHABLE' : '❌ UNREACHABLE';
  const trackingStatus = results.tracking.success ? '✅ WORKING' : '❌ FAILED';
  const snippetStatus = results.snippet.success ? '✅ AVAILABLE' : '❌ MISSING';
  
  console.log(`MyCannaby.de:     ${mycannabyStatus}`);
  console.log(`Tracking Endpoint:  ${trackingStatus}`);
  console.log(`Snippet Service:    ${snippetStatus}`);
  
  if (results.mycannaby.reachable && results.tracking.success) {
    console.log('\n🚀 FULL SYSTEM OPERATIONAL');
    console.log('MyCannaby can receive tracking data and AdsEngineer can process it.');
  } else if (results.mycannaby.reachable && !results.tracking.success) {
    console.log('\n⚠️  PARTIAL SYSTEM');
    console.log('MyCannaby reachable but tracking has issues.');
  } else if (!results.mycannaby.reachable && results.tracking.success) {
    console.log('\n⚠️  WEIRD STATE');
    console.log('MyCannaby down but tracking endpoint working (cached data?).');
  } else {
    console.log('\n❌ SYSTEM DOWN');
    console.log('Multiple connectivity issues detected.');
  }
  
  console.log('\n📈 Performance Metrics:');
  console.log(`   MyCannaby Response: ${results.mycannaby.responseTime?.toFixed(2) || 'N/A'}ms`);
  console.log(`   Tracking Endpoint:     ${results.tracking.responseTime?.toFixed(2) || 'N/A'}ms`);
  console.log(`   Snippet Retrieval:  ${results.snippet.responseTime?.toFixed(2) || 'N/A'}ms`);
  
  return results;
}

// Main execution
async function main() {
  console.log('🔬 AdsEngineer → MyCannaby Connectivity Tester');
  console.log('================================================');
  console.log(`Testing at: ${new Date().toISOString()}`);
  console.log(`Target: ${MYCANNABY_URL}`);
  console.log(`API: ${API_BASE}`);
  
  try {
    await generateReport();
    
    console.log('\n✅ Test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testMyCannabyReachability,
  testTrackingEndpoint,
  testSnippetRetrieval,
  generateReport
};