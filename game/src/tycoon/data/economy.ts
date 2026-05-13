/**
 * Tycoon mode economy + upgrade catalog.
 *
 * Core resources:
 *   - Cash (₩): liquid, spent on trays + upgrades + wages.
 *   - Ovens: base 2 slots, +1 per Oven upgrade tier.
 *   - Shelf: base 8/slot, raised by Shelf upgrades.
 *   - Staff: 알바 auto-bakes the most-demanded bread when an oven is free.
 *   - Marketing: temporarily multiplies spawn rate.
 *
 * Tray margins (~70%) leave room for daily wages + upgrade reinvestment,
 * which is the actual tycoon loop the user was missing in V1.
 */

import { BreadType } from '../../models/BreadType';

export interface BreadEconomy {
  costPerTray: number;
  bakeTimeMs: number;
  breadsPerTray: number;
}

export const BREAD_ECONOMY: Record<BreadType, BreadEconomy> = {
  [BreadType.Plain]:        { costPerTray: 4500, bakeTimeMs: 6000, breadsPerTray: 6 },
  [BreadType.Everything]:   { costPerTray: 5500, bakeTimeMs: 7000, breadsPerTray: 6 },
  [BreadType.OliveCheese]:  { costPerTray: 7000, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.BasilTomato]:  { costPerTray: 7000, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.GarlicButter]: { costPerTray: 6500, bakeTimeMs: 8000, breadsPerTray: 6 },
  [BreadType.Hotteok]:      { costPerTray: 7500, bakeTimeMs: 9000, breadsPerTray: 6 },
  [BreadType.ChocoBun]:     { costPerTray: 7500, bakeTimeMs: 9000, breadsPerTray: 6 },
};

export const STARTING_CASH = 50_000;
export const DAILY_WAGES_BASE = 30_000;     // base salary for the owner-baker
export const DAILY_WAGES_PER_ALBA = 25_000;
export const OVEN_BASE_COUNT = 2;
export const SHELF_BASE_CAPACITY = 8;       // per-slot stock cap
export const QUEUE_CAPACITY_BASE = 4;       // visible queue length
export const STARTING_STOCK = 2;

// ============================================================================
// Upgrade catalog — tiered. Buy in order; later tiers unlock as prior tiers
// are owned.
// ============================================================================

export type UpgradeCategory = 'oven' | 'shelf' | 'staff' | 'marketing' | 'speed' | 'research' | 'branch';

export interface UpgradeDef {
  id: string;
  category: UpgradeCategory;
  name: string;
  description: string;
  cost: number;
  /** If non-null, requires this upgrade id to already be owned. */
  requires?: string;
  /** Day number at or after which this becomes available. */
  dayRequirement?: number;
  /** Some upgrades stack (alba count); others are one-time switches. */
  stacks?: boolean;
  /** For stacking upgrades, the maximum number ownable. */
  maxStacks?: number;
}

/** Breads that are unlocked from Day 1 — others require research. */
export const STARTING_UNLOCKED_BREADS: BreadType[] = [
  BreadType.Plain,
  BreadType.Everything,
  BreadType.OliveCheese,
  BreadType.BasilTomato,
];

/** Research upgrade id → BreadType it unlocks. */
export const RESEARCH_UNLOCKS: Record<string, BreadType> = {
  'research-garlic-butter': BreadType.GarlicButter,
  'research-seed-hotteok':  BreadType.Hotteok,
  'research-choco-bun':     BreadType.ChocoBun,
};

/** Branch passive income: per game-minute, per branch tier.
 * Tuning: branch-2 ≈ ₩102k/day, branch-3 ≈ ₩255k/day — meaningful side income
 * without making the main storefront irrelevant. */
export const BRANCH_PASSIVE_PER_MIN: Record<string, number> = {
  'branch-2': 200,
  'branch-3': 500,
};

export const UPGRADES: UpgradeDef[] = [
  // OVEN — add slot capacity
  { id: 'oven-3',  category: 'oven',   name: '오븐 3호기',  description: '오븐 슬롯 +1 (총 3개)', cost: 90_000 },
  { id: 'oven-4',  category: 'oven',   name: '오븐 4호기',  description: '오븐 슬롯 +1 (총 4개)', cost: 180_000, requires: 'oven-3' },

  // SPEED — reduce bake time
  { id: 'speed-1', category: 'speed',  name: '컨벡션 팬',   description: '모든 오븐 굽기 시간 −20%', cost: 70_000 },
  { id: 'speed-2', category: 'speed',  name: '스팀 인젝션', description: '모든 오븐 굽기 시간 추가 −20%', cost: 140_000, requires: 'speed-1' },

  // SHELF — raise per-slot capacity
  { id: 'shelf-1', category: 'shelf',  name: '진열대 확장',   description: '슬롯당 진열 한도 +4 (총 12)', cost: 50_000 },
  { id: 'shelf-2', category: 'shelf',  name: '쇼케이스 교체', description: '슬롯당 진열 한도 추가 +4 (총 16)', cost: 120_000, requires: 'shelf-1' },

  // STAFF — alba auto-bake
  {
    id: 'alba', category: 'staff', name: '알바 채용',
    description: '6초마다 가장 비어있는 빵을 자동으로 트레이 굽기. 일급 25,000원',
    cost: 40_000, stacks: true, maxStacks: 2,
  },

  // MARKETING — boost spawn rate for next day
  {
    id: 'mkt-insta', category: 'marketing', name: '인스타 광고',
    description: '다음 날 손님 트래픽 +30% (1일 한정)', cost: 25_000, stacks: true, maxStacks: 5,
  },
  {
    id: 'mkt-naver', category: 'marketing', name: '네이버 플레이스 광고',
    description: '다음 날 손님 트래픽 +60% (1일 한정)', cost: 60_000, requires: 'mkt-insta',
    stacks: true, maxStacks: 5,
  },

  // RESEARCH — unlock additional menu items
  {
    id: 'research-garlic-butter', category: 'research', name: '갈릭버터 레시피',
    description: '갈릭버터 소금빵 메뉴 해금. 인기 메뉴, 객단가 ₩4,300',
    cost: 40_000, dayRequirement: 3,
  },
  {
    id: 'research-seed-hotteok', category: 'research', name: '씨앗호떡 레시피',
    description: '씨앗호떡 소금빵 메뉴 해금. 견과+캐러멜, 객단가 ₩4,300',
    cost: 60_000, dayRequirement: 5,
  },
  {
    id: 'research-choco-bun', category: 'research', name: '초코번 시그니처 R&D',
    description: '초코번 소금빵 메뉴 해금. 매장 시그니처, 객단가 ₩4,300',
    cost: 100_000, dayRequirement: 7,
  },

  // BRANCH — passive income from additional stores
  {
    id: 'branch-2', category: 'branch', name: '연남 2호점 출점',
    description: '분점 1개 추가 — 영업 시간 동안 자동 수익 (₩200 / 게임-분, ≈ ₩100k/day)',
    cost: 500_000, dayRequirement: 10,
  },
  {
    id: 'branch-3', category: 'branch', name: '성수 3호점 출점',
    description: '분점 추가 — 자동 수익 (₩500 / 게임-분, ≈ ₩255k/day)',
    cost: 1_500_000, dayRequirement: 25, requires: 'branch-2',
  },
];

