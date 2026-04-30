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
  // Cloud Run / Google Frontend strips/intercepts the Authorization header
  // for IAM purposes, so we use a custom header that passes through cleanly.
  const provided =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(req.url).searchParams.get('secret') ||
    '';
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    console.warn('[cron/auto-blog] unauthorized', {
      hasSecretEnv: Boolean(CRON_SECRET),
      hasHeader: Boolean(req.headers.get('x-cron-secret')),
      hasAuth: Boolean(req.headers.get('authorization')),
      hasQuery: Boolean(new URL(req.url).searchParams.get('secret')),
    });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const db = adminDb();

  // Query overrides — let an authorized caller bypass blogConfig for ad-hoc
  // runs. Same Bearer secret already proven above.
  const url = new URL(req.url);
  const langsParam = url.searchParams.get('langs');     // e.g. "en,ja,zh-CN"
  const countParam = url.searchParams.get('count');     // e.g. "1"
  const force = url.searchParams.get('force') === '1';  // ignore lastGeneratedDate
  const publishOverride = url.searchParams.get('publish'); // "1" → published, "0" → draft

  // Load config
  const configSnap = await db.doc('blogConfig/default').get();
  const config = (configSnap.exists ? configSnap.data() : {}) as Record<string, unknown>;
  const lastDate = (config.lastGeneratedDate as Partial<Record<Lang, string>>) || {};
  const baseAutoPublish = config.autoPublish === true;
  const autoPublish =
    publishOverride === '1' ? true :
    publishOverride === '0' ? false :
    baseAutoPublish;

  let dailyCounts: Record<Lang, number>;
  if (langsParam) {
    const validLangs: Lang[] = ['ko', 'en', 'zh-CN', 'ja'];
    const requested = langsParam.split(',').map((s) => s.trim()) as Lang[];
    const count = countParam ? Math.max(1, Math.min(5, parseInt(countParam, 10) || 1)) : 1;
    dailyCounts = {} as Record<Lang, number>;
    for (const l of validLangs) {
      dailyCounts[l] = requested.includes(l) ? count : 0;
    }
  } else {
    dailyCounts = (config.dailyCounts as Record<Lang, number>) || ({} as Record<Lang, number>);
  }

  // Load all media (for photo selection)
  const mediaSnap = await db.collection('mediaItems').orderBy('createdAt', 'desc').get();
  const allMedia: MediaDoc[] = mediaSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) } as MediaDoc));

  // Build usage map: image URL → most recent createdAt millis it was used in.
  // Used as a soft penalty in scoring (recently-used photos drop in score
  // but stay eligible) — photos can be reused across blog posts, just not
  // duplicated within one post.
  const postsSnap = await db.collection('blogPosts').get();
  const usageMap = new Map<string, number>();
  postsSnap.forEach((doc) => {
    const data = doc.data() as {
      images?: string[]; coverImage?: string; createdAt?: { toMillis(): number };
    };
    const ts = data.createdAt?.toMillis?.() ?? 0;
    const urls = new Set<string>();
    (data.images || []).forEach((u) => urls.add(u));
    if (data.coverImage) urls.add(data.coverImage);
    for (const u of urls) {
      const prev = usageMap.get(u) ?? 0;
      if (ts > prev) usageMap.set(u, ts);
    }
  });

  // Build task list. `force=1` skips the "already done today" idempotence
  // guard, which is needed for ad-hoc multi-lang catch-up runs.
  const tasks: Array<{ lang: Lang; index: number }> = [];
  (Object.keys(dailyCounts) as Lang[]).forEach((lang) => {
    if (!force && lastDate[lang] === today) return;
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

  // Track URLs already picked in *this run* so two simultaneously-generated
  // posts in the same cron tick don't end up with the same photos.
  const pickedThisRun = new Set<string>();
  const summary = { generated: 0, failed: 0, skipped: 0, errors: [] as string[] };

  const now = Date.now();
  const DAY_MS = 86_400_000;

  for (const task of tasks) {
    const available = allMedia
      .filter((m) => m.type === 'image' && !pickedThisRun.has(m.url))
      .map((m) => {
        const tagBonus = (m.tags?.length || 0) * 1000;
        const uploadFreshness = (m.createdAt?.toMillis() || 0) / 1e9;
        const lastUsedAt = usageMap.get(m.url) ?? 0;
        const daysSinceUsed = lastUsedAt
          ? Math.max(0, (now - lastUsedAt) / DAY_MS)
          : 999;
        // Recently used (last 14d) → up to -5000; never used → 0 penalty.
        const recencyPenalty = lastUsedAt
          ? Math.max(0, 5000 - daysSinceUsed * (5000 / 14))
          : 0;
        return { ...m, score: tagBonus + uploadFreshness - recencyPenalty };
      })
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
      const tsNow = Timestamp.now();
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
        createdAt: tsNow,
        updatedAt: tsNow,
        publishedAt: status === 'published' ? tsNow : null,
      });

      // Within this cron run, prevent picking the same URLs for another task
      urls.forEach((u) => pickedThisRun.add(u));
      // Update the usage map so the next task's recency penalty is correct
      urls.forEach((u) => usageMap.set(u, Date.now()));

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
