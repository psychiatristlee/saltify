import styles from './GameOverView.module.css';

interface Props {
  score: number;
  totalSaltBreadCrushed: number;
  availableCouponsCount: number;
  onRestart: () => void;
}

export default function GameOverView({
  score,
  totalSaltBreadCrushed,
  availableCouponsCount,
  onRestart,
}: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>Game Over!</h2>
        <div className={styles.scoreSection}>
          <span className={styles.scoreLabel}>최종 점수</span>
          <span className={styles.scoreValue}>{score}</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>🥖 소금빵 크러쉬</span>
            <span className={styles.statValue}>{totalSaltBreadCrushed}개</span>
          </div>
          <div className={styles.statItem}>
            <span>🎫 보유 쿠폰</span>
            <span className={styles.statValue}>{availableCouponsCount}장</span>
          </div>
        </div>
        <button className={styles.restartButton} onClick={onRestart}>
          다시 시작
        </button>
      </div>
    </div>
  );
}
