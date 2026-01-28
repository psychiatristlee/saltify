import { BreadType, getAllBreadTypes, BREAD_DATA } from '../models/BreadType';
import DonutProgress from './DonutProgress';
import styles from './BreadProgressPanel.module.css';

interface BreadProgressPanelProps {
  level: number;
  moves: number;
  getProgressForBread: (breadType: BreadType) => number;
  getCouponsForBread: (breadType: BreadType) => { id: string }[];
  onBreadClick?: () => void;
}

export default function BreadProgressPanel({
  level,
  moves,
  getProgressForBread,
  getCouponsForBread,
  onBreadClick,
}: BreadProgressPanelProps) {
  const allBreadTypes = getAllBreadTypes();

  return (
    <div className={styles.container}>
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>레벨</span>
          <span className={styles.statValue}>{level}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>남은 이동</span>
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
              <span className={styles.breadName}>{breadInfo.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
