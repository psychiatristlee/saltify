import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORE_INFO = `## 매장 정보
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)
- Instagram: @salt_bread_official`;

interface Post {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  const { current, feedback, imageUrls } = (await req.json()) as {
    current: Post;
    feedback: string;
    imageUrls: string[];
  };

  if (!current || !feedback?.trim()) {
    return NextResponse.json({ error: 'current and feedback required' }, { status: 400 });
  }

  const urls = (imageUrls || []).slice(0, 8);
  let imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
  try {
    const parts = await Promise.all(urls.map((u) => urlToImagePart(u)));
    imageParts = parts.map((p) => p.part);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'image fetch failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const prompt = `당신은 솔트빵(Salt,0) 베이커리의 블로그 에디터입니다.

## 현재 블로그 초안 (JSON)
${JSON.stringify(current, null, 2)}

## 사용자의 수정 요청
${feedback}

## 임무
위 수정 요청을 반영하여 블로그 포스트를 개선하세요.
- 사용자가 구체적으로 요청하지 않은 부분은 그대로 유지
- SEO 최적화 유지 (제목 60자 이내, 설명 155자 이내)
- HTML 본문 구조 유지 (h2, h3, p, img)
- 한국어로 작성

${STORE_INFO}

## 응답 형식 (반드시 이 JSON 형식으로, 순수 JSON만)
{
  "title": "...",
  "slug": "...",
  "description": "...",
  "content": "<h2>...</h2>...",
  "tags": [...]
}

중요: 마크다운 없이 순수 JSON만 출력.`;

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent([prompt, ...imageParts]),
      { logContext: { route: 'refine-blog', imageCount: urls.length } }
    );
    const text = stripJsonFence(result.response.text());
    try {
      const post = JSON.parse(text);
      return NextResponse.json({ post, model: MODEL_NAME });
    } catch {
      return NextResponse.json({ post: current, model: MODEL_NAME });
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
