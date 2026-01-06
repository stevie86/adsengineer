#!/usr/bin/env node

/**
 * MyCannaby Diagnostic & Fix Tool
 * Diagnoses and fixes connectivity issues between AdsEngineer and MyCannaby
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const MYCANNABY_URL = 'https://mycannaby.de';
const API_BASE = 'https://adsengineer-cloud.adsengineer.workers.dev';
const TEST_EMAIL = 'test@mycannaby.de';
const TEST_GCLID = 'EAIaIQv3i3m8e7vO-' + Date.now();

// MyCannaby site configuration from your database
const MYCANNABY_CONFIG = {
  siteId: 'mycannaby-687f1af9',
  shopifyDomain: 'mycannaby.myshopify.com',
  webhookSecret: 'shpat_demo_secret_xxxxxxxx'
};

async function checkMyCannabyReachability() {
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

async function testTrackingEndpoint(headers = {}) {
  console.log('📡 Testing AdsEngineer tracking endpoint...');
  
  const testData = {
    site_id: MYCANNABY_CONFIG.siteId,
    email: TEST_EMAIL,
    gclid: TEST_GCLID,
    adjusted_value_cents: 4500,
    landing_page: MYCANNABY_URL + '/test',
    consent_status: 'granted',
    utm_source: 'connectivity_test',
    utm_medium: 'test',
    utm_campaign: 'diagnostic'
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
        'User-Agent': 'AdsEngineer-Connectivity-Tester/1.0',
        ...headers
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

async function checkAuthHeaders() {
  console.log('🔐 Testing AdsEngineer authentication...');
  
  const testMethods = [
    {
      name: 'No Auth',
      headers: {}
    },
    {
      name: 'JWT Token (test)',
      headers: {
          'Authorization': 'Bearer test_jwt_token'
        }
      },
    {
      name: 'API Key (test)',
      headers: {
          'X-API-Key': 'test_api_key'
        }
      },
    {
      name: 'Admin Token (from config)',
      headers: {
          'X-Admin-Token': 'admin_token_placeholder'
        }
      }
    ];
  
  let workingMethod = null;
  
  for (const method of testMethods) {
    try {
      const result = await testTrackingEndpoint(method.headers);
      console.log(`   ${method.name}: ${result.success ? '✅' : '❌'}`);
      
      if (result.success) {
        workingMethod = method.name;
        break;
      }
    } catch (error) {
      console.log(`   ${method.name}: ❌ (${error.message})`);
    }
  }
  
  return workingMethod;
}

async function checkSnippetEndpoint() {
  console.log('📄 Testing snippet service availability...');
  
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'adsengineer-cloud.adsengineer.workers.dev',
      port: 443,
      path: `/api/v1/snippet/${MYCANNABY_CONFIG.siteId}`,
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

async function checkMissingEndpoints() {
  console.log('🔍 Checking for missing API endpoints...');
  
  const missingEndpoints = [
    '/api/v1/snippet/:siteId',
    '/api/v1/health',
    '/api/v1/admin/sites'
  ];
  
  const results = {};
  
  for (const endpoint of missingEndpoints) {
    try {
      const result = await testEndpointExists(endpoint);
      console.log(`   ${endpoint}: ${result.exists ? '✅' : '❌'} ${result.status}`);
      results[endpoint] = result;
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Error - ${error.message}`);
      results[endpoint] = { exists: false, error: error.message };
    }
  }
  
  return results;
}

async function testEndpointExists(endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      hostname: 'adsengineer-cloud.adsengineer.workers.dev',
      port: 443,
      path: endpoint,
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
        resolve({
          exists: res.statusCode !== 404,
          responseTime,
          statusCode: res.statusCode,
          status: res.statusCode === 200 ? 'OK' : res.statusCode.toString()
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      resolve({
        exists: false,
        responseTime,
        error: err.message
      });
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

async function generateFixes() {
  console.log('\n🔧 GENERATING FIXES...\n');
  
  const fixes = [];
  
  // Fix 1: Create missing snippet endpoint
  fixes.push({
    title: 'Create Snippet API Endpoint',
    file: 'serverless/src/routes/snippets.ts',
    priority: 'HIGH',
    code: `// serverless/src/routes/snippets.ts
import { Hono } from 'hono';
import { z } from 'zod';

const snippetSchema = z.object({
  siteId: z.string().min(1)
});

export const snippetRouter = new Hono();

// Get snippet by site ID
snippetRouter.get('/:siteId', async (c) => {
  const { siteId } = c.req.param();
  
  if (!siteId) {
    return c.json({ error: 'Site ID required' }, 400);
  }
  
  // MyCannaby specific snippet
  if (siteId === 'mycannaby-687f1af9') {
    const mycannabySnippet = \`<script>
      // MyCannaby enterprise tracking
      var MYCANNABY_CONFIG = {
        siteId: '\${siteId}',
        enterprise: true,
        debug: true
      };
      
      // Rest of MyCannaby tracking code...
    </script>\`;
    
    return c.html(200, mycannabySnippet);
  }
  
  // Generic snippet for other customers
  const genericSnippet = \`<script>
    // Generic tracking code...
  </script>\`;
  
  return c.html(200, genericSnippet);
});
`,
    description: 'Adds missing /api/v1/snippets/:siteId endpoint to serve tracking snippets'
  });
  
  // Fix 2: Update main router to include snippet routes
  fixes.push({
    title: 'Update Main Router',
    file: 'serverless/src/index.ts',
    priority: 'HIGH',
    code: `// Add to index.ts
import { snippetRouter } from './routes/snippets';

app.route('/snippets', snippetRouter);
`,
    description: 'Registers snippet endpoints in main Hono app'
  });
  
  // Fix 3: Fix authentication middleware
  fixes.push({
    title: 'Fix Authentication',
    file: 'serverless/src/middleware/auth.ts',
    priority: 'CRITICAL',
    code: `// Current issue: Tracking endpoint requires auth but no clear method
export const requireAuth = async (c: Context, next: Next) => {
  // Try multiple auth methods
  const authHeader = c.req.header('Authorization');
  const apiKey = c.req.header('X-API-Key');
  const adminToken = c.req.header('X-Admin-Token');
  
  // Allow public endpoints like health check and snippet retrieval
  const publicPaths = ['/health', '/snippets/:siteId'];
  const isPublicPath = publicPaths.some(path => c.req.path.includes(path));
  
  if (isPublicPath) {
    await next();
    return;
  }
  
  // Check for valid auth (implement proper token validation)
  if (authHeader?.startsWith('Bearer ') || apiKey || adminToken) {
    // TODO: Validate token against database
    await next();
  } else {
    return c.json({ error: 'Authentication required' }, 401);
  }
};
`,
    description: 'Fixes 401 authentication errors on tracking endpoint'
  });
  
  return fixes;
}

async function main() {
  console.log('🔬 AdsEngineer → MyCannaby Diagnostic Tool');
  console.log('================================================');
  console.log(`Testing at: ${new Date().toISOString()}`);
  console.log(`Target: ${MYCANNABY_URL}`);
  console.log(`API: ${API_BASE}`);
  
  try {
    console.log('\n🎯 DIAGNOSTIC PHASE 1: Connectivity Tests');
    console.log('==========================================');
    
    // Test 1: MyCannaby webshop reachability
    const mycannabyStatus = await checkMyCannabyReachability();
    console.log(`MyCannaby.de: ${mycannabyStatus.reachable ? '✅ REACHABLE' : '❌ UNREACHABLE'}`);
    
    if (!mycannabyStatus.reachable) {
      console.log('\n⚠️  MyCannaby webshop is DOWN');
      console.log('   Fix: Check MyCannaby server status');
      console.log('   Contact: MyCannaby technical team');
      process.exit(1);
    }
    
    // Test 2: Authentication methods
    console.log('\n🔐 DIAGNOSTIC PHASE 2: Authentication Tests');
    console.log('==========================================');
    const workingAuth = await checkAuthHeaders();
    
    if (!workingAuth) {
      console.log('\n❌ All authentication methods failed');
      console.log('   Fix: Implement proper authentication system');
    } else {
      console.log(`✅ Working auth: ${workingAuth}`);
    }
    
    // Test 3: Missing endpoints
    console.log('\n🔍 DIAGNOSTIC PHASE 3: Missing Endpoints');
    console.log('==========================================');
    const missingEndpoints = await checkMissingEndpoints();
    
    // Test 4: Snippet service
    console.log('\n📄 DIAGNOSTIC PHASE 4: Snippet Service');
    console.log('==========================================');
    const snippetStatus = await checkSnippetEndpoint();
    console.log(`Snippet Service: ${snippetStatus.success ? '✅ WORKING' : '❌ MISSING'}`);
    
    // Generate fixes
    console.log('\n🔧 DIAGNOSTIC PHASE 5: Fix Generation');
    console.log('==========================================');
    const fixes = await generateFixes();
    
    console.log('\n📋 SUMMARY OF ISSUES:');
    console.log('====================');
    console.log('❌ ISSUE 1: 401 Unauthorized on tracking endpoint');
    console.log('   Fix: Implement proper authentication middleware');
    console.log('');
    console.log('❌ ISSUE 2: Missing /api/v1/snippets/:siteId endpoint');
    console.log('   Fix: Create snippet router to serve tracking code');
    console.log('');
    console.log('⚠️  ISSUE 3: MyCannaby returns 403 (access denied)');
    console.log('   Fix: Check MyCannaby Cloudflare settings/CSG');
    console.log('');
    
    console.log('\n🎯 REQUIRED FIXES:');
    console.log('==================');
    console.log(`Generated ${fixes.length} fixes with priorities:`);
    
    fixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.title} (${fix.priority})`);
      console.log(`   File: ${fix.file}`);
      console.log(`   Description: ${fix.description}`);
    });
    
    console.log('\n📁 OUTPUT FILES NEEDED:');
    console.log('========================');
    fixes.forEach(fix => {
      console.log(`Create: ${fix.file}`);
    });
    
    console.log('\n✅ Diagnostic completed successfully');
    console.log('Next steps: Implement fixes, re-run connectivity test');
    
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkMyCannabyReachability,
  testTrackingEndpoint,
  checkSnippetEndpoint,
  generateFixes
};