/**
 * Generate cartoon-style single-bread icons using Gemini's image generation
 * model, using each bread's Naver Place photo as a visual reference.
 *
 * Usage:
 *   GEMINI_API_KEY=$(firebase apphosting:secrets:access GEMINI_API_KEY --project saltify-game) \
 *     node scripts/generate-bread-icons.mjs
 *
 * Output:
 *   game/public/breads/{id}-icon.png
 *   blog/public/breads/{id}-icon.png   (mirrored)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

// Latest image-capable Gemini model. Falls back if the preview ID changes.
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

const BREADS = [
  {
    id: 'plain',
    referencePath: 'game/public/breads/plain-naver.jpg',
    prompt:
      'A single elongated salt bread (소금빵) shaped like a small crescent log. ' +
      'No toppings, plain golden-brown crust with light coarse salt sprinkles. ' +
      'One bread only, centered, isolated.',
  },
  {
    id: 'everything',
    referencePath: 'game/public/breads/everything-naver.jpg',
    prompt:
      'A single elongated salt bread topped with a generous mix of black sesame seeds, ' +
      'white sesame seeds, chia seeds, and chopped onion bits. Golden-brown crust. ' +
      'One bread only, centered, isolated.',
  },
  {
    id: 'olive-cheese',
    referencePath: 'game/public/breads/olive-cheese-naver.jpg',
    prompt:
      'A single elongated salt bread with visible black olive slices and melted cheese ' +
      'baked into the top. Golden crust with savory toppings. ' +
      'One bread only, centered, isolated.',
  },
  {
    id: 'basil-tomato',
    referencePath: 'game/public/breads/basil-tomato-naver.jpg',
    prompt:
      'A single elongated salt bread topped with bright green basil pesto and red ' +
      'sun-dried tomato pieces. Golden bread, vivid green and red toppings. ' +
      'One bread only, centered, isolated.',
  },
  {
    id: 'garlic-butter',
    referencePath: 'game/public/breads/garlic-butter-naver.jpg',
    prompt:
      'A single elongated salt bread glazed with golden garlic butter sauce, glossy ' +
      'shiny surface, with visible chopped garlic flecks. Rich golden-brown color. ' +
      'One bread only, centered, isolated.',
  },
  {
    id: 'seed-hotteok',
    referencePath: 'game/public/breads/hotteok-naver.jpg',
    prompt:
      'A single elongated salt bread topped with a pile of mixed nuts and seeds ' +
      '(pumpkin seeds, sunflower seeds, peanuts) with a hint of golden syrup. ' +
      'Korean hotteok-style salt bread. One bread only, centered, isolated.',
  },
  {
    id: 'choco-bun',
    referencePath: 'game/public/breads/choco-bun-naver.jpg',
    prompt:
      'A single elongated salt bread completely covered on top with a smooth, ' +
      'glossy dark-brown chocolate dough crust. The base bread shape is the same ' +
      'as a regular salt bread (long oval). The chocolate covering is matte, ' +
      'not a cube. One bread only, centered, isolated.',
  },
];

const STYLE_SUFFIX =
  ' Style: clean cartoon illustration, friendly children-book aesthetic, ' +
  'soft warm bakery palette, subtle drop shadow underneath the bread, ' +
  'pure white background, no plate, no packaging, no text, no watermark, ' +
  'no other objects. Square 1:1 framing, the bread fills about 70% of the canvas, ' +
  'centered. Suitable as a small game piece icon.';

async function generateOne(bread) {
  const refBuf = await readFile(join(ROOT, bread.referencePath));
  const refBase64 = refBuf.toString('base64');
  const refMime = bread.referencePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Use this reference photo to understand the bread variant, then ' +
              'redraw it as a cartoon icon for a mobile match-3 game.\n\n' +
              bread.prompt +
              STYLE_SUFFIX,
          },
          { inlineData: { mimeType: refMime, data: refBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      temperature: 0.7,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart) {
    throw new Error(`No image in response: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return Buffer.from(imgPart.inlineData.data, 'base64');
}

async function main() {
  for (const bread of BREADS) {
    process.stdout.write(`[${bread.id}] generating... `);
    try {
      const png = await generateOne(bread);
      await writeFile(join(ROOT, 'game/public/breads', `${bread.id}-icon.png`), png);
      await writeFile(join(ROOT, 'blog/public/breads', `${bread.id}-icon.png`), png);
      console.log(`ok (${(png.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    // Slight pacing to be nice to the API
    await new Promise((r) => setTimeout(r, 800));
  }
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
