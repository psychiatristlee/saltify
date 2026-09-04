import type { Metadata } from 'next';
import StoreInfoPage from '@/components/StoreInfoPage';
import { STORE } from '@/lib/storeInfo';

const URL = `${STORE.websiteUrl}/ja`;

// Every locale points at the same set of alternates, which is what Google
// requires for hreflang to be honoured — the annotations must be reciprocal.
const LANGUAGES = {
  ko: `${STORE.websiteUrl}/`,
  en: `${STORE.websiteUrl}/en`,
  ja: `${STORE.websiteUrl}/ja`,
  'zh-Hans': `${STORE.websiteUrl}/zh`,
  'x-default': `${STORE.websiteUrl}/`,
};

export const metadata: Metadata = {
  title: 'ソルトパン Salt,θ (Salt Bread) — ソウル延南洞の塩パン専門店 | 솔트빵',
  description:
    'ソウル延南洞（ヨンナムドン）の塩パン専門店ソルトパン Salt,θ (Salt Bread)。フランス産発酵バターとマルドン塩で焼き上げます。営業時間は毎日 11:00–19:30（ラストオーダー 19:00）、年中無休。弘大入口駅3番出口から徒歩5分。住所・営業時間・メニューと価格を日本語でご案内。',
  keywords: '塩パン ソウル, ソルトパン, 延南洞 パン屋, 延南洞 塩パン, 弘大 ベーカリー, ソウル パン屋 日本語, 韓国 塩パン, ヨンナムドン カフェ',
  alternates: { canonical: URL, languages: LANGUAGES },
  openGraph: {
    type: 'website',
    url: URL,
    title: 'ソルトパン Salt,θ (Salt Bread) — ソウル延南洞の塩パン専門店 | 솔트빵',
    description:
      'ソウル延南洞の塩パン専門店。毎日 11:00–19:30 営業、年中無休。弘大入口駅から徒歩5分。住所・営業時間・メニューを日本語で。',
    images: [{ url: STORE.ogImage, width: 1000, height: 1000, alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 / Salt bread close-up, Yeonnam-dong, Seoul' }],
    locale: 'ja_JP',
    siteName: '솔트빵 Salt,θ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ソルトパン Salt,θ (Salt Bread) — ソウル延南洞の塩パン専門店 | 솔트빵',
    description: 'ソウル延南洞の塩パン専門店。毎日 11:00–19:30 営業、年中無休。弘大入口駅から徒歩5分。住所・営業時間・メニューを日本語で。',
    images: [STORE.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <StoreInfoPage lang="ja" />;
}
