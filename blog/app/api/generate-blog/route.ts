import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORE_INFO = `## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)
- Instagram: @salt_bread_official`;

function fallback(text: string) {
  return {
    title: '새 블로그 포스트',
    slug: `post-${Date.now().toString(36)}`,
    description: '솔트빵의 새로운 소식',
    content: `<p>${text}</p>`,
    tags: ['솔트빵', '소금빵'],
  };
}

export async function POST(req: NextRequest) {
  const { imageUrls } = (await req.json()) as { imageUrls: string[] };
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'imageUrls required' }, { status: 400 });
  }

  const urls = imageUrls.slice(0, 8);
  let imageParts: Array<{ inlineData: { data: string; mimeType: string } }>;
  let totalSize = 0;
  try {
    const parts = await Promise.all(urls.map((u) => urlToImagePart(u)));
    imageParts = parts.map((p) => p.part);
    totalSize = parts.reduce((sum, p) => sum + p.size, 0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'image fetch failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const prompt = `당신은 서울 홍대/연남동에 위치한 수제 소금빵 전문 베이커리 "솔트빵(Salt,0)"의 블로그 에디터입니다.

첨부된 사진들을 보고 블로그 포스트를 작성해주세요.

## 작성 규칙
- 따뜻하고 친근한 톤으로 작성
- 사진 속 내용을 자연스럽게 묘사하며 스토리텔링
- HTML 형식으로 본문 작성 (h2, h3, p, img 태그 사용)
- 이미지는 본문 중간중간에 자연스럽게 배치 (img 태그에 src로 원본 URL 사용)
- SEO에 최적화된 제목과 설명문 작성
- 한국어로 작성

${STORE_INFO}

## 응답 형식 (반드시 이 JSON 형식으로)
{
  "title": "SEO 최적화된 블로그 제목 (60자 이내)",
  "slug": "영문-케밥-케이스-슬러그",
  "description": "SEO 메타 설명문 (155자 이내, 핵심 키워드 포함)",
  "content": "<h2>...</h2><p>...</p><img src=\\"...\\" alt=\\"...\\"/>...",
  "tags": ["소금빵", "홍대맛집", "연남동", ...]
}

이미지 URL 목록: ${JSON.stringify(urls)}

중요: 반드시 유효한 JSON만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent([prompt, ...imageParts]),
      { logContext: { route: 'generate-blog', imageCount: urls.length, totalSize } }
    );
    const text = stripJsonFence(result.response.text());
    try {
      const post = JSON.parse(text);
      return NextResponse.json({ post, model: MODEL_NAME });
    } catch {
      return NextResponse.json({ post: fallback(text), model: MODEL_NAME });
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
