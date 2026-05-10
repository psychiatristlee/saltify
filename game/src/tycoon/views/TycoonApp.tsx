import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PixiCanvas from '../pixi/PixiCanvas';
import {
  createStorefrontScene, StorefrontHandle, DayResult, OvenStateView,
} from '../pixi/scenes/StorefrontScene';
import { BREAD_DATA, BreadType, getAllBreadTypes } from '../../models/BreadType';
import { useAuth } from '../../hooks/useAuth';
import { loadJournal, saveDayResult, JournalSummary } from '../services/tycoonJournal';
import { formatGameTime } from '../data/dayConfig';
import { BREAD_ECONOMY, STARTING_CASH } from '../data/economy';
import styles from './TycoonApp.module.css';

export default function TycoonApp() {
  const handleRef = useRef<StorefrontHandle | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journal, setJournal] = useState<JournalSummary | null>(null);
  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [cash, setCash] = useState(STARTING_CASH);
  const [ovens, setOvens] = useState<OvenStateView[]>([]);
  const [gameTimeMin, setGameTimeMin] = useState(11 * 60);
  const [phaseLabel, setPhaseLabel] = useState('오전 출근');
  const [dayNumber, setDayNumber] = useState(1);
  const [endOfDay, setEndOfDay] = useState<DayResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadJournal(user.id).then((j) => {
      setJournal(j);
      setDayNumber(j.currentDay);
      setCash(j.currentCash ?? STARTING_CASH);
    }).catch((err) => {
      console.error('[tycoon] journal load failed', err);
      setJournal({ currentDay: 1, totalRevenue: 0, totalServed: 0, totalLost: 0, currentCash: STARTING_CASH });
    });
  }, [user?.id]);

  const sceneFactory = useCallback(async (app: import('pixi.js').Application) => {
    const startDay = journal?.currentDay ?? 1;
    const startCash = journal?.currentCash ?? STARTING_CASH;
    const handle = await createStorefrontScene(app, startDay, startCash);
    handleRef.current = handle;
    handle.onSale((rev) => {
      setRevenue((r) => r + rev);
      setSalesCount((c) => c + 1);
    });
    handle.onCustomerLost(() => {
      setLostCount((c) => c + 1);
    });
    handle.onCashChange((c) => setCash(c));
    handle.onOvenChange((s) => setOvens(s));
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
          cogs: endOfDay.cogs,
          wages: endOfDay.wages,
          netProfit: endOfDay.revenue - endOfDay.cogs - endOfDay.wages,
          served: endOfDay.served,
          lost: endOfDay.lost,
          satisfaction: endOfDay.satisfaction,
          cashEnd: endOfDay.cashEnd,
        });
      }
    } catch (err) {
      console.error('[tycoon] saveDayResult failed', err);
    } finally {
      setSaving(false);
    }
    setRevenue(0);
    setSalesCount(0);
    setLostCount(0);
    setEndOfDay(null);
    handleRef.current?.startNextDay();
    if (user?.id) {
      try {
        const j = await loadJournal(user.id);
        setJournal(j);
      } catch (e) { /* non-fatal */ }
    }
  }

  const breadTypes = getAllBreadTypes();
  const dayProgress = Math.min(1, Math.max(0, (gameTimeMin - 11 * 60) / (8.5 * 60)));
  const netProfit = endOfDay
    ? endOfDay.revenue - endOfDay.cogs - endOfDay.wages
    : 0;

  return (
    <div className={styles.container}>
      {/* TOP HUD — single row, modern flat style */}
      <header className={styles.hud}>
        <button className={styles.backButton} onClick={() => navigate('/')} aria-label="홈">
          ←
        </button>
        <div className={styles.dayBlock}>
          <div className={styles.dayPill}>DAY {dayNumber}</div>
          <div className={styles.timeRow}>
            <span className={styles.clock}>{formatGameTime(gameTimeMin)}</span>
            <span className={styles.phaseTag}>{phaseLabel}</span>
          </div>
          <div className={styles.timeBar}>
            <div className={styles.timeBarFill} style={{ width: `${dayProgress * 100}%` }} />
          </div>
        </div>
        <div className={styles.moneyBlock}>
          <div className={styles.cashRow}>
            <span className={styles.cashLabel}>현금</span>
            <span className={`${styles.cashValue} ${cash < 10000 ? styles.cashLow : ''}`}>
              ₩{cash.toLocaleString()}
            </span>
          </div>
          <div className={styles.subStats}>
            <span>매출 ₩{revenue.toLocaleString()}</span>
            <span className={styles.subStatDot}>·</span>
            <span>판매 {salesCount}</span>
            <span className={styles.subStatDot}>·</span>
            <span className={styles.lostStat}>이탈 {lostCount}</span>
          </div>
        </div>
      </header>

      {/* CANVAS */}
      <div className={styles.canvas}>
        {journalReady && <PixiCanvas scene={sceneFactory} />}
        {!journalReady && <div className={styles.canvasLoading}>불러오는 중…</div>}
      </div>

      {/* OVEN STATUS STRIP */}
      <div className={styles.ovenStrip}>
        {ovens.map((o, i) => (
          <div key={i} className={styles.ovenCard}>
            <div className={styles.ovenHeader}>
              <span className={styles.ovenLabel}>오븐 {i + 1}</span>
              <span className={styles.ovenStatus}>
                {o.baking !== null ? `${BREAD_DATA[o.baking].nameKo} 굽는 중` : '대기'}
              </span>
            </div>
            <div className={styles.ovenBar}>
              <div
                className={styles.ovenBarFill}
                style={{ width: `${(o.baking !== null ? o.progress : 0) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* BAKE BAR — tray-based bake buttons */}
      <footer className={styles.bakeBar}>
        <p className={styles.bakeHint}>탭해서 트레이 굽기 (1판 = 6개)</p>
        <div className={styles.bakeRow}>
          {breadTypes.map((type) => {
            const econ = BREAD_ECONOMY[type];
            const isAlreadyBaking = ovens.some((o) => o.baking === type);
            const noFreeOven = ovens.length > 0 && ovens.every((o) => o.baking !== null);
            const tooPoor = cash < econ.costPerTray;
            const disabled = isAlreadyBaking || noFreeOven || tooPoor;
            return (
              <BakeButton
                key={type}
                type={type}
                cost={econ.costPerTray}
                disabled={disabled}
                disabledReason={
                  isAlreadyBaking ? '굽는 중' :
                  tooPoor ? '현금 부족' :
                  noFreeOven ? '오븐 가득' : ''
                }
                onBake={() => handleRef.current?.bakeTray(type)}
              />
            );
          })}
        </div>
        <p className={styles.testBanner}>🧪 베타 · 실 쿠폰 미연동</p>
      </footer>

      {endOfDay && (
        <div className={styles.modalScrim}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalSubtitle}>영업 마감</span>
              <h2 className={styles.modalTitle}>Day {endOfDay.dayNumber}</h2>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalRow}>
                <span>매출</span>
                <span className={styles.posMoney}>+₩{endOfDay.revenue.toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>재료비 (트레이 원가)</span>
                <span className={styles.negMoney}>−₩{endOfDay.cogs.toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>인건비 (알바)</span>
                <span className={styles.negMoney}>−₩{endOfDay.wages.toLocaleString()}</span>
              </div>
              <div className={styles.modalDivider} />
              <div className={`${styles.modalRow} ${styles.modalRowTotal}`}>
                <span>순이익</span>
                <span className={netProfit >= 0 ? styles.posMoney : styles.negMoney}>
                  {netProfit >= 0 ? '+' : '−'}₩{Math.abs(netProfit).toLocaleString()}
                </span>
              </div>
            </div>

            <div className={styles.modalSection}>
              <div className={styles.modalSubRow}>
                <span>판매한 빵</span>
                <span>{endOfDay.served}개</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>놓친 손님</span>
                <span>{endOfDay.lost}명</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>고객 만족도</span>
                <span>{Math.round(endOfDay.satisfaction * 100)}%</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>마감 후 현금</span>
                <span className={endOfDay.cashEnd >= 0 ? styles.posMoney : styles.negMoney}>
                  ₩{endOfDay.cashEnd.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              className={styles.modalButton}
              onClick={handleNextDay}
              disabled={saving}
            >
              {saving ? '저장 중…' : `Day ${endOfDay.dayNumber + 1} 시작`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BakeButton({
  type, cost, disabled, disabledReason, onBake,
}: {
  type: BreadType;
  cost: number;
  disabled: boolean;
  disabledReason: string;
  onBake: () => void;
}) {
  const data = BREAD_DATA[type];
  return (
    <button
      className={`${styles.bakeButton} ${disabled ? styles.bakeButtonDisabled : ''}`}
      onClick={onBake}
      disabled={disabled}
      title={disabledReason || data.nameKo}
    >
      <img src={data.image} alt={data.nameKo} className={styles.bakeIcon} />
      <span className={styles.bakeName}>{data.nameKo}</span>
      <span className={styles.bakeCost}>₩{cost.toLocaleString()}</span>
    </button>
  );
}
