import { useEffect } from 'react';
import { t, getDefaultLanguage } from '../lib/i18n';
import styles from './LevelUpCelebration.module.css';

interface Props {
  levelsGained: number;
  newLevel: number;
  onDismiss: () => void;
}

export default function LevelUpCelebration({ levelsGained, newLevel, onDismiss }: Props) {
  const lang = getDefaultLanguage();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.content}>
        <div className={styles.stars}>&#x2728;</div>
        <div className={styles.title}>{t('charLevelUp', lang)}</div>
        <div className={styles.level}>Lv {newLevel}</div>
        {levelsGained > 1 && (
          <div className={styles.multi}>+{levelsGained} {t('levels', lang)}</div>
        )}
        <div className={styles.tapHint}>{t('tapToDismiss', lang)}</div>
      </div>
    </div>
  );
}
