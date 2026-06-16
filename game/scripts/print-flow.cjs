#!/usr/bin/env node
/**
 * Headless browser test for the 주문표 출력 (OrderTicket) component.
 *
 * Vite serves a dedicated entry (`/print-test.html` → `src/__print_test.tsx`)
 * that mounts OrderTicket with a fixed fake Order. We then assert:
 *   - pickup number, items, total, customer info, status, notes all render
 *   - window.print() is auto-fired once on mount
 *   - manual 🖨️ 인쇄 button re-fires print
 *   - 닫기 button triggers onClose
 *   - @media print rules are present in the loaded stylesheets
 *   - no uncaught JS errors
 */

const puppeteer = require('puppeteer');

const BASE = process.env.URL || 'http://localhost:5173';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (/Failed to load resource|the server responded with a status/.test(t)) return;
      errors.push('CONSOLEERR ' + t);
    }
  });

  let pass = 0, fail = 0;
  const results = [];
  function check(name, cond, detail) {
    if (cond) { pass++; results.push('  ✓ ' + name); }
    else      { fail++; results.push('  ✗ ' + name + (detail ? ('\n      ' + detail) : '')); }
  }

  await page.goto(BASE + '/print-test.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600)); // let React mount + autoPrint timer (50ms) fire

  const text = await page.evaluate(() => document.body.innerText);

  check('renders pickup number 0042', /0042/.test(text), 'snippet: ' + text.slice(0, 200));
  check('renders 플레인 소금빵', /플레인 소금빵/.test(text));
  check('renders 콜드브루 라떼', /콜드브루 라떼/.test(text));
  check('renders 제로슈가 밀크티', /제로슈가 밀크티/.test(text));
  check('renders total 20,000원', /20,000원/.test(text));
  check('renders line total 7,000원 (1 × 7000)', /7,000원/.test(text));
  check('renders line total 6,000원 (1 × 6000)', /6,000원/.test(text));
  check('renders line total 7,000원 for plain × 2 (3500*2)', /7,000원/.test(text));
  check('renders customer 홍길동', /홍길동/.test(text));
  check('renders phone 010-1234-5678', /010-1234-5678/.test(text));
  check('renders status 주문 접수', /주문 접수/.test(text));
  check('renders pickup date 2026-05-16', /2026-05-16/.test(text));
  check('renders notes label & content', /요청사항/.test(text) && /갈릭버터 잘 익은/.test(text));
  check('renders order id', /ORDER_TEST_42/.test(text));
  check('renders pickup hint', /픽업.*번호를 알려/.test(text));
  check('renders shop branding 솔트빵 Saltify', /솔트빵 Saltify/.test(text));

  const printed = await page.evaluate(() => window._printed || 0);
  check('window.print() invoked >=1 time on mount (got ' + printed + ')', printed >= 1);

  // Manual click on the in-overlay 🖨️ 인쇄 button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /인쇄/.test(b.textContent || ''));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 100));
  const printedAfter = await page.evaluate(() => window._printed || 0);
  check('manual 🖨️ 인쇄 click re-fires print (' + printed + ' → ' + printedAfter + ')', printedAfter > printed);

  // @media print rules loaded?
  const hasPrintCss = await page.evaluate(() => {
    let acc = '';
    for (const sheet of document.styleSheets) {
      try {
        for (const r of sheet.cssRules) acc += r.cssText + '\n';
      } catch {}
    }
    return /@media print/.test(acc);
  });
  check('@media print rules present in stylesheets', hasPrintCss);

  // The ticket is wrapped in data-ticket="order" for print scoping
  const ticketAttr = await page.$('[data-ticket="order"]');
  check('ticket DOM has data-ticket="order" marker', !!ticketAttr);

  // Close button
  const closeWorked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /닫기/.test(b.textContent || ''));
    if (btn) btn.click();
    return !!window._closedAt;
  });
  check('닫기 button fires onClose', closeWorked);

  check('no uncaught JS errors (got ' + errors.length + ')',
    errors.length === 0,
    errors.slice(0, 2).join(' | '));

  await browser.close();

  console.log('\n=========================================');
  console.log(' Print-flow smoke — ' + pass + ' passed, ' + fail + ' failed');
  console.log('=========================================');
  for (const line of results) console.log(line);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
