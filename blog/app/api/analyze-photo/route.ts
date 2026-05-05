import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  callGemini, getGeminiModel, urlToImagePart, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Reference menu images (loaded from /public at first request, cached in memory).
// Provided to Gemini as few-shot examples — drastically improves recognition
// of similar-looking salt breads.
const REFERENCE_MENU = [
  { id: 'plain', name: '플레인 (토핑 없는 길쭉한 소금빵)', file: 'breads/plain.png' },
  { id: 'everything', name: '에브리띵 (검은깨/참깨/양파 등 토핑)', file: 'breads/everything.png' },
  { id: 'olive-cheese', name: '올리브치즈 (올리브와 치즈)', file: 'breads/olive-cheese.png' },
  { id: 'basil-tomato', name: '바질토마토 (녹색 바질, 빨간 토마토)', file: 'breads/basil-tomato.png' },
  { id: 'garlic-butter', name: '갈릭버터 (마늘과 버터, 광택)', file: 'breads/garlic-butter.png' },
  { id: 'seed-hotteok', name: '씨앗호떡 (견과류 토핑)', file: 'breads/hotteok.png' },
  // Cream-filled / coated specialty breads — these reference photos are
  // generic stand-ins; AI primarily uses the text hint below.
  { id: 'matcha-cream', name: '말차크림 (녹색 크림 충전)', file: 'brandings/cube-matcha-cream.png' },
  { id: 'choco-bun', name: '초코번 소금빵 (초콜릿 반죽이 빵 표면을 덮음)', file: 'brandings/cube-choco-cream.png' },
  // Drinks
  { id: 'milk-tea', name: '제로슈가 밀크티 (밀크티 컵)', file: 'breads/milktea.png' },
];

interface RefPart {
  id: string;
  name: string;
  part: { inlineData: { data: string; mimeType: string } };
}

let referencesPromise: Promise<RefPart[]> | null = null;

async function loadReferences(): Promise<RefPart[]> {
  if (referencesPromise) return referencesPromise;
  referencesPromise = (async () => {
    const baseDir = path.join(process.cwd(), 'public');
    const results: RefPart[] = [];
    for (const ref of REFERENCE_MENU) {
      try {
        const buf = await fs.readFile(path.join(baseDir, ref.file));
        results.push({
          id: ref.id,
          name: ref.name,
          part: { inlineData: { data: buf.toString('base64'), mimeType: 'image/png' } },
        });
      } catch (err) {
        console.warn('[analyze-photo] reference image missing', ref.file, err);
      }
    }
    return results;
  })();
  // If load fails, allow retry on next call
  referencesPromise.catch(() => { referencesPromise = null; });
  return referencesPromise;
}

/**
 * Lenient JSON array extraction — Gemini sometimes wraps the array in
 * commentary or markdown despite instructions.
 */
function extractMenuIds(text: string, validIds: Set<string>): string[] {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 1) Direct JSON parse
  try {
    const v = JSON.parse(stripped);
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === 'string' && validIds.has(x));
    }
  } catch {
    // continue
  }

  // 2) Find first JSON-array-like substring
  const m = stripped.match(/\[[^\[\]]*\]/);
  if (m) {
    try {
      const v = JSON.parse(m[0]);
      if (Array.isArray(v)) {
        return v.filter((x): x is string => typeof x === 'string' && validIds.has(x));
      }
    } catch {
      // continue
    }
  }

  // 3) Last resort: scan for known IDs in the text
  const found: string[] = [];
  for (const id of validIds) {
    const re = new RegExp(`\\b${id.replace(/-/g, '[-_]?')}\\b`, 'i');
    if (re.test(stripped)) found.push(id);
  }
  return found;
}

