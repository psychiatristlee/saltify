import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadFriendsCharacters, FriendCharacter } from '../services/character';
import { computeStats } from '../models/Character';
import styles from './FriendsCharacterView.module.css';

interface Props {
  userId: string;
  onClose: () => void;
}

export default function FriendsCharacterView({ userId, onClose }: Props) {
  const [friends, setFriends] = useState<FriendCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadFriendsCharacters(userId)
      .then(setFriends)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>👥 {t('friendsCharacters')}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>{t('loadingFriends')}</div>
          ) : friends.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>🫥</div>
              <p className={styles.emptyTitle}>{t('noFriendsYet')}</p>
              <p className={styles.emptyDesc}>{t('inviteFriendsToSee')}</p>
            </div>
          ) : (
            <div className={styles.friendList}>
              {friends.map((friend) => {
                const stats = computeStats(friend.character);
                const xpPercent = stats.expToNext > 0
                  ? Math.round((stats.exp / stats.expToNext) * 100)
                  : 100;
                const levelClass = stats.level >= 50
                  ? styles.maxLevel
                  : stats.level >= 20
                    ? styles.highLevel
                    : '';

                return (
                  <div key={friend.userId} className={styles.friendCard}>
                    {friend.photoURL ? (
                      <img src={friend.photoURL} alt="" className={styles.friendPhoto} />
                    ) : (
                      <div className={styles.friendPhotoPlaceholder}>👤</div>
                    )}

                    <div className={styles.friendInfo}>
                      <div className={styles.friendName}>{friend.displayName}</div>
                      <div className={styles.friendStats}>
                        <div className={styles.xpBar}>
                          <div className={styles.xpFill} style={{ width: `${xpPercent}%` }} />
                        </div>
                        <span className={styles.statLine}>
                          {stats.exp}/{stats.expToNext}
                        </span>
                      </div>
                    </div>

                    <div className={`${styles.levelBadge}${levelClass ? ` ${levelClass}` : ''}`}>
                      <span className={styles.levelLabel}>{t('friendLevel')}</span>
                      <span className={styles.levelNumber}>{stats.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
