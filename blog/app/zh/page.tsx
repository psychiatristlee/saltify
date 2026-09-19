import type { Metadata } from 'next';
import StoreInfoPage from '@/components/StoreInfoPage';
import { STORE } from '@/lib/storeInfo';

const URL = `${STORE.websiteUrl}/zh`;

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
  title: 'Salt,θ (Salt Bread) — 首尔延南洞盐面包专卖店 | 솔트빵',
  description:
    '首尔延南洞盐面包（shio-pan）专卖店 Salt,θ (Salt Bread)。使用法国发酵黄油与马尔顿海盐烘焙。营业时间 每天 11:00–19:30（最后点单 19:00），全年无休。弘大入口站3号出口步行5分钟。中文提供地址、营业时间、菜单与价格。',
  keywords: '盐面包 首尔, 延南洞 面包店, 延南洞 盐面包, 弘大 面包店, 首尔 烘焙, 韩国 盐面包, 首尔美食 中文, 延南洞 咖啡厅',
  alternates: { canonical: URL, languages: LANGUAGES },
  openGraph: {
    type: 'website',
    url: URL,
    title: 'Salt,θ (Salt Bread) — 首尔延南洞盐面包专卖店 | 솔트빵',
    description:
      '首尔延南洞盐面包专卖店。每天 11:00–19:30 营业，全年无休。弘大入口站步行5分钟。中文地址、营业时间与菜单。',
    images: [{ url: STORE.ogImage, width: 1000, height: 1000, alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 / Salt bread close-up, Yeonnam-dong, Seoul' }],
    locale: 'zh_CN',
    siteName: '솔트빵 Salt,θ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salt,θ (Salt Bread) — 首尔延南洞盐面包专卖店 | 솔트빵',
    description: '首尔延南洞盐面包专卖店。每天 11:00–19:30 营业，全年无休。弘大入口站步行5分钟。中文地址、营业时间与菜单。',
    images: [STORE.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <StoreInfoPage lang="zh-CN" />;
}
