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

// Shared shape — every icon is ONE whole salt bread, never cut, never paired.
const SALT_BREAD_SHAPE =
  'a single whole elongated salt bread (소금빵) shaped like a fat little ' +
  'crescent / oblong loaf. Two-tone color: deep caramelized golden-brown on ' +
  'the top arch, pale cream-white on the underside. Four shallow horizontal ' +
  'score lines across the top crust. Coarse white salt crystals (chunky ' +
  'pearl-salt) sprinkled on the very top.';

// All 7 icons: ONE whole bread, no cross-section, no paired bread, no slice.
// The signature feature must be visible from the OUTSIDE — for fillings, the
// filling oozes / peeks out through the score lines and the open ends so it's
// still loud at icon size.
const BREADS = [
  {
    id: 'plain',
    referencePath: 'game/public/breads/plain-naver.jpg',
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'NO toppings beyond the salt. NO seeds, NO herbs, NO filling, NO drip. ' +
      'The signature is the clean two-tone caramelized crust + 4 visible ' +
      'score marks + chunky white pearl-salt crystals scattered on top. ' +
      'It must be obvious this is the PLAIN baseline — bare, golden, salty.',
  },
  {
    id: 'everything',
    referencePath: 'game/public/breads/everything-naver.jpg',
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the ENTIRE TOP ARCH (about 70% of the visible surface) is ' +
      'completely encrusted with a dense everything-bagel topping mix: a thick ' +
      'crowd of black sesame seeds, white sesame seeds, poppy seeds, and small ' +
      'crispy onion flakes packed shoulder-to-shoulder. The dense seed coat is ' +
      'the dominant visual — barely any bare crust shows through, the top ' +
      'reads almost-black-with-flecks at a glance. Pale cream underside still ' +
      'visible for the salt-bread shape cue.',
  },
  {
    id: 'olive-cheese',
    referencePath: 'game/public/breads/olive-cheese-naver.jpg',
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the signature toppings sit boldly on TOP of the loaf so the icon ' +
      'reads at a glance: EXACTLY ONE single BLACK OLIVE RING pressed into ' +
      'the dead-center top of the crust (one olive only — not 2, not 3, ' +
      'just one prominent ring). Around the olive and from between the score ' +
      'lines, thick chunks of melted golden-yellow CHEESE visibly bubble out ' +
      'and ooze slightly down the sides. The single-olive + melted-cheese ' +
      'pair is the unmistakable signature — make the olive bold and the ' +
      'yellow cheese ooze pop. Coarse white salt sprinkled around.',
  },
  {
    id: 'basil-tomato',
    referencePath: 'game/public/breads/basil-tomato-naver.jpg',
    prompt:
      'Draw a single whole elongated salt bread (소금빵), shaped like a fat ' +
      'little crescent loaf. Same caramelized two-tone crust + score lines + ' +
      'pearl salt as a normal salt bread, BUT: ' +
      '(1) the entire crust is visibly speckled with tiny dark-green basil ' +
      'flakes baked into the dough — like a fine green confetti across the ' +
      'whole top, ' +
      '(2) bright RED chopped sun-dried tomato pieces are pushed up between ' +
      'the score lines and at the open ends of the loaf, very visible, almost ' +
      'spilling out — vivid red that pops against the brown crust, ' +
      '(3) a touch of green basil leaves visible alongside the red bits. ' +
      'The bold red-and-green topping is the unmistakable signature.',
  },
  {
    id: 'garlic-butter',
    referencePath: 'game/public/breads/garlic-butter-naver.jpg',
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the entire top arch is heavily dusted with bright fresh GREEN ' +
      'PARSLEY flakes — like a thick herby snowfall covering most of the top ' +
      'crust (the parsley layer is the dominant visual). On top of the parsley, ' +
      'add small chopped chunks of pale garlic and a few small glossy golden ' +
      'pools of melted butter pooled along the score lines, with one dramatic ' +
      'butter drip running down the side of the bread. Brown crust + heavy ' +
      'green coat + glossy yellow butter is the unmistakable signature combo.',
  },
  {
    id: 'seed-hotteok',
    referencePath: 'game/public/breads/hotteok-naver.jpg',
    prompt:
      `Draw ${SALT_BREAD_SHAPE} ` +
      'BUT the top has EXACTLY 3 LARGE WHOLE SEEDS pressed prominently into ' +
      'the crust, arranged in a clear triangle pattern (one near the top-' +
      'center toward the front of the loaf, one at the upper-left, one at ' +
      'the upper-right) — the triangular 3-seed arrangement is the most ' +
      'important visual cue. The seeds should be a mix: one green pumpkin ' +
      'seed (kernel), one beige sunflower-seed kernel, and one whole ' +
      'almond — all clearly visible, large enough to recognize, evenly ' +
      'spaced. Around the seeds, a small drizzle of dark caramel-brown ' +
      'syrup glosses the crust and shows that the loaf is filled with ' +
      'sweet hotteok filling. Coarse white salt sprinkled around the seeds. ' +
      'Three triangle-arranged seeds + caramel drizzle IS the signature.',
  },
  {
    id: 'choco-bun',
    referencePath: 'game/public/breads/choco-bun-naver.jpg',
    prompt:
      'Draw ONE single whole elongated bread (same shape as a salt bread). ' +
      'The entire top arch is covered with a MELON-BREAD / Mexican-concha ' +
      'style cocoa-cookie-dough topping — matte, dry, dark cocoa-brown, NOT ' +
      'a smooth chocolate glaze. The cocoa topping has cracked while baking, ' +
      'forming 3 or 4 jagged crackle lines that reveal pale golden bread ' +
      'showing through the cracks — high-contrast dark-brown / pale-yellow ' +
      'pattern is the dominant visual. The bottom underside of the loaf is ' +
      'still pale cream like a normal salt bread (so the salt-bread shape ' +
      'reads). NO smooth chocolate drip, NO shiny ganache. Cocoa-cookie ' +
      'crackle crust IS the signature.',
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
  // Optional filter: ONLY=olive-cheese,seed-hotteok node ...
  const onlyEnv = process.env.ONLY;
  const filter = onlyEnv ? new Set(onlyEnv.split(',').map((s) => s.trim())) : null;
  const targets = filter ? BREADS.filter((b) => filter.has(b.id)) : BREADS;
  if (targets.length === 0) {
    console.error(`No breads match ONLY=${onlyEnv}`);
    process.exit(1);
  }
  for (const bread of targets) {
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
