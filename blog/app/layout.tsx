import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://salt-bbang.com'),
  title: '솔트빵 Saltify - 연남동 소금빵 베이커리 | Yeonnam Salt Bread Bakery, Hongdae Seoul',
  description:
    'Saltify (솔트빵) — Yeonnam-dong / Hongdae salt bread bakery in Seoul. 5-minute walk from Hongik Univ. Station. Artisan shio-pan from ₩3,000 in 7 varieties (plain, garlic butter, choco-bun) plus cold brew and zero-sugar milk tea. 서울 연남동·홍대 소금빵 맛집. 영업시간 11:00–19:30 (일요일 휴무).',
  keywords:
    'Saltify, Yeonnam bakery, Yeonnam-dong bakery, Yeonnam salt bread, shio pan Seoul, salt bread Seoul, Hongdae bakery, Hongdae salt bread, 솔트빵, 소금빵, 연남동 소금빵, 연남동 빵집, 연남동 베이커리, 연남동 카페, 홍대 소금빵, 홍대 소금빵 맛집, 홍대 빵집, 홍대 베이커리, 서울 소금빵, 서울 베이커리, 마포구 베이커리',
  authors: [{ name: '솔트빵 Saltify' }],
  openGraph: {
    type: 'website',
    url: 'https://salt-bbang.com',
    title: '솔트빵 Saltify - 연남동 소금빵 베이커리 | Yeonnam Salt Bread Bakery, Seoul',
    description:
      'Yeonnam-dong / Hongdae salt bread bakery in Seoul. Artisan shio-pan from ₩3,000 in 7 varieties. 서울 연남동·홍대 소금빵 맛집. 홍대입구역 5분.',
    images: [
      {
        url: 'https://salt-bbang.com/brandings/thumbnail.png',
        width: 1200,
        height: 630,
        alt: 'Saltify - Yeonnam-dong salt bread bakery in Seoul / 솔트빵 연남동 소금빵 베이커리',
      },
    ],
    locale: 'ko_KR',
    alternateLocale: ['en_US', 'ja_JP', 'zh_CN'],
    siteName: '솔트빵 Saltify',
  },
  twitter: {
    card: 'summary_large_image',
    title: '솔트빵 Saltify - 연남동 소금빵 베이커리 | Yeonnam Salt Bread Bakery',
    description:
      'Yeonnam-dong / Hongdae salt bread bakery in Seoul. 서울 연남동·홍대 소금빵 맛집.',
    images: ['https://salt-bbang.com/brandings/thumbnail.png'],
  },
  alternates: {
    canonical: 'https://salt-bbang.com',
    languages: {
      ko: 'https://salt-bbang.com/',
      en: 'https://salt-bbang.com/',
      ja: 'https://salt-bbang.com/',
      zh: 'https://salt-bbang.com/',
      'x-default': 'https://salt-bbang.com/',
    },
  },
  other: {
    'geo.region': 'KR-11',
    'geo.placename': 'Yeonnam-dong, Mapo-gu, Seoul · 연남동, 마포구, 서울특별시',
    'geo.position': '37.5621326;126.9237369',
    ICBM: '37.5621326, 126.9237369',
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
