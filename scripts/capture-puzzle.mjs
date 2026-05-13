/**
 * Quick screenshot of the puzzle game landing for visual comparison
 * against the tycoon HUD.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = join(__dirname, 'play-test-shots');

const VIEWPORT = { width: 430, height: 932 };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
});
const page = await ctx.newPage();
await page.goto('https://game.salt-bbang.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(SHOT_DIR, '00-puzzle-landing.png') });
await browser.close();
console.log('captured');
