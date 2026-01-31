import { useEffect, useState } from 'react';
import styles from './ParticleEffect.module.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  type: 'crumb' | 'sparkle' | 'firework';
}

interface Props {
  type: 'pop' | 'firework';
  x: number;
  y: number;
  color?: string;
  comboLevel?: number;
  onComplete?: () => void;
}

const BREAD_COLORS = ['#F5DEB3', '#DEB887', '#D2B48C', '#C4A87D', '#E8D4A8'];
const FIREWORK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

export default function ParticleEffect({ type, x, y, color, comboLevel = 0, onComplete }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    const comboMultiplier = Math.min(1 + comboLevel * 0.3, 2.5);

    if (type === 'pop') {
      // Bread crumb particles (scaled by combo)
      const crumbCount = Math.round(16 * comboMultiplier);
      for (let i = 0; i < crumbCount; i++) {
        const angle = (Math.PI * 2 * i) / crumbCount + Math.random() * 0.5;
        const speed = (2 + Math.random() * 4) * Math.min(comboMultiplier, 1.5);
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          color: color || BREAD_COLORS[Math.floor(Math.random() * BREAD_COLORS.length)],
          size: 4 + Math.random() * 6,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          rotation: Math.random() * 360,
          type: 'crumb',
        });
      }
      // Sparkles (scaled by combo)
      const sparkleCount = Math.round(10 * comboMultiplier);
      for (let i = 0; i < sparkleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (3 + Math.random() * 3) * Math.min(comboMultiplier, 1.5);
        newParticles.push({
          id: 100 + i,
          x: 0,
          y: 0,
          color: '#FFD700',
          size: 3 + Math.random() * 4,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          rotation: 0,
          type: 'sparkle',
        });
      }
    } else if (type === 'firework') {
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
        const speed = 4 + Math.random() * 6;
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
          size: 6 + Math.random() * 6,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed - 2,
          rotation: Math.random() * 360,
          type: 'firework',
        });
      }
    }

    setParticles(newParticles);

    const timeout = setTimeout(() => {
      onComplete?.();
    }, type === 'pop' ? 600 : 1200);

    return () => clearTimeout(timeout);
  }, [type, color, comboLevel, onComplete]);

  return (
    <div className={styles.container} style={{ left: x, top: y }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`${styles.particle} ${styles[p.type]}`}
          style={{
            '--vx': p.velocityX,
            '--vy': p.velocityY,
            '--size': `${p.size}px`,
            '--color': p.color,
            '--rotation': `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}
      {type === 'pop' && <div className={styles.shockwave} />}
    </div>
  );
}
