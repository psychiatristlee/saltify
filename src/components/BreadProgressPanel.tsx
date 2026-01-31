import { BreadType, getAllBreadTypes, BREAD_DATA } from '../models/BreadType';
import DonutProgress from './DonutProgress';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../lib/i18n';
import styles from './BreadProgressPanel.module.css';

const BREAD_I18N: Record<BreadType, { name: TranslationKey }> = {
  [BreadType.Plain]: { name: 'breadPlainName' },
  [BreadType.Everything]: { name: 'breadEverythingName' },
  [BreadType.OliveCheese]: { name: 'breadOliveCheeseName' },
  [BreadType.BasilTomato]: { name: 'breadBasilTomatoName' },
  [BreadType.GarlicButter]: { name: 'breadGarlicButterName' },
  [BreadType.Hotteok]: { name: 'breadHotteokName' },
};

interface BreadProgressPanelProps {
  level: number;
  moves: number;
  score: number;
  targetScore: number;
  getProgressForBread: (breadType: BreadType) => number;
  getCouponsForBread: (breadType: BreadType) => { id: string }[];
  onBreadClick?: () => void;
}

export default function BreadProgressPanel({
  level,
  moves,
  score,
  targetScore,
  getProgressForBread,
  getCouponsForBread,
  onBreadClick,
}: BreadProgressPanelProps) {
  const allBreadTypes = getAllBreadTypes();
  const { t } = useLanguage();

  return (
    <div className={styles.container}>
      <div className={styles.statsRow}>
        {(() => {
          const radius = 19;
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(score / targetScore, 1);
          const dashOffset = circumference * (1 - progress);
          return (
            <div className={styles.levelRadial}>
              <svg width={48} height={48} className={styles.levelSvg}>
                <circle cx={24} cy={24} r={radius} fill="none" stroke="#ede0cc" strokeWidth={4} />
                <circle
                  cx={24} cy={24} r={radius}
                  fill="none"
                  stroke="#FF8C00"
                  strokeWidth={4}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className={styles.levelProgressCircle}
                />
              </svg>
              <div className={styles.levelInner}>
                <span className={styles.levelNum}>{level}</span>
              </div>
            </div>
          );
        })()}
        <div className={styles.statBox}>
          <span className={styles.statLabel}>{t('remainingMoves')}</span>
          <span className={moves <= 5 ? styles.statValueLow : styles.statValue}>
            {moves}
          </span>
        </div>
      </div>
      <div className={styles.panel}>
        {allBreadTypes.map((breadType) => {
          const breadInfo = BREAD_DATA[breadType];
          const progress = getProgressForBread(breadType);
          const coupons = getCouponsForBread(breadType);

          return (
            <div
              key={breadType}
              className={styles.breadItem}
              onClick={onBreadClick}
              style={{ cursor: onBreadClick ? 'pointer' : 'default' }}
            >
              <DonutProgress
                progress={progress}
                size={44}
                strokeWidth={3}
                imageUrl={breadInfo.image}
                color={breadInfo.color}
                couponCount={coupons.length}
                nearCoupon={progress >= 0.8 && progress < 1.0}
              />
              <span className={styles.breadName}>{t(BREAD_I18N[breadType].name)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
