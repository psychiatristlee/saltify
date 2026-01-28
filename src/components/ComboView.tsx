import { useMemo } from 'react';
import styles from './ComboView.module.css';

interface Props {
  comboCount: number;
}

// Generate random particles with pre-calculated positions
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i + Math.random() * 30) * (Math.PI / 180);
    const distance = 80 + Math.random() * 120;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 8 + Math.random() * 12,
      delay: Math.random() * 0.2,
    };
  });
}

export default function ComboView({ comboCount }: Props) {
  // More particles for higher combos
  const particleCount = Math.min(comboCount * 6, 30);
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  // Different intensity based on combo count
  const intensity = comboCount >= 5 ? 'extreme' : comboCount >= 4 ? 'high' : comboCount >= 3 ? 'medium' : 'low';

  return (
    <div className={`${styles.overlay} ${styles[intensity]}`}>
      {/* Screen flash */}
      <div className={styles.flash} />

      {/* Radial burst lines */}
      <div className={styles.burstContainer}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={styles.burstLine}
            style={{ transform: `rotate(${i * 30}deg)` }}
          />
        ))}
      </div>

      {/* Particles */}
      <div className={styles.particleContainer}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              '--tx': `${p.x}px`,
              '--ty': `${p.y}px`,
              '--size': `${p.size}px`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Combo text */}
      <div className={styles.textContainer}>
        <div className={styles.textShadow}>{comboCount}x</div>
        <div className={styles.text}>{comboCount}x</div>
        <div className={styles.subText}>콤보!</div>
      </div>

      {/* Ring explosion */}
      <div className={styles.ring} />
      <div className={styles.ring2} />
    </div>
  );
}
