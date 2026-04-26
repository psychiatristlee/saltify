/**
 * Single source of truth for store info. Used in blog post footer,
 * landing-page schema, generate-blog prompts, and OG/place metadata.
 *
 * NAP (Name/Address/Phone) consistency is a big local-SEO factor —
 * keeping all surfaces wired to this constant prevents drift.
 */

export const STORE = {
  name: '솔트빵',
  englishName: 'Salt,0',
  description:
    '서울 홍대 연남동의 수제 소금빵 전문 베이커리. 매일 갓 구운 소금빵.',

  // Address
  streetAddress: '동교로 39길 10 1층',
  addressLocality: '마포구',
  addressRegion: '서울특별시',
  postalCode: '03996',
  addressCountry: 'KR',
  addressFull: '서울 마포구 동교로 39길 10 1층',
  addressEn: '1F, 10 Donggyo-ro 39-gil, Mapo-gu, Seoul, Republic of Korea',

  // Coordinates
  lat: 37.5621326,
  lng: 126.9237369,

  // Hours
  hoursText: '매일 11:00 - 19:30 (일요일 휴무, 빵 소진시 마감)',
  hoursTextEn: '11:00 - 19:30 daily (closed Sundays, until sold out)',

  // Social / external
  instagram: '@salt_bread_official',
  instagramUrl: 'https://www.instagram.com/salt_bread_official',

  // Naver Place
  naverPlaceId: '2082452936',
  naverPlaceUrl: 'https://map.naver.com/p/entry/place/2082452936',
  naverMobileUrl: 'https://m.place.naver.com/restaurant/2082452936/home',

  // Google Maps — search-API URL (place_id-less, but precise via store name + locality).
  // If you obtain the actual Google Place ID, swap to:
  // `https://www.google.com/maps/place/?q=place_id:<ID>`
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Salt%2C0+%EC%97%B0%EB%82%A8%EB%8F%99+%EC%86%94%ED%8A%B8%EB%B9%B5',

  // Sites
  websiteUrl: 'https://salt-bbang.com',
  gameUrl: 'https://game.salt-bbang.com',
};

export type StoreInfo = typeof STORE;
