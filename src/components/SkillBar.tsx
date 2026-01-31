import { SkillState, SkillType, getSkillDef } from '../models/Skill';
import styles from './SkillBar.module.css';

interface Props {
  skills: SkillState[];
  activeSkill: SkillType | null;
  isAnimating: boolean;
  onActivate: (type: SkillType) => void;
  onCancelSkill: () => void;
}

export default function SkillBar({ skills, activeSkill, isAnimating, onActivate, onCancelSkill }: Props) {

  return (
    <div className={styles.container}>
      {skills.map((skill) => {
        const def = getSkillDef(skill.type);
        const isReady = skill.unlocked && skill.currentCooldown === 0;
        const isActive = activeSkill === skill.type;
        const cooldownPercent = skill.unlocked && def.cooldown > 0
          ? (skill.currentCooldown / def.cooldown) * 100
          : 0;

        return (
          <button
            key={skill.type}
            className={`${styles.skillButton}${isActive ? ` ${styles.active}` : ''}${isReady ? ` ${styles.ready}` : ''}${!skill.unlocked ? ` ${styles.locked}` : ''}`}
            disabled={!isReady || isAnimating}
            onClick={() => {
              if (isActive) {
                onCancelSkill();
              } else if (isReady) {
                onActivate(skill.type);
              }
            }}
          >
            <span className={styles.emoji}>{def.emoji}</span>
            {!skill.unlocked && (
              <span className={styles.lockOverlay}>Lv{def.unlockLevel}</span>
            )}
            {skill.unlocked && skill.currentCooldown > 0 && (
              <div className={styles.cooldownOverlay}>
                <div
                  className={styles.cooldownFill}
                  style={{ height: `${cooldownPercent}%` }}
                />
                <span className={styles.cooldownText}>{skill.currentCooldown}</span>
              </div>
            )}
            {isReady && !isActive && (
              <div className={styles.readyGlow} />
            )}
          </button>
        );
      })}
    </div>
  );
}
