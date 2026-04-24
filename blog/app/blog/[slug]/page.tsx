import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlugServer } from '@/lib/services/blogServer';
import styles from './page.module.css';

// ISR: Revalidate every 60 seconds (so new/updated posts show up reasonably quickly)
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

  const url = `https://salt-bbang.com/blog/${post.slug}`;
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.coverImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: { '@type': 'Organization', name: '솔트빵 Salt,0' },
    publisher: {
      '@type': 'Organization',
      name: '솔트빵',
      logo: { '@type': 'ImageObject', url: 'https://salt-bbang.com/brandings/plain.png' },
    },
    mainEntityOfPage: `https://salt-bbang.com/blog/${post.slug}`,
    keywords: post.tags.join(', '),
    articleBody: post.content.replace(/<[^>]+>/g, ''),
  };

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        <Link href="/" className={styles.backLink}>← 솔트빵</Link>

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

        <div className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} />

        <footer className={styles.footer}>
          <div className={styles.storeCard}>
            <h3>솔트빵 Salt,0</h3>
            <p>서울 마포구 동교로 39길 10 1층</p>
            <p>영업시간 11:00 - 19:30 (일요일 휴무)</p>
            <a href="https://www.instagram.com/salt_bread_official" target="_blank" rel="noopener noreferrer">
              @salt_bread_official
            </a>
          </div>
        </footer>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
