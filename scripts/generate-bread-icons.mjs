/**
 * Generate cartoon bread icons that emphasize each menu's signature
 * visual feature (so they're distinguishable at a glance even at 60×60).
 *
 * Usage:
 *   GEMINI_API_KEY=$(firebase apphosting:secrets:access GEMINI_API_KEY --project saltify-game) \
 *     node scripts/generate-bread-icons.mjs
 *
 * Output: game/public/breads/{id}-icon.png + blog mirror.
 *
 * Approach: each prompt below was derived from inspecting the actual
 * Naver Place product photo. The first salt-bread shape rule applies
 * to ALL breads; per-bread differences are described as concretely as
 * possible (parsley dust vs. seed scatter, single olive vs. dense
 * sesame coat, melon-bread crackle vs. smooth glaze, etc.).
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

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

// Shared shape description — every salt bread (소금빵) has this base form.
const SALT_BREAD_SHAPE =
  'a small elongated salt bread (소금빵) shaped like a fat little crescent / oblong. ' +
  'Two-tone color: deep caramelized golden-brown on the top arch fading to pale ' +
  'cream-white on the underside. Four shallow horizontal score lines across the top ' +
  'crust. Coarse white salt crystals (chunky pearl-salt) sprinkled on the very top.';

// For breads where the SIGNATURE is on the inside (cross-section), we draw
// the loaf cut in half so the filling is visible. For breads where the
// signature is on the OUTSIDE, we draw a single whole loaf.
const BREADS = [
  {
    id: 'plain',
    referencePath: 'game/public/breads/plain-naver.jpg',
    cut: false,
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'NO toppings other than the salt. NO seeds, NO herbs, NO cream — ' +
      'this is the PLAIN variant. The signature feature is the clean two-tone ' +
      'crust + visible score marks + chunky salt crystals on top.',
  },
  {
    id: 'everything',
    referencePath: 'game/public/breads/everything-naver.jpg',
    cut: false,
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the entire top half of the bread is DENSELY COVERED with everything-bagel ' +
      'topping: thick layer of black sesame seeds, white sesame seeds, poppy seeds, ' +
      'and small white crispy onion flakes. The topping covers about 80% of the ' +
      'top crust — barely any plain crust shows through. The signature is the ' +
      'almost-black studded surface from the dense seed mix.',
  },
  {
    id: 'olive-cheese',
    referencePath: 'game/public/breads/olive-cheese-naver.jpg',
    cut: true,
    prompt:
      `Two breads side by side: a whole one and a half-cut one showing the cross section. ` +
      `Both are ${SALT_BREAD_SHAPE} ` +
      'The whole loaf has ONE single black olive ring placed dead-center on top + a ' +
      'sprinkle of coarse salt — that is the only visible topping on the outside. ' +
      'The CUT half is the signature view: cross-section densely studded with ' +
      'creamy white melted-cheese chunks AND chopped black olive pieces packed ' +
      'inside the white crumb. Make the cheese-and-olive cross-section visually ' +
      'unmistakable.',
  },
  {
    id: 'basil-tomato',
    referencePath: 'game/public/breads/basil-tomato-naver.jpg',
    cut: true,
    prompt:
      `Two breads side by side: a whole one and a half-cut one showing the cross section. ` +
      'Both are an elongated salt bread shape, but the dough itself is flecked ' +
      'with tiny dark-green basil specks throughout the crust (basil-pesto-infused ' +
      'dough — gives the crust a faint green-speckled look). The whole loaf has ' +
      'a small opening on top revealing a peek of bright red filling. ' +
      'The CUT half is the signature view: a bold red sun-dried-tomato + basil ' +
      'pesto filling pocket at the center of the cross-section, surrounded by ' +
      'white bread interior. Make the red-and-green filling visually loud.',
  },
  {
    id: 'garlic-butter',
    referencePath: 'game/public/breads/garlic-butter-naver.jpg',
    cut: false,
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the entire top is heavily dusted with bright fresh GREEN PARSLEY ' +
      'flakes — like a heavy snowfall of parsley covering most of the top crust. ' +
      'A small drip of glossy yellow garlic butter glistens at one end where it ' +
      'has soaked through. The signature feature is the dominant green parsley ' +
      'cover (like an herby green coat) — make it unmistakable that this is the ' +
      'GARLIC BUTTER variant by the heavy green dusting on the brown crust.',
  },
  {
    id: 'seed-hotteok',
    referencePath: 'game/public/breads/hotteok-naver.jpg',
    cut: true,
    prompt:
      `Two breads side by side: a whole one and a half-cut one showing the cross section. ` +
      `Both are ${SALT_BREAD_SHAPE} ` +
      'The whole loaf has a single small green pumpkin-seed kernel pressed into ' +
      'the top center as the only topping (besides salt). ' +
      'The CUT half is the signature view: cross-section oozing with sweet HOTTEOK ' +
      'filling — chopped peanuts, walnuts, pumpkin seeds bound in a glossy dark ' +
      'caramel-brown sugar syrup, dripping out of the cross-section. Make the ' +
      'caramel-and-nut filling visually loud and gooey.',
  },
  {
    id: 'choco-bun',
    referencePath: 'game/public/breads/choco-bun-naver.jpg',
    cut: false,
    prompt:
      'An elongated bread (same shape as a salt bread) but the entire top crust ' +
      'is covered with a MELON-BREAD style cocoa-cookie-dough topping — matte ' +
      'dark cocoa-brown color, NOT smooth glaze, but a textured cookie crust ' +
      'that has CRACKED while baking. Pale yellow bread underneath shows through ' +
      'the cracks in 3-4 jagged lines, creating a strong dark-brown / pale-yellow ' +
      'contrast. NO chocolate drip, NO smooth shine — the look is a craggy, ' +
      'dry, cocoa-cookie crust like Korean choco-bun (초코번) or Mexican concha. ' +
      'This dark crackle pattern IS the signature.',
  },
];

const STYLE_SUFFIX =
  ' Style: clean cartoon illustration, friendly children-book aesthetic, ' +
  'soft warm bakery palette, subtle drop shadow underneath. Pure white ' +
  'background, no plate, no packaging, no text, no watermark, no other ' +
  'objects. Square 1:1 framing, the bread fills about 75% of the canvas, ' +
  'centered. The signature features described above must be the FIRST thing ' +
  'a viewer notices even when the icon is shrunk to 60x60 pixels.';

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
              'Reference photo of the ACTUAL product (study it carefully — note ' +
              'the topping, the bread shape, the cross-section if shown):\n',
          },
          { inlineData: { mimeType: refMime, data: refBase64 } },
          {
            text:
              '\nNow draw a cartoon icon of this exact bread variant for a mobile ' +
              'match-3 game. The icon must be visually distinct from other salt ' +
              'bread variants (plain / everything / olive-cheese / basil-tomato / ' +
              'garlic-butter / seed-hotteok / choco-bun) — the player should ' +
              'recognize WHICH one this is at a glance.\n\n' +
              bread.prompt +
              STYLE_SUFFIX,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      temperature: 0.5,  // lower = more faithful to prompt
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
    await new Promise((r) => setTimeout(r, 800));
  }
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
