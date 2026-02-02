/**
 * WooCommerce Adapter Tests
 *
 * Tests woocommerceAdapter converts WooCommerce webhooks to StandardEvent
 */

import { woocommerceAdapter } from './src/adapters/woocommerce';

console.log('=== WooCommerce Adapter Tests ===\n');

// Test 1: Purchase event
console.log('Test 1: WooCommerce purchase webhook → StandardEvent');
const wooPayload = {
  id: 12345,
  event: 'orders.created',
  customer: {
    email: 'customer@example.com',
    phone: '+1234567890',
    first_name: 'John',
    last_name: 'Doe'
  },
  total_price: '149.99',
  currency: 'EUR',
  line_items: [
    { product_id: 101, name: 'Product A', quantity: 2, price: '75.00' },
    { product_id: 102, name: 'Product B', quantity: 1, price: '49.99' }
  ],
  order_key: 'order_abc123',
  date_created: '2025-01-29T10:00:00Z',
};

const result = woocommerceAdapter(wooPayload as any);

console.assert(result.success === true, 'WooCommerce adapter should succeed');
console.assert(result.event?.eventName === 'purchase', 'Event should be purchase');
console.assert(result.event?.userData.email === 'customer@example.com', 'Email should be extracted');
console.assert(result.event?.userData.phone === '+1234567890', 'Phone should be extracted');
console.assert(result.event?.customData.value === 149.99, 'Total price should be converted to number');
console.assert(result.event?.customData.currency === 'EUR', 'Currency should be extracted');
console.assert(result.event?.customData.content_ids?.length === 3, 'Should extract product IDs and names');
console.assert(result.event?.customData.num_items === 3, 'Should calculate total quantity');
console.assert(result.event?.customData.order_id === 'order_abc123', 'Order key should be order_id');
console.log('✓ WooCommerce adapter test passed\n');

// Test 2: Event name mapping
console.log('Test 2: Multiple WooCommerce event types → purchase event');
const events = {
  'wc_orders.created': 'purchase',
  'orders.updated': 'purchase',
  'wc_orders.updated': 'purchase',
  orders_status_updated: 'purchase',
};

for (const [wooEvent, expectedEvent] of Object.entries(events)) {
  const payload = { id: 1, event: wooEvent };
  const r = woocommerceAdapter(payload as any);
  console.assert(r.event?.eventName === expectedEvent, `${wooEvent} should map to ${expectedEvent}`);
}

console.log('✓ Event mapping test passed\n');

console.log('=== All Tests Passed ✓ ===');