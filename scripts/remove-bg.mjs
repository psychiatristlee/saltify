/**
 * Strip near-white background from a PNG by flood-filling alpha=0
 * starting from the image edges. This preserves white pixels INSIDE
 * the subject (eyes, paper, white shirt) because they aren't connected
 * to the edge.
 *
 * Usage: node scripts/remove-bg.mjs <in> <out>
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from '/Users/jungsoklee/saltify/blog/node_modules/sharp/lib/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WHITE_THRESHOLD = 232;       // R&G&B all above this → counts as background
const SOFT_THRESHOLD = 200;        // gradient zone → partial alpha for AA edges

async function stripBg(inputPath, outputPath) {
  const img = sharp(inputPath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const len = w * h;

  const visited = new Uint8Array(len);

  function isHardWhite(idx) {
    return data[idx] >= WHITE_THRESHOLD &&
           data[idx + 1] >= WHITE_THRESHOLD &&
           data[idx + 2] >= WHITE_THRESHOLD;
  }
  function isSoftWhite(idx) {
    return data[idx] >= SOFT_THRESHOLD &&
           data[idx + 1] >= SOFT_THRESHOLD &&
           data[idx + 2] >= SOFT_THRESHOLD;
  }

  // Stack-based flood fill from the edges. Pixels we touch get alpha=0;
  // we only continue propagating through pixels that are hard-white.
  const stack = [];
  function seedIfWhite(x, y) {
    const i = y * w + x;
    if (visited[i]) return;
    if (isHardWhite(i * 4)) {
      visited[i] = 1;
      stack.push(i);
    }
  }
  for (let x = 0; x < w; x++) {
    seedIfWhite(x, 0);
    seedIfWhite(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seedIfWhite(0, y);
    seedIfWhite(w - 1, y);
  }

  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    data[i * 4 + 3] = 0;

    if (x > 0)     { const ni = i - 1; if (!visited[ni] && isHardWhite(ni * 4)) { visited[ni] = 1; stack.push(ni); } }
    if (x < w - 1) { const ni = i + 1; if (!visited[ni] && isHardWhite(ni * 4)) { visited[ni] = 1; stack.push(ni); } }
    if (y > 0)     { const ni = i - w; if (!visited[ni] && isHardWhite(ni * 4)) { visited[ni] = 1; stack.push(ni); } }
    if (y < h - 1) { const ni = i + w; if (!visited[ni] && isHardWhite(ni * 4)) { visited[ni] = 1; stack.push(ni); } }
  }

  // Soft-edge pass: any pixel that borders a transparent neighbor and is
  // soft-white but not hard-white → partial alpha based on luminance, so
  // the AA outline doesn't show as a gray halo.
  // Walk over the whole image, no recursion, just one-pixel border check.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const idx = i * 4;
      if (data[idx + 3] === 0) continue;        // already transparent
      if (!isSoftWhite(idx)) continue;           // not in the gradient zone

      // Has a transparent neighbor?
      const neighbors = [];
      if (x > 0) neighbors.push(i - 1);
      if (x < w - 1) neighbors.push(i + 1);
      if (y > 0) neighbors.push(i - w);
      if (y < h - 1) neighbors.push(i + w);
      let touchesTransparent = false;
      for (const ni of neighbors) {
        if (data[ni * 4 + 3] === 0) { touchesTransparent = true; break; }
      }
      if (!touchesTransparent) continue;

      // Fade alpha proportional to (255 - whiteness)
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const t = (lum - SOFT_THRESHOLD) / (WHITE_THRESHOLD - SOFT_THRESHOLD); // 0..1
      data[idx + 3] = Math.max(0, Math.round((1 - t) * 255));
    }
  }

  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(outputPath);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const root = join(__dirname, '..');

  if (mode === '--breads') {
    // Strip the white background off every bread icon, then mirror the
    // result from game/ to blog/.
    const dir = join(root, 'game/public/breads');
    const blogDir = join(root, 'blog/public/breads');
    const { readdir, copyFile } = await import('node:fs/promises');
    const files = (await readdir(dir)).filter((f) => f.endsWith('-icon.png'));
    for (const f of files) {
      const inPath = join(dir, f);
      process.stdout.write(`[${f}] stripping bg... `);
      await stripBg(inPath, inPath);
      await copyFile(inPath, join(blogDir, f));
      console.log('ok');
    }
    return;
  }

  if (args.length === 0) {
    // Default: process all customer PNGs in place
    const dir = join(root, 'game/public/customers');
    const ids = ['commuter', 'tourist', 'student', 'evening'];
    for (const id of ids) {
      const p = join(dir, `${id}.png`);
      process.stdout.write(`[${id}] stripping bg... `);
      await stripBg(p, p);
      console.log('ok');
    }
    return;
  }
  if (args.length !== 2) {
    console.error('Usage: node remove-bg.mjs [<input> <output> | --breads]');
    process.exit(1);
  }
  await stripBg(args[0], args[1]);
  console.log('ok');
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
