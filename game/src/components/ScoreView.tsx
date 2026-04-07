import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();

  return (
    <div className={styles.container}>
      <div className={styles.statRow}>
        <button
          className={styles.statIconButton}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label={t('levelSystem')}
        >
          <span className={styles.statIcon}>⭐</span>
        </button>
        <div className={styles.statInfo}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{t('level')} {level}</span>
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
          <span className={styles.movesLabel}>{t('moves')}</span>
          <span className={moves <= 5 ? styles.movesLow : styles.moves}>
            {moves}
          </span>
        </div>
      </div>

      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <span>⭐ {t('levelSystem')}</span>
            <button
              className={styles.tooltipClose}
              onClick={() => setShowTooltip(false)}
            >
              ✕
            </button>
          </div>
          <p className={styles.tooltipText}>
            {t('levelSystemDesc')}
          </p>
          <p className={styles.tooltipText}>
            {t('scoreDesc')}
          </p>
          <div className={styles.tooltipHighlight}>
            {t('levelScaleInfo')}
          </div>
        </div>
      )}
    </div>
  );
}
