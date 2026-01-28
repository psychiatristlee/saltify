import { useMemo } from 'react';
import { SpecialItemType } from '../models/BreadCell';
import styles from './ExplosionEffect.module.css';

interface Props {
  x: number;
  y: number;
  type: SpecialItemType;
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i + Math.random() * 20) * (Math.PI / 180);
    const distance = 40 + Math.random() * 80;
    return {
      id: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.1,
    };
  });
}

export default function ExplosionEffect({ x, y, type }: Props) {
  const particleCount = type === SpecialItemType.MilkTea ? 24 : type === SpecialItemType.Choco ? 16 : 12;
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  const typeClass =
    type === SpecialItemType.MilkTea
      ? styles.milkTea
      : type === SpecialItemType.Choco
      ? styles.choco
      : styles.matcha;

  return (
    <div
      className={`${styles.container} ${typeClass}`}
      style={{ left: x, top: y }}
    >
      {/* Central flash */}
      <div className={styles.flash} />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--size': `${p.size}px`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Ring */}
      <div className={styles.ring} />
    </div>
  );
}
