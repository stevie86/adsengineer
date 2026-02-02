import { woocommerceAdapter } from './src/workers/multi-platform-tracking/src/adapters/woocommerce';

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

console.log('success:', result.success);
console.log('eventName:', result.event?.eventName);
console.log('userData:', JSON.stringify(result.event?.userData, null, 2));
console.log('customData:', JSON.stringify(result.event?.customData, null, 2));
console.log('timestamp:', result.event?.timestamp);
