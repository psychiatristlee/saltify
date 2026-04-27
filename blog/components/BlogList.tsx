'use client';

import Link from 'next/link';
import styles from './BlogList.module.css';

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  publishedAt: string | null; // ISO string (server-fetched)
}

interface Props {
  posts: BlogListItem[];
}

export default function BlogList({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className={styles.section} id="blog">
      <h2 className={styles.sectionTitle}>Blog</h2>
      <div className={styles.list}>
        {posts.slice(0, 6).map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.id} className={styles.card}>
            {post.coverImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={post.coverImage} alt={post.title} className={styles.cardImage} />
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{post.title}</h3>
              <p className={styles.cardDesc}>{post.description}</p>
              <time className={styles.cardDate}>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })
                  : ''}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
