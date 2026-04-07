import { useMemo } from 'react';
import { SpecialItemType } from '../models/BreadCell';
import styles from './ExplosionEffect.module.css';

interface Props {
  x: number;
  y: number;
  type: SpecialItemType;
}

function generateParticles(count: number, offset: number = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((360 / count) * i + Math.random() * 20) * (Math.PI / 180);
    const distance = 40 + Math.random() * 80;
    return {
      id: offset + i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.1,
    };
  });
}

export default function ExplosionEffect({ x, y, type }: Props) {
  const baseCount = type === SpecialItemType.MilkTea ? 10 : type === SpecialItemType.Choco ? 8 : 6;
  const particles = useMemo(() => generateParticles(baseCount), [baseCount]);

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

      {/* Primary wave particles */}
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

      {/* Inner ring */}
      <div className={styles.ring} />

      {/* Outer ring (larger, delayed) */}
      <div className={styles.outerRing} />

      {/* Screen flash overlay */}
      <div className={styles.screenFlash} />
    </div>
  );
}
