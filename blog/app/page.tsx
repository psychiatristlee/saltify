import LandingPage from '@/components/LandingPage';
import { STORE } from '@/lib/storeInfo';

const BAKERY_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  '@id': `${STORE.websiteUrl}#bakery`,
  name: `${STORE.name} (${STORE.englishName})`,
  alternateName: [STORE.englishName, STORE.name, 'Salt Bbang'],
  description: STORE.description,
  url: STORE.websiteUrl,
  image: `${STORE.websiteUrl}/brandings/thumbnail.png`,
  logo: `${STORE.websiteUrl}/brandings/plain.png`,
  priceRange: '₩₩',
  servesCuisine: ['Korean Bakery', 'Salt Bread', 'Coffee'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: STORE.streetAddress,
    addressLocality: STORE.addressLocality,
    addressRegion: STORE.addressRegion,
    postalCode: STORE.postalCode,
    addressCountry: STORE.addressCountry,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: STORE.lat,
    longitude: STORE.lng,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '11:00',
      closes: '19:30',
    },
  ],
  // sameAs is the strongest signal for "this website == this Google Maps /
  // Naver Place / Instagram entity". Helps the local pack tie everything
  // together.
  sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
  hasMap: [STORE.naverPlaceUrl, STORE.googleMapsUrl],
  areaServed: { '@type': 'City', name: '서울' },
  potentialAction: {
    '@type': 'ViewAction',
    target: STORE.naverPlaceUrl,
    name: '네이버 플레이스에서 보기',
  },
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
