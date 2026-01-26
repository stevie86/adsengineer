import { expect, test } from 'vitest';
import { browser, context, page } from '../setup/e2e-setup';

test.describe('Complete User Journey', () => {
  test.beforeEach(async () => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Agency Signup Flow', () => {
    test('should complete full signup process', async () => {
      await page.click('text=Join AdsEngineer');

      await page.fill('input[name="agency-name"]', 'Test E2E Agency');
      await page.fill('input[name="contact-name"]', 'E2E Test User');
      await page.fill('input[name="contact-email"]', 'e2e@test.com');
      await page.fill('input[name="website"]', 'https://e2e-test.com');
      await page.fill('input[name="phone"]', '+1234567890');

      await page.click('button:has-text("Next: Platforms & Experience")');
      await page.waitForSelector('text=Your marketing setup');

      await page.check('input[value="google-ads"]');
      await page.check('input[value="facebook-ads"]');
      await page.selectOption('select[name="monthly-spend"]', '5k-10k');
      await page.check('input[value="basic"]');

      await page.click('button:has-text("Next: Choose Plan")');
      await page.waitForSelector('text=Choose your plan');

      await page.click('text=Professional');
      await page.waitForSelector('text=Payment Information');

      await page.fill('iframe >> input[name="cardnumber"]', '4242424242424242');
      await page.fill('iframe >> input[name="exp-date"]', '12/28');
      await page.fill('iframe >> input[name="cvc"]', '123');
      await page.fill('input[name="cardholder-name"]', 'E2E Test User');

      await page.click('button:has-text("Start Free Trial")');
      await page.waitForSelector('text=Welcome to AdsEngineer!', { timeout: 15000 });

      await expect(page.locator('text=Welcome to AdsEngineer!')).toBeVisible();
      await expect(
        page.locator('text=Your account has been created and payment processed successfully')
      ).toBeVisible();
      await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
    });

    test('should validate form fields and show errors', async () => {
      await page.click('text=Join AdsEngineer');

      await page.click('button:has-text("Next: Platforms & Experience")');

      await expect(page.locator('text=Agency Name is required')).toBeVisible();
      await expect(page.locator('text=Contact Name is required')).toBeVisible();
      await expect(page.locator('text=Email Address is required')).toBeVisible();

      await page.fill('input[name="contact-email"]', 'invalid-email');
      await expect(page.locator('text=Invalid email format')).toBeVisible();
    });

    test('should handle payment failures gracefully', async () => {
      await page.click('text=Join AdsEngineer');

      await page.fill('input[name="agency-name"]', 'Test E2E Agency');
      await page.fill('input[name="contact-name"]', 'E2E Test User');
      await page.fill('input[name="contact-email"]', 'e2e@test.com');

      await page.click('button:has-text("Next: Platforms & Experience")');
      await page.click('button:has-text("Next: Choose Plan")');
      await page.click('text=Professional');

      await page.fill('iframe >> input[name="cardnumber"]', '4000000000000002');
      await page.click('button:has-text("Start Free Trial")');

      await expect(page.locator('text=Your card was declined')).toBeVisible();
    });
  });

  test.describe('Dashboard Functionality', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'e2e@test.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button:has-text("Sign In")');
      await page.waitForSelector('text=Welcome back', { timeout: 10000 });
    });

    test('should display dashboard with analytics', async () => {
      await expect(page.locator('text=Welcome back, E2E Test User!')).toBeVisible();
      await expect(page.locator('text=Test E2E Agency')).toBeVisible();

      await expect(page.locator('[data-testid="total-conversions"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversion-rate"]')).toBeVisible();
    });

    test('should allow site management', async () => {
      await page.click('button:has-text("Add Site")');
      await page.waitForSelector('text=Add New Site');

      await page.fill('input[name="site-name"]', 'E2E Test Site');
      await page.fill('input[name="site-url"]', 'https://e2e-site.com');
      await page.selectOption('select[name="platform"]', 'shopify');

      await page.click('button:has-text("Add Site")');
      await page.waitForSelector('text=Site added successfully');

      await expect(page.locator('text=E2E Test Site')).toBeVisible();
      await expect(page.locator('text=https://e2e-site.com')).toBeVisible();
    });

    test('should display analytics charts', async () => {
      await expect(page.locator('[data-testid="conversions-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="value-chart"]')).toBeVisible();

      await page.click('button:has-text("Date Range")');
      await page.click('text=Last 7 days');

      await page.waitForTimeout(2000);
      await expect(page.locator('[data-testid="chart-updated"]')).toBeVisible();
    });

    test('should export analytics data', async () => {
      await page.click('button:has-text("Export")');
      await page.click('text=Export as CSV');

      const downloadPromise = page.waitForEvent('download');
      await page.waitForTimeout(3000);

      await expect(downloadPromise).resolves.toBeDefined();
    });
  });

  test.describe('Custom Events Management', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'e2e@test.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button:has-text("Sign In")');
      await page.waitForSelector('text=Welcome back');

      await page.click('text=Custom Events');
      await page.waitForSelector('text=Event Definitions');
    });

    test('should create custom event definition', async () => {
      await page.click('button:has-text("Create Event")');
      await page.fill('input[name="event-name"]', 'High Value Purchase');
      await page.fill('input[name="description"]', 'Purchases over $1000');
      await page.fill('input[name="threshold"]', '1000');

      await page.click('button:has-text("Create Event Definition")');
      await page.waitForSelector('text=Event definition created');

      await expect(page.locator('text=High Value Purchase')).toBeVisible();
      await expect(page.locator('text=Purchases over $1000')).toBeVisible();
    });

    test('should assign events to sites', async () => {
      await page.click('text=Event Definitions');
      await page.click('button:has-text("Assign to Sites")');

      await page.check('input[name="site-1"]');
      await page.check('input[name="site-2"]');
      await page.selectOption('select[name="event-definition"]', 'High Value Purchase');

      await page.click('button:has-text("Assign Events")');
      await page.waitForSelector('text=Events assigned successfully');

      await expect(page.locator('text=High Value Purchase assigned to 2 sites')).toBeVisible();
    });

    test('should track custom events via tracking snippet', async () => {
      const trackingPage = await context.newPage();
      await trackingPage.goto('http://localhost:3000/tracking/snippet.js?siteId=site-123');

      const snippet = await trackingPage.content();
      await expect(snippet).toContain('window.AdsEngineer');
      await expect(snippet).toContain('site-123');
      await expect(snippet).toContain('track: function');

      await trackingPage.close();

      const testSitePage = await context.newPage();
      await testSitePage.setContent(`
        <html>
          <head><script>${snippet}</script></head>
          <body>
            <button onclick="window.AdsEngineer.track('test-purchase', 1500, {test: 'data'})">
              Track Event
            </button>
          </body>
        </html>
      `);

      await testSitePage.click('button:has-text("Track Event")');
      await testSitePage.waitForTimeout(2000);

      await page.goto('http://localhost:3000/dashboard');
      await page.reload();
      await page.waitForTimeout(3000);

      await expect(page.locator('text=test-purchase')).toBeVisible();
      await testSitePage.close();
    });
  });

  test.describe('Integration Testing', () => {
    test('should handle Shopify webhook integration', async () => {
      const webhookResponse = await page.request.post(
        'http://localhost:8090/api/v1/shopify/webhook',
        {
          data: {
            id: 123456789,
            email: 'shopify-customer@example.com',
            total_price: '150.00',
            currency: 'USD',
            created_at: new Date().toISOString(),
          },
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Hmac-Sha256': 'test-signature',
          },
        }
      );

      expect(webhookResponse.status()).toBe(200);

      await page.goto('http://localhost:3000/dashboard');
      await page.reload();
      await page.waitForTimeout(2000);

      await expect(page.locator('text=shopify-customer@example.com')).toBeVisible();
      await expect(page.locator('text=$150.00')).toBeVisible();
    });

    test('should handle Google Ads integration', async () => {
      await page.click('text=Settings');
      await page.click('text=Integrations');
      await page.click('text=Google Ads');

      await page.click('button:has-text("Connect Google Ads")');

      const popup = await context.waitForEvent('page');
      await popup.goto('https://accounts.google.com/oauth/authorize?client_id=test');

      await page.waitForTimeout(5000);

      await expect(page.locator('text=Google Ads connected')).toBeVisible();
      await expect(page.locator('text=Connected to test-account@google.com')).toBeVisible();
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle network interruptions gracefully', async () => {
      await page.route('**/api/v1/**', (route) => route.abort());

      await page.click('text=Analytics');

      await expect(page.locator('text=Connection failed')).toBeVisible();
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();

      await page.unroute('**/api/v1/**');
      await page.click('button:has-text("Retry")');

      await expect(page.locator('text=Analytics')).toBeVisible();
    });

    test('should maintain session during navigation', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForSelector('text=Welcome back');

      await page.goto('http://localhost:3000/analytics');
      await page.waitForSelector('text=Analytics');

      await expect(page.locator('text=Welcome back, E2E Test User!')).toBeVisible();
      await expect(page.locator('text=Test E2E Agency')).toBeVisible();

      await page.goto('http://localhost:3000/settings');
      await page.waitForSelector('text=Settings');

      await expect(page.locator('text=E2E Test User')).toBeVisible();
    });

    test('should handle concurrent user actions', async () => {
      const page2 = await context.newPage();
      await page2.goto('http://localhost:3000/login');
      await page2.fill('input[name="email"]', 'e2e2@test.com');
      await page2.fill('input[name="password"]', 'testpassword123');
      await page2.click('button:has-text("Sign In")');

      await page.goto('http://localhost:3000/sites');
      await page.click('button:has-text("Add Site")');
      await page.fill('input[name="site-name"]', 'Concurrent Site 1');

      await page2.goto('http://localhost:3000/sites');
      await page2.click('button:has-text("Add Site")');
      await page2.fill('input[name="site-name"]', 'Concurrent Site 2');

      await page.click('button:has-text("Add Site")');
      await page2.click('button:has-text("Add Site")');

      await expect(page.locator('text=Concurrent Site 1')).toBeVisible();
      await expect(page2.locator('text=Concurrent Site 2')).toBeVisible();

      await page2.close();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should adapt to mobile screen size', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('http://localhost:3000/dashboard');
      await page.waitForSelector('text=Welcome back');

      await expect(page.locator('nav.mobile-nav')).toBeVisible();
      await expect(page.locator('button:has-text("Menu")')).toBeVisible();

      await page.click('button:has-text("Menu")');
      await expect(page.locator('.mobile-menu')).toBeVisible();

      await expect(page.locator('.sidebar')).toBeHidden();
    });

    test('should adapt to tablet screen size', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('http://localhost:3000/dashboard');
      await page.waitForSelector('text=Welcome back');

      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('button:has-text("Menu")')).toBeHidden();
    });

    test('should handle touch gestures on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('http://localhost:3000/dashboard');

      const chart = page.locator('[data-testid="conversions-chart"]');
      await chart.scrollIntoViewIfNeeded();

      await page.touch.start({
        x: 200,
        y: 300,
      });
      await page.touch.move({
        x: 200,
        y: 200,
      });
      await page.touch.end();

      await page.waitForTimeout(1000);

      const isVisible = await chart.isVisible();
      expect(isVisible).toBe(true);
    });
  });
});
