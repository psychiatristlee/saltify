import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini, getGeminiModel, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Body {
  content: string; // HTML body
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const html = (body.content || '').trim();
  if (!html) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  // Strip HTML tags for the model (text-only context for SEO meta)
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  const prompt = `당신은 솔트빵(Salt,0) 베이커리 블로그의 SEO 담당입니다. 아래 본문을 읽고 SEO 메타데이터를 생성해주세요.

== 본문 (HTML 태그 제거된 텍스트) ==
${text}

== 출력 (반드시 순수 JSON만) ==
{
  "title": "검색 노출 잘 되는 제목 (60자 이내, 핵심 키워드 포함)",
  "slug": "url-friendly-english-kebab-case-slug",
  "description": "메타 설명 (155자 이내, 핵심 키워드 자연스럽게 포함)",
  "tags": ["솔트빵", "홍대 소금빵", ... 5~10개]
}

규칙:
- title은 자연스럽고 클릭하고 싶은 톤으로 (광고 같지 않게)
- slug는 영문 소문자/하이픈만, 30자 이내, 본문 핵심 키워드 영문 표현
- description은 검색결과 미리보기에서 본문 요약처럼 보이도록
- tags는 검색량 있는 한국어 키워드 위주 (예: 홍대맛집, 연남동베이커리, 소금빵 등)
- 마크다운, 설명, 따옴표 외 텍스트 모두 금지. 순수 JSON만.`;

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent(prompt),
      { logContext: { route: 'generate-meta', textLen: text.length } }
    );
    const raw = stripJsonFence(result.response.text());
    try {
      const meta = JSON.parse(raw);
      return NextResponse.json({ meta, model: MODEL_NAME });
    } catch {
      return NextResponse.json({
        meta: {
          title: '솔트빵 새 블로그 포스트',
          slug: `post-${Date.now().toString(36)}`,
          description: text.slice(0, 150),
          tags: ['솔트빵', '소금빵', '홍대맛집'],
        },
        model: MODEL_NAME,
      });
    }
  } catch (err) {
    if (err instanceof GeminiError) {
      const httpStatus = err.status === 429 ? 429 : err.status === 503 ? 503 : 500;
      return NextResponse.json(
        { error: err.message, retryAfter: err.retryAfter, attempts: err.attempts },
        { status: httpStatus }
      );
    }
    const msg = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
