import { NextRequest, NextResponse } from 'next/server';
import {
  callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';
import { applyMarkdown } from '@/lib/markdown';
import { fetchNaverPlaceContext, naverContextToPrompt } from '@/lib/server/naverPlace';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORE_INFO_BY_LANG: Record<string, string> = {
  ko: `## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)
- Instagram: @salt_bread_official`,
  en: `## Store Info (weave in naturally if relevant)
- Name: Salt,0 (솔트빵)
- Location: 1F, 10 Donggyo-ro 39-gil, Mapo-gu, Seoul (Yeonnam-dong, 5 min walk from Hongik Univ. Stn)
- Hours: 11:00 - 19:30 (Closed Sundays / sells out daily)
- Instagram: @salt_bread_official`,
  ja: `## 店舗情報 (自然に織り交ぜて)
- 店名: ソルトパン Salt,0
- 所在地: ソウル特別市 麻浦区 東橋路39キル 10 1F (延南洞、弘大入口駅から徒歩5分)
- 営業時間: 11:00〜19:30 (日曜定休、売り切れ次第終了)
- Instagram: @salt_bread_official`,
  'zh-CN': `## 门店信息 (自然融入)
- 店名: Salt,0 (솔트빵)
- 地址: 首尔特别市 麻浦区 东桥路39街 10号 1层 (延南洞,弘大入口站步行5分钟)
- 营业时间: 11:00 - 19:30 (周日休息,售完即止)
- Instagram: @salt_bread_official`,
};

const TONE_BY_LANG: Record<string, string> = {
  ko: `## 톤 & 스타일 (반드시 준수)
- **솔트빵 파티시에가 직접 손님에게 메뉴를 소개하는 느낌**으로 캐주얼하게 작성
- 1인칭 시점으로 자연스럽게 ("오늘은 ~을 만들어봤어요", "사실 이 빵은~", "꼭 ~해보세요")
- 너무 광고스럽거나 격식 차린 표현 금지 (예: "프리미엄", "최고의", "신선한 재료로~" X)
- 친한 단골에게 말하듯 편안하게, 빵에 대한 애정과 디테일이 묻어나도록
- 마크다운 문법 적극 활용: **굵은 글씨**, *기울임*, > 인용, - 리스트, ## 헤더 등`,
  en: `## Tone & Style (mandatory)
- Write in **first-person voice as the Salt,0 patissier introducing each bread**
- Casual, warm, like chatting with a regular customer
- Avoid sales-y phrasing ("premium", "the finest", "freshest ingredients" — banned)
- Use markdown freely: **bold**, *italic*, > quote, - list, ## heading
- Keep cultural notes light — readers may not be in Korea yet`,
  ja: `## トーン&スタイル (必須)
- **ソルトパンのパティシエが直接お客様にパンを紹介する1人称**で、親しみやすく
- 「今日は〜を焼いてみました」「実はこのパン〜」のように自然な口調で
- 広告的・かしこまった表現は禁止 (「プレミアム」「最高級」「厳選素材」など NG)
- マークダウン文法を活用: **太字**、*斜体*、> 引用、- リスト、## 見出し`,
  'zh-CN': `## 语气与风格 (必须遵守)
- 以**Salt,0 烘焙师亲自向顾客介绍面包**的第一人称语气书写
- 像跟熟客聊天一样自然亲切
- 避免广告化、生硬的措辞 (如"高级"、"顶级"、"精选食材"等)
- 灵活使用 Markdown: **粗体**、*斜体*、> 引用、- 列表、## 标题`,
};

const LANG_NAME: Record<string, string> = {
  ko: '한국어 (Korean)',
  en: 'English',
  ja: '日本語 (Japanese)',
  'zh-CN': '简体中文 (Simplified Chinese)',
};

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
  const { imageUrls, language: rawLang } = (await req.json()) as {
    imageUrls: string[];
    language?: string;
  };
  const lang = (rawLang && LANG_NAME[rawLang]) ? rawLang : 'ko';
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

  const tone = TONE_BY_LANG[lang] || TONE_BY_LANG.ko;
  const storeInfo = STORE_INFO_BY_LANG[lang] || STORE_INFO_BY_LANG.ko;

  // Live Naver Place context — refetched on every blog generation so the
  // post never references menus/prices that don't actually exist.
  let naverContext = '';
  try {
    const ctx = await fetchNaverPlaceContext();
    naverContext = naverContextToPrompt(ctx);
    console.log('[generate-blog] naver context', {
      menus: ctx.menus.length,
      reviews: ctx.reviewSnippets.length,
    });
  } catch (err) {
    console.warn('[generate-blog] naver fetch failed', err);
  }

  const prompt = `You are the patissier at Salt,0 (솔트빵), a salt bread bakery in Seoul.

⚠️ WRITE THE ENTIRE BLOG POST IN ${LANG_NAME[lang]}. All title, description, content, and tags must be in ${LANG_NAME[lang]}.

${tone}

## Format
- Write the body in HTML using these tags freely: \`<h2>\`, \`<h3>\`, \`<p>\`, \`<strong>\`, \`<em>\`, \`<blockquote>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<img>\`
- Sprinkle photos through the body via \`<img src="..."/>\`
- ⚠️ \`<img>\` src MUST be an exact copy of one of the URLs in "Available image URLs" below. NEVER invent or modify URLs.
- Use \`<blockquote>\` for quotes (sensory bites, customer reviews)
- Use \`<strong>\` for key keywords

## SEO
- Title ≤ 60 chars, description ≤ 155 chars (both in ${LANG_NAME[lang]})
- Slug must be **English kebab-case** regardless of post language (e.g. "salt-bread-spring-menu")
- Tags should be terms locals search for in ${LANG_NAME[lang]}

${storeInfo}

${naverContext}

## Available image URLs (use exactly these)
${urls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

## Output (pure JSON only, no markdown fence)
{
  "title": "...",
  "slug": "english-kebab-case",
  "description": "...",
  "content": "<h2>...</h2><p>...</p><img src=\\"<one of above urls>\\"/>...",
  "tags": ["...", "..."]
}`;

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
