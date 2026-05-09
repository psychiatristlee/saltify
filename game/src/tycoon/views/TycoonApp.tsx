import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PixiCanvas from '../pixi/PixiCanvas';
import { createStorefrontScene, StorefrontHandle, DayResult } from '../pixi/scenes/StorefrontScene';
import { BREAD_DATA, BreadType, getAllBreadTypes } from '../../models/BreadType';
import { useAuth } from '../../hooks/useAuth';
import { loadJournal, saveDayResult, JournalSummary } from '../services/tycoonJournal';
import { formatGameTime } from '../data/dayConfig';
import styles from './TycoonApp.module.css';

export default function TycoonApp() {
  const handleRef = useRef<StorefrontHandle | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journal, setJournal] = useState<JournalSummary | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [gameTimeMin, setGameTimeMin] = useState(11 * 60);
  const [phaseLabel, setPhaseLabel] = useState('오전 출근');
  const [dayNumber, setDayNumber] = useState(1);
  const [endOfDay, setEndOfDay] = useState<DayResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Load journal once when user is known
  useEffect(() => {
    if (!user?.id) return;
    loadJournal(user.id).then((j) => {
      setJournal(j);
      setDayNumber(j.currentDay);
    }).catch((err) => {
      console.error('[tycoon] journal load failed', err);
      // fallback to local-only mode
      setJournal({ currentDay: 1, totalRevenue: 0, totalServed: 0, totalLost: 0 });
    });
  }, [user?.id]);

  const sceneFactory = useCallback(async (app: import('pixi.js').Application) => {
    // Wait for journal load before starting (so we know currentDay)
    const startDay = journal?.currentDay ?? 1;
    const handle = await createStorefrontScene(app, startDay);
    handleRef.current = handle;
    handle.onSale((rev) => {
      setRevenue((r) => r + rev);
      setSalesCount((c) => c + 1);
    });
    handle.onCustomerLost(() => {
      setLostCount((c) => c + 1);
    });
    handle.onTimeChange((m, phase, day) => {
      setGameTimeMin(m);
      setPhaseLabel(phase);
      setDayNumber(day);
    });
    handle.onDayEnd((result) => {
      setEndOfDay(result);
    });
    return handle.controller;
  }, [journal]);

  // Don't mount PixiCanvas until journal load resolves (so startDay is correct)
  const journalReady = journal !== null;

  useEffect(() => () => { handleRef.current = null; }, []);

  async function handleNextDay() {
    if (!endOfDay) return;
    setSaving(true);
    try {
      if (user?.id) {
        await saveDayResult(user.id, {
          dayNumber: endOfDay.dayNumber,
          revenue: endOfDay.revenue,
          served: endOfDay.served,
          lost: endOfDay.lost,
          satisfaction: endOfDay.satisfaction,
        });
      }
    } catch (err) {
      console.error('[tycoon] saveDayResult failed', err);
    } finally {
      setSaving(false);
    }
    // Reset live counters and start the next day
    setRevenue(0);
    setSalesCount(0);
    setLostCount(0);
    setEndOfDay(null);
    handleRef.current?.startNextDay();
    // Refresh local journal cache
    if (user?.id) {
      try {
        const j = await loadJournal(user.id);
        setJournal(j);
      } catch (e) { /* non-fatal */ }
    }
  }

  const breadTypes = getAllBreadTypes();
  const dayProgress = Math.min(1, Math.max(0, (gameTimeMin - 11 * 60) / (8.5 * 60)));

  return (
    <div className={styles.container}>
      <header className={styles.hud}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← 홈
        </button>
        <div className={styles.timeBlock}>
          <div className={styles.dayLabel}>Day {dayNumber}</div>
          <div className={styles.clock}>{formatGameTime(gameTimeMin)}</div>
          <div className={styles.phaseLabel}>{phaseLabel}</div>
          <div className={styles.timeBar}>
            <div className={styles.timeBarFill} style={{ width: `${dayProgress * 100}%` }} />
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>매출</span>
            <span className={styles.statValue}>₩{revenue.toLocaleString()}</span>
          </div>
          <div className={styles.statSm}>
            <span className={styles.statLabelSm}>판매</span>
            <span className={styles.statValueSm}>{salesCount}</span>
          </div>
          <div className={styles.statSm}>
            <span className={styles.statLabelSm}>이탈</span>
            <span className={styles.statValueBadSm}>{lostCount}</span>
          </div>
        </div>
      </header>

      <div className={styles.canvas}>
        {journalReady && <PixiCanvas scene={sceneFactory} />}
        {!journalReady && <div className={styles.canvasLoading}>불러오는 중…</div>}
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
        <p className={styles.testBanner}>🧪 타이쿤 모드 베타 · 실 쿠폰 미연동</p>
      </footer>

      {endOfDay && (
        <div className={styles.modalScrim}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Day {endOfDay.dayNumber} 영업 마감</h2>
            <div className={styles.modalRow}>
              <span>매출</span>
              <span className={styles.modalValue}>₩{endOfDay.revenue.toLocaleString()}</span>
            </div>
            <div className={styles.modalRow}>
              <span>판매한 빵</span>
              <span className={styles.modalValue}>{endOfDay.served}개</span>
            </div>
            <div className={styles.modalRow}>
              <span>놓친 손님</span>
              <span className={styles.modalValueBad}>{endOfDay.lost}명</span>
            </div>
            <div className={styles.modalRow}>
              <span>고객 만족도</span>
              <span className={styles.modalValue}>
                {Math.round(endOfDay.satisfaction * 100)}%
              </span>
            </div>
            {journal && (
              <div className={styles.modalCumulative}>
                누적 매출 ₩{(journal.totalRevenue + endOfDay.revenue).toLocaleString()} · 운영 {endOfDay.dayNumber}일차
              </div>
            )}
            <button
              className={styles.modalButton}
              onClick={handleNextDay}
              disabled={saving}
            >
              {saving ? '저장 중…' : `Day ${endOfDay.dayNumber + 1} 시작 →`}
            </button>
          </div>
        </div>
      )}
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
