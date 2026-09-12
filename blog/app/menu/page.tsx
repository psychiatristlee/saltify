import type { Metadata } from 'next';
import MenuBoard from '@/components/MenuBoard';
import { STORE } from '@/lib/storeInfo';
import { MENU_BREADS } from '@/lib/breadData';
import { t } from '@/lib/i18n';

const URL = `${STORE.websiteUrl}/menu`;

// The menu board is published in Korean and Japanese; hreflang annotations
// must be reciprocal between the two.
const LANGUAGES = {
  ko: `${STORE.websiteUrl}/menu`,
  ja: `${STORE.websiteUrl}/menu/jp`,
  'x-default': `${STORE.websiteUrl}/menu`,
};

// Built from breadData so the snippet cannot go stale when the menu changes.
const BREADS = MENU_BREADS.map((b) => t(b.nameKey, 'ko')).join('·');
const FROM = Math.min(...MENU_BREADS.map((b) => b.price)).toLocaleString('en-US');

const TITLE = '메뉴 | 솔트빵 Salt,θ — 연남동 소금빵 전문점';
const DESCRIPTION = `연남동 소금빵 전문점 솔트빵 Salt,θ 메뉴판. 소금빵 ${MENU_BREADS.length}종 (${BREADS}) ${FROM}원부터, 콜드브루 음료까지. 매일 ${STORE.opens}–${STORE.closes} (L.O. ${STORE.lastOrder}, 연중무휴), 홍대입구역 도보 5분.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: LANGUAGES },
  openGraph: {
    type: 'website',
    url: URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: STORE.ogImage, width: 1000, height: 1000 }],
    locale: 'ko_KR',
    siteName: STORE.fullName,
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <MenuBoard lang="ko" />;
}
