/**
 * EOD-focused play-test: wait into the late afternoon, then snapshot
 * every 6s for 4 minutes, naming each shot with the visible game time
 * we can read out of the HUD via DOM. Lets us see whether EOD actually
 * fires and what blocks it.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = join(__dirname, 'play-test-shots', 'eod');
await mkdir(SHOT_DIR, { recursive: true });

const URL = 'https://game.salt-bbang.com/tycoon';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
const debugs = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  const t = m.text();
  if (t.startsWith('[tycoon-eod-debug]')) {
    debugs.push(t);
    console.log('  >>', t);
  } else if (m.type() === 'error') errors.push(t);
});

await page.goto(URL, { waitUntil: 'networkidle' });

async function readClock() {
  try {
    return await page.locator('header span').filter({ hasText: /\d\d:\d\d/ }).first().innerText({ timeout: 1000 });
  } catch { return '?'; }
}
async function readEod() {
  return await page.locator('text=영업 마감').count();
}

// Spam bake buttons for ~50s, then observe
const bakeButtons = page.locator('footer button').filter({ has: page.locator('img') });
const count = await bakeButtons.count();
console.log(`bake buttons: ${count}`);

const startMs = Date.now();
const totalMs = 220_000;  // ~3.7 min total
const interval = 6_000;

while (Date.now() - startMs < totalMs) {
  const clock = await readClock();
  const closed = clock === '19:30';
  if (!closed) {
    for (let i = 0; i < count; i++) {
      try { await bakeButtons.nth(i).click({ timeout: 400, force: true }); } catch {}
    }
  } else {
    // After close: keep the page "active" by moving the mouse over the
    // HUD so headless Chromium doesn't throttle RAF and freeze the
    // Pixi ticker (which would block the EOD condition from ever firing).
    await page.mouse.move(50, 50);
    await page.mouse.move(100, 100);
  }
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
  const eod = await readEod();
  const name = `t${elapsed.padStart(3, '0')}-clock-${clock.replace(':','')}-eod${eod}.png`;
  await page.screenshot({ path: join(SHOT_DIR, name) });
  console.log(`t=${elapsed}s  clock=${clock}  eodModal=${eod > 0 ? 'YES' : 'no'}  ${closed ? '[closed]' : ''}`);
  if (eod > 0) {
    console.log('EOD modal visible — opening shop');
    await page.locator('button', { hasText: '상점 열기' }).click({ force: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(SHOT_DIR, 'shop-oven.png') });
    // Cycle through every shop tab
    for (const tabName of ['굽기 속도', '진열대', '직원', '마케팅', '레시피', '분점']) {
      try {
        await page.locator('button', { hasText: tabName }).click({ force: true, timeout: 1500 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(SHOT_DIR, `shop-${tabName}.png`) });
      } catch { /* tab may not exist */ }
    }
    break;
  }
  await page.waitForTimeout(interval);
}

console.log('errors:', errors);
await browser.close();
