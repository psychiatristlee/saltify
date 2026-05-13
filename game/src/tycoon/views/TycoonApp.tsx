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
import {
  BREAD_ECONOMY, STARTING_CASH, goalFor, UpgradeDef,
  unlockedBreads,
} from '../data/economy';
import { TycoonState, makeInitialState } from '../state/tycoonState';
import * as Audio from '../audio';
import ShopView from './ShopView';
import styles from './TycoonApp.module.css';

export default function TycoonApp() {
  const handleRef = useRef<StorefrontHandle | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journal, setJournal] = useState<JournalSummary | null>(null);
  // Local mirror of the TycoonState — the actual mutable object is held in stateRef.
  const stateRef = useRef<TycoonState>(makeInitialState());
  const [, setStateTick] = useState(0);   // bump to force rerender when state mutates
  const bumpState = () => setStateTick((n) => n + 1);

  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [cash, setCash] = useState(STARTING_CASH);
  const [ovens, setOvens] = useState<OvenStateView[]>([]);
  const [gameTimeMin, setGameTimeMin] = useState(11 * 60);
  const [phaseLabel, setPhaseLabel] = useState('오전 출근');
  const [dayNumber, setDayNumber] = useState(1);
  const [endOfDay, setEndOfDay] = useState<DayResult | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    // Always start with a default journal so the canvas can mount even
    // for unauthenticated visitors / journal load failures (the tycoon
    // mode is playable in guest mode, just without cross-session save).
    const fallback = {
      currentDay: 1, currentCash: STARTING_CASH,
      totalRevenue: 0, totalServed: 0, totalLost: 0,
    };
    if (!user?.id) {
      setJournal(fallback);
      return;
    }
    loadJournal(user.id).then((j) => {
      setJournal(j);
      stateRef.current = {
        cash: j.currentCash ?? STARTING_CASH,
        dayNumber: j.currentDay,
        upgrades: {
          owned: j.upgradesOwned ?? {},
          pendingNextDay: j.pendingMarketing ?? [],
        },
      };
      setDayNumber(j.currentDay);
      setCash(stateRef.current.cash);
      bumpState();
    }).catch((err) => {
      console.error('[tycoon] journal load failed', err);
      setJournal(fallback);
    });
  }, [user?.id]);

  const sceneFactory = useCallback(async (app: import('pixi.js').Application) => {
    const today = stateRef.current.dayNumber;
    const goal = goalFor(today);
    const handle = await createStorefrontScene(app, {
      state: stateRef.current,
      revenueGoal: goal.revenueTarget,
      goalBonus: goal.bonus,
    });
    handleRef.current = handle;
    handle.onSale((rev) => {
      setRevenue((r) => r + rev);
      setSalesCount((c) => c + 1);
      Audio.playSale();
    });
    handle.onCustomerLost(() => {
      setLostCount((c) => c + 1);
      Audio.playAngry();
    });
    handle.onCashChange((c) => setCash(c));
    handle.onOvenChange((s) => setOvens(s));
    handle.onOvenDone(() => {
      Audio.playOvenDing();
    });
    handle.onTimeChange((m, phase, day) => {
      setGameTimeMin(m);
      setPhaseLabel(phase);
      setDayNumber(day);
    });
    handle.onDayEnd((result) => {
      setEndOfDay(result);
      if (result.goalHit) Audio.playUnlock();
    });
    return handle.controller;
  }, [journal]);

  const journalReady = journal !== null;

  useEffect(() => () => { handleRef.current = null; }, []);

  function handlePurchase(def: UpgradeDef) {
    const st = stateRef.current;
    if (st.cash < def.cost) {
      Audio.playBlocked();
      return;
    }
    const cur = st.upgrades.owned[def.id] ?? 0;
    st.cash -= def.cost;
    st.upgrades.owned[def.id] = cur + 1;
    if (def.category === 'marketing') {
      st.upgrades.pendingNextDay = [...st.upgrades.pendingNextDay, def.id];
    }
    setCash(st.cash);
    bumpState();
    // Research unlock is a meaningful event — different chime.
    if (def.category === 'research' || def.category === 'branch') {
      Audio.playUnlock();
    } else {
      Audio.playPurchase();
    }
  }

  function toggleMute() {
    const next = !muted;
    Audio.setMuted(next);
    setMutedState(next);
  }

  async function handleStartNextDay() {
    const st = stateRef.current;
    st.dayNumber = (endOfDay?.dayNumber ?? st.dayNumber) + 1;
    setSaving(true);
    try {
      if (user?.id && endOfDay) {
        await saveDayResult(user.id, {
          dayNumber: endOfDay.dayNumber,
          revenue: endOfDay.revenue,
          branchRevenue: Math.round(endOfDay.branchRevenue),
          cogs: endOfDay.cogs,
          wages: endOfDay.wages,
          netProfit: Math.round(
            endOfDay.revenue + endOfDay.branchRevenue
            - endOfDay.cogs - endOfDay.wages + endOfDay.goalBonus
          ),
          served: endOfDay.served,
          lost: endOfDay.lost,
          satisfaction: endOfDay.satisfaction,
          cashEnd: Math.round(endOfDay.cashEnd),
          goalHit: endOfDay.goalHit,
          goalBonus: endOfDay.goalBonus,
          upgradesOwned: { ...st.upgrades.owned },
          pendingMarketing: [...st.upgrades.pendingNextDay],
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
    setShowShop(false);
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
  const goal = goalFor(dayNumber);
  const totalDayRevenue = revenue;
  const goalPct = Math.min(1, totalDayRevenue / goal.revenueTarget);
  const unlocked = unlockedBreads(stateRef.current.upgrades);
  const netProfit = endOfDay
    ? endOfDay.revenue + endOfDay.branchRevenue - endOfDay.cogs - endOfDay.wages + endOfDay.goalBonus
    : 0;

  return (
    <div className={styles.container}>
      {/* TOP HUD */}
      <header className={styles.hud}>
        <div className={styles.hudLeft}>
          <button className={styles.backButton} onClick={() => navigate('/')} aria-label="홈">
            ←
          </button>
          <button
            className={styles.muteButton}
            onClick={toggleMute}
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
            title={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
        <div className={styles.dayBlock}>
          <div className={styles.dayRow}>
            <span className={styles.dayPill}>DAY {dayNumber}</span>
            <span className={styles.clock}>{formatGameTime(gameTimeMin)}</span>
            <span className={styles.phaseTag}>{phaseLabel}</span>
          </div>
          <div className={styles.timeBar}>
            <div className={styles.timeBarFill} style={{ width: `${dayProgress * 100}%` }} />
          </div>
          <div className={styles.goalRow}>
            <span className={styles.goalLabel}>{goal.label}</span>
            <span className={styles.goalProgress}>
              ₩{revenue.toLocaleString()} / ₩{goal.revenueTarget.toLocaleString()}
            </span>
          </div>
          <div className={styles.goalBar}>
            <div className={styles.goalBarFill} style={{ width: `${goalPct * 100}%` }} />
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
            <span>판매 {salesCount}</span>
            <span className={styles.subStatDot}>·</span>
            <span className={styles.lostStat}>이탈 {lostCount}</span>
          </div>
        </div>
      </header>

      <div className={styles.canvas}>
        {journalReady && <PixiCanvas scene={sceneFactory} />}
        {!journalReady && <div className={styles.canvasLoading}>불러오는 중…</div>}
      </div>

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

      <footer className={styles.bakeBar}>
        <p className={styles.bakeHint}>탭해서 트레이 굽기 · 1판 = 6개</p>
        <div className={styles.bakeRow}>
          {breadTypes.map((type) => {
            const econ = BREAD_ECONOMY[type];
            const isUnlocked = unlocked.has(type);
            const isAlreadyBaking = ovens.some((o) => o.baking === type);
            const noFreeOven = ovens.length > 0 && ovens.every((o) => o.baking !== null);
            const tooPoor = cash < econ.costPerTray;
            const disabled = !isUnlocked || isAlreadyBaking || noFreeOven || tooPoor;
            return (
              <BakeButton
                key={type}
                type={type}
                cost={econ.costPerTray}
                disabled={disabled}
                locked={!isUnlocked}
                disabledReason={
                  !isUnlocked ? '레시피 미해금 — 상점에서 R&D' :
                  isAlreadyBaking ? '굽는 중' :
                  tooPoor ? '현금 부족' :
                  noFreeOven ? '오븐 가득' : ''
                }
                onBake={() => {
                  if (!isUnlocked) { Audio.playBlocked(); return; }
                  const ok = handleRef.current?.bakeTray(type);
                  if (!ok) Audio.playBlocked();
                }}
              />
            );
          })}
        </div>
      </footer>

      {endOfDay && !showShop && (
        <div className={styles.modalScrim}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalSubtitle}>영업 마감</span>
              <h2 className={styles.modalTitle}>Day {endOfDay.dayNumber}</h2>
            </div>

            {endOfDay.goalHit && (
              <div className={styles.goalHitBanner}>
                🎯 일일 목표 달성 · 보너스 +₩{endOfDay.goalBonus.toLocaleString()}
              </div>
            )}

            <div className={styles.modalSection}>
              <div className={styles.modalRow}>
                <span>본점 매출</span>
                <span className={styles.posMoney}>+₩{endOfDay.revenue.toLocaleString()}</span>
              </div>
              {endOfDay.branchRevenue > 0 && (
                <div className={styles.modalRow}>
                  <span>분점 수익</span>
                  <span className={styles.posMoney}>+₩{Math.round(endOfDay.branchRevenue).toLocaleString()}</span>
                </div>
              )}
              <div className={styles.modalRow}>
                <span>재료비</span>
                <span className={styles.negMoney}>−₩{endOfDay.cogs.toLocaleString()}</span>
              </div>
              <div className={styles.modalRow}>
                <span>인건비</span>
                <span className={styles.negMoney}>−₩{endOfDay.wages.toLocaleString()}</span>
              </div>
              {endOfDay.goalBonus > 0 && (
                <div className={styles.modalRow}>
                  <span>목표 달성 보너스</span>
                  <span className={styles.posMoney}>+₩{endOfDay.goalBonus.toLocaleString()}</span>
                </div>
              )}
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
                <span>판매한 빵</span><span>{endOfDay.served}개</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>놓친 손님</span><span>{endOfDay.lost}명</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>고객 만족도</span><span>{Math.round(endOfDay.satisfaction * 100)}%</span>
              </div>
              <div className={styles.modalSubRow}>
                <span>마감 후 현금</span>
                <span className={endOfDay.cashEnd >= 0 ? styles.posMoney : styles.negMoney}>
                  ₩{endOfDay.cashEnd.toLocaleString()}
                </span>
              </div>
            </div>

            <button className={styles.modalButton} onClick={() => setShowShop(true)}>
              상점 열기 →
            </button>
          </div>
        </div>
      )}

      {showShop && (
        <ShopView
          state={stateRef.current}
          currentDay={(endOfDay?.dayNumber ?? dayNumber) + 1}
          onPurchase={handlePurchase}
          onClose={() => handleStartNextDay()}
        />
      )}

      {saving && (
        <div className={styles.savingToast}>저장 중…</div>
      )}
    </div>
  );
}

function BakeButton({
  type, cost, disabled, locked, disabledReason, onBake,
}: {
  type: BreadType;
  cost: number;
  disabled: boolean;
  locked: boolean;
  disabledReason: string;
  onBake: () => void;
}) {
  const data = BREAD_DATA[type];
  // Strip "소금빵" suffix for compact button label — only choco-bun has it.
  const shortName = data.nameKo.replace(/\s?소금빵$/, '');
  return (
    <button
      className={`${styles.bakeButton} ${disabled ? styles.bakeButtonDisabled : ''} ${locked ? styles.bakeButtonLocked : ''}`}
      onClick={onBake}
      title={disabledReason || data.nameKo}
    >
      <img src={data.image} alt={data.nameKo} className={styles.bakeIcon} />
      <span className={styles.bakeName}>{shortName}</span>
      <span className={styles.bakeCost}>{locked ? '🔒' : `₩${(cost / 1000).toFixed(1)}k`}</span>
    </button>
  );
}
