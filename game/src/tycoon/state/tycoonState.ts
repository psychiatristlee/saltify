/**
 * Tycoon mode runtime state holder.
 *
 * One instance per active TycoonApp mount. Owns the upgrade ledger and
 * the cash position. The Pixi scene reads from this for its mechanics
 * (oven count, shelf capacity, alba behavior, marketing boost) and
 * mutates the cash field as sales / costs occur.
 *
 * Persisted to Firestore by tycoonJournal at end-of-day; loaded back on
 * next session.
 */

import {
  UpgradeState, ovenCount, bakeTimeMultiplier,
  shelfCapacity, albaCount, dailyWages, trafficBoost,
} from '../data/economy';

export interface TycoonState {
  cash: number;
  dayNumber: number;
  upgrades: UpgradeState;
}

export function makeInitialState(): TycoonState {
  return {
    cash: 50_000,
    dayNumber: 1,
    upgrades: { owned: {}, pendingNextDay: [] },
  };
}

// Convenience derived getters
export const stateOvenCount = (s: TycoonState) => ovenCount(s.upgrades);
export const stateBakeTimeMul = (s: TycoonState) => bakeTimeMultiplier(s.upgrades);
export const stateShelfCap = (s: TycoonState) => shelfCapacity(s.upgrades);
export const stateAlbaCount = (s: TycoonState) => albaCount(s.upgrades);
export const stateDailyWages = (s: TycoonState) => dailyWages(s.upgrades);
export const stateTrafficBoost = (s: TycoonState) => trafficBoost(s.upgrades.pendingNextDay);
