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
    '서울 연남동·홍대 수제 소금빵 전문 베이커리 / Yeonnam-dong & Hongdae artisan salt bread bakery in Seoul. 매일 갓 구운 소금빵.',

  // Address — addressLocality includes Yeonnam-dong for stronger local-SEO geo match.
  streetAddress: '동교로 39길 10 1층',
  addressLocality: '연남동, 마포구',
  addressRegion: '서울특별시',
  postalCode: '03996',
  addressCountry: 'KR',
  addressFull: '서울특별시 마포구 연남동 동교로 39길 10 1층',
  addressEn: '1F, 10 Donggyo-ro 39-gil, Yeonnam-dong, Mapo-gu, Seoul, Republic of Korea',

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

  // Google Maps — official share link for the 솔트빵 (Yeonnam/Hongdae) listing.
  googleMapsUrl: 'https://share.google/WQi9M04Y8Gqyf7wuH',

  // Sites
  websiteUrl: 'https://salt-bbang.com',
  gameUrl: 'https://game.salt-bbang.com',
};

export type StoreInfo = typeof STORE;
