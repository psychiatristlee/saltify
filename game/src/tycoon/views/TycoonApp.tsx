import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PixiCanvas from '../pixi/PixiCanvas';
import { createStorefrontScene, StorefrontHandle } from '../pixi/scenes/StorefrontScene';
import { BREAD_DATA, BreadType, getAllBreadTypes } from '../../models/BreadType';
import styles from './TycoonApp.module.css';

export default function TycoonApp() {
  const handleRef = useRef<StorefrontHandle | null>(null);
  const navigate = useNavigate();
  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);

  const sceneFactory = useCallback(async (app: import('pixi.js').Application) => {
    const handle = await createStorefrontScene(app);
    handleRef.current = handle;
    handle.onSale((rev) => {
      setRevenue((r) => r + rev);
      setSalesCount((c) => c + 1);
    });
    handle.onCustomerLost(() => {
      setLostCount((c) => c + 1);
    });
    return handle.controller;
  }, []);

  useEffect(() => () => { handleRef.current = null; }, []);

  const breadTypes = getAllBreadTypes();

  return (
    <div className={styles.container}>
      <header className={styles.hud}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← 홈
        </button>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>매출</span>
            <span className={styles.statValue}>₩{revenue.toLocaleString()}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>판매</span>
            <span className={styles.statValue}>{salesCount}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>이탈</span>
            <span className={styles.statValueBad}>{lostCount}</span>
          </div>
        </div>
      </header>

      <div className={styles.canvas}>
        <PixiCanvas scene={sceneFactory} />
      </div>

      <footer className={styles.bakeBar}>
        <p className={styles.bakeHint}>탭해서 굽기 (재고 보충)</p>
        <div className={styles.bakeRow}>
          {breadTypes.map((type) => (
            <BakeButton
              key={type}
              type={type}
              onBake={() => handleRef.current?.bake(type)}
            />
          ))}
        </div>
        <p className={styles.testBanner}>🧪 타이쿤 모드 프로토타입 · 실 쿠폰 미연동</p>
      </footer>
    </div>
  );
}

function BakeButton({ type, onBake }: { type: BreadType; onBake: () => void }) {
  const data = BREAD_DATA[type];
  return (
    <button className={styles.bakeButton} onClick={onBake} title={data.nameKo}>
      <img src={data.image} alt={data.nameKo} className={styles.bakeIcon} />
      <span className={styles.bakeName}>{data.nameKo}</span>
    </button>
  );
}
