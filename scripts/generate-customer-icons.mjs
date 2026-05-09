/**
 * Generate cartoon customer character sprites for the tycoon mode,
 * one per persona. Each is a full-body standing pose, facing forward,
 * isolated on a white background, in the same cartoon style as the
 * bread icons so the whole scene feels coherent.
 */

import { writeFile } from 'node:fs/promises';
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

const PERSONAS = [
  {
    id: 'commuter',
    label: '출근족 직장인',
    prompt:
      'A young Korean office worker (commuter) standing facing the viewer. ' +
      'Wearing a crisp navy blue suit jacket over a white shirt, dark slacks, ' +
      'leather shoes. Holding a slim leather laptop bag in one hand and a ' +
      'phone in the other. Tidy short black hair, a slightly tired but ' +
      'determined expression — late-for-work energy. Mid-20s to early-30s.',
  },
  {
    id: 'tourist',
    label: '관광객',
    prompt:
      'A cheerful foreign tourist standing facing the viewer. Wearing a ' +
      'colorful t-shirt (yellow or coral), khaki cargo shorts, white sneakers, ' +
      'and a small camera hanging from the neck. A small backpack on one ' +
      'shoulder. Wide excited smile, sunglasses pushed up on the head, ' +
      'slightly tan skin. The pose conveys "exploring Hongdae for the first time".',
  },
  {
    id: 'student',
    label: '카공족 학생',
    prompt:
      'A Korean university student in cafe-study mode. Standing facing the ' +
      'viewer, wearing an oversized cream-colored hoodie, ripped denim jeans, ' +
      'and chunky white sneakers. A laptop tote bag slung over the shoulder, ' +
      'wireless earbuds in one ear, holding a tablet against the chest. Round ' +
      'glasses, messy bun (if female) or messy short hair (if male) — the ' +
      'image should feel cozy and a bit sleepy.',
  },
  {
    id: 'evening',
    label: '퇴근족',
    prompt:
      'A Korean working professional in the evening, on the way home. ' +
      'Standing facing the viewer, blazer slightly unbuttoned, tie loosened, ' +
      'sleeves slightly rolled up. Carrying a paper shopping bag in one hand ' +
      '(suggesting they are buying bread to bring home as a treat), and a ' +
      'phone in the other. Late 30s, soft warm smile, content end-of-day vibe.',
  },
];

const STYLE_SUFFIX =
  ' Style: clean cartoon character illustration, friendly children-book / ' +
  'mobile-game aesthetic. Thick clean outlines, soft warm lighting, vivid ' +
  'but not garish colors, subtle drop shadow at the feet. Pure white ' +
  'background, no scenery. Square 1:1 framing. Full body shown from head ' +
  'to toe, character fills about 80% of the canvas vertically, centered. ' +
  'The character is recognizable as their persona type from a single glance ' +
  'when shrunk to 80×120 pixels — outfit + posture must be the dominant ' +
  'distinguishing features, NOT facial detail.';

async function generateOne(persona) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: persona.prompt + STYLE_SUFFIX },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      temperature: 0.6,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('No image in response');
  return Buffer.from(imgPart.inlineData.data, 'base64');
}

async function main() {
  for (const p of PERSONAS) {
    process.stdout.write(`[${p.id}] ${p.label} ... `);
    try {
      const png = await generateOne(p);
      await writeFile(join(ROOT, 'game/public/customers', `${p.id}.png`), png);
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
