/**
 * Renders the web menu board (/menu/jp, /menu) to the PNG + PDF offered for
 * download on that page.
 *
 *   node scripts/render-menu-board.mjs
 *   BASE_URL=https://salt-bbang.com LANGS=ja,ko node scripts/render-menu-board.mjs
 *
 * Writes blog/public/menu-board/salt-bread-menu-<lang>.{png,pdf}. Re-run and
 * redeploy whenever blog/lib/breadData.ts changes, or the files go stale.
 * PW_CHANNEL=chrome uses the installed Google Chrome instead of Playwright's
 * bundled Chromium.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'blog', 'public', 'menu-board');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LANGS = (process.env.LANGS || 'ja').split(',');
const PATHS = { ko: '/menu', ja: '/menu/jp' };
// Matches .board max-width in blog/components/MenuBoard.module.css.
const BOARD_WIDTH = 905;

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
});

for (const lang of LANGS) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1400 },
    deviceScaleFactor: 2,
  });
  await page.goto(BASE_URL + PATHS[lang], { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const board = page.locator('[data-menu-board]');
  const out = join(OUT_DIR, `salt-bread-menu-${lang}`);
  await board.screenshot({ path: `${out}.png` });

  // A single page sized to the board, so it prints edge to edge.
  await page.emulateMedia({ media: 'print' });
  await page.setViewportSize({ width: BOARD_WIDTH, height: 1400 });
  const { height } = await board.boundingBox();
  await page.pdf({
    path: `${out}.pdf`,
    width: `${BOARD_WIDTH}px`,
    height: `${Math.ceil(height) + 2}px`,
    printBackground: true,
    pageRanges: '1',
  });

  await page.close();
  console.log(`${lang}: ${out}.png, ${out}.pdf`);
}

await browser.close();
