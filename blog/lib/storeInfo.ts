/**
 * Single source of truth for store info. Used in blog post footer,
 * landing-page schema, generate-blog prompts, and OG/place metadata.
 *
 * NAP (Name/Address/Phone) consistency is a big local-SEO factor —
 * keeping all surfaces wired to this constant prevents drift.
 *
 * Brand naming rules (consumer-facing surfaces only):
 *   - Korean:  솔트빵  or  솔트빵 Salt,θ   (never "솔트 빵" with a space)
 *   - English: Salt,θ (Salt Bread)  — the ASCII "Salt Bread" MUST always be
 *     present, because foreign visitors cannot type "θ" into a search box.
 *   - "Saltify" is the legal business name, not the brand. It must never
 *     appear on a consumer-facing surface. (Internal identifiers such as the
 *     Firebase project `saltify-game` and localStorage keys are unaffected.)
 */

export const STORE = {
  name: '솔트빵',
  /** Stylised English mark. Always pair with `englishNameAscii` in public copy. */
  englishName: 'Salt,θ',
  /** Typeable fallback — foreign visitors search for this, not "θ". */
  englishNameAscii: 'Salt Bread',
  /** Canonical English rendering for public copy. */
  englishNameFull: 'Salt,θ (Salt Bread)',
  /** Canonical bilingual rendering for titles and schema `name`. */
  fullName: '솔트빵 Salt,θ',
  description:
    '프랑스산 발효버터와 말돈 소금으로 만드는 연남동 프리미엄 소금빵 전문점 / Yeonnam-dong premium salt bread (shio-pan) bakery in Seoul, made with French cultured butter and Maldon salt.',

  // Address — addressLocality includes Yeonnam-dong for stronger local-SEO geo match.
  streetAddress: '동교로 39길 10 1층',
  addressLocality: '연남동, 마포구',
  addressRegion: '서울특별시',
  // NOTE: unverified. Repo previously held three different values
  // (03996 here, 04030 in game/index.html). Left as-is pending owner confirmation.
  postalCode: '03996',
  addressCountry: 'KR',
  addressFull: '서울특별시 마포구 연남동 동교로 39길 10 1층',
  /** Romanised address — foreign visitors show this to a taxi driver. */
  addressEn: '10, Donggyo-ro 39-gil, Mapo-gu, Seoul (1F)',

  // Contact
  telephone: '+82-507-1482-3553',
  telephoneDisplay: '0507-1482-3553',

  // Coordinates
  lat: 37.5621326,
  lng: 126.9237369,

  // Hours — open every day, no closing day.
  opens: '11:00',
  closes: '19:30',
  lastOrder: '19:00',
  /** All seven days, for schema.org OpeningHoursSpecification. */
  openDays: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ],
  /** schema.org microdata shorthand. */
  get openingHoursMicrodata() {
    return `Mo-Su ${this.opens}-${this.closes}`;
  },
  get hoursText() {
    return `매일 ${this.opens} – ${this.closes} (L.O. ${this.lastOrder} / 소진 시 조기 마감)`;
  },
  get hoursTextEn() {
    return `Open daily ${this.opens} – ${this.closes} (last order ${this.lastOrder}, may close early once sold out)`;
  },
  get hoursTextJa() {
    return `毎日 ${this.opens} – ${this.closes} (ラストオーダー ${this.lastOrder} / 売り切れ次第終了)`;
  },
  get hoursTextZh() {
    return `每天 ${this.opens} – ${this.closes} (最后点单 ${this.lastOrder} / 售完即止)`;
  },

  // Transit
  nearestStation: '홍대입구역 3번 출구 도보 5분',
  nearestStationEn: '5-minute walk from Hongik Univ. Station (Line 2 / AREX) Exit 3',
  nearestStationJa: '弘大入口駅 (2号線 / 空港鉄道) 3番出口から徒歩5分',
  nearestStationZh: '弘大入口站 (2号线 / 机场铁路) 3号出口步行5分钟',

  // Social / external
  instagram: '@salt_bread_official',
  instagramUrl: 'https://www.instagram.com/salt_bread_official',

  // Naver Place
  naverPlaceId: '2082452936',
  naverPlaceUrl: 'https://map.naver.com/p/entry/place/2082452936',
  naverMobileUrl: 'https://m.place.naver.com/restaurant/2082452936/home',

  // Google Maps — official share link for the 솔트빵 (Yeonnam/Hongdae) listing.
  googleMapsUrl: 'https://share.google/WQi9M04Y8Gqyf7wuH',

  // Sites
  websiteUrl: 'https://salt-bbang.com',
  gameUrl: 'https://game.salt-bbang.com',
  /** Representative image — salt bread close-up, used for OG/schema. */
  ogImage: 'https://salt-bbang.com/breads/plain-naver.jpg',
};

export type StoreInfo = typeof STORE;
