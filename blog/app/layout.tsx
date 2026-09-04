import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ToastProvider } from '@/components/Toast';
import { STORE } from '@/lib/storeInfo';
import './globals.css';

// Foreign visitors cannot type "θ", so every English-facing string pairs the
// stylised mark with the searchable ASCII form: "Salt,θ (Salt Bread)".
//
// The hours are spelled out here rather than interpolated because these are
// prose search snippets, not data. blog/lib/storeInfo.ts holds the canonical
// values — change them there first, then update the wording here, in
// blog/app/{en,ja,zh}/page.tsx, blog/app/menu/jp/page.tsx and
// blog/public/manifest.json.
const SITE_TITLE = '솔트빵 Salt,θ | 연남동 소금빵 전문점 Yeonnam Salt Bread';
const SITE_DESCRIPTION =
  '프랑스산 발효버터와 말돈 소금으로 만드는 연남동 소금빵 전문점 솔트빵 Salt,θ (Salt Bread). 매일 11:00–19:30 영업 (L.O. 19:00 / 소진 시 조기 마감), 홍대입구역 도보 5분. Yeonnam-dong salt bread bakery in Seoul made with French cultured butter and Maldon salt — open daily 11:00–19:30, 5 minutes from Hongik Univ. Station.';

export const metadata: Metadata = {
  metadataBase: new URL(STORE.websiteUrl),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords:
    'Salt Bread, Salt Bread Seoul, Salt,θ, 솔트빵, Yeonnam Salt Bread, Yeonnam bakery, Yeonnam-dong bakery, shio pan Seoul, salt bread Seoul, Hongdae bakery, Hongdae salt bread, Seoul bakery, Korean salt bread, 소금빵, 연남동 소금빵, 연남동 빵집, 연남동 베이커리, 연남동 카페, 홍대 소금빵, 홍대 소금빵 맛집, 홍대 빵집, 홍대 베이커리, 서울 소금빵, 서울 베이커리, 마포구 베이커리, 塩パン ソウル, 延南洞 パン屋, 盐面包 首尔, 延南洞 面包店',
  authors: [{ name: '솔트빵 Salt,θ' }],
  openGraph: {
    type: 'website',
    url: STORE.websiteUrl,
    title: SITE_TITLE,
    description:
      '프랑스산 발효버터와 말돈 소금으로 만드는 연남동 소금빵 전문점. 매일 11:00–19:30 (L.O. 19:00 / 소진 시 조기 마감), 홍대입구역 도보 5분. Yeonnam-dong salt bread bakery in Seoul — open daily, 5 min from Hongik Univ. Station.',
    images: [
      {
        // Salt bread close-up — French cultured butter and flaky salt in frame.
        url: STORE.ogImage,
        width: 1000,
        height: 1000,
        alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 — 연남동 소금빵 전문점 / Salt bread close-up at Salt,θ, Yeonnam-dong, Seoul',
      },
    ],
    locale: 'ko_KR',
    alternateLocale: ['en_US', 'ja_JP', 'zh_CN'],
    siteName: '솔트빵 Salt,θ',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description:
      '프랑스산 발효버터·말돈 소금 연남동 소금빵 전문점. 매일 11:00–19:30. Yeonnam-dong salt bread bakery, open daily, 5 min from Hongik Univ. Station.',
    images: [STORE.ogImage],
  },
  alternates: {
    canonical: STORE.websiteUrl,
    // Each language has its own indexable URL so hreflang is meaningful —
    // pointing every locale at "/" would make Google ignore the annotations.
    languages: {
      ko: `${STORE.websiteUrl}/`,
      en: `${STORE.websiteUrl}/en`,
      ja: `${STORE.websiteUrl}/ja`,
      'zh-Hans': `${STORE.websiteUrl}/zh`,
      'x-default': `${STORE.websiteUrl}/`,
    },
  },
  other: {
    'geo.region': 'KR-11',
    'geo.placename': 'Yeonnam-dong, Mapo-gu, Seoul · 연남동, 마포구, 서울특별시',
    'geo.position': `${STORE.lat};${STORE.lng}`,
    ICBM: `${STORE.lat}, ${STORE.lng}`,
  },
  icons: {
    icon: '/brandings/plain.png',
    apple: '/brandings/plain.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body>
        <ToastProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
