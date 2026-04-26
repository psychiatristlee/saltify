import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebaseAdmin';
import {
  callGemini, getGeminiModel, urlToImagePart, stripJsonFence, GeminiError, MODEL_NAME,
} from '@/lib/server/gemini';
import { applyMarkdown } from '@/lib/markdown';
import { fetchNaverPlaceContext, naverContextToPrompt } from '@/lib/server/naverPlace';

export const runtime = 'nodejs';
export const maxDuration = 300; // up to 5min for the whole batch

const CRON_SECRET = process.env.CRON_SECRET || '';
const PHOTOS_PER_POST = 4;

type Lang = 'ko' | 'en' | 'zh-CN' | 'ja';

interface MediaDoc {
  id: string;
  url: string;
  type: string;
  tags?: string[];
  createdAt?: Timestamp;
}

const LANG_NAME: Record<string, string> = {
  ko: '한국어 (Korean)',
  en: 'English',
  ja: '日本語 (Japanese)',
  'zh-CN': '简体中文 (Simplified Chinese)',
};

const STORE_INFO_BY_LANG: Record<string, string> = {
  ko: `매장명: 솔트빵 (Salt,0). 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분). 영업시간: 11:00-19:30 (일요일 휴무). Instagram: @salt_bread_official`,
  en: `Salt,0 Bakery, 1F 10 Donggyo-ro 39-gil, Mapo-gu, Seoul (Yeonnam-dong, 5 min from Hongik Univ. Stn). Hours: 11:00-19:30 (closed Sun). IG: @salt_bread_official`,
  ja: `ソルトパン Salt,0、ソウル特別市 麻浦区 東橋路39キル 10 1F (延南洞、弘大入口駅から徒歩5分)。営業時間: 11:00-19:30 (日曜定休)。Instagram: @salt_bread_official`,
  'zh-CN': `Salt,0 (솔트빵)，首尔特别市麻浦区东桥路39街10号1层 (延南洞，弘大入口站步行5分钟)。营业时间: 11:00-19:30 (周日休息)。Instagram: @salt_bread_official`,
};

const TONE_BY_LANG: Record<string, string> = {
  ko: `Salt,0 파티시에가 손님에게 메뉴를 직접 소개하는 1인칭 캐주얼톤. 광고 표현 금지.`,
  en: `First-person Salt,0 patissier voice introducing breads casually. No sales-y phrasing.`,
  ja: `Salt,0のパティシエが直接お客様にパンを紹介する1人称・カジュアルな口調。広告的な表現は避ける。`,
  'zh-CN': `Salt,0 烘焙师以第一人称亲切介绍面包，避免广告化措辞。`,
};

