const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const SLOW_BEFORE = ['BMRN','BR','BLDR','DHR','DG','D','BBY','BDX','CCI','DDOG'];
  console.log('Before:', SLOW_BEFORE.join(', '), '— previously all >2s');
  console.log();
  for (const t of SLOW_BEFORE) {
    const times = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const t0 = Date.now();
      await page.goto(`https://sera.news/us-stocks/${t}?cb=${Date.now()}-${i}`, { waitUntil: 'load', timeout: 25000 }).catch(()=>{});
      times.push(Date.now() - t0);
      await ctx.close();
    }
    const avg = times.reduce((a,b)=>a+b,0)/times.length;
    const max = Math.max(...times);
    console.log(`  ${t.padEnd(6)} avg=${avg.toFixed(0)}ms max=${max}ms runs=[${times.map(t=>`${t}ms`).join(', ')}]`);
  }
  await browser.close();
})();
