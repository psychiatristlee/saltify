import { NextRequest, NextResponse } from 'next/server';
import { callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME } from '@/lib/server/gemini';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';

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

  let imagePart: { inlineData: { data: string; mimeType: string } };
  let imageSize = 0;

  try {
    if (body.imageUrl) {
      const res = await urlToImagePart(body.imageUrl);
      imagePart = res.part;
      imageSize = res.size;
    } else if (body.imageBase64) {
      imagePart = {
        inlineData: { data: body.imageBase64, mimeType: body.mimeType || 'image/jpeg' },
      };
      // rough size from base64 length (*3/4 - padding)
      imageSize = Math.floor((body.imageBase64.length * 3) / 4);
    } else {
      return NextResponse.json({ error: 'imageUrl or imageBase64 required' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'image fetch failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const menuList = [...MENU_BREADS, ...MENU_DRINKS]
    .map((m) => `- ${m.id}: ${t(m.nameKey, 'ko')}`)
    .join('\n');

  const prompt = `당신은 솔트빵(Salt,0) 베이커리의 사진 분류 AI입니다.

## 솔트빵 전체 메뉴
${menuList}

## 임무
첨부된 사진에 보이는 메뉴들을 식별하여 id만 JSON 배열로 응답하세요.

## 판단 기준
- 사진에 메뉴가 명확히 보이면 해당 id 포함
- 여러 메뉴가 함께 있으면 모두 포함 (최대 5개)
- 빵의 종류를 구분하기 어려우면 가장 비슷한 메뉴를 합리적으로 추정
- 상세히 판단이 불가능한 경우(실루엣, 배경 등)에만 빈 배열 []

## 빵 식별 힌트
- plain: 토핑 없는 길쭉한 소금빵
- everything: 표면에 검은깨/참깨/양파 등 여러 토핑
- olive-cheese: 올리브(검은색)와 치즈가 보임
- basil-tomato: 녹색 바질과 붉은 토마토
- garlic-butter: 마늘/버터가 덧발린 모양, 광택있는 표면
- seed-hotteok: 땅콩/견과가 토핑
- chive-cream-cheese: 가운데 크림치즈, 쪽파(초록) 토핑
- salt-butter-tteok: 정사각형 떡(여러개), 굵은 소금
- choco-cream: 큐브형태, 초콜릿색 크림
- matcha-cream: 큐브형태, 녹색 크림
- cold-brew / cold-brew-latte / milk-tea: 컵에 담긴 음료

## 출력 형식
순수 JSON 배열만. 마크다운 없이.
예: ["plain","everything"]
빈 결과: []`;

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent([prompt, imagePart]),
      { logContext: { route: 'analyze-photo', imageSize } }
    );
    const text = stripJsonFence(result.response.text());
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ tags: [], model: MODEL_NAME, elapsedMs: Date.now() - started });
    }
    const validIds = new Set([...MENU_BREADS, ...MENU_DRINKS].map((m) => m.id));
    const tags = parsed.filter(
      (t: unknown): t is string => typeof t === 'string' && validIds.has(t)
    );
    console.log('[analyze-photo] success', {
      tags,
      model: MODEL_NAME,
      imageSize,
      elapsedMs: Date.now() - started,
    });
    return NextResponse.json({ tags, model: MODEL_NAME, elapsedMs: Date.now() - started });
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
