const { chromium } = require('playwright');
const fs = require('fs');

const krCodes = fs.readFileSync('/tmp/kr-codes.txt', 'utf8').trim().split('\n');
const usCodes = fs.readFileSync('/tmp/us-codes.txt', 'utf8').trim().split('\n');

const BASE = 'https://sera.news';
const PARALLEL = 6;
const NAV_TIMEOUT_MS = 25000;

// Returns { ok, msIncome, msBalance, isRows, bsRows, error }
async function inspectStock(browser, kind, code) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const url = kind === 'kr' ? `${BASE}/stocks/${code}` : `${BASE}/us-stocks/${code}`;
  const result = { kind, code, url, error: null, ttfb: null, msIncome: null, msBalance: null, isRows: 0, bsRows: 0 };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    result.ttfb = Date.now() - t0;
    if (!resp || resp.status() !== 200) { result.error = `http ${resp?.status()}`; return result; }

    // Click 손익계산서 / Income Statement tab
    const incomeSelector = kind === 'kr'
      ? 'button:has-text("손익계산서")'
      : 'h3:has-text("Income Statement"), h3:has-text("손익계산서")';
    if (kind === 'kr') {
      const t1 = Date.now();
      await page.locator(incomeSelector).first().click({ timeout: 5000 }).catch(()=>{});
      await page.waitForSelector('text=매출액', { timeout: 5000 }).catch(()=>{});
      result.msIncome = Date.now() - t1;
      // Count numeric cells in IS table
      result.isRows = await page.locator('table:has-text("매출액") tr').count();
    } else {
      // US is a single page with no tabs — all sections inline
      result.msIncome = 0;
      result.isRows = await page.locator('text=Revenue').count();
    }

    if (kind === 'kr') {
      const t2 = Date.now();
      await page.locator('button:has-text("재무상태표")').first().click({ timeout: 5000 }).catch(()=>{});
      await page.waitForSelector('text=자산총계', { timeout: 5000 }).catch(()=>{});
      result.msBalance = Date.now() - t2;
      result.bsRows = await page.locator('table:has-text("자산총계") tr').count();
    } else {
      result.msBalance = 0;
      result.bsRows = await page.locator('text=Total Assets').count();
    }
  } catch (e) {
    result.error = e.message.slice(0, 100);
  } finally {
    await ctx.close();
  }
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const all = [
    ...krCodes.map(c => ({ kind: 'kr', code: c })),
    ...usCodes.map(c => ({ kind: 'us', code: c })),
  ];
  console.log(`Total pages to audit: ${all.length}`);

  const results = [];
  let done = 0;
  // Worker pool of PARALLEL concurrent inspections
  async function worker() {
    while (true) {
      const next = all.shift();
      if (!next) break;
      try {
        const r = await inspectStock(browser, next.kind, next.code);
        results.push(r);
      } catch (e) {
        results.push({ kind: next.kind, code: next.code, error: e.message });
      }
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${all.length + done} done...`);
    }
  }
  const workers = Array(PARALLEL).fill(0).map(() => worker());
  await Promise.all(workers);
  await browser.close();

  fs.writeFileSync('/tmp/page-audit.json', JSON.stringify(results, null, 2));

  // Summarize
  const failed = results.filter(r => r.error);
  const krResults = results.filter(r => r.kind === 'kr');
  const usResults = results.filter(r => r.kind === 'us');
  const slow = results.filter(r => r.ttfb && r.ttfb > 3000);
  console.log(`\n═══ summary ═══`);
  console.log(`total: ${results.length}, failed: ${failed.length}, slow (>3s): ${slow.length}`);
  const avgTtfb = results.filter(r => r.ttfb).reduce((s,r)=>s+r.ttfb,0) / results.filter(r => r.ttfb).length;
  console.log(`avg TTFB: ${avgTtfb.toFixed(0)}ms`);

  console.log(`\nKR: ${krResults.length}, with IS rows > 5: ${krResults.filter(r=>r.isRows>5).length}, BS rows > 5: ${krResults.filter(r=>r.bsRows>5).length}`);
  console.log(`US: ${usResults.length}, IS visible: ${usResults.filter(r=>r.isRows>0).length}, BS visible: ${usResults.filter(r=>r.bsRows>0).length}`);

  if (failed.length) {
    console.log(`\nFailed pages (first 10):`);
    for (const f of failed.slice(0, 10)) console.log(`  ${f.kind}/${f.code}: ${f.error}`);
  }
  if (slow.length) {
    console.log(`\nSlow pages (first 10):`);
    for (const s of slow.slice(0, 10)) console.log(`  ${s.kind}/${s.code}: ${s.ttfb}ms`);
  }
})();