// ============================================================================
// Daily goals — each tier rewards a cash bonus when revenue target is hit.
// ============================================================================
export interface DailyGoal {
  fromDay: number;
  toDay: number;
  label: string;
  revenueTarget: number;
  bonus: number;
}

export const DAILY_GOALS: DailyGoal[] = [
  { fromDay: 1, toDay: 2,   label: '동교 1주 적응',         revenueTarget:  60_000, bonus: 10_000 },
  { fromDay: 3, toDay: 5,   label: '연남 단골 만들기',       revenueTarget: 100_000, bonus: 15_000 },
  { fromDay: 6, toDay: 10,  label: '홍대 입소문',            revenueTarget: 180_000, bonus: 25_000 },
  { fromDay: 11, toDay: 20, label: '베이커리 인증',          revenueTarget: 280_000, bonus: 40_000 },
  { fromDay: 21, toDay: 999, label: '솔트빵 본점 명소',       revenueTarget: 400_000, bonus: 60_000 },
];

export function goalFor(day: number): DailyGoal {
  for (const g of DAILY_GOALS) {
    if (day >= g.fromDay && day <= g.toDay) return g;
  }
  return DAILY_GOALS[DAILY_GOALS.length - 1];
}

// ============================================================================
// State derivation helpers — pure functions of the upgrade map.
// ============================================================================
export interface UpgradeState {
  /** id → count (1 for non-stacking owned, N for stacking). */
  owned: Record<string, number>;
  /** Marketing items consumed but pending application on next day. */
  pendingNextDay: string[];
}

export function ovenCount(state: UpgradeState): number {
  return OVEN_BASE_COUNT + (state.owned['oven-3'] ? 1 : 0) + (state.owned['oven-4'] ? 1 : 0);
}
export function bakeTimeMultiplier(state: UpgradeState): number {
  let m = 1;
  if (state.owned['speed-1']) m *= 0.8;
  if (state.owned['speed-2']) m *= 0.8;
  return m;
}
export function shelfCapacity(state: UpgradeState): number {
  return SHELF_BASE_CAPACITY
    + (state.owned['shelf-1'] ? 4 : 0)
    + (state.owned['shelf-2'] ? 4 : 0);
}
export function albaCount(state: UpgradeState): number {
  return state.owned['alba'] ?? 0;
}
export function dailyWages(state: UpgradeState): number {
  return DAILY_WAGES_BASE + albaCount(state) * DAILY_WAGES_PER_ALBA;
}
/** Spawn rate multiplier from marketing items pending for this day. */
export function trafficBoost(pending: string[]): number {
  let m = 1;
  for (const id of pending) {
    if (id === 'mkt-insta') m *= 1.3;
    if (id === 'mkt-naver') m *= 1.6;
  }
  return m;
}

export function isUpgradeAvailable(def: UpgradeDef, state: UpgradeState, currentDay = 1): boolean {
  if (def.requires && !state.owned[def.requires]) return false;
  if (def.dayRequirement && currentDay < def.dayRequirement) return false;
  const count = state.owned[def.id] ?? 0;
  if (def.stacks) {
    return count < (def.maxStacks ?? 99);
  }
  return count === 0;
}

/** Set of bread types the player can currently bake (starting unlocks + researched). */
export function unlockedBreads(state: UpgradeState): Set<BreadType> {
  const set = new Set<BreadType>(STARTING_UNLOCKED_BREADS);
  for (const [id, breadType] of Object.entries(RESEARCH_UNLOCKS)) {
    if (state.owned[id]) set.add(breadType);
  }
  return set;
}

/** Total passive income per game-minute from all owned branches. */
export function branchPassivePerMin(state: UpgradeState): number {
  let total = 0;
  for (const [id, perMin] of Object.entries(BRANCH_PASSIVE_PER_MIN)) {
    if (state.owned[id]) total += perMin;
  }
  return total;
}
