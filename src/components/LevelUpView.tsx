import { useEffect, useState } from 'react';
import ParticleEffect from './ParticleEffect';
import styles from './LevelUpView.module.css';

interface Props {
  level: number;
  score: number;
}

interface Firework {
  id: number;
  x: number;
  y: number;
}

export default function LevelUpView({ level, score }: Props) {
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    // Launch fireworks at random positions
    const launchFirework = () => {
      const id = Date.now() + Math.random();
      const x = Math.random() * window.innerWidth;
      const y = 100 + Math.random() * (window.innerHeight * 0.5);

      setFireworks((prev) => [...prev, { id, x, y }]);
    };

    // Launch multiple fireworks with delays
    const intervals = [0, 200, 400, 600, 800, 1000, 1200, 1400];
    const timeouts = intervals.map((delay) =>
      setTimeout(launchFirework, delay)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const removeFirework = (id: number) => {
    setFireworks((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.celebration}>🎉</div>
        <h2 className={styles.title}>레벨 클리어!</h2>
        <div className={styles.levelBadge}>
          <span className={styles.levelLabel}>LEVEL</span>
          <span className={styles.levelNumber}>{level}</span>
        </div>
        <p className={styles.score}>최종 점수: {score.toLocaleString()}</p>
        <p className={styles.nextLevel}>레벨 {level + 1} 시작!</p>
      </div>

      {fireworks.map((fw) => (
        <ParticleEffect
          key={fw.id}
          type="firework"
          x={fw.x}
          y={fw.y}
          onComplete={() => removeFirework(fw.id)}
        />
      ))}
    </div>
  );
}
