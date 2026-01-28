import { useLanguage } from '../contexts/LanguageContext';
import styles from './GameOverView.module.css';

interface Props {
  score: number;
  totalPoints: number;
  availableCouponsCount: number;
  onRestart: () => void;
}

export default function GameOverView({
  score,
  totalPoints,
  availableCouponsCount,
  onRestart,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('gameOver')}</h2>
        <div className={styles.scoreSection}>
          <span className={styles.scoreLabel}>{t('finalScore')}</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
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
        <button className={styles.restartButton} onClick={onRestart}>
          {t('playAgain')}
        </button>
      </div>
    </div>
  );
}
