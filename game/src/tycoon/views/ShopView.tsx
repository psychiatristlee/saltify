/**
 * Between-day upgrade shop.
 *
 * Displayed after the end-of-day P&L modal is dismissed. The player can
 * spend accumulated cash on permanent upgrades (ovens, shelf, speed),
 * staff (alba — auto-bake), and one-day marketing boosts before
 * starting the next day.
 */

import { useState } from 'react';
import {
  UPGRADES, UpgradeCategory, UpgradeDef,
  isUpgradeAvailable, ovenCount, shelfCapacity, albaCount, bakeTimeMultiplier,
} from '../data/economy';
import { TycoonState } from '../state/tycoonState';
import styles from './ShopView.module.css';

interface Props {
  state: TycoonState;
  onPurchase: (def: UpgradeDef) => void;
  onClose: () => void;
}

const CATEGORY_META: Record<UpgradeCategory, { label: string; icon: string }> = {
  oven:      { label: '오븐',     icon: '🔥' },
  speed:     { label: '굽기 속도', icon: '⚡' },
  shelf:     { label: '진열대',   icon: '🥖' },
  staff:     { label: '직원',     icon: '👨‍🍳' },
  marketing: { label: '마케팅',   icon: '📢' },
};

export default function ShopView({ state, onPurchase, onClose }: Props) {
  const [tab, setTab] = useState<UpgradeCategory>('oven');
  const visibleUpgrades = UPGRADES.filter((u) => u.category === tab);

  const ownedSummary = (def: UpgradeDef): string => {
    const n = state.upgrades.owned[def.id] ?? 0;
    if (n === 0) return '';
    if (def.stacks) return `${n}개 보유`;
    return '보유 중';
  };

  return (
    <div className={styles.scrim}>
      <div className={styles.shop}>
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>UPGRADE SHOP</div>
            <h2 className={styles.title}>다음 날 준비</h2>
          </div>
          <div className={styles.cashBlock}>
            <span className={styles.cashLabel}>가용 현금</span>
            <span className={styles.cashValue}>₩{state.cash.toLocaleString()}</span>
          </div>
        </header>

        <div className={styles.statsStrip}>
          <Stat label="오븐"      value={`${ovenCount(state.upgrades)}대`} />
          <Stat label="진열 한도"  value={`${shelfCapacity(state.upgrades)}개`} />
          <Stat label="굽기 속도"  value={`×${(1 / bakeTimeMultiplier(state.upgrades)).toFixed(2)}`} />
          <Stat label="알바"       value={`${albaCount(state.upgrades)}명`} />
        </div>

        <nav className={styles.tabs}>
          {(Object.keys(CATEGORY_META) as UpgradeCategory[]).map((c) => (
            <button
              key={c}
              className={`${styles.tab} ${tab === c ? styles.tabActive : ''}`}
              onClick={() => setTab(c)}
            >
              <span>{CATEGORY_META[c].icon}</span>
              <span>{CATEGORY_META[c].label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.list}>
          {visibleUpgrades.map((def) => {
            const available = isUpgradeAvailable(def, state.upgrades);
            const affordable = state.cash >= def.cost;
            const summary = ownedSummary(def);
            const reqLocked = def.requires && !state.upgrades.owned[def.requires];
            const disabled = !available || !affordable;
            const reqDef = def.requires ? UPGRADES.find((u) => u.id === def.requires) : null;
            return (
              <div key={def.id} className={`${styles.card} ${disabled ? styles.cardDisabled : ''}`}>
                <div className={styles.cardMain}>
                  <div className={styles.cardName}>
                    {def.name}
                    {summary && <span className={styles.ownedTag}>{summary}</span>}
                  </div>
                  <div className={styles.cardDesc}>{def.description}</div>
                  {reqLocked && reqDef && (
                    <div className={styles.cardReq}>🔒 선행: {reqDef.name}</div>
                  )}
                </div>
                <button
                  className={`${styles.buyButton} ${disabled ? styles.buyButtonDisabled : ''}`}
                  onClick={() => onPurchase(def)}
                  disabled={disabled}
                >
                  <span className={styles.buyAmount}>₩{def.cost.toLocaleString()}</span>
                  <span className={styles.buyLabel}>
                    {!available ? '구매 불가' : !affordable ? '현금 부족' : '구매'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <button className={styles.startButton} onClick={onClose}>
          다음 날 시작 →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statItem}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
