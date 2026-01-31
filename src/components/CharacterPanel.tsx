import { CharacterStats } from '../models/Character';
import styles from './CharacterPanel.module.css';

interface Props {
  stats: CharacterStats;
  lastExpGained?: number;
}

export default function CharacterPanel({ stats, lastExpGained }: Props) {
  const progressPercent = stats.expToNext > 0 ? (stats.exp / stats.expToNext) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.levelBadge}>
        <span className={styles.levelLabel}>Lv</span>
        <span className={styles.levelNumber}>{stats.level}</span>
      </div>
      <div className={styles.expBarOuter}>
        <div className={styles.expBarInner} style={{ width: `${progressPercent}%` }} />
        <span className={styles.expText}>
          {stats.exp} / {stats.expToNext}
        </span>
      </div>
      {lastExpGained !== undefined && lastExpGained > 0 && (
        <span className={styles.expGained}>+{lastExpGained} EXP</span>
      )}
    </div>
  );
}
