import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineString } from "firebase-functions/params";

const GENAI_API_KEY = defineString("GOOGLE_GENAI_API_KEY", { default: "" });

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  siteName: string;
}

export async function searchWeb(keyword: string): Promise<SearchResult[]> {
  const apiKey = GENAI_API_KEY.value();

  if (!apiKey) {
    console.warn("Google GenAI API key not configured. Skipping search.");
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} } as any],
    });

    const prompt = `Search for recent blog posts, reviews, or community discussions about traveling to Korea or visiting Korean places that mention "${keyword}".

IMPORTANT: Only include posts where users can leave comments or replies. Focus on:
- Korean blogs: Naver Blog, Tistory, Daum Blog
- Korean communities: Naver Cafe
- Travel review sites: TripAdvisor, MangoPlate, Yelp
- Q&A sites: Quora, Yahoo Answers

DO NOT include: YouTube videos, Instagram posts, Reddit threads, Facebook posts, Twitter/X posts, news articles, or official company websites.

The posts must be related to Korea travel, Korean food, Korean tourist attractions, or visiting Korean businesses.

List up to 10 relevant results with title, snippet, and URL.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate?.groundingMetadata?.groundingChunks) {
      console.log(`No grounding chunks returned for keyword: "${keyword}"`);
      return [];
    }

    const { groundingChunks, groundingSupports } = candidate.groundingMetadata;

    // Build snippet map from grounding supports
    const snippetMap = new Map<number, string>();
    if (groundingSupports) {
      for (const support of groundingSupports) {
        const indices = support.groundingChunckIndices || [];
        // SDK types segment as string, but actual API may return { text } object
        const segmentText =
          typeof support.segment === "string"
            ? support.segment
            : (support.segment as unknown as { text?: string })?.text || "";
        for (const idx of indices) {
          if (!snippetMap.has(idx) && segmentText) {
            snippetMap.set(idx, segmentText.substring(0, 300));
          }
        }
      }
    }

    const generatedText = response.text();

    const rawResults = groundingChunks
      .map((chunk, index) => {
        if (!chunk.web?.uri) return null;

        const uri = chunk.web.uri;
        const title = chunk.web.title || "";
        const snippet =
          snippetMap.get(index) ||
          extractSnippetFromText(generatedText, title, uri);

        return { title, snippet, url: uri, siteName: "" };
      })
      .filter((r): r is SearchResult => r !== null);

    // Resolve vertexai redirect URLs to actual URLs
    const resolved = await Promise.all(
      rawResults.map(async (r) => {
        const resolvedUrl = await resolveRedirectUrl(r.url);
        if (!resolvedUrl) return null; // Could not resolve — skip
        return {
          ...r,
          url: resolvedUrl,
          siteName: extractSiteName(resolvedUrl),
        };
      })
    );

    // Filter out non-commentable platforms and vertexai URLs
    const blockedDomains = [
      "vertexaisearch.cloud.google.com",
      "reddit.com",
      "youtube.com",
      "youtu.be",
      "instagram.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "tiktok.com",
      "pinterest.com",
      "linkedin.com",
    ];

    const results = resolved.filter((r): r is SearchResult => {
      if (!r) return false;
      const url = r.url.toLowerCase();
      return !blockedDomains.some((domain) => url.includes(domain));
    });

    console.log(
      `Gemini grounding found ${results.length} results for "${keyword}"`
    );
    return results;
  } catch (error) {
    console.error("Error searching web with Gemini grounding:", error);
    return [];
  }
}

async function resolveRedirectUrl(url: string): Promise<string> {
  if (!url.includes("vertexaisearch.cloud.google.com")) {
    return url;
  }

  // Try multiple methods to resolve the redirect
  const methods: Array<() => Promise<string | null>> = [
    // 1. HEAD with manual redirect
    async () => {
      const res = await fetch(url, { method: "HEAD", redirect: "manual" });
      return res.headers.get("location");
    },
    // 2. GET with manual redirect (some servers only respond to GET)
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.headers.get("location");
    },
    // 3. GET with follow — read the final URL from response
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      // If we followed redirects and ended up somewhere else
      if (res.url && !res.url.includes("vertexaisearch.cloud.google.com")) {
        return res.url;
      }
      // Check HTML for meta refresh or JS redirect
      const html = await res.text();
      const metaMatch = html.match(/url=["']?([^"'>\s]+)/i);
      if (metaMatch?.[1]) return metaMatch[1];
      return null;
    },
  ];

  for (const method of methods) {
    try {
      const resolved = await method();
      if (resolved && !resolved.includes("vertexaisearch.cloud.google.com")) {
        return resolved;
      }
    } catch {
      // Try next method
    }
  }

  console.warn(`Could not resolve redirect URL, skipping: ${url}`);
  // Return empty string to signal unresolvable — caller should filter these out
  return "";
}

function extractSnippetFromText(
  generatedText: string,
  title: string,
  url: string
): string {
  if (!title && !url) return "";

  const lines = generatedText.split("\n").filter((l) => l.trim());
  const hostname = safeHostname(url);

  for (const line of lines) {
    if (
      (title && line.includes(title)) ||
      (hostname && line.includes(hostname))
    ) {
      const cleaned = line.replace(/[*#\[\]()]/g, "").trim();
      if (cleaned.length > 20) return cleaned.substring(0, 300);
    }
  }

  return "";
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function extractSiteName(urlOrDomain: string): string {
  let domain: string;
  try {
    domain = new URL(urlOrDomain).hostname.replace(/^www\./, "");
  } catch {
    domain = urlOrDomain.replace(/^www\./, "");
  }

  const siteNames: Record<string, string> = {
    // Global
    "reddit.com": "Reddit",
    "tripadvisor.com": "TripAdvisor",
    "quora.com": "Quora",
    "yelp.com": "Yelp",
    "youtube.com": "YouTube",
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "twitter.com": "Twitter",
    "x.com": "X",
    "google.com": "Google",
    "klook.com": "Klook",
    // Korean
    "tripadvisor.co.kr": "TripAdvisor KR",
    "blog.naver.com": "Naver Blog",
    "cafe.naver.com": "Naver Cafe",
    "naver.com": "Naver",
    "tistory.com": "Tistory",
    "mangoplate.com": "MangoPlate",
    // Japanese
    "tripadvisor.jp": "TripAdvisor JP",
    "travel.yahoo.co.jp": "Yahoo! Travel JP",
    "4travel.jp": "4travel",
    "chiebukuro.yahoo.co.jp": "Yahoo! 知恵袋",
    // Chinese
    "tripadvisor.cn": "TripAdvisor CN",
    "xiaohongshu.com": "小红书",
    "mafengwo.cn": "马蜂窝",
    "dianping.com": "大众点评",
    "qyer.com": "穷游网",
  };

  for (const [key, name] of Object.entries(siteNames)) {
    if (domain.includes(key)) return name;
  }

  return domain;
}
