import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';
import { applyMarkdown } from '@/lib/markdown';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORE_INFO = `## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)
- Instagram: @salt_bread_official`;

const TONE_GUIDE = `## 톤 & 스타일 (반드시 준수)
- **솔트빵 파티시에가 직접 손님에게 메뉴를 소개하는 느낌**으로 캐주얼하게 작성
- 1인칭 시점으로 자연스럽게 ("오늘은 ~을 만들어봤어요", "사실 이 빵은~", "꼭 ~해보세요")
- 너무 광고스럽거나 격식 차린 표현 금지 (예: "프리미엄", "최고의", "신선한 재료로~" X)
- 친한 단골에게 말하듯 편안하게, 빵에 대한 애정과 디테일이 묻어나도록
- 마크다운 문법 적극 활용: **굵은 글씨**, *기울임*, > 인용, - 리스트, ## 헤더 등`;

function fallback(text: string) {
  return {
    title: '새 블로그 포스트',
    slug: `post-${Date.now().toString(36)}`,
    description: '솔트빵의 새로운 소식',
    content: `<p>${text}</p>`,
    tags: ['솔트빵', '소금빵'],
  };
}

/**
 * Validate <img src=""> URLs in HTML content. If the AI used a URL not in the
 * provided list (i.e. hallucinated/broken), replace it with a real one from
 * the list (cycling through). Out-of-list extras are removed.
 */
function fixImageUrls(html: string, providedUrls: string[]): string {
  if (providedUrls.length === 0) {
    return html.replace(/<img[^>]*>/gi, '');
  }
  let nextIdx = 0;
  return html.replace(/<img\b[^>]*?>/gi, (tag) => {
    const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : '';
    if (src && providedUrls.includes(src)) return tag;
    // Replace src with next available real URL
    const newUrl = providedUrls[nextIdx % providedUrls.length];
    nextIdx++;
    if (srcMatch) {
      return tag.replace(/src\s*=\s*["'][^"']+["']/i, `src="${newUrl}"`);
    }
    return tag.replace(/<img\b/i, `<img src="${newUrl}"`);
  });
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

  const prompt = `당신은 솔트빵(Salt,0)의 파티시에입니다. 직접 만든 소금빵을 손님들에게 캐주얼하게 소개하는 블로그 글을 써주세요.

${TONE_GUIDE}

## 작성 형식
- HTML로 작성하되 다음 태그를 적극 활용: \`<h2>\`, \`<h3>\`, \`<p>\`, \`<strong>\`, \`<em>\`, \`<blockquote>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<img>\`
- 본문 중간중간에 \`<img src="..."/>\` 로 사진 자연스럽게 삽입
- ⚠️ \`<img>\` 의 src에는 반드시 아래 "사용 가능한 이미지 URL"에서 정확히 복사한 URL만 사용 (절대 수정/생성 금지)
- 인용문구는 \`<blockquote>\` 태그로 (예: 빵 한 입 베어물었을 때의 느낌, 손님 후기 같은 분위기)
- 주요 키워드는 \`<strong>\` 으로 강조

## SEO
- 제목 60자 이내, 설명 155자 이내
- 본문 첫 문단에 핵심 키워드 자연스럽게 포함

${STORE_INFO}

## 사용 가능한 이미지 URL (반드시 이 중에서만 선택)
${urls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

## 응답 형식 (반드시 이 JSON 형식으로 순수 JSON만)
{
  "title": "...",
  "slug": "영문-케밥-케이스",
  "description": "...",
  "content": "<h2>...</h2><p><strong>...</strong>...</p><blockquote>...</blockquote><img src=\\"<위 URL 중 하나>\\"/>...",
  "tags": ["솔트빵", "...", ...]
}

마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

  try {
    const model = getGeminiModel();
    const result = await callGemini(
      () => model.generateContent([prompt, ...imageParts]),
      { logContext: { route: 'generate-blog', imageCount: urls.length, totalSize } }
    );
    const text = stripJsonFence(result.response.text());
    try {
      const post = JSON.parse(text);
      if (typeof post.content === 'string') {
        post.content = applyMarkdown(fixImageUrls(post.content, urls));
      }
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
