import LandingPage from '@/components/LandingPage';
import type { BlogListItem } from '@/components/BlogList';
import { getPublishedPostsServer } from '@/lib/services/blogServer';
import { STORE } from '@/lib/storeInfo';

// Revalidate every minute so a freshly-published post shows up on the
// homepage within ~60s without a redeploy.
export const revalidate = 60;

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
  sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
  hasMap: [STORE.naverPlaceUrl, STORE.googleMapsUrl],
  areaServed: { '@type': 'City', name: '서울' },
  potentialAction: {
    '@type': 'ViewAction',
    target: STORE.naverPlaceUrl,
    name: '네이버 플레이스에서 보기',
  },
};

export default async function Home() {
  const rawPosts = await getPublishedPostsServer();
  const posts: BlogListItem[] = rawPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  return (
    <>
      <LandingPage posts={posts} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BAKERY_JSON_LD) }}
      />
    </>
  );
}
