'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublishedPosts, BlogPost } from '@/lib/services/blogService';
import styles from './BlogList.module.css';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPublishedPosts().then((p) => {
      setPosts(p);
      setLoaded(true);
    });
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Blog</h2>
      <div className={styles.list}>
        {posts.slice(0, 6).map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.id} className={styles.card}>
            {post.coverImage && (
              <img src={post.coverImage} alt={post.title} className={styles.cardImage} />
            )}
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{post.title}</h3>
              <p className={styles.cardDesc}>{post.description}</p>
              <time className={styles.cardDate}>
                {post.publishedAt?.toDate().toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
