import { defineString } from "firebase-functions/params";
import { SearchResult } from "./googleSearch.js";

const SERPAPI_KEY = defineString("SERPAPI_KEY", { default: "" });

interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

const SITE_NAMES: Record<string, string> = {
  "xiaohongshu.com": "小红书",
  "mafengwo.cn": "马蜂窝",
  "dianping.com": "大众点评",
  "qyer.com": "穷游网",
  "douban.com": "豆瓣",
  "zhihu.com": "知乎",
  "weibo.com": "微博",
  "bilibili.com": "Bilibili",
  "tripadvisor.cn": "TripAdvisor CN",
  "tripadvisor.jp": "TripAdvisor JP",
  "4travel.jp": "4travel",
  "tabelog.com": "食べログ",
  "gnavi.co.jp": "ぐるなび",
  "hotpepper.jp": "ホットペッパー",
};

export async function searchBaidu(
  keyword: string
): Promise<SearchResult[]> {
  const apiKey = SERPAPI_KEY.value();

  if (!apiKey) {
    console.warn("SerpAPI key not configured. Skipping Baidu search.");
    return [];
  }

  try {
    const url = `https://serpapi.com/search.json?engine=baidu&q=${encodeURIComponent(keyword)}&api_key=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`SerpAPI Baidu search failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      console.error(`SerpAPI error: ${data.error}`);
      return [];
    }

    const results = (data.organic_results || []).map((item) => ({
      title: item.title || "",
      snippet: item.snippet || "",
      url: item.link || "",
      siteName: extractSiteName(item.link || ""),
    }));

    console.log(
      `Baidu search found ${results.length} results for "${keyword}"`
    );
    return results;
  } catch (error) {
    console.error("Error searching Baidu via SerpAPI:", error);
    return [];
  }
}

export async function searchYahooJapan(
  keyword: string
): Promise<SearchResult[]> {
  const apiKey = SERPAPI_KEY.value();

  if (!apiKey) {
    console.warn("SerpAPI key not configured. Skipping Yahoo Japan search.");
    return [];
  }

  try {
    const url = `https://serpapi.com/search.json?engine=yahoo_japan&p=${encodeURIComponent(keyword)}&api_key=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`SerpAPI Yahoo Japan search failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      console.error(`SerpAPI error: ${data.error}`);
      return [];
    }

    const results = (data.organic_results || []).map((item) => ({
      title: item.title || "",
      snippet: item.snippet || "",
      url: item.link || "",
      siteName: extractSiteName(item.link || ""),
    }));

    console.log(
      `Yahoo Japan search found ${results.length} results for "${keyword}"`
    );
    return results;
  } catch (error) {
    console.error("Error searching Yahoo Japan via SerpAPI:", error);
    return [];
  }
}

function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, name] of Object.entries(SITE_NAMES)) {
      if (hostname.includes(domain)) return name;
    }
    return hostname;
  } catch {
    return url;
  }
}
