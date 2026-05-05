'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import styles from '@/app/blog/page.module.css';

export interface BlogIndexItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  publishedAt: string | null;
  language?: string;
}

interface Props {
  posts: BlogIndexItem[];
}

const DATE_LOCALE: Record<string, string> = {
  ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', 'zh-CN': 'zh-CN',
};

const LABEL = {
  ko: {
    title: '솔트빵 블로그',
    subtitle: '파티시에가 직접 쓰는 소금빵 이야기. 매일 갓 구운 소금빵의 비하인드를 만나보세요.',
    count: (n: number) => `총 ${n}개의 글`,
    empty: '아직 발행된 글이 없습니다.',
    home: '홈으로 돌아가기',
  },
  en: {
    title: 'Salt,0 Blog',
    subtitle: 'Behind-the-scenes notes from our patissier — fresh out of the oven, every day.',
    count: (n: number) => `${n} posts`,
    empty: 'No posts yet.',
    home: 'Back to home',
  },
  ja: {
    title: 'ソルトパン ブログ',
    subtitle: 'パティシエが綴る、塩パンができるまでの物語。毎日焼きたての香りを。',
    count: (n: number) => `合計 ${n} 件`,
    empty: 'まだ投稿がありません。',
    home: 'ホームへ',
  },
  'zh-CN': {
    title: 'Salt,0 博客',
    subtitle: '烘焙师亲笔记录的盐面包故事。每天新鲜出炉的幕后。',
    count: (n: number) => `共 ${n} 篇`,
    empty: '暂无发布文章。',
    home: '返回首页',
  },
} as const;

export default function BlogIndexClient({ posts }: Props) {
  const { language } = useLanguage();
  const labels = LABEL[language as keyof typeof LABEL] || LABEL.ko;

  const filtered = posts.filter((p) => (p.language || 'ko') === language);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{labels.title}</h1>
        <p className={styles.subtitle}>{labels.subtitle}</p>
        <p className={styles.count}>{labels.count(filtered.length)}</p>
      </header>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {labels.empty}
          <Link href="/" className={styles.emptyLink}>{labels.home}</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((post) => (
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
                      dateTime={post.publishedAt || undefined}
                      className={styles.cardDate}
                    >
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString(
                            DATE_LOCALE[language] || 'ko-KR',
                            { year: 'numeric', month: 'long', day: 'numeric' },
                          )
                        : ''}
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
    </>
  );
}
