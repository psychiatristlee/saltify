/**
 * Capture the puzzle game board to verify the new transparent-bg bread
 * icons render correctly on top of the colored cell backgrounds.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = join(__dirname, 'play-test-shots');

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
});
const page = await ctx.newPage();

await page.goto('https://game.salt-bbang.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(SHOT_DIR, 'puzzle-landing-newbg.png') });

// Try to navigate into the actual puzzle game (Start Game button)
try {
  await page.locator('button', { hasText: /시작|Start/ }).first().click({ timeout: 3000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(SHOT_DIR, 'puzzle-login-or-board.png') });
} catch (e) {
  console.log('start button not found:', e.message.slice(0, 80));
}

await browser.close();
console.log('done');
