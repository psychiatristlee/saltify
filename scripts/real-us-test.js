const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const SAMPLES = ['AAPL','MSFT','TSLA','SPY','QQQ','TSM','AZN','JPM','BLD','PFE','XOM','UNH'];
  for (const t of SAMPLES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const url = `https://sera.news/us-stocks/${t}?cb=${Date.now()}`;
    const t0 = Date.now();
    let domLoaded = 0, loadEv = 0, contentVisible = 0;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      domLoaded = Date.now() - t0;
      await page.waitForLoadState('load', { timeout: 15000 }).catch(()=>{});
      loadEv = Date.now() - t0;
      // Time until financial section heading appears
      try {
        await page.waitForSelector('text=손익계산서', { timeout: 5000 });
        contentVisible = Date.now() - t0;
      } catch {
        contentVisible = -1;
      }
      // Inspect what's actually visible
      const hasNoData = await page.locator('text=데이터 없음').first().isVisible({ timeout: 500 }).catch(()=>false);
      const hasPrice = await page.locator('text=/\\$[0-9]+\\./').first().isVisible({ timeout: 500 }).catch(()=>false);
      const hasFinancials = await page.locator('text=손익계산서').first().isVisible({ timeout: 500 }).catch(()=>false);
      const hasBs = await page.locator('text=재무상태표').first().isVisible({ timeout: 500 }).catch(()=>false);
      console.log(`${t.padEnd(7)} dom=${domLoaded}ms load=${loadEv}ms financials=${contentVisible}ms | price:${hasPrice?'✓':'✗'} IS:${hasFinancials?'✓':'✗'} BS:${hasBs?'✓':'✗'} 데이터없음:${hasNoData?'⚠️':'-'}`);
    } catch (e) {
      console.log(`${t}: ERROR ${e.message.slice(0,80)}`);
    } finally {
      await ctx.close();
    }
  }
  await browser.close();
})();
