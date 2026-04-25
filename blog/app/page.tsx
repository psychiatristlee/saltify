import LandingPage from '@/components/LandingPage';

const BAKERY_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: '솔트빵 (Salt,0)',
  alternateName: ['Salt,0', '솔트빵', 'Salt Bbang'],
  description:
    '서울 홍대 연남동에 위치한 수제 소금빵 전문 베이커리. 매일 갓 구운 소금빵을 만나보세요.',
  url: 'https://salt-bbang.com',
  telephone: '',
  image: 'https://salt-bbang.com/brandings/thumbnail.png',
  logo: 'https://salt-bbang.com/brandings/plain.png',
  priceRange: '₩₩',
  servesCuisine: ['Korean Bakery', 'Salt Bread', 'Coffee'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '동교로 39길 10 1층',
    addressLocality: '마포구',
    addressRegion: '서울특별시',
    postalCode: '03996',
    addressCountry: 'KR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 37.5621326,
    longitude: 126.9237369,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '11:00',
      closes: '19:30',
    },
  ],
  sameAs: [
    'https://www.instagram.com/salt_bread_official',
    'https://map.naver.com/p/entry/place/2082452936',
  ],
  hasMap: 'https://map.naver.com/p/entry/place/2082452936',
  areaServed: { '@type': 'City', name: '서울' },
};

export default function Home() {
  return (
    <>
      <LandingPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BAKERY_JSON_LD) }}
      />
    </>
  );
}
