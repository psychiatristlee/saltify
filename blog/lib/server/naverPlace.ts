/**
 * Naver Place crawler — pulls live menu, hours, and review snippets from
 * Naver Map for our store. Used as ground-truth context for blog generation
 * so the AI doesn't hallucinate menus or details that don't exist.
 *
 * Approach: fetch the public mobile-place HTML and extract the embedded
 * Apollo state (window.__APOLLO_STATE__). The cache is normalized with
 * keys like "Menu:12345" — we walk it to gather menus + reviews.
 */

const STORE_PLACE_ID = '2082452936';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Cache-Control': 'no-cache',
};

export interface NaverMenuItem {
  name: string;
  price?: string;
  description?: string;
}

export interface NaverPlaceContext {
  fetchedAt: string;
  storeName?: string;
  hours?: string;
  address?: string;
  menus: NaverMenuItem[];
  reviewSnippets: string[];
}

function extractApolloState(html: string): Record<string, unknown> | null {
  const m1 = html.match(
    /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:window\.|<\/script)/
  );
  if (m1) {
    try { return JSON.parse(m1[1]); } catch { /* try next */ }
  }
  const m2 = html.match(
    /<script[^>]*id=["']__APOLLO_STATE__["'][^>]*>([\s\S]*?)<\/script>/
  );
  if (m2) {
    try { return JSON.parse(m2[1]); } catch { /* fall through */ }
  }
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchNaverPlaceContext(
  placeId: string = STORE_PLACE_ID
): Promise<NaverPlaceContext> {
  const ctx: NaverPlaceContext = {
    fetchedAt: new Date().toISOString(),
    menus: [],
    reviewSnippets: [],
  };

  const seenMenus = new Set<string>();
  const collectFromState = (state: Record<string, unknown>) => {
    for (const [key, val] of Object.entries(state)) {
      if (!val || typeof val !== 'object') continue;
      const v = val as Record<string, unknown>;

      // Menu items: typed as Menu, RestaurantMenu, etc.
      if (/^(Menu|RestaurantMenu|MenuV2|CafeMenu):/i.test(key)) {
        const name = String(v.name || v.menuName || '').trim();
        if (!name || seenMenus.has(name)) continue;
        seenMenus.add(name);
        const priceVal = v.price ?? v.priceText ?? v.priceFormatted;
        ctx.menus.push({
          name,
          price: priceVal != null ? String(priceVal) : undefined,
          description:
            (v.description as string | undefined) ||
            (v.detail as string | undefined) ||
            undefined,
        });
      }

      // Reviews (visitor / blog / receipt) — prefer short text snippets
      if (/Review|Visitor:/i.test(key)) {
        const txt = (v.body || v.contents || v.text || v.review) as string | undefined;
        if (typeof txt === 'string' && txt.length > 10 && txt.length < 500) {
          if (ctx.reviewSnippets.length < 8) ctx.reviewSnippets.push(txt.trim());
        }
      }

      // Place summary — name, hours, address
      if (
        /^(PlaceSummary|RestaurantBase|RestaurantSummary|PlaceBase):/i.test(key) &&
        !ctx.storeName
      ) {
        if (typeof v.name === 'string') ctx.storeName = v.name;
        const addr = (v.fullAddress || v.commonAddress || v.roadAddress) as
          | string
          | undefined;
        if (addr && !ctx.address) ctx.address = addr;
      }

      // Hours
      if (
        /BizHour|BusinessHour|OperatingTime/i.test(key) &&
        typeof v.description === 'string' &&
        !ctx.hours
      ) {
        ctx.hours = v.description;
      }
    }
  };

  // Try multiple endpoints — menu list + home (for reviews/summary)
  const targets = [
    `https://pcmap.place.naver.com/restaurant/${placeId}/menu/list`,
    `https://pcmap.place.naver.com/restaurant/${placeId}/home`,
    `https://pcmap.place.naver.com/restaurant/${placeId}/review/visitor`,
  ];

  for (const url of targets) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const state = extractApolloState(html);
    if (state) collectFromState(state);
  }

  return ctx;
}

/**
 * Format the context as a compact prompt section. Empty fields are skipped.
 */
export function naverContextToPrompt(ctx: NaverPlaceContext): string {
  if (ctx.menus.length === 0 && ctx.reviewSnippets.length === 0) return '';
  const lines: string[] = ['== 네이버 플레이스 라이브 데이터 (단일 진실 원천) =='];
  if (ctx.storeName) lines.push(`매장명: ${ctx.storeName}`);
  if (ctx.address) lines.push(`주소: ${ctx.address}`);
  if (ctx.hours) lines.push(`영업시간: ${ctx.hours}`);
  if (ctx.menus.length > 0) {
    lines.push('', '메뉴 (네이버에 등록된 실제 판매 메뉴):');
    ctx.menus.slice(0, 30).forEach((m) => {
      lines.push(
        `- ${m.name}${m.price ? ` (${m.price})` : ''}${m.description ? ` — ${m.description}` : ''}`
      );
    });
  }
  if (ctx.reviewSnippets.length > 0) {
    lines.push('', '실제 손님 리뷰 (말투/분위기 참고):');
    ctx.reviewSnippets.slice(0, 5).forEach((r, i) => {
      lines.push(`${i + 1}. "${r.slice(0, 200)}"`);
    });
  }
  lines.push(
    '',
    '⚠️ 위 메뉴 목록에 없는 메뉴는 절대 본문에 언급하지 마세요. 가격/이름은 위 데이터를 정확히 따르세요.'
  );
  return lines.join('\n');
}
