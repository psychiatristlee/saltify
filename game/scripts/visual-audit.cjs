/* Capture screenshots of public routes for design review. */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = '/tmp/saltify-audit';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });

  async function snap(url, name, opts = {}) {
    const page = await browser.newPage();
    await page.setViewport({ width: opts.width || 412, height: opts.height || 915, deviceScaleFactor: 2 });
    if (opts.skipVisited) {
      // Don't preset saltify_visited
    } else {
      await page.goto(BASE);
      await page.evaluate(() => localStorage.setItem('saltify_visited', 'true'));
    }
    await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, opts.wait || 1200));
    const filePath = path.join(OUT, name + '.png');
    await page.screenshot({ path: filePath, fullPage: opts.fullPage || false });
    console.log('  ✓', name, '→', filePath);
    await page.close();
  }

  // Public pages (no auth)
  await snap('/', 'landing', { skipVisited: true, fullPage: true, height: 1800 });
  await snap('/', 'login');
  await snap('/admin', 'admin-gate');
  await snap('/privacy', 'privacy', { fullPage: true, height: 1400 });
  await snap('/terms', 'terms', { fullPage: true, height: 1400 });
  await snap('/account-deletion', 'account-deletion');

  // Fixtures (auth-gated tabs rendered standalone)
  await snap('/menu-fixture.html', 'tab-menu', { wait: 1500, fullPage: true, height: 1400 });
  await snap('/orders-fixture.html', 'tab-orders', { wait: 1500, fullPage: true, height: 1600 });
  await snap('/profile-fixture.html', 'tab-profile', { wait: 1500, fullPage: true, height: 1400 });

  // OrderTicket fixture
  await snap('/print-test.html', 'order-ticket');

  // Blog
  const BLOG = 'http://localhost:3001';
  async function snapBlog(url, name, opts = {}) {
    const page = await browser.newPage();
    await page.setViewport({ width: opts.width || 412, height: opts.height || 915, deviceScaleFactor: 2 });
    await page.goto(BLOG + url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, opts.wait || 1500));
    const filePath = path.join(OUT, name + '.png');
    await page.screenshot({ path: filePath, fullPage: opts.fullPage || false });
    console.log('  ✓', name, '→', filePath);
    await page.close();
  }
  await snapBlog('/', 'blog-home', { fullPage: true, height: 2000 });
  await snapBlog('/blog', 'blog-list', { fullPage: true, height: 1400 });

  await browser.close();
  console.log('\nAll screenshots in:', OUT);
})();
