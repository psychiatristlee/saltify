import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPostsServer } from '@/lib/services/blogServer';
import { STORE } from '@/lib/storeInfo';
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
  const posts = await getPublishedPostsServer();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '솔트빵', item: STORE.websiteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${STORE.websiteUrl}/blog` },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${STORE.websiteUrl}/blog`,
    isPartOf: { '@type': 'WebSite', name: '솔트빵', url: STORE.websiteUrl },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((p, i) => ({
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

        <header className={styles.header}>
          <h1 className={styles.title}>솔트빵 블로그</h1>
          <p className={styles.subtitle}>
            파티시에가 직접 쓰는 소금빵 이야기. 매일 갓 구운 소금빵의 비하인드를 만나보세요.
          </p>
          <p className={styles.count}>총 {posts.length}개의 글</p>
        </header>

        {posts.length === 0 ? (
          <div className={styles.empty}>
            아직 발행된 글이 없습니다.
            <Link href="/" className={styles.emptyLink}>홈으로 돌아가기</Link>
          </div>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className={styles.card}>
                  {post.coverImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    <p className={styles.cardDesc}>{post.description}</p>
                    <div className={styles.cardMeta}>
                      <time
                        dateTime={post.publishedAt?.toISOString()}
                        className={styles.cardDate}
                      >
                        {post.publishedAt?.toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </time>
                      {post.tags.length > 0 && (
                        <div className={styles.cardTags}>
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className={styles.cardTag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
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
