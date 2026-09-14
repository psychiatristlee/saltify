/**
 * Page content scraper utility.
 * Fetches the actual HTML content of a URL and extracts meaningful text.
 */

export interface ScrapedContent {
  text: string;
  success: boolean;
}

const MAX_CONTENT_LENGTH = 3000;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Scrape the main text content from a URL.
 */
export async function scrapePage(url: string): Promise<ScrapedContent> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,zh-CN;q=0.5",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Scrape failed for ${url}: ${res.status}`);
      return { text: "", success: false };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return { text: "", success: false };
    }

    const html = await res.text();
    const text = extractTextFromHtml(html);

    return { text: text.substring(0, MAX_CONTENT_LENGTH), success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`Scrape error for ${url}: ${msg}`);
    return { text: "", success: false };
  }
}

/**
 * Scrape multiple pages in parallel with concurrency limit.
 */
export async function scrapePages(
  urls: string[],
  concurrency = 3
): Promise<Map<string, ScrapedContent>> {
  const results = new Map<string, ScrapedContent>();
  const queue = [...urls];

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      const content = await scrapePage(url);
      results.set(url, content);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Extract readable text from raw HTML by stripping tags and normalizing whitespace.
 */
function extractTextFromHtml(html: string): string {
  // Remove script, style, noscript, svg, head blocks
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ");

  // Remove nav, footer, header blocks (common boilerplate)
  text = text
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");

  // Replace common block elements with newlines
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote)[^>]*>/gi, "\n");

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ");

  // Normalize whitespace
  text = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 10) // drop very short lines (nav items, etc.)
    .join("\n");

  return text.trim();
}
