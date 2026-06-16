const { chromium } = require('playwright');
const fs = require('fs');
const krCodes = fs.readFileSync('/tmp/kr-codes.txt','utf8').trim().split('\n');
const usCodes = fs.readFileSync('/tmp/us-codes.txt','utf8').trim().split('\n');

const KR_TABS = [
  { id: 'income',    label: '손익계산서', sentinel: '매출액' },
  { id: 'balance',   label: '재무상태표', sentinel: '자산총계' },
  { id: 'cashflow',  label: '현금흐름표', sentinel: '영업활동' },
  { id: 'quarterly', label: '분기 실적',  sentinel: '매출' },
  { id: 'ratios',    label: '재무비율',   sentinel: '이익률' },
];

async function auditKr(browser, code) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const url = `https://sera.news/stocks/${code}?cb=${Date.now()}`;
  const out = { kind:'kr', code, url, initialLoad:null, error:null, tabs:{} };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil:'domcontentloaded', timeout:20000 });
    out.initialLoad = Date.now() - t0;
    if (!resp || resp.status() !== 200) { out.error = `http ${resp?.status()}`; return out; }
    for (const tab of KR_TABS) {
      const t1 = Date.now();
      try {
        await page.locator(`button:has-text("${tab.label}")`).first().click({ timeout:4000 });
        await page.waitForSelector(`text=${tab.sentinel}`, { timeout:5000 });
        out.tabs[tab.id] = { ms: Date.now() - t1, visible: true };
      } catch (e) {
        out.tabs[tab.id] = { ms: Date.now() - t1, visible: false, err: e.message.slice(0,60) };
      }
    }
  } catch (e) {
    out.error = e.message.slice(0,80);
  } finally {
    await ctx.close();
  }
  return out;
}

async function auditUs(browser, code) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const url = `https://sera.news/us-stocks/${code}?cb=${Date.now()}`;
  const out = { kind:'us', code, url, initialLoad:null, error:null, hasIS:false, hasBS:false, hasNoData:false, hasPrice:false };
  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil:'domcontentloaded', timeout:20000 });
    out.initialLoad = Date.now() - t0;
    if (!resp || resp.status() !== 200) { out.error = `http ${resp?.status()}`; return out; }
    await page.waitForLoadState('load', { timeout: 12000 }).catch(()=>{});
    out.hasPrice    = await page.locator('text=/\\$[0-9]+\\./').first().isVisible({ timeout:1500 }).catch(()=>false);
    out.hasIS       = await page.locator('text=손익계산서').first().isVisible({ timeout:1500 }).catch(()=>false);
    out.hasBS       = await page.locator('text=재무상태표').first().isVisible({ timeout:1500 }).catch(()=>false);
    out.hasNoData   = await page.locator('text=데이터 없음').first().isVisible({ timeout:500 }).catch(()=>false);
  } catch (e) {
    out.error = e.message.slice(0,80);
  } finally {
    await ctx.close();
  }
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const queue = [
    ...krCodes.map(c => ({ k:'kr', c })),
    ...usCodes.map(c => ({ k:'us', c })),
  ];
  console.log(`Total pages: ${queue.length}`);
  let done = 0;
  const PARALLEL = 8;
  async function worker() {
    while (queue.length) {
      const t = queue.shift();
      try {
        const r = t.k==='kr' ? await auditKr(browser,t.c) : await auditUs(browser,t.c);
        results.push(r);
      } catch (e) { results.push({ ...t, error: e.message }); }
      done++;
      if (done % 40 === 0) {
        const recentAvg = results.slice(-40).filter(r=>r.initialLoad).reduce((s,r)=>s+r.initialLoad,0) / 40;
        console.log(`  ${done}/${queue.length+done} avg recent load=${recentAvg.toFixed(0)}ms`);
      }
    }
  }
  await Promise.all(Array(PARALLEL).fill(0).map(()=>worker()));
  await browser.close();
  fs.writeFileSync('/tmp/all-tabs-audit.json', JSON.stringify(results, null, 2));

  const kr = results.filter(r => r.kind==='kr');
  const us = results.filter(r => r.kind==='us');
  console.log(`\n══════ KR (${kr.length}) ══════`);
  const krFail = kr.filter(r=>r.error);
  console.log(`failed: ${krFail.length}`);
  const krSlow = kr.filter(r => r.initialLoad && r.initialLoad > 2000);
  console.log(`slow initial (>2s): ${krSlow.length}`);
  console.log(`avg initial load: ${(kr.filter(r=>r.initialLoad).reduce((s,r)=>s+r.initialLoad,0)/kr.filter(r=>r.initialLoad).length).toFixed(0)}ms`);
  for (const tab of KR_TABS) {
    const ok = kr.filter(r => r.tabs?.[tab.id]?.visible).length;
    const fail = kr.length - ok;
    const avgMs = kr.filter(r=>r.tabs?.[tab.id]?.visible).reduce((s,r)=>s+r.tabs[tab.id].ms,0) / Math.max(1, ok);
    console.log(`  ${tab.label.padEnd(10)} 표시:${ok}/${kr.length} (실패 ${fail}) avg ${avgMs.toFixed(0)}ms`);
  }

  console.log(`\n══════ US (${us.length}) ══════`);
  const usFail = us.filter(r=>r.error);
  console.log(`failed: ${usFail.length}`);
  const usSlow = us.filter(r => r.initialLoad && r.initialLoad > 2000);
  console.log(`slow (>2s): ${usSlow.length}`);
  console.log(`avg load: ${(us.filter(r=>r.initialLoad).reduce((s,r)=>s+r.initialLoad,0)/us.filter(r=>r.initialLoad).length).toFixed(0)}ms`);
  console.log(`has price (시세): ${us.filter(r=>r.hasPrice).length}/${us.length}`);
  console.log(`has 손익계산서: ${us.filter(r=>r.hasIS).length}/${us.length}`);
  console.log(`has 재무상태표: ${us.filter(r=>r.hasBS).length}/${us.length}`);
  console.log(`shows "데이터 없음": ${us.filter(r=>r.hasNoData).length}/${us.length}`);

  // Slowest 10 per kind
  console.log('\nKR slowest 10:');
  kr.filter(r=>r.initialLoad).sort((a,b)=>b.initialLoad-a.initialLoad).slice(0,10).forEach(r=>console.log(`  ${r.code}: ${r.initialLoad}ms`));
  console.log('\nUS slowest 10:');
  us.filter(r=>r.initialLoad).sort((a,b)=>b.initialLoad-a.initialLoad).slice(0,10).forEach(r=>console.log(`  ${r.code}: ${r.initialLoad}ms`));
})();
