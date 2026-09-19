import type { Metadata } from 'next';
import StoreInfoPage from '@/components/StoreInfoPage';
import { STORE } from '@/lib/storeInfo';

const URL = `${STORE.websiteUrl}/zh-hant`;

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

// Taiwanese and Hong Kong visitors search for 鹽可頌 — the term that came in
// with Japanese 塩パン — far more than 鹽麵包, so the title leads with it.
export const metadata: Metadata = {
  title: 'Salt,θ (Salt Bread) — 首爾延南洞鹽可頌專賣店 | 솔트빵',
  description:
    '首爾延南洞鹽可頌（鹽麵包 / shio-pan）專賣店 Salt,θ (Salt Bread)。使用法國發酵奶油與馬爾頓海鹽烘焙。營業時間 每天 11:00–19:30（最後點餐 19:00），全年無休。弘大入口站3號出口步行5分鐘。繁體中文提供地址、營業時間、菜單與價格。',
  keywords:
    '鹽可頌 首爾, 首爾 鹽麵包, 延南洞 麵包店, 延南洞 鹽可頌, 弘大 麵包店, 首爾 烘焙, 韓國 鹽可頌, 首爾美食 繁體中文, 延南洞 咖啡廳, 首爾自由行 美食',
  alternates: { canonical: URL, languages: LANGUAGES },
  openGraph: {
    type: 'website',
    url: URL,
    title: 'Salt,θ (Salt Bread) — 首爾延南洞鹽可頌專賣店 | 솔트빵',
    description:
      '首爾延南洞鹽可頌專賣店。每天 11:00–19:30 營業，全年無休。弘大入口站步行5分鐘。繁體中文地址、營業時間與菜單。',
    images: [
      {
        url: STORE.ogImage,
        width: 1000,
        height: 1000,
        alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 / Salt bread close-up, Yeonnam-dong, Seoul',
      },
    ],
    locale: 'zh_TW',
    siteName: '솔트빵 Salt,θ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salt,θ (Salt Bread) — 首爾延南洞鹽可頌專賣店 | 솔트빵',
    description:
      '首爾延南洞鹽可頌專賣店。每天 11:00–19:30 營業，全年無休。弘大入口站步行5分鐘。繁體中文地址、營業時間與菜單。',
    images: [STORE.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <StoreInfoPage lang="zh-Hant" />;
}
