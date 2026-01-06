import ShopifySEOAuditor from './shopify-seo-auditor.js';

async function runTests() {
  console.log('🧪 Running Shopify SEO Auditor Tests...\n');

  const auditor = new ShopifySEOAuditor();

  const testCases = [
    {
      name: 'Valid Product Page',
      url: 'https://demo.shopify.com/products/example-product',
      domain: 'demo.shopify.com',
      expectedScore: { min: 70, max: 100 }
    },
    {
      name: 'Collection Page',
      url: 'https://demo.shopify.com/collections/all',
      domain: 'demo.shopify.com',
      expectedScore: { min: 60, max: 100 }
    },
    {
      name: 'Homepage',
      url: 'https://demo.shopify.com',
      domain: 'demo.shopify.com',
      expectedScore: { min: 70, max: 100 }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      
      const report = await auditor.auditStore(testCase.url, testCase.domain);
      
      console.log(`📊 Overall Score: ${report.scores.overall}`);
      console.log(`📈 SEO Score: ${report.scores.seo || 'N/A'}`);
      console.log(`⚡ Performance Score: ${report.scores.performance || 'N/A'}`);
      console.log(`🛒 Shopify Score: ${report.scores.shopify || 'N/A'}`);
      
      const overallScore = report.scores.overall;
      const { min, max } = testCase.expectedScore;
      
      if (overallScore >= min && overallScore <= max) {
        console.log('✅ Test PASSED\n');
      } else {
        console.log(`❌ Test FAILED - Expected ${min}-${max}, got ${overallScore}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Test ERROR - ${error.message}\n`);
    }
  }

  console.log('🎯 Tests completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };