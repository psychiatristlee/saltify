import { useLanguage } from '../contexts/LanguageContext';
import styles from './GameOverView.module.css';

interface Props {
  totalPoints: number;
  availableCouponsCount: number;
  onRestart: () => void;
}

export default function GameOverView({
  totalPoints,
  availableCouponsCount,
  onRestart,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('gameOver')}</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>🥖 {t('totalPoints')}</span>
            <span className={styles.statValue}>{totalPoints.toLocaleString()}P</span>
          </div>
          <div className={styles.statItem}>
            <span>🎫 {t('availableCoupons')}</span>
            <span className={styles.statValue}>{availableCouponsCount}</span>
          </div>
        </div>
        <p className={styles.savedMessage}>✅ {t('pointsSaved')}</p>
        <button className={styles.restartButton} onClick={onRestart}>
          {t('playAgain')}
        </button>
      </div>
    </div>
  );
}
