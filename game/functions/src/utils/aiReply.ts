import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineString } from "firebase-functions/params";

const GENAI_API_KEY = defineString("GOOGLE_GENAI_API_KEY", { default: "" });

export async function generateSuggestedReply(
  postTitle: string,
  postSnippet: string,
  siteName: string,
  keyword: string
): Promise<string> {
  const apiKey = GENAI_API_KEY.value();

  if (!apiKey) {
    return getDefaultReply(siteName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Truncate content to avoid exceeding token limits
    const truncatedContent = postSnippet.substring(0, 2000);

    // Detect post language from title and content
    const postText = `${postTitle} ${truncatedContent}`;
    const hasKorean = /[가-힣]/.test(postText);
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(postText);
    const hasChinese = /[\u4E00-\u9FFF]/.test(postText) && !hasJapanese && !hasKorean;

    let detectedLang = "English";
    if (hasKorean) detectedLang = "Korean";
    else if (hasJapanese) detectedLang = "Japanese";
    else if (hasChinese) detectedLang = "Chinese";

    const prompt = `You are helping a bakery called "솔트빵(Salt bbang)" in Hongdae, Seoul. You write comment replies that look like real user comments on various platforms.

The post is from "${siteName}" with the title: "${postTitle}"
Post content:
"""
${truncatedContent}
"""
Matched keyword: "${keyword}"
Detected language: ${detectedLang}

CRITICAL RULES:
1. You MUST write the reply in ${detectedLang}. If the post is in English, reply in English. If Japanese, reply in Japanese. If Chinese, reply in Chinese. NEVER reply in Korean unless the post is in Korean.
2. The bakery's official name is "솔트빵(Salt bbang)" — use the appropriate form for the language:
   - Korean: 솔트빵
   - English: Salt bbang
   - Japanese: ソルトパン(Salt bbang)
   - Chinese: Salt bbang

REPLY STYLE — vary between these approaches (pick ONE randomly):
A) Personal story: Share a brief personal experience visiting the area and stumbling upon the bakery
B) Helpful tip: Answer the post's question first, then casually mention the bakery as a side recommendation
C) Agreement + addition: Agree with the post's point, add your own take, and weave in the bakery mention
D) Local insider: Write as if you're a local sharing a hidden gem in the neighborhood

Additional guidelines:
- Sound like a real person, not a marketing bot
- Match the tone of the platform (casual for Reddit/YouTube, polite for blogs/TripAdvisor)
- 2-3 sentences max
- Do NOT use promotional language like "best ever", "must visit", "highly recommend"
- Do NOT start with "I" every time — vary sentence structures

Reply only with the comment text, no quotes or extra formatting.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating AI reply:", error);
    return getDefaultReply(siteName);
  }
}

/**
 * AI로 게시글이 한국 여행/맛집 탐방과 관련 있는지 판단합니다.
 * 관련 있으면 true, 없으면 false를 반환합니다.
 */
export async function checkTravelRelevance(
  postTitle: string,
  postContent: string,
  siteName: string
): Promise<boolean> {
  const apiKey = GENAI_API_KEY.value();

  if (!apiKey) {
    // API 키 없으면 일단 통과시킴
    return true;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const truncated = postContent.substring(0, 1500);

    const prompt = `You are a content classifier. Determine if this post is relevant for a bakery marketing team in Seoul, Korea.

Site: "${siteName}"
Title: "${postTitle}"
Content:
"""
${truncated}
"""

A post is RELEVANT if it matches ANY of these:
- Someone traveling to or asking about Seoul, Hongdae, Yeonnam-dong, Mapo, or nearby areas
- Someone looking for food/bakery/cafe recommendations in Korea
- A travel blog/review about visiting Seoul or Korea
- Someone discussing places to eat or visit in Seoul
- A review of bakeries, cafes, or food spots in Korea

A post is NOT RELEVANT if it is:
- A baking recipe or home baking tutorial
- A product review for store-bought bread (not a bakery visit)
- General food science or nutrition article
- Content about salt bread/bakeries in other countries with no Korea connection
- News article not related to travel or food tourism
- Official company/brand announcement or press release
- An automated aggregation page or index page
- A video transcript without specific travel content
- A post where users CANNOT leave comments (news sites, official pages)
- Content that is not a personal blog, review, or community discussion

Reply with ONLY "YES" or "NO".`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim().toUpperCase();

    const isRelevant = answer.startsWith("YES");
    if (!isRelevant) {
      console.log(`Filtered out non-travel post: "${postTitle}" (${siteName})`);
    }
    return isRelevant;
  } catch (error) {
    console.error("Error checking travel relevance:", error);
    // 에러 시 통과시킴
    return true;
  }
}

function getDefaultReply(siteName: string): string {
  const isKorean = siteName.includes("Naver") || siteName.includes("Tistory");
  const isJapanese = siteName.includes("JP") || siteName.includes("tabelog") || siteName.includes("4travel");
  const isChinese = siteName.includes("CN") || siteName.includes("小红书") || siteName.includes("马蜂窝");

  if (isKorean) {
    return "홍대 연남동 쪽에 솔트빵이라는 소금빵 전문점이 있는데, 갈릭버터 소금빵이 특히 맛있었어요. 홍대입구역에서 걸어갈 수 있는 거리라 접근성도 좋고요.";
  }

  if (isJapanese) {
    return "弘大のヨンナムドンにSalt bbangという塩パン専門店があって、ガーリックバター塩パンが本当に美味しかったです。弘大入口駅から歩いて行ける距離なのでアクセスも良いですよ。";
  }

  if (isChinese) {
    return "弘大延南洞有一家叫Salt bbang的盐面包专门店，蒜香黄油盐面包特别好吃。从弘大入口站走路就能到，交通也很方便。";
  }

  return "There's a salt bread spot called Salt bbang in the Hongdae/Yeonnam-dong area. Their garlic butter salt bread was really good. It's a short walk from Hongik University station.";
}
