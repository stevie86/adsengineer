/**
 * End-to-End Test: Extract → Config → Worker Send
 *
 * Tests the complete workflow:
 * 1. Parse GTM export
 * 2. Generate config.json
 * 3. Load config in Universal Engine
 * 4. Process sample event data
 */

import type { EventData } from './universal-engine/universal-engine';
import { UniversalEngine } from './universal-engine/universal-engine';

// Sample dataLayer (matches config from test)
const sampleDataLayer: any = {
  ecommerce: {
    purchase: {
      total: 150.0,
    },
    currencyCode: 'USD',
    items: [
      {
        item_id: 'product-123',
        item_name: 'Test Product',
      },
    ],
  },
  user: {
    hashedEmail: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    phone: '+1234567890',
  },
};

async function testEndToEnd() {
  console.log('=== End-to-End Test: Extract → Config → Worker Send ===\n');

  // Load generated config
  const config = JSON.parse(require('fs').readFileSync('/tmp/test-config.json', 'utf-8'));
  console.log('Config loaded:', config.customerId);
  console.log(
    'Events found:',
    config.events.map((e: any) => e.eventName)
  );
  console.log('');

  // Create mock environment
  const mockEnv = {
    DB: null as any,
    KV: {
      get: async (key: string) => {
        if (key === 'config:customer-test-001') {
          return JSON.stringify(config);
        }
        return null;
      },
    } as any,
  } as Bindings;

  // Create Universal Engine
  const engine = new UniversalEngine(mockEnv);

  // Test purchase event
  console.log('Testing purchase event...');
  try {
    const result = await engine.processEvent('customer-test-001', {
      eventName: 'purchase',
      dataLayer: sampleDataLayer,
    });
    console.log('Purchase event processed successfully');
    console.log('Platforms sent:', Object.keys(result));
  } catch (error) {
    console.error('Purchase event failed:', error);
  }

  console.log('');

  // Test lead event
  console.log('Testing lead event...');
  try {
    const result = await engine.processEvent('customer-test-001', {
      eventName: 'lead',
      dataLayer: sampleDataLayer,
    });
    console.log('Lead event processed successfully');
    console.log('Platforms sent:', Object.keys(result));
  } catch (error) {
    console.error('Lead event failed:', error);
  }

  console.log('');
  console.log('=== Test Complete ===');
}

// Run test
testEndToEnd().catch(console.error);
