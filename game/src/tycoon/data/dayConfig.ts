/**
 * Day cycle configuration for the tycoon mode.
 *
 * Real time: ~3 minutes per in-game day (11:00 → 19:30 = 510 game minutes).
 * Each phase has its own customer-spawn cadence and persona mix, so the
 * day "feels" different from morning rush to closing.
 */

export type Persona = 'commuter' | 'tourist' | 'student' | 'evening';

export interface PhaseConfig {
  /** Display label shown in the HUD. */
  label: string;
  /** Inclusive start time, in minutes since 00:00. */
  startMin: number;
  /** Exclusive end time. */
  endMin: number;
  /** Mean ms between customer spawns. Lower = busier. */
  spawnIntervalMs: number;
  /** Persona weights — higher = more likely. Must include all 4 keys. */
  weights: Record<Persona, number>;
}

export const OPEN_MIN = 11 * 60;        // 11:00
export const CLOSE_MIN = 19 * 60 + 30;  // 19:30
export const DAY_LEN_MIN = CLOSE_MIN - OPEN_MIN;  // 510

/** Real seconds it takes to play through one in-game day. */
export const DAY_LEN_SECONDS = 180;

/** Game minutes that pass per real second. */
export const TIME_SCALE = DAY_LEN_MIN / DAY_LEN_SECONDS;  // ≈ 2.83

export const PHASES: PhaseConfig[] = [
  {
    label: '오전 출근',
    startMin: 11 * 60,
    endMin: 13 * 60,
    spawnIntervalMs: 2200,
    weights: { commuter: 6, tourist: 2, student: 1, evening: 0 },
  },
  {
    label: '점심',
    startMin: 13 * 60,
    endMin: 15 * 60,
    spawnIntervalMs: 2600,
    weights: { commuter: 2, tourist: 5, student: 2, evening: 0 },
  },
  {
    label: '오후 카공',
    startMin: 15 * 60,
    endMin: 17 * 60,
    spawnIntervalMs: 3200,
    weights: { commuter: 0, tourist: 3, student: 6, evening: 1 },
  },
  {
    label: '저녁 퇴근',
    startMin: 17 * 60,
    endMin: 19 * 60 + 30,
    spawnIntervalMs: 1800,
    weights: { commuter: 0, tourist: 2, student: 1, evening: 7 },
  },
];

export function phaseAt(gameMin: number): PhaseConfig {
  for (const p of PHASES) {
    if (gameMin >= p.startMin && gameMin < p.endMin) return p;
  }
  return PHASES[PHASES.length - 1];
}

export function pickPersona(weights: Record<Persona, number>): Persona {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(weights) as [Persona, number][]) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'commuter';
}

export function formatGameTime(gameMin: number): string {
  const h = Math.floor(gameMin / 60);
  const m = Math.floor(gameMin % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Persona-specific behavior parameters.
 *
 * `purchaseQtyRange` — how many breads this persona orders. Commuter grabs
 * one for the train, tourist tries multiple flavors, evening crowd buys a
 * gift box. Pricing the bill by qty is what gives different personas
 * different revenue weight.
 */
export const PERSONA_PROFILE: Record<Persona, {
  patienceMs: number;
  walkSpeed: number;
  buyDwellMs: number;
  purchaseQtyRange: [number, number];
}> = {
  commuter: { patienceMs:  8000, walkSpeed: 2.4, buyDwellMs: 1000, purchaseQtyRange: [1, 1] },
  tourist:  { patienceMs: 14000, walkSpeed: 1.4, buyDwellMs: 2000, purchaseQtyRange: [2, 3] },
  student:  { patienceMs: 18000, walkSpeed: 1.2, buyDwellMs: 2500, purchaseQtyRange: [1, 1] },
  evening:  { patienceMs: 11000, walkSpeed: 1.8, buyDwellMs: 1500, purchaseQtyRange: [2, 4] },
};
