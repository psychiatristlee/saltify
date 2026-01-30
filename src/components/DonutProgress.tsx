import { useEffect, useRef, useState } from 'react';
import styles from './DonutProgress.module.css';

interface DonutProgressProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
  imageUrl: string;
  color: string;
  couponCount?: number;
}

export default function DonutProgress({
  progress,
  size,
  strokeWidth,
  imageUrl,
  color,
  couponCount = 0,
}: DonutProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  const imageSize = size - strokeWidth * 2 - 8;

  const prevProgress = useRef(progress);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (progress > prevProgress.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 500);
      prevProgress.current = progress;
      return () => clearTimeout(timer);
    }
    prevProgress.current = progress;
  }, [progress]);

  return (
    <div
      className={`${styles.container} ${animating ? styles.pulse : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className={styles.svg}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={styles.progressCircle}
        />
      </svg>
      <div className={styles.imageContainer}>
        <img
          src={imageUrl}
          alt=""
          className={styles.breadImage}
          style={{ width: imageSize, height: imageSize }}
        />
      </div>
      {couponCount > 0 && (
        <div className={styles.couponBadge}>
          {couponCount}
        </div>
      )}
    </div>
  );
}