interface Body {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

export async function POST(req: NextRequest) {
  const started = Date.now();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  let targetPart: { inlineData: { data: string; mimeType: string } };
  let imageSize = 0;
  try {
    if (body.imageUrl) {
      const r = await urlToImagePart(body.imageUrl);
      targetPart = r.part;
      imageSize = r.size;
    } else if (body.imageBase64) {
      targetPart = {
        inlineData: { data: body.imageBase64, mimeType: body.mimeType || 'image/jpeg' },
      };
      imageSize = Math.floor((body.imageBase64.length * 3) / 4);
    } else {
      return NextResponse.json({ error: 'imageUrl or imageBase64 required' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'image fetch failed' },
      { status: 400 }
    );
  }

  const validIds = new Set([...MENU_BREADS, ...MENU_DRINKS].map((m) => m.id));
  const drinkList = MENU_DRINKS
    .map((m) => `- ${m.id}: ${t(m.nameKey, 'ko')}`)
    .join('\n');

  // Build the prompt parts:
  //   [intro] + [ref image, label]*N + [target image, instruction]
  const refs = await loadReferences();
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  parts.push({
    text: `당신은 솔트빵(Salt,0) 베이커리의 사진 분류 전문가입니다.

먼저 솔트빵의 메뉴 참조 이미지들을 보여드리겠습니다. 각 이미지 다음에 메뉴 ID와 설명이 있습니다. 이 이미지들을 잘 보고 시각적 특징을 학습한 후, 마지막에 제시된 사진을 분류해야 합니다.

== 메뉴 참조 이미지 ==`,
  });

  for (const ref of refs) {
    parts.push(ref.part);
    parts.push({ text: `\n→ id: "${ref.id}" / ${ref.name}\n` });
  }

  parts.push({
    text: `

== 시각적 식별 힌트 (참조 사진과 별개로 적용) ==
- choco-bun (초코번 소금빵): 소금빵 위에 갈색/짙은 코코아 색의 부드러운 반죽이 덮여 있어
  표면이 매끈하고 갈색. 단면을 자르면 안에 진한 초코크림이 보임. 모양은 일반 소금빵과
  같은 길쭉한 형태. (참조 이미지의 "큐브" 모양과 달리 길쭉함)
- matcha-cream (말차크림): 일반 길쭉한 소금빵 형태인데, 단면을 자르면 진한 녹색 크림이
  안에 가득 차 있음. 표면은 보통의 소금빵 색. 큐브 형태가 아님.

== 음료 ==
${drinkList}
※ 음료는 컵/병에 담겨 있고 빵과 명확히 다름

== 분석 대상 사진 ==
다음 사진을 위 참조 이미지들과 비교해서 어떤 메뉴가 보이는지 식별하세요:`,
  });

  parts.push(targetPart);

  parts.push({
    text: `

== 출력 규칙 ==
- 사진에 메뉴가 명확히 보이면 해당 id 포함
- 여러 메뉴가 함께 있으면 모두 포함
- 비슷해 보이는데 100% 확신이 없어도, 가장 비슷한 메뉴 1개는 추정해서 포함
- 메뉴 id가 아닌 어떤 텍스트도 출력하지 말 것 (설명, 이유, 마크다운 모두 금지)
- 정말 빵/음료가 사진에 전혀 없을 때만 [] 출력

== 응답 형식 ==
순수 JSON 배열 1개만 출력. 예시:
["plain","everything"]
또는
["garlic-butter"]
또는
[]

지금 응답:`,
  });

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent(parts),
      { logContext: { route: 'analyze-photo', imageSize, refCount: refs.length } }
    );
    const rawText = result.response.text();
    const tags = extractMenuIds(rawText, validIds);
    console.log('[analyze-photo] success', {
      tags,
      raw: rawText.slice(0, 200),
      model: MODEL_NAME,
      imageSize,
      elapsedMs: Date.now() - started,
    });
    return NextResponse.json({
      tags,
      model: MODEL_NAME,
      elapsedMs: Date.now() - started,
      raw: rawText.slice(0, 500), // for debugging
    });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error('[analyze-photo] final failure', {
        status: err.status,
        retryAfter: err.retryAfter,
        attempts: err.attempts,
        model: MODEL_NAME,
        imageSize,
      });
      const httpStatus = err.status === 429 ? 429 : err.status === 503 ? 503 : 500;
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfter, attempts: err.attempts },
        { status: httpStatus }
      );
    }
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[analyze-photo] unexpected error', { msg, imageSize });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
