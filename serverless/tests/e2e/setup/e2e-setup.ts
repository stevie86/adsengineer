import { Browser, BrowserContext, chromium, Page } from 'playwright';

let browser: Browser;
let context: BrowserContext;
let page: Page;

export async function setupE2E() {
  browser = await chromium.launch({
    headless: process.env.CI === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });

  page = await context.newPage();
  await page.goto('http://localhost:3000');

  (global as any).page = page;
  (global as any).context = context;
  (global as any).browser = browser;
}

export async function cleanupE2E() {
  if (context) {
    await context.close();
  }
  if (browser) {
    await browser.close();
  }
}

export { page, context, browser };
