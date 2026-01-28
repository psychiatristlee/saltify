import { useEffect, useMemo } from 'react';
import styles from './CouponCelebration.module.css';

interface Props {
  breadImage: string;
  breadName: string;
  message: string;
  onClose: () => void;
}

// Generate confetti particles
function generateConfetti(count: number) {
  const colors = ['#FFD700', '#FF8C00', '#FF6B6B', '#4CAF50', '#2196F3', '#9C27B0'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

export default function CouponCelebration({ breadImage, breadName, message, onClose }: Props) {
  const confetti = useMemo(() => generateConfetti(50), []);

  // Vibrate on mobile devices
  useEffect(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, []);

  return (
    <div className={styles.overlay}>
      {/* Confetti */}
      <div className={styles.confettiContainer}>
        {confetti.map((c) => (
          <div
            key={c.id}
            className={styles.confetti}
            style={{
              left: `${c.left}%`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              backgroundColor: c.color,
              width: `${c.size}px`,
              height: `${c.size}px`,
              transform: `rotate(${c.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* Glow effect */}
      <div className={styles.glow} />

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.badge}>NEW</div>
        <div className={styles.iconContainer}>
          <div className={styles.iconRing} />
          <div className={styles.iconRing2} />
          <img src={breadImage} alt={breadName} className={styles.icon} />
        </div>
        <h2 className={styles.title}>쿠폰 획득!</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.couponTag}>
          <span className={styles.tagIcon}>🎟️</span>
          <span>{breadName} 쿠폰</span>
        </div>
        <button className={styles.button} onClick={onClose}>
          확인
        </button>
      </div>

      {/* Sparkles */}
      <div className={styles.sparkle} style={{ top: '20%', left: '15%' }} />
      <div className={styles.sparkle} style={{ top: '25%', right: '20%' }} />
      <div className={styles.sparkle} style={{ top: '60%', left: '10%' }} />
      <div className={styles.sparkle} style={{ top: '70%', right: '15%' }} />
    </div>
  );
}
