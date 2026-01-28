import { useState, useEffect } from 'react';
import { fetchRankings, UserRanking } from '../services/ranking';
import { BREAD_DATA } from '../models/BreadType';
import styles from './RankingView.module.css';

interface Props {
  currentUserId: string | null;
  onClose: () => void;
}

export default function RankingView({ currentUserId, onClose }: Props) {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRankings()
      .then(setRankings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>랭킹</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : rankings.length === 0 ? (
            <div className={styles.empty}>아직 랭킹 데이터가 없습니다.</div>
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
                        {user.userId === currentUserId && <span className={styles.meTag}>나</span>}
                      </span>
                      <div className={styles.stats}>
                        <span className={styles.statItem}>
                          발행 <strong>{user.totalIssued}</strong>
                        </span>
                        <span className={styles.statDivider}>|</span>
                        <span className={styles.statItem}>
                          사용 <strong>{user.totalUsed}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.breadCounts}>
                    {user.breadCounts.map(({ breadType, count }) => (
                      <div key={breadType} className={styles.breadCount}>
                        <img
                          src={BREAD_DATA[breadType].image}
                          alt={BREAD_DATA[breadType].nameKo}
                          className={styles.breadIcon}
                        />
                        <span className={styles.breadCountNum}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.infoSection}>
            <p className={styles.infoItem}>• 쿠폰 사용 개수가 많은 순서로 정렬됩니다.</p>
            <p className={styles.infoItem}>• 사용 개수가 같으면 발행 개수로 정렬됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
