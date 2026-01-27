import { BreadType, getAllBreadTypes, BREAD_DATA } from '../models/BreadType';
import DonutProgress from './DonutProgress';
import styles from './BreadProgressPanel.module.css';

interface BreadProgressPanelProps {
  getProgressForBread: (breadType: BreadType) => number;
  getCouponsForBread: (breadType: BreadType) => { id: string }[];
}

export default function BreadProgressPanel({
  getProgressForBread,
  getCouponsForBread,
}: BreadProgressPanelProps) {
  const allBreadTypes = getAllBreadTypes();

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        {allBreadTypes.map((breadType) => {
          const breadInfo = BREAD_DATA[breadType];
          const progress = getProgressForBread(breadType);
          const coupons = getCouponsForBread(breadType);

          return (
            <div key={breadType} className={styles.breadItem}>
              <DonutProgress
                progress={progress}
                size={48}
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
