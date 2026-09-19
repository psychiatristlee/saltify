import type { Metadata } from 'next';
import StoreInfoPage from '@/components/StoreInfoPage';
import { STORE } from '@/lib/storeInfo';

const URL = `${STORE.websiteUrl}/en`;

// Every locale points at the same set of alternates, which is what Google
// requires for hreflang to be honoured — the annotations must be reciprocal.
const LANGUAGES = {
  ko: `${STORE.websiteUrl}/`,
  en: `${STORE.websiteUrl}/en`,
  ja: `${STORE.websiteUrl}/ja`,
  'zh-Hans': `${STORE.websiteUrl}/zh`,
  'zh-Hant': `${STORE.websiteUrl}/zh-hant`,
  'x-default': `${STORE.websiteUrl}/`,
};

export const metadata: Metadata = {
  title: 'Salt,θ (Salt Bread) — Yeonnam-dong Salt Bread Bakery, Seoul | 솔트빵',
  description:
    'Salt,θ (Salt Bread) is a salt bread (shio-pan) bakery in Yeonnam-dong, Seoul, made with French cultured butter and Maldon sea salt. Open daily 11:00–19:30 (last order 19:00), no closing day. 5-minute walk from Hongik Univ. Station Exit 3. Address, hours, menu and prices in English.',
  keywords: 'salt bread Seoul, Salt Bread, shio pan Seoul, Yeonnam-dong bakery, Yeonnam salt bread, Hongdae bakery, Seoul bakery English, what to eat Yeonnam, Seoul bread tour',
  alternates: { canonical: URL, languages: LANGUAGES },
  openGraph: {
    type: 'website',
    url: URL,
    title: 'Salt,θ (Salt Bread) — Yeonnam-dong Salt Bread Bakery, Seoul | 솔트빵',
    description:
      'Yeonnam-dong salt bread bakery in Seoul. Open daily 11:00–19:30, 5 minutes from Hongik Univ. Station. Address, hours, menu and prices in English.',
    images: [{ url: STORE.ogImage, width: 1000, height: 1000, alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 / Salt bread close-up, Yeonnam-dong, Seoul' }],
    locale: 'en_US',
    siteName: '솔트빵 Salt,θ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salt,θ (Salt Bread) — Yeonnam-dong Salt Bread Bakery, Seoul | 솔트빵',
    description: 'Yeonnam-dong salt bread bakery in Seoul. Open daily 11:00–19:30, 5 minutes from Hongik Univ. Station. Address, hours, menu and prices in English.',
    images: [STORE.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <StoreInfoPage lang="en" />;
}
