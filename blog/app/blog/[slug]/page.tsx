import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlugServer } from '@/lib/services/blogServer';
import { applyMarkdown } from '@/lib/markdown';
import { STORE } from '@/lib/storeInfo';
import styles from './page.module.css';

// ISR: revalidate every 60s so new/updated posts show up promptly.
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlugServer(slug);
  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다 | 솔트빵',
      robots: { index: false, follow: false },
    };
  }

  const url = `${STORE.websiteUrl}/blog/${post.slug}`;
  const publishDate = post.publishedAt?.toISOString();
  const modifiedDate = post.updatedAt?.toISOString();

  return {
    title: `${post.title} | 솔트빵`,
    description: post.description,
    keywords: [...post.tags, '솔트빵', '홍대 소금빵', '연남동 베이커리'].join(', '),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      siteName: '솔트빵',
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
      locale: 'ko_KR',
      publishedTime: publishDate,
      modifiedTime: modifiedDate,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
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
    other: {
      'article:published_time': publishDate || '',
      'article:modified_time': modifiedDate || '',
      // Place metadata — helps local-search crawlers tie article → location
      'place:location:latitude': String(STORE.lat),
      'place:location:longitude': String(STORE.lng),
      'geo.region': 'KR-11',
      'geo.placename': '서울특별시 마포구 연남동',
      'geo.position': `${STORE.lat};${STORE.lng}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlugServer(slug);
  if (!post) notFound();

  const publishDate = post.publishedAt?.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const wordCount = post.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
  const url = `${STORE.websiteUrl}/blog/${post.slug}`;

  // BlogPosting (Article) schema
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: `${STORE.name} ${STORE.englishName}`,
      url: STORE.websiteUrl,
      sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
    },
    publisher: {
      '@type': 'Organization',
      name: STORE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${STORE.websiteUrl}/brandings/plain.png`,
        width: 512,
        height: 512,
      },
      sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.tags.join(', '),
    articleBody: post.content.replace(/<[^>]+>/g, ''),
    wordCount,
    inLanguage: post.language || 'ko',
    // Tie this article to a real local business — strongest signal for
    // Google to associate the post with the store's Google Maps entity.
    about: {
      '@type': 'Bakery',
      name: STORE.name,
      url: STORE.websiteUrl,
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
      hasMap: STORE.googleMapsUrl,
      sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
    },
  };

  // BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '솔트빵', item: STORE.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${STORE.websiteUrl}/#blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        {/* Visible breadcrumb (also helps internal linking) */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">솔트빵</Link>
          <span aria-hidden="true">›</span>
          <Link href="/#blog">Blog</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{post.title}</span>
        </nav>

        {post.coverImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={post.coverImage} alt={post.title} className={styles.coverImage} />
        )}

        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <time dateTime={post.publishedAt?.toISOString()}>{publishDate}</time>
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        </div>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: applyMarkdown(post.content) }}
        />

        {/* Store info + map links — every blog post anchors to the same
            local business, which boosts NAP consistency for local SEO. */}
        <footer className={styles.footer}>
          <section className={styles.storeCard} itemScope itemType="https://schema.org/Bakery">
            <h2 className={styles.storeHeader}>
              <span itemProp="name">{STORE.name}</span>
              <span className={styles.storeSub} itemProp="alternateName">{STORE.englishName}</span>
            </h2>

            <address
              className={styles.address}
              itemProp="address"
              itemScope
              itemType="https://schema.org/PostalAddress"
            >
              <span itemProp="streetAddress">{STORE.addressFull}</span>
            </address>

            <p className={styles.hours} itemProp="openingHours" content="Mo-Sa 11:00-19:30">
              🕐 {STORE.hoursText}
            </p>

            <div className={styles.mapButtons}>
              <a
                href={STORE.naverPlaceUrl}
                target="_blank"
                rel="noopener"
                className={styles.naverBtn}
                aria-label="네이버 플레이스에서 솔트빵 보기"
              >
                <span>📍</span> 네이버 플레이스
              </a>
              <a
                href={STORE.googleMapsUrl}
                target="_blank"
                rel="noopener"
                className={styles.googleBtn}
                aria-label="Google Maps에서 솔트빵 보기"
              >
                <span>🗺️</span> Google Maps
              </a>
              <a
                href={STORE.instagramUrl}
                target="_blank"
                rel="noopener"
                className={styles.igBtn}
                aria-label="솔트빵 인스타그램 (@salt_bread_official)"
              >
                <span>📷</span> Instagram
              </a>
            </div>

            <link itemProp="url" href={STORE.websiteUrl} />
            <link itemProp="sameAs" href={STORE.naverPlaceUrl} />
            <link itemProp="sameAs" href={STORE.googleMapsUrl} />
            <link itemProp="sameAs" href={STORE.instagramUrl} />
          </section>

          <p className={styles.permalink}>
            <Link href="/">← 다른 글 보기</Link>
          </p>

          <p className={styles.copyright}>
            &copy; 2026 <Link href="/admin" className={styles.adminLink}>Saltify</Link>. All rights reserved.
          </p>
        </footer>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
