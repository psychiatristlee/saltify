/* Desktop screenshots of the blog. */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BLOG = 'http://localhost:3001';
const OUT = '/tmp/saltify-audit';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });

  async function snap(url, name, w, h, fullPage = false) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
    await page.goto(BLOG + url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage });
    console.log('  ✓', name);
    await page.close();
  }

  await snap('/', 'blog-home-mobile', 412, 915);
  await snap('/', 'blog-home-desktop', 1280, 900);
  await snap('/blog', 'blog-list-mobile', 412, 915);
  await snap('/blog', 'blog-list-desktop', 1280, 900);

  await browser.close();
})();
