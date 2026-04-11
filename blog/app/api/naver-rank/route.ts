import { NextRequest, NextResponse } from 'next/server';

// 솔트빵 네이버 플레이스 ID
const STORE_PLACE_ID = '2082452936';
const STORE_NAMES = ['솔트빵', 'salt,0', 'salt, 0', 'saltbbang', '솔트, 빵'];

interface PlaceItem {
  id: string;
  name: string;
  rank: number;
  category?: string;
  address?: string;
}

interface RankResult {
  keyword: string;
  rank: number | null;
  total: number;
  matched?: { name: string; id: string; rank: number };
  topResults: PlaceItem[];
  source: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Cache-Control': 'no-cache',
};

/**
 * 네이버 플레이스 iframe HTML에서 __APOLLO_STATE__ JSON을 추출
 */
function extractApolloState(html: string): Record<string, unknown> | null {
  // window.__APOLLO_STATE__ = {...};  형태
  const m1 = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:window\.|<\/script)/);
  if (m1) {
    try {
      return JSON.parse(m1[1]);
    } catch {
      // continue
    }
  }
  // <script id="__APOLLO_STATE__" type="application/json">{...}</script> 형태
  const m2 = html.match(/<script[^>]*id=["']__APOLLO_STATE__["'][^>]*>([\s\S]*?)<\/script>/);
  if (m2) {
    try {
      return JSON.parse(m2[1]);
    } catch {
      // continue
    }
  }
  return null;
}

/**
 * Apollo state에서 PlaceListSummary / RestaurantListSummary 등을 찾아 places 배열로 변환
 */
function parsePlacesFromApollo(state: Record<string, unknown>): PlaceItem[] {
  const places: PlaceItem[] = [];
  const seen = new Set<string>();

  // Apollo state는 normalized cache 구조: 키는 "PlaceListSummary:123456789" 등
  for (const [key, value] of Object.entries(state)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;

    // PlaceSummary, RestaurantListSummary, PlaceListSummary 등을 모두 처리
    if (
      key.startsWith('PlaceSummary:') ||
      key.startsWith('RestaurantListSummary:') ||
      key.startsWith('PlaceListSummary:') ||
      key.startsWith('CafeListSummary:')
    ) {
      const id = String(v.id || key.split(':')[1] || '');
      const name = String(v.name || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      places.push({
        id,
        name,
        rank: 0, // 순서는 나중에 계산
        category: v.category as string | undefined,
        address: (v.fullAddress || v.commonAddress || v.roadAddress) as string | undefined,
      });
    }
  }

  return places;
}

/**
 * Apollo state의 ROOT_QUERY에서 검색 결과 순서를 추출 (있을 경우)
 */
function extractOrderedIds(state: Record<string, unknown>): string[] {
  const ordered: string[] = [];
  const root = state['ROOT_QUERY'] as Record<string, unknown> | undefined;
  if (!root) return ordered;

  for (const [key, value] of Object.entries(root)) {
    // restaurants(...), places(...), cafes(...) 등의 쿼리 결과
    if (!Array.isArray(value)) continue;
    if (!key.match(/^(restaurants|places|cafes|hairshops|hospitals|accommodations|all)/i)) continue;

    for (const item of value) {
      if (item && typeof item === 'object' && '__ref' in item) {
        const ref = String((item as { __ref: string }).__ref);
        const id = ref.split(':')[1];
        if (id && !ordered.includes(id)) ordered.push(id);
      }
    }
  }

  // ROOT_QUERY에 직접 검색 결과 객체로 있는 경우
  for (const [key, value] of Object.entries(root)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    const items = (v.items || v.list || v.places || v.restaurants) as unknown;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object' && '__ref' in item) {
          const ref = String((item as { __ref: string }).__ref);
          const id = ref.split(':')[1];
          if (id && !ordered.includes(id)) ordered.push(id);
        }
      }
    }
    void key;
  }

  return ordered;
}

/**
 * 네이버 플레이스 list 페이지 URL들을 차례로 시도
 */
async function fetchNaverPlaceList(keyword: string): Promise<{ html: string; url: string } | null> {
  const encoded = encodeURIComponent(keyword);
  const urls = [
    `https://pcmap.place.naver.com/restaurant/list?query=${encoded}`,
    `https://pcmap.place.naver.com/place/list?query=${encoded}`,
    `https://m.place.naver.com/restaurant/list?query=${encoded}`,
    `https://m.place.naver.com/place/list?query=${encoded}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' });
      if (!res.ok) continue;
      const html = await res.text();
      if (html.includes('__APOLLO_STATE__')) {
        return { html, url };
      }
    } catch (e) {
      console.error('Fetch error for', url, e);
    }
  }
  return null;
}

async function getNaverPlaceRank(keyword: string): Promise<RankResult> {
  const fetched = await fetchNaverPlaceList(keyword);
  if (!fetched) {
    return { keyword, rank: null, total: 0, topResults: [], source: 'fetch-failed' };
  }

  const state = extractApolloState(fetched.html);
  if (!state) {
    return { keyword, rank: null, total: 0, topResults: [], source: 'no-apollo' };
  }

  const allPlaces = parsePlacesFromApollo(state);
  const orderedIds = extractOrderedIds(state);

  // 정렬: orderedIds에 있는 것들 먼저, 그 다음 나머지
  const idToPlace = new Map(allPlaces.map((p) => [p.id, p]));
  const ordered: PlaceItem[] = [];
  orderedIds.forEach((id, idx) => {
    const p = idToPlace.get(id);
    if (p) {
      ordered.push({ ...p, rank: idx + 1 });
      idToPlace.delete(id);
    }
  });
  // 순서 정보가 없는 나머지는 뒤에 붙임 (순위 정확도가 떨어짐)
  let nextRank = ordered.length + 1;
  for (const p of idToPlace.values()) {
    ordered.push({ ...p, rank: nextRank++ });
  }

  // 솔트빵 매칭
  let matched: { name: string; id: string; rank: number } | undefined;
  for (const p of ordered) {
    const lower = (p.name || '').toLowerCase();
    if (
      p.id === STORE_PLACE_ID ||
      STORE_NAMES.some((n) => lower.includes(n.toLowerCase()))
    ) {
      matched = { name: p.name, id: p.id, rank: p.rank };
      break;
    }
  }

  return {
    keyword,
    rank: matched?.rank ?? null,
    total: ordered.length,
    matched,
    topResults: ordered.slice(0, 10),
    source: fetched.url,
  };
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get('keyword');
  if (!keyword) {
    return NextResponse.json({ error: 'keyword required' }, { status: 400 });
  }

  try {
    const result = await getNaverPlaceRank(keyword);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Rank check error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    );
  }
}
