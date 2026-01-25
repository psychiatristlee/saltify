import { useState } from 'react';
import styles from './ScoreView.module.css';

interface Props {
  level: number;
  score: number;
  targetScore: number;
  moves: number;
  points: number;
  progressToNextCoupon: number;
  availableCouponsCount: number;
}

type TooltipType = 'level' | 'points' | null;

export default function ScoreView({
  level,
  score,
  targetScore,
  moves,
  points,
  progressToNextCoupon,
  availableCouponsCount,
}: Props) {
  const [activeTooltip, setActiveTooltip] = useState<TooltipType>(null);
  const scoreProgress = Math.min(score / targetScore, 1);

  const toggleTooltip = (type: TooltipType) => {
    setActiveTooltip(activeTooltip === type ? null : type);
  };

  return (
    <div className={styles.container}>
      {/* 레벨 프로그레스 */}
      <div className={styles.statRow}>
        <button
          className={styles.statIconButton}
          onClick={() => toggleTooltip('level')}
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

      {activeTooltip === 'level' && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <span>⭐ 레벨 시스템</span>
            <button
              className={styles.tooltipClose}
              onClick={() => setActiveTooltip(null)}
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

      {/* 포인트 프로그레스 */}
      <div className={styles.statRow}>
        <button
          className={styles.statIconButton}
          onClick={() => toggleTooltip('points')}
          aria-label="포인트 설명 보기"
        >
          <img src="/breads/salt-bread.png" alt="소금빵" className={styles.statIconImg} />
        </button>
        <div className={styles.statInfo}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>포인트</span>
            <span className={styles.statValuePoint}>
              {points.toLocaleString()}P / 3,000P
            </span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.pointProgressFill}
              style={{ width: `${Math.min(progressToNextCoupon * 100, 100)}%` }}
            />
          </div>
        </div>
        {availableCouponsCount > 0 && (
          <span className={styles.couponBadge}>🎟️ {availableCouponsCount}</span>
        )}
      </div>

      {activeTooltip === 'points' && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <span>🥐 포인트 시스템</span>
            <button
              className={styles.tooltipClose}
              onClick={() => setActiveTooltip(null)}
            >
              ✕
            </button>
          </div>
          <p className={styles.tooltipText}>
            소금빵을 부술 때마다 1포인트를 적립해요!
          </p>
          <p className={styles.tooltipText}>
            3,000포인트를 모으면 소금빵 1+1 쿠폰을 받을 수 있어요.
          </p>
          <div className={styles.tooltipHighlight}>
            🎟️ 쿠폰은 우측 상단 버튼에서 확인하세요
          </div>
        </div>
      )}
    </div>
  );
}
