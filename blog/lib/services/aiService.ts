import { GoogleGenerativeAI } from '@google/generative-ai';
import { MENU_BREADS, MENU_DRINKS } from '../breadData';
import { t } from '../i18n';

// Client-side Gemini - API key will be set from environment
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

/**
 * Convert File (from upload) to base64 for Gemini
 */
async function fileToGeminiPart(file: File) {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return {
    inlineData: {
      data: base64,
      mimeType: file.type || 'image/jpeg',
    },
  };
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Gemini 호출을 재시도 + 지수 백오프로 감싼다. 429/503 같은 rate-limit에 대응.
 */
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, baseDelayMs = 2000 } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err instanceof Error ? err.message : err);
      const isRateLimit = /429|resource exhausted|rate.?limit|quota/i.test(msg);
      const isRetryable = isRateLimit || /503|temporarily|unavailable/i.test(msg);
      if (!isRetryable || i === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, i);
      console.warn(`Gemini rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

/**
 * 사진을 분석해서 솔트빵 메뉴들 중 해당하는 것을 자동 태그한다.
 * 메뉴가 전혀 보이지 않거나 API 실패 시 빈 배열 반환.
 */
export async function analyzePhotoForMenuTags(file: File): Promise<string[]> {
  if (!file.type.startsWith('image/')) return [];

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const menuList = [...MENU_BREADS, ...MENU_DRINKS]
    .map((m) => `- ${m.id}: ${t(m.nameKey, 'ko')} — ${t(m.descKey, 'ko')}`)
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
    const imagePart = await fileToGeminiPart(file);
    const result = await callGeminiWithRetry(() =>
      model.generateContent([prompt, imagePart])
    );
    const text = result.response.text().trim();
    console.log('[auto-tag] Gemini response:', text);
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const tags = JSON.parse(jsonStr);
    if (!Array.isArray(tags)) return [];
    const validIds = new Set([...MENU_BREADS, ...MENU_DRINKS].map((m) => m.id));
    const filtered = tags.filter((t: unknown): t is string => typeof t === 'string' && validIds.has(t));
    console.log('[auto-tag] filtered tags:', filtered);
    return filtered;
  } catch (err) {
    console.error('analyzePhotoForMenuTags failed:', err);
    return [];
  }
}

export interface GeneratedPost {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
}

const STORE_INFO = `## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00 - 19:30 (일요일 휴무, 소진시 마감)
- Instagram: @salt_bread_official`;

async function urlsToImageParts(imageUrls: string[]) {
  return Promise.all(
    imageUrls.slice(0, 8).map(async (url) => {
      const res = await fetch(url);
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return {
        inlineData: { data: base64, mimeType: blob.type || 'image/jpeg' },
      };
    })
  );
}

function parseGeneratedPost(text: string, fallback?: GeneratedPost): GeneratedPost {
  const jsonStr = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(jsonStr) as GeneratedPost;
  } catch {
    return (
      fallback || {
        title: '새 블로그 포스트',
        slug: `post-${Date.now().toString(36)}`,
        description: '솔트빵의 새로운 소식',
        content: `<p>${text}</p>`,
        tags: ['솔트빵', '소금빵'],
      }
    );
  }
}

export async function generateBlogPost(imageUrls: string[]): Promise<GeneratedPost> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imageParts = await urlsToImageParts(imageUrls);

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

이미지 URL 목록: ${JSON.stringify(imageUrls)}

중요: 반드시 유효한 JSON만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

  const result = await callGeminiWithRetry(() =>
    model.generateContent([prompt, ...imageParts])
  );
  return parseGeneratedPost(result.response.text());
}

/**
 * 사용자 피드백을 받아 현재 draft를 수정한다. 인터랙티브 리파인먼트용.
 */
export async function refineBlogPost(
  current: GeneratedPost,
  userFeedback: string,
  imageUrls: string[]
): Promise<GeneratedPost> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imageParts = await urlsToImageParts(imageUrls);

  const prompt = `당신은 솔트빵(Salt,0) 베이커리의 블로그 에디터입니다.

## 현재 블로그 초안 (JSON)
${JSON.stringify(current, null, 2)}

## 사용자의 수정 요청
${userFeedback}

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

  const result = await callGeminiWithRetry(() =>
    model.generateContent([prompt, ...imageParts])
  );
  return parseGeneratedPost(result.response.text(), current);
}
