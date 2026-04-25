import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://salt-bbang.com'),
  title: '솔트빵 - 홍대 소금빵 맛집 | 연남동 베이커리 카페 | 서울 소금빵 추천',
  description:
    '서울 홍대 소금빵 맛집 솔트빵(Salt,0). 홍대입구역 도보 5분, 연남동 카페거리. 수제 소금빵 8종 + 음료. 영업시간 11:00-19:30 (일요일 휴무, 소진시 마감).',
  keywords:
    '솔트빵, 소금빵, 홍대 소금빵, 홍대 소금빵 맛집, 홍대 빵집, 홍대 맛집, 홍대 베이커리, 연남동 빵집, 연남동 카페, 서울 소금빵, 서울 베이커리',
  authors: [{ name: '솔트빵' }],
  openGraph: {
    type: 'website',
    url: 'https://salt-bbang.com',
    title: '솔트빵 - 홍대 소금빵 맛집 | 연남동 베이커리 카페',
    description:
      '서울 홍대·연남동 소금빵 맛집. 홍대입구역 5분, 바삭하고 고소한 수제 소금빵 전문 베이커리. 플레인, 갈릭버터, 큐브 말차크림 등 8종. 소금빵 게임도 즐기고 무료 쿠폰도 받아보세요!',
    images: [
      {
        url: 'https://salt-bbang.com/brandings/thumbnail.png',
        width: 1200,
        height: 630,
        alt: '솔트빵 - 홍대 소금빵 전문점 메뉴 이미지',
      },
    ],
    locale: 'ko_KR',
    siteName: '솔트빵',
  },
  twitter: {
    card: 'summary_large_image',
    title: '솔트빵 - 홍대 소금빵 맛집 | 연남동 베이커리 카페',
    description:
      '서울 홍대·연남동 소금빵 맛집. 바삭한 수제 소금빵 전문 베이커리. 소금빵 게임도 즐기고 무료 쿠폰도 받아보세요!',
    images: ['https://salt-bbang.com/brandings/thumbnail.png'],
  },
  alternates: {
    canonical: 'https://salt-bbang.com',
    languages: {
      ko: 'https://salt-bbang.com/',
      en: 'https://salt-bbang.com/',
      ja: 'https://salt-bbang.com/',
      zh: 'https://salt-bbang.com/',
    },
  },
  other: {
    'geo.region': 'KR-11',
    'geo.placename': '서울특별시 마포구 연남동',
    'geo.position': '37.5621326;126.9237369',
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
