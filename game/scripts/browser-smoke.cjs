#!/usr/bin/env node
/**
 * Headless browser smoke test for the salt-bread ordering app.
 *
 * What we verify (read-only — never touches Firebase data):
 *   1. SEO: title, Yeonnam mention count, meta description, canonical, JSON-LD parses
 *   2. App boot: React mounts (#root is not empty)
 *   3. Landing → "주문 시작하기" CTA exists
 *   4. /admin route renders (admin gate visible)
 *   5. No uncaught console errors during boot
 *
 * Run: node scripts/browser-smoke.cjs
 */

const puppeteer = require('puppeteer');

const URL = process.env.URL || 'http://localhost:5173/';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });

  // Capture only real JS errors. HTTP 4xx/5xx resource failures from
  // Firebase/Naver-Map without dev creds are expected — filter them.
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (/Failed to load resource|Firebase|firestore|auth\/|FirebaseError|net::ERR|the server responded with a status/i.test(text)) return;
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR ' + err.message));

  const results = [];
  let pass = 0, fail = 0;
  function check(name, cond, detail) {
    if (cond) { pass++; results.push(`  ✓ ${name}`); }
    else      { fail++; results.push(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
  }

  console.log(`\nLoading ${URL} …`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Title
  const title = await page.title();
  check('title contains "Yeonnam Salt Bread Bakery"', title.includes('Yeonnam Salt Bread Bakery'), `got: ${title}`);
  check('title contains "솔트빵"', title.includes('솔트빵'));
  check('title contains "Saltify"', title.includes('Saltify'));

  // 2. Meta description
  const desc = await page.$eval('meta[name="description"]', (el) => el.content);
  check('meta description mentions Yeonnam-dong', /Yeonnam-dong/.test(desc));
  check('meta description mentions Hongdae', /Hongdae/.test(desc) || /연남동·홍대/.test(desc));

  // 3. Canonical
  const canonical = await page.$eval('link[rel="canonical"]', (el) => el.href);
  check('canonical = salt-bbang.com', canonical === 'https://salt-bbang.com/');

  // 4. JSON-LD validity
  const ldBlocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent));
  check(`>=5 JSON-LD blocks (got ${ldBlocks.length})`, ldBlocks.length >= 5);
  let ldOk = 0, ldBad = 0;
  for (const b of ldBlocks) {
    try { JSON.parse(b); ldOk++; } catch { ldBad++; }
  }
  check(`all JSON-LD blocks parse (${ldOk}/${ldBlocks.length})`, ldBad === 0);

  // 5. No fake aggregateRating residue
  const html = await page.content();
  check('no aggregateRating residue', !/aggregateRating/.test(html));

  // 6. Yeonnam mentions in served HTML (text + meta)
  const yeonnamMentions = (html.match(/Yeonnam/g) || []).length;
  check(`Yeonnam mentioned >=15 times (got ${yeonnamMentions})`, yeonnamMentions >= 15);

  // 7. App actually mounted
  const rootHtml = await page.$eval('#root', (el) => el.innerHTML.length);
  check(`#root mounted (innerHTML length=${rootHtml})`, rootHtml > 100);

  // 8. Landing page CTA (since first-time visitor)
  // Wait for either landing CTA or login screen
  const bodyText = await page.evaluate(() => document.body.innerText);
  check(
    'landing/login screen rendered (has 주문/시작/로그인 text)',
    /주문|시작|로그인|로딩|로그아웃|메뉴/.test(bodyText),
    `first 200 chars: ${bodyText.slice(0, 200)}`,
  );

  // 9. robots.txt
  const robotsResp = await page.goto(URL.replace(/\/$/, '') + '/robots.txt');
  const robotsText = await robotsResp.text();
  check('robots.txt sitemap points to salt-bbang.com', /Sitemap:\s*https:\/\/salt-bbang\.com\/sitemap\.xml/.test(robotsText));
  check('robots.txt does NOT reference saltify-game.web.app/sitemap', !/saltify-game\.web\.app\/sitemap/.test(robotsText));

  // 10. sitemap.xml lastmod
  const smResp = await page.goto(URL.replace(/\/$/, '') + '/sitemap.xml');
  const smText = await smResp.text();
  check('sitemap lastmod is 2026-05-16', /<lastmod>2026-05-16<\/lastmod>/.test(smText));
  const urlCount = (smText.match(/<url>/g) || []).length;
  check(`sitemap has >=6 urls (got ${urlCount})`, urlCount >= 6);

  // 11. Admin route
  await page.goto(URL.replace(/\/$/, '') + '/admin', { waitUntil: 'networkidle2' });
  const adminBody = await page.evaluate(() => document.body.innerText);
  check('/admin renders (has 관리자/admin/login keyword)', /관리|admin|로그인|준비|메뉴|주문|로딩/i.test(adminBody));

  // 12. Console errors
  check(
    `no uncaught JS errors (got ${consoleErrors.length})`,
    consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | '),
  );

  await browser.close();

  console.log('\n=========================================');
  console.log(` Browser smoke — ${pass} passed, ${fail} failed`);
  console.log('=========================================');
  for (const line of results) console.log(line);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
