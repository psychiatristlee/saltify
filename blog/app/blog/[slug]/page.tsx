'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, BlogPost } from '@/lib/services/blogService';
import styles from './page.module.css';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug).then((p) => {
      if (p && p.status === 'published') {
        setPost(p);
        // Dynamic SEO - update document head
        document.title = `${p.title} | 솔트빵`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', p.description);

        // OG tags
        setMetaTag('og:title', p.title);
        setMetaTag('og:description', p.description);
        setMetaTag('og:image', p.coverImage);
        setMetaTag('og:url', `https://salt-bbang.com/blog/${p.slug}`);
        setMetaTag('og:type', 'article');

        // Twitter
        setMetaTag('twitter:title', p.title);
        setMetaTag('twitter:description', p.description);
        setMetaTag('twitter:image', p.coverImage);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>포스트를 찾을 수 없습니다</h1>
          <Link href="/" className={styles.homeLink}>홈으로</Link>
        </div>
      </div>
    );
  }

  const publishDate = post.publishedAt?.toDate().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.container}>
      <article className={styles.article}>
        <Link href="/" className={styles.backLink}>← 솔트빵</Link>

        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className={styles.coverImage} />
        )}

        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <time>{publishDate}</time>
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
            <p>영업시간 11:00-21:00 (일요일 휴무)</p>
            <a href="https://www.instagram.com/salt_bread_official" target="_blank" rel="noopener noreferrer">
              @salt_bread_official
            </a>
          </div>
        </footer>
      </article>

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            image: post.coverImage,
            datePublished: post.publishedAt?.toDate().toISOString(),
            dateModified: post.updatedAt?.toDate().toISOString(),
            author: { '@type': 'Organization', name: '솔트빵 Salt,0' },
            publisher: {
              '@type': 'Organization',
              name: '솔트빵',
              logo: { '@type': 'ImageObject', url: 'https://salt-bbang.com/brandings/plain.png' },
            },
            mainEntityOfPage: `https://salt-bbang.com/blog/${post.slug}`,
            keywords: post.tags.join(', '),
          }),
        }}
      />
    </div>
  );
}

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) ||
           document.querySelector(`meta[name="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
