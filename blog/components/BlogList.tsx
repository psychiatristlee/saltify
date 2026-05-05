'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import styles from './BlogList.module.css';

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  publishedAt: string | null; // ISO string (server-fetched)
  language?: string;
}

interface Props {
  posts: BlogListItem[];
}

// Show only posts matching the current UI language. Posts that pre-date
// the language field (no language set) fall through to ko.
function effectiveLang(p: BlogListItem): string {
  return p.language || 'ko';
}

const DATE_LOCALE: Record<string, string> = {
  ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', 'zh-CN': 'zh-CN',
};

export default function BlogList({ posts }: Props) {
  const { language } = useLanguage();

  const matching = posts.filter((p) => effectiveLang(p) === language);
  if (matching.length === 0) return null;

  const hasMore = matching.length > 6;

  const moreLabel =
    language === 'ko' ? `+ 전체 ${matching.length}개 글 보기`
    : language === 'en' ? `+ See all ${matching.length} posts`
    : language === 'ja' ? `+ ${matching.length}件すべて見る`
    : `+ 查看全部 ${matching.length} 篇`;

  const allLabel =
    language === 'ko' ? '전체 글 보기 →'
    : language === 'en' ? 'View all →'
    : language === 'ja' ? '全て見る →'
    : '查看全部 →';

  return (
    <section className={styles.section} id="blog">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Blog</h2>
        <Link href="/blog" className={styles.viewAll} aria-label={allLabel}>
          {allLabel}
        </Link>
      </div>
      <div className={styles.list}>
        {matching.slice(0, 6).map((post) => (
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
                  ? new Date(post.publishedAt).toLocaleDateString(
                      DATE_LOCALE[language] || 'ko-KR',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )
                  : ''}
              </time>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <Link href="/blog" className={styles.viewAllBtn}>
          {moreLabel}
        </Link>
      )}
    </section>
  );
}
