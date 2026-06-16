/* Capture screen + print-emulation snapshots of the OrderTicket. */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915 });
  await page.goto('http://localhost:5173/print-test.html', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: '/tmp/order-ticket-screen.png', fullPage: false });

  await page.emulateMedia('print');
  await page.pdf({
    path: '/tmp/order-ticket-print.pdf',
    width: '80mm',
    height: '180mm',
    printBackground: true,
    margin: { top: '4mm', right: '4mm', bottom: '4mm', left: '4mm' },
  });

  await browser.close();
  console.log('screen → /tmp/order-ticket-screen.png');
  console.log('print  → /tmp/order-ticket-print.pdf');
})();
