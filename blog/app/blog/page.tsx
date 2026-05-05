import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPostsServer } from '@/lib/services/blogServer';
import { STORE } from '@/lib/storeInfo';
import BlogIndexClient, { BlogIndexItem } from '@/components/BlogIndexClient';
import styles from './page.module.css';

// Same revalidate as homepage so a freshly-published post shows up here
// and on `/` within ~60s.
export const revalidate = 60;

const TITLE = '블로그 | 솔트빵 - 홍대 소금빵 맛집';
const DESCRIPTION =
  '솔트빵 파티시에가 직접 쓰는 소금빵 이야기. 신메뉴 출시, 베이커리 일상, 메뉴 추천을 모두 모았습니다.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${STORE.websiteUrl}/blog` },
  openGraph: {
    type: 'website',
    url: `${STORE.websiteUrl}/blog`,
    title: TITLE,
    description: DESCRIPTION,
    siteName: '솔트빵',
    images: [{ url: `${STORE.websiteUrl}/brandings/thumbnail.png`, width: 1200, height: 630 }],
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${STORE.websiteUrl}/brandings/thumbnail.png`],
  },
  robots: { index: true, follow: true },
};

export default async function BlogIndexPage() {
  const rawPosts = await getPublishedPostsServer();

  const posts: BlogIndexItem[] = rawPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    coverImage: p.coverImage,
    tags: p.tags || [],
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    language: p.language,
  }));

  // BreadcrumbList — language-agnostic, fine for crawlers regardless of UI lang.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '솔트빵', item: STORE.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${STORE.websiteUrl}/blog` },
    ],
  };

  // CollectionPage lists ALL languages — Google can index every locale's slug
  // through this single CollectionPage rather than the language-filtered UI.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${STORE.websiteUrl}/blog`,
    isPartOf: { '@type': 'WebSite', name: '솔트빵', url: STORE.websiteUrl },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: rawPosts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${STORE.websiteUrl}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">솔트빵</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Blog</span>
        </nav>

        <BlogIndexClient posts={posts} />
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </div>
  );
}
