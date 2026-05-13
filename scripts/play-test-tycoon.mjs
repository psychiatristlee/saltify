/**
 * Headless play-test of the deployed tycoon mode.
 *
 * Navigates to game.salt-bbang.com/tycoon, takes screenshots through the
 * core loop (entry → live game → mid-day → end-of-day → shop). Captures
 * console errors so we can spot anything broken in production.
 *
 * Outputs PNGs to scripts/play-test-shots/.
 */

import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = join(__dirname, 'play-test-shots');
await mkdir(SHOT_DIR, { recursive: true });

const URL_BASE = process.env.PLAY_URL || 'https://game.salt-bbang.com';

const VIEWPORT = { width: 430, height: 932 };  // iPhone 14 Pro Max-ish

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await ctx.newPage();

  const consoleEvents = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleEvents.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleEvents.push(`[pageerror] ${err.message}`);
  });

  console.log('→ landing page');
  await page.goto(`${URL_BASE}/tycoon`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(SHOT_DIR, '01-initial.png'), fullPage: false });

  console.log('→ waiting 6s into live day (should show customers + counters moving)');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: join(SHOT_DIR, '02-early-day.png') });

  console.log('→ trying to tap each bake button');
  // Find the bake-bar buttons (heuristic: they have an <img> inside)
  const bakeButtons = page.locator('footer button').filter({ has: page.locator('img') });
  const count = await bakeButtons.count();
  console.log(`   found ${count} bake buttons`);
  for (let i = 0; i < count; i++) {
    try {
      await bakeButtons.nth(i).click({ timeout: 1000, force: true });
      await page.waitForTimeout(200);
    } catch (e) {
      console.log(`   bake button ${i} click failed: ${e.message.slice(0, 80)}`);
    }
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(SHOT_DIR, '03-after-bake-taps.png') });

  console.log('→ midday (game time should be 13-15:00)');
  await page.waitForTimeout(45000);
  await page.screenshot({ path: join(SHOT_DIR, '04-midday.png') });

  // Auto-bake to keep stock alive
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < count; i++) {
      try { await bakeButtons.nth(i).click({ timeout: 600, force: true }); } catch {}
    }
    await page.waitForTimeout(8000);
  }

  console.log('→ near end-of-day');
  await page.waitForTimeout(40000);
  await page.screenshot({ path: join(SHOT_DIR, '05-late-day.png') });

  console.log('→ waiting for end-of-day modal');
  try {
    await page.waitForSelector('text=영업 마감', { timeout: 180000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(SHOT_DIR, '06-end-of-day.png') });

    console.log('→ opening shop');
    const shopBtn = page.locator('button', { hasText: '상점 열기' });
    await shopBtn.click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(SHOT_DIR, '07-shop-oven.png') });

    // Click each category tab and screenshot
    const tabs = ['굽기 속도', '진열대', '직원', '마케팅', '레시피', '분점'];
    for (const t of tabs) {
      try {
        await page.locator('button', { hasText: t }).click({ timeout: 1500, force: true });
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(SHOT_DIR, `07-shop-${t}.png`) });
      } catch (e) {
        console.log(`   tab "${t}" click failed`);
      }
    }
  } catch (e) {
    console.log('   end-of-day modal not seen — capturing fallback shot');
    await page.screenshot({ path: join(SHOT_DIR, '06-no-eod.png') });
  }

  console.log('\n=== console events ===');
  for (const e of consoleEvents) console.log(e);

  await browser.close();
}

main().catch((err) => { console.error('fatal:', err); process.exit(1); });
