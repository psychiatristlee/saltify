'use client';

import { useEffect } from 'react';
import styles from './BlogPreview.module.css';

interface Props {
  title: string;
  description: string;
  tags: string[];
  coverImage: string;
  content: string;
  onClose: () => void;
}

export default function BlogPreview({
  title, description, tags, coverImage, content, onClose,
}: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.shell} onClick={(e) => e.stopPropagation()}>
        <div className={styles.bar}>
          <span className={styles.barLabel}>📖 미리보기 · 게시되면 이렇게 보입니다</span>
          <button onClick={onClose} className={styles.closeBtn}>✕ 닫기</button>
        </div>

        <div className={styles.scroll}>
          <article className={styles.article}>
            <div className={styles.backLink}>← 솔트빵</div>

            {coverImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={coverImage} alt={title} className={styles.coverImage} />
            )}

            <h1 className={styles.title}>{title || '(제목 미정)'}</h1>

            {description && (
              <p className={styles.lead}>{description}</p>
            )}

            <div className={styles.meta}>
              <time>{today}</time>
              <div className={styles.tags}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
            </div>

            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#bbb">본문이 비어있습니다.</p>' }}
            />

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
        </div>
      </div>
    </div>
  );
}