function fixImageUrls(html: string, providedUrls: string[]): string {
  if (providedUrls.length === 0) return html.replace(/<img[^>]*>/gi, '');
  let nextIdx = 0;
  return html.replace(/<img\b[^>]*?>/gi, (tag) => {
    const m = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    const src = m ? m[1] : '';
    if (src && providedUrls.includes(src)) return tag;
    const newUrl = providedUrls[nextIdx % providedUrls.length];
    nextIdx++;
    if (m) return tag.replace(/src\s*=\s*["'][^"']+["']/i, `src="${newUrl}"`);
    return tag.replace(/<img\b/i, `<img src="${newUrl}"`);
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

async function generatePostForLanguage(lang: Lang, urls: string[], naverContext: string) {
  const model = getGeminiModel();
  const tone = TONE_BY_LANG[lang] || TONE_BY_LANG.ko;
  const storeInfo = STORE_INFO_BY_LANG[lang] || STORE_INFO_BY_LANG.ko;

  const parts = await Promise.all(urls.slice(0, 8).map((u) => urlToImagePart(u)));
  const imageParts = parts.map((p) => p.part);

  const prompt = `You are the patissier at Salt,0 (솔트빵), a salt bread bakery.

⚠️ Write the entire post in ${LANG_NAME[lang]}. Title, description, body, and tags must be in ${LANG_NAME[lang]}.

Tone: ${tone}

## Format
- HTML body using <h2>/<h3>/<p>/<strong>/<em>/<blockquote>/<ul>/<li>/<img>
- Sprinkle photos via <img src="..."/>; src must exactly match one of the provided URLs
- Use <strong> for keywords, <blockquote> for sensory bites or reviews

## SEO
- title ≤60 chars, description ≤155 chars (in ${LANG_NAME[lang]})
- slug must be **English kebab-case** regardless of post language
- tags should be locally-searched terms in ${LANG_NAME[lang]}

Store info: ${storeInfo}

${naverContext}

Available image URLs (use exactly these):
${urls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Output (pure JSON only, no markdown fence):
{"title":"...","slug":"english-kebab","description":"...","content":"<h2>...</h2><p>...</p><img src=\\"...\\"/>","tags":["...","..."]}`;

  const result = await callGemini(
    () => model.generateContent([prompt, ...imageParts]),
    { logContext: { route: 'cron/auto-blog', lang, imageCount: urls.length } }
  );

  const raw = stripJsonFence(result.response.text());
  let post: { title: string; slug: string; description: string; content: string; tags: string[] };
  try {
    post = JSON.parse(raw);
  } catch {
    post = {
      title: 'Salt,0 새 포스트',
      slug: `post-${Date.now().toString(36)}`,
      description: '솔트빵의 새로운 소식',
      content: `<p>${raw}</p>`,
      tags: ['솔트빵'],
    };
  }
  if (typeof post.content === 'string') {
    post.content = applyMarkdown(fixImageUrls(post.content, urls));
  }
  return post;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const db = adminDb();

  // Load config
  const configSnap = await db.doc('blogConfig/default').get();
  const config = (configSnap.exists ? configSnap.data() : {}) as Record<string, unknown>;
  const dailyCounts = (config.dailyCounts as Record<Lang, number>) || ({} as Record<Lang, number>);
  const lastDate = (config.lastGeneratedDate as Partial<Record<Lang, string>>) || {};
  const autoPublish = config.autoPublish === true;

  // Load all media (for photo selection)
  const mediaSnap = await db.collection('mediaItems').orderBy('createdAt', 'desc').get();
  const allMedia: MediaDoc[] = mediaSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as MediaDoc));

  // Load images already used in any blog post
  const postsSnap = await db.collection('blogPosts').get();
  const usedUrls = new Set<string>();
  postsSnap.forEach((doc) => {
    const data = doc.data() as { images?: string[]; coverImage?: string };
    (data.images || []).forEach((u) => usedUrls.add(u));
    if (data.coverImage) usedUrls.add(data.coverImage);
  });

  // Build task list (skip langs already done today)
  const tasks: Array<{ lang: Lang; index: number }> = [];
  (Object.keys(dailyCounts) as Lang[]).forEach((lang) => {
    if (lastDate[lang] === today) return;
    const target = dailyCounts[lang] || 0;
    for (let i = 0; i < target; i++) tasks.push({ lang, index: i });
  });

  if (tasks.length === 0) {
    return NextResponse.json({ ok: true, message: 'nothing to do', today });
  }

  // Crawl Naver Place once per cron run — same context shared across all tasks
  let naverContext = '';
  try {
    const ctx = await fetchNaverPlaceContext();
    naverContext = naverContextToPrompt(ctx);
    console.log('[cron/auto-blog] naver context', {
      menus: ctx.menus.length, reviews: ctx.reviewSnippets.length,
    });
  } catch (err) {
    console.warn('[cron/auto-blog] naver fetch failed', err);
  }

  const usedThisRun = new Set(usedUrls);
  const summary = { generated: 0, failed: 0, skipped: 0, errors: [] as string[] };

  for (const task of tasks) {
    const available = allMedia
      .filter((m) => m.type === 'image' && !usedThisRun.has(m.url))
      .map((m) => ({
        ...m,
        score: (m.tags?.length || 0) * 1000 + (m.createdAt?.toMillis() || 0) / 1e9,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, PHOTOS_PER_POST);

    if (available.length === 0) {
      summary.skipped++;
      summary.errors.push(`${task.lang}: no available photos`);
      continue;
    }

    const urls = available.map((m) => m.url);
    try {
      const post = await generatePostForLanguage(task.lang, urls, naverContext);
      const cover = post.content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || urls[0];
      const slug = generateSlug(post.slug || post.title) + '-' + Date.now().toString(36);
      const now = Timestamp.now();
      const status = autoPublish ? 'published' : 'draft';

      await db.collection('blogPosts').add({
        title: post.title,
        slug,
        description: post.description,
        content: post.content,
        coverImage: cover,
        images: urls,
        tags: post.tags || [],
        language: task.lang,
        status,
        createdAt: now,
        updatedAt: now,
        publishedAt: status === 'published' ? now : null,
      });

      // Mark used so subsequent tasks in the same run don't reuse
      urls.forEach((u) => usedThisRun.add(u));

      // Mark this language done for today
      await db.doc('blogConfig/default').set(
        {
          [`lastGeneratedDate.${task.lang}`]: today,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      summary.generated++;
    } catch (err) {
      summary.failed++;
      const msg = err instanceof GeminiError
        ? `gemini ${err.status} attempts=${err.attempts}`
        : err instanceof Error ? err.message : 'unknown';
      summary.errors.push(`${task.lang}: ${msg}`);
      console.error('[cron/auto-blog] task failed', { lang: task.lang, err });
      // Stop further work on hard rate limit
      if (err instanceof GeminiError && err.status === 429) break;
    }
  }

  console.log('[cron/auto-blog] done', { today, summary, model: MODEL_NAME });
  return NextResponse.json({ ok: true, today, summary });
}
