import { useState } from 'react';
import styles from './ScoreView.module.css';

interface Props {
  level: number;
  score: number;
  targetScore: number;
  moves: number;
}

export default function ScoreView({
  level,
  score,
  targetScore,
  moves,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const scoreProgress = Math.min(score / targetScore, 1);

  return (
    <div className={styles.container}>
      <div className={styles.statRow}>
        <button
          className={styles.statIconButton}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label="레벨 설명 보기"
        >
          <span className={styles.statIcon}>⭐</span>
        </button>
        <div className={styles.statInfo}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>레벨 {level}</span>
            <span className={styles.statValue}>
              {score.toLocaleString()} / {targetScore.toLocaleString()}
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.levelProgressFill}
              style={{ width: `${scoreProgress * 100}%` }}
            />
          </div>
        </div>
        <div className={styles.movesBox}>
          <span className={styles.movesLabel}>이동</span>
          <span className={moves <= 5 ? styles.movesLow : styles.moves}>
            {moves}
          </span>
        </div>
      </div>

      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <span>⭐ 레벨 시스템</span>
            <button
              className={styles.tooltipClose}
              onClick={() => setShowTooltip(false)}
            >
              ✕
            </button>
          </div>
          <p className={styles.tooltipText}>
            목표 점수를 달성하면 다음 레벨로 올라가요!
          </p>
          <p className={styles.tooltipText}>
            빵을 3개 이상 맞추면 점수를 얻어요. 콤보를 이어가면 더 많은 점수를 획득할 수 있어요!
          </p>
          <div className={styles.tooltipHighlight}>
            레벨이 올라갈수록 목표 점수가 높아져요
          </div>
        </div>
      )}
    </div>
  );
}
