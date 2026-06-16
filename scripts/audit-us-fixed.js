const { chromium } = require('playwright');
const fs = require('fs');

const usCodes = fs.readFileSync('/tmp/us-codes.txt', 'utf8').trim().split('\n');
const BASE = 'https://sera.news';
const PARALLEL = 6;
const NAV_TIMEOUT_MS = 25000;

async function inspect(browser, code) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const url = `${BASE}/us-stocks/${code}`;
  const result = { code, error: null, ttfb: null, isRows: 0, bsRows: 0, isHeading: false, bsHeading: false };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    result.ttfb = Date.now() - t0;
    if (!resp || resp.status() !== 200) { result.error = `http ${resp?.status()}`; return result; }

    // US Pages use Korean locale by default → labels: 손익계산서 / 재무상태표 / 매출 / 자산총계
    result.isHeading = await page.locator('text=손익계산서').first().isVisible({ timeout: 2000 }).catch(() => false);
    result.bsHeading = await page.locator('text=재무상태표').first().isVisible({ timeout: 2000 }).catch(() => false);
    // Count rows in each table
    result.isRows = await page.locator('h3:has-text("손익계산서") ~ * tr, h3:has-text("손익계산서") + * tr').count().catch(() => 0);
    result.bsRows = await page.locator('h3:has-text("재무상태표") ~ * tr, h3:has-text("재무상태표") + * tr').count().catch(() => 0);
  } catch (e) {
    result.error = e.message.slice(0, 100);
  } finally {
    await ctx.close();
  }
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log(`US pages: ${usCodes.length}`);
  const results = [];
  let done = 0;
  let queue = [...usCodes];
  async function worker() {
    while (queue.length) {
      const code = queue.shift();
      try { results.push(await inspect(browser, code)); }
      catch (e) { results.push({ code, error: e.message }); }
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${usCodes.length}...`);
    }
  }
  await Promise.all(Array(PARALLEL).fill(0).map(() => worker()));
  await browser.close();
  fs.writeFileSync('/tmp/us-audit.json', JSON.stringify(results, null, 2));

  const fail = results.filter(r => r.error);
  const noIs = results.filter(r => !r.isHeading);
  const noBs = results.filter(r => !r.bsHeading);
  const slow = results.filter(r => r.ttfb && r.ttfb > 3000);
  const avgTtfb = results.filter(r => r.ttfb).reduce((s,r)=>s+r.ttfb,0) / results.filter(r => r.ttfb).length;
  console.log(`\n═══ US summary ═══`);
  console.log(`total: ${results.length}, failed: ${fail.length}, slow (>3s): ${slow.length}`);
  console.log(`avg TTFB: ${avgTtfb.toFixed(0)}ms`);
  console.log(`IS heading missing: ${noIs.length}`);
  console.log(`BS heading missing: ${noBs.length}`);
  if (noIs.length) console.log(`  examples: ${noIs.slice(0, 10).map(r=>r.code).join(', ')}`);
  if (fail.length) {
    console.log(`Failed:`);
    for (const f of fail.slice(0, 10)) console.log(`  ${f.code}: ${f.error}`);
  }
  if (slow.length) {
    console.log(`Slow:`);
    for (const s of slow.slice(0, 10)) console.log(`  ${s.code}: ${s.ttfb}ms`);
  }
})();
