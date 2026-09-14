import { defineString } from "firebase-functions/params";
import { SearchResult } from "./googleSearch.js";

const NAVER_CLIENT_ID = defineString("NAVER_CLIENT_ID", { default: "" });
const NAVER_CLIENT_SECRET = defineString("NAVER_CLIENT_SECRET", { default: "" });

interface NaverSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  cafename?: string;
}

interface NaverSearchResponse {
  total: number;
  items: NaverSearchItem[];
}

type NaverSearchType = "blog" | "cafearticle" | "webkr";

const SEARCH_TYPES: NaverSearchType[] = ["blog", "cafearticle", "webkr"];

async function searchNaverByType(
  keyword: string,
  type: NaverSearchType
): Promise<SearchResult[]> {
  const clientId = NAVER_CLIENT_ID.value();
  const clientSecret = NAVER_CLIENT_SECRET.value();

  const url = `https://openapi.naver.com/v1/search/${type}?query=${encodeURIComponent(keyword)}&display=10&sort=date`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!res.ok) {
    console.error(
      `Naver ${type} search failed: ${res.status} ${res.statusText}`
    );
    return [];
  }

  const data = (await res.json()) as NaverSearchResponse;

  return data.items.map((item) => ({
    title: stripHtml(item.title),
    snippet: stripHtml(item.description),
    url: item.link,
    siteName: getSiteName(type, item),
  }));
}

export async function searchNaver(keyword: string): Promise<SearchResult[]> {
  const clientId = NAVER_CLIENT_ID.value();
  const clientSecret = NAVER_CLIENT_SECRET.value();

  if (!clientId || !clientSecret) {
    console.warn("Naver API credentials not configured. Skipping Naver search.");
    return [];
  }

  try {
    const allResults: SearchResult[] = [];

    for (const type of SEARCH_TYPES) {
      const results = await searchNaverByType(keyword, type);
      allResults.push(...results);
    }

    console.log(
      `Naver search found ${allResults.length} results for "${keyword}"`
    );
    return allResults;
  } catch (error) {
    console.error("Error searching Naver:", error);
    return [];
  }
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim();
}

function getSiteName(
  type: NaverSearchType,
  item: NaverSearchItem
): string {
  switch (type) {
    case "blog":
      return item.bloggername ? `Naver Blog (${item.bloggername})` : "Naver Blog";
    case "cafearticle":
      return item.cafename ? `Naver Cafe (${item.cafename})` : "Naver Cafe";
    case "webkr":
      return extractDomain(item.link);
    default:
      return "Naver";
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("tistory.com")) return "Tistory";
    if (hostname.includes("naver.com")) return "Naver";
    return hostname;
  } catch {
    return "Naver";
  }
}
