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

/**
 * 사진을 분석해서 솔트빵 메뉴들 중 해당하는 것을 자동 태그한다.
 * 메뉴가 전혀 보이지 않으면 빈 배열 반환.
 */
export async function analyzePhotoForMenuTags(file: File): Promise<string[]> {
  if (!file.type.startsWith('image/')) return [];

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const menuList = [...MENU_BREADS, ...MENU_DRINKS]
    .map((m) => `- ${m.id}: ${t(m.nameKey, 'ko')} — ${t(m.descKey, 'ko')}`)
    .join('\n');

  const prompt = `당신은 솔트빵(Salt,0) 베이커리의 사진 분류 전문가입니다.

## 솔트빵 메뉴 목록
${menuList}

## 임무
첨부된 사진을 보고, 사진에 나타나는 메뉴의 id들을 JSON 배열로만 응답하세요.

## 규칙
- 사진에 보이는 메뉴가 위 목록의 어떤 id에 해당하는지 판단
- 여러 메뉴가 함께 찍힌 경우 모두 포함
- 확신이 높은 메뉴만 포함 (추측은 제외)
- 메뉴가 전혀 안 보이면 빈 배열 []
- 반드시 id만 사용 (예: "plain", "choco-cream")
- 마크다운 없이 순수 JSON 배열만 출력

예시 응답: ["plain", "everything"]`;

  try {
    const imagePart = await fileToGeminiPart(file);
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const tags = JSON.parse(jsonStr);
    if (!Array.isArray(tags)) return [];
    // 유효한 id만 필터
    const validIds = new Set([...MENU_BREADS, ...MENU_DRINKS].map((m) => m.id));
    return tags.filter((t: unknown): t is string => typeof t === 'string' && validIds.has(t));
  } catch (err) {
    console.error('analyzePhotoForMenuTags failed:', err);
    return [];
  }
}

interface GeneratedPost {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
}

export async function generateBlogPost(imageUrls: string[]): Promise<GeneratedPost> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Fetch images and convert to base64
  const imageParts = await Promise.all(
    imageUrls.slice(0, 8).map(async (url) => {
      const res = await fetch(url);
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return {
        inlineData: {
          data: base64,
          mimeType: blob.type || 'image/jpeg',
        },
      };
    })
  );

  const prompt = `당신은 서울 홍대/연남동에 위치한 수제 소금빵 전문 베이커리 "솔트빵(Salt,0)"의 블로그 에디터입니다.

첨부된 사진들을 보고 블로그 포스트를 작성해주세요.

## 작성 규칙
- 따뜻하고 친근한 톤으로 작성
- 사진 속 내용을 자연스럽게 묘사하며 스토리텔링
- HTML 형식으로 본문 작성 (h2, h3, p, img 태그 사용)
- 이미지는 본문 중간중간에 자연스럽게 배치 (img 태그에 src로 원본 URL 사용)
- SEO에 최적화된 제목과 설명문 작성
- 한국어로 작성

## 매장 정보 (필요시 자연스럽게 포함)
- 매장명: 솔트빵 (Salt,0)
- 위치: 서울 마포구 동교로 39길 10 1층 (연남동, 홍대입구역 도보 5분)
- 영업시간: 11:00-21:00 (일요일 휴무)
- Instagram: @salt_bread_official

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

  const result = await model.generateContent([prompt, ...imageParts]);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(jsonStr) as GeneratedPost;
  } catch {
    // Fallback if parsing fails
    return {
      title: '새 블로그 포스트',
      slug: `post-${Date.now().toString(36)}`,
      description: '솔트빵의 새로운 소식',
      content: `<p>${text}</p>`,
      tags: ['솔트빵', '소금빵'],
    };
  }
}
