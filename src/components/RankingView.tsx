import { useState, useEffect } from 'react';
import { fetchRankings, UserRanking } from '../services/ranking';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './RankingView.module.css';

interface Props {
  currentUserId: string | null;
  onClose: () => void;
}

export default function RankingView({ currentUserId, onClose }: Props) {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchRankings(currentUserId)
      .then(setRankings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>👥 {t('friendRanking')}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>{t('loading')}</div>
          ) : rankings.length === 0 ? (
            <div className={styles.empty}>{t('noFriends')}</div>
          ) : (
            <div className={styles.rankingList}>
              {rankings.map((user) => (
                <div
                  key={user.userId}
                  className={`${styles.rankingItem} ${user.userId === currentUserId ? styles.currentUser : ''}`}
                >
                  <div className={styles.rankBadge}>
                    {user.rank <= 3 ? (
                      <span className={styles[`rank${user.rank}`]}>
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className={styles.rankNumber}>{user.rank}</span>
                    )}
                  </div>

                  <div className={styles.userInfo}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className={styles.userPhoto} />
                    ) : (
                      <div className={styles.userPhotoPlaceholder}>👤</div>
                    )}
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>
                        {user.displayName}
                        {user.userId === currentUserId && <span className={styles.meTag}>{t('me')}</span>}
                      </span>
                      <div className={styles.stats}>
                        <span className={styles.statItem}>
                          {t('issued')} <strong>{user.totalIssued}</strong>
                        </span>
                        <span className={styles.statDivider}>|</span>
                        <span className={styles.statItem}>
                          {t('used')} <strong>{user.totalUsed}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.breadCounts}>
                    <div className={styles.breadCount}>
                      <span className={styles.breadTotalIcon}>🥖</span>
                      <span className={styles.breadCountNum}>
                        {user.breadCounts.reduce((sum, { count }) => sum + count, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.infoSection}>
            <p className={styles.infoItem}>• {t('rankingInfo1')}</p>
            <p className={styles.infoItem}>• {t('rankingInfo2')}</p>
            <p className={styles.infoItem}>• {t('rankingInfo3')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
