import express from 'express';
import 'dotenv/config';

// Environment variables
const { ADSENGINEER_API_KEY, PORT = 3000 } = process.env;

const app = express();
app.use(express.json()); // Parse JSON bodies

// Serve static files
app.use(express.static('public'));

// Status endpoint for connection check
app.get('/api/status', async (req, res) => {
  try {
    // Check AdsEngineer Cloudflare Workers connection
    const adsEngineerStatus = await checkAdsEngineerConnection();

    res.json({
      shopify_connected: true,
      adsengineer_connected: adsEngineerStatus.connected,
      last_check: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      shopify_connected: true,
      adsengineer_connected: false,
      error: error.message,
      last_check: new Date().toISOString()
    });
  }
});

// Webhook endpoint for order creation
app.post('/webhooks/orders-create', async (req, res) => {
  try {
    console.log('Received order webhook');
    const shop = req.headers['x-shopify-shop-domain'] || 'unknown-shop';
    await processOrderWebhook(JSON.stringify(req.body), shop);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error');
  }
});

// Webhook processing - simplified since server handles the logic
async function processOrderWebhook(body, shop) {
  try {
    const order = JSON.parse(body);

    console.log(`Processing order from ${shop}:`, {
      order_id: order.id,
      total_price: order.total_price,
      customer_email: order.customer?.email
    });

    // Send to AdsEngineer Cloudflare Workers Shopify webhook endpoint
    const response = await fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': shop,
        'X-Shopify-Topic': 'orders/create'
      },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      console.error('Failed to send data to AdsEngineer:', response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    } else {
      console.log('Successfully sent order data to AdsEngineer');
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
}

// GCLID extraction is now handled by the AdsEngineer server
// The full order object is sent and processed there

async function checkAdsEngineerConnection() {
  try {
    const response = await fetch('https://adsengineer-cloud.adsengineer.workers.dev/api/v1/health', {
      timeout: 5000
    });
    
    return {
      connected: response.ok,
      status: response.status,
      responseTime: Date.now()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      responseTime: Date.now()
    };
  }
}

// Main app route - shows status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>AdsEngineer Shopify Plugin</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { padding: 20px; border-radius: 5px; margin: 10px 0; }
            .connected { background: #d4edda; border: 1px solid #c3e6cb; }
            .disconnected { background: #f8d7da; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <h1>AdsEngineer Shopify Plugin</h1>
        <div id="status" class="status">Loading...</div>

        <script>
            async function checkStatus() {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();

                    const statusDiv = document.getElementById('status');
                    if (data.adsengineer_connected) {
                        statusDiv.className = 'status connected';
                        statusDiv.innerHTML = '✅ Connected to AdsEngineer';
                    } else {
                        statusDiv.className = 'status disconnected';
                        statusDiv.innerHTML = '❌ Disconnected from AdsEngineer';
                    }
                } catch (error) {
                    document.getElementById('status').innerHTML = '❌ Error checking status';
                }
            }

            checkStatus();
            setInterval(checkStatus, 30000);
        </script>
    </body>
    </html>
  `);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AdsEngineer Shopify Plugin running on port ${port}`);
});