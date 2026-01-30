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
  const levelProgress = Math.min(score / targetScore, 1);

  // Radial progress for level
  const lvlSize = 48;
  const lvlStroke = 3.5;
  const lvlRadius = (lvlSize - lvlStroke) / 2;
  const lvlCircum = 2 * Math.PI * lvlRadius;
  const lvlOffset = lvlCircum * (1 - levelProgress);
  const lvlCenter = lvlSize / 2;

  return (
    <div className={styles.container}>
      <div className={styles.statsRow}>
        <div className={styles.levelRadial}>
          <svg width={lvlSize} height={lvlSize} className={styles.levelSvg}>
            <circle
              cx={lvlCenter} cy={lvlCenter} r={lvlRadius}
              fill="none" stroke="#e8d5b0" strokeWidth={lvlStroke}
            />
            <circle
              cx={lvlCenter} cy={lvlCenter} r={lvlRadius}
              fill="none" stroke="#FF8C00" strokeWidth={lvlStroke}
              strokeDasharray={lvlCircum} strokeDashoffset={lvlOffset}
              strokeLinecap="round"
              className={styles.levelProgressCircle}
            />
          </svg>
          <div className={styles.levelInner}>
            <span className={styles.levelNum}>{level}</span>
          </div>
        </div>
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
              />
              <span className={styles.breadName}>{t(BREAD_I18N[breadType].name)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
