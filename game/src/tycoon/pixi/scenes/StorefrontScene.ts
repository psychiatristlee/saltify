import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import { BREAD_DATA, getAllBreadTypes, BreadType } from '../../../models/BreadType';
import {
  CLOSE_MIN, OPEN_MIN, TIME_SCALE,
  PERSONA_PROFILE, Persona, phaseAt, pickPersona,
} from '../../data/dayConfig';
import {
  BREAD_ECONOMY, QUEUE_CAPACITY_BASE, STARTING_STOCK,
  bakeTimeMultiplier, ovenCount, shelfCapacity, albaCount, dailyWages, trafficBoost,
  unlockedBreads, branchPassivePerMin,
} from '../../data/economy';
import { TycoonState } from '../../state/tycoonState';
import type { PixiSceneController } from '../PixiCanvas';

// Warm flat bakery palette
const WALL = 0xfaf2e2;
const WALL_DARK = 0xeadcb8;
const FLOOR = 0xb88a5a;
const FLOOR_DARK = 0x8b6a3e;
const COUNTER = 0x6d4d2e;
const COUNTER_LIGHT = 0x8e6e44;
const SHELF_BG = 0xc9a06d;
const SHELF_TRIM = 0x7a5635;
// Oven — brushed-steel commercial bakery look
const OVEN_BODY = 0x4a4744;
const OVEN_BODY_LIGHT = 0x6b6663;
const OVEN_BODY_DARK = 0x2a2826;
const OVEN_TRIM = 0x1a1815;
const OVEN_GLASS_DARK = 0x0a0807;
const OVEN_GLASS_GLOW = 0xff7a2a;
const OVEN_HANDLE = 0xb8b8b8;
const OVEN_DIGITAL = 0xff5a30;
const OVEN_KNOB = 0x202020;
const TRAY = 0x6a6360;

interface BreadSlot {
  type: BreadType;
  sprite: Sprite;
  baseX: number;
  baseY: number;
  inStock: number;
}

interface Customer {
  container: Container;
  spriteContainer: Container;  // animated parent of the persona sprite
  patienceFill: Graphics;
  bubbleQtyText: Text | null;
  speed: number;
  state: 'arriving' | 'waiting' | 'serving' | 'leaving';
  queueIndex: number;
  patienceMaxMs: number;
  patienceLeftMs: number;
  serveDwellMs: number;
  dwellElapsed: number;
  wantedType: BreadType;
  wantedQty: number;
  persona: Persona;
  animPhase: number;            // 0..2π, drives idle/walk bob
}

interface OvenSlot {
  index: number;
  baking: BreadType | null;
  remainingMs: number;
  totalMs: number;
  doorContainer: Container;
  tray: Graphics;                 // metal tray sitting on the rack
  trayBread: Sprite | null;
  glow: Graphics;
  steam: Container;               // 3 steam puffs animated
  digital: Text;                  // "READY" / "180°" / countdown
  progressBar: Graphics;
  progressBarBg: Graphics;
  bodyGfx: Graphics;
  labelText: Text;
}

export interface OvenStateView {
  index: number;
  baking: BreadType | null;
  progress: number;
}

export interface DayResult {
  dayNumber: number;
  revenue: number;
  branchRevenue: number;
  cogs: number;
  wages: number;
  served: number;
  lost: number;
  satisfaction: number;
  cashEnd: number;
  goalHit: boolean;
  goalBonus: number;
}

export interface StorefrontHandle {
  controller: PixiSceneController;
  bakeTray: (type: BreadType) => boolean;
  /** True iff the bread is in the unlocked set for the current upgrade state. */
  isBreadUnlocked: (type: BreadType) => boolean;
  startNextDay: () => void;
  /** Sync upgrade state changes mid-life (e.g., after a between-day shop purchase). */
  refreshUpgrades: () => void;
  onDayEnd: (cb: (r: DayResult) => void) => void;
  onSale: (cb: (revenue: number, type: BreadType) => void) => void;
  onCustomerLost: (cb: () => void) => void;
  onCashChange: (cb: (cash: number) => void) => void;
  onOvenChange: (cb: (states: OvenStateView[]) => void) => void;
  onOvenDone: (cb: () => void) => void;
  onTimeChange: (cb: (gameMin: number, phaseLabel: string, dayNumber: number) => void) => void;
}

const CUSTOMER_TEXTURES: Record<Persona, string> = {
  commuter: '/customers/commuter.png',
  tourist: '/customers/tourist.png',
  student: '/customers/student.png',
  evening: '/customers/evening.png',
};

// Logical canvas
const W = 720;
const H = 1280;
const SHELF_X = 56;
const SHELF_Y = 200;
const SHELF_W = W - 112;
const SHELF_H = 360;
const COUNTER_TOP_Y = 700;
const COUNTER_H = 60;
const FLOOR_Y = COUNTER_TOP_Y + COUNTER_H;
const QUEUE_Y = 1100;
const QUEUE_START_X = W / 2 - 60;
const QUEUE_SPACING = 110;
const OVEN_AREA_Y = 580;
const OVEN_W = 200;
const OVEN_H = 100;

export interface SceneOptions {
  state: TycoonState;
  /** Optional revenue goal — if hit by end of day, fires goalHit=true. */
  revenueGoal?: number;
  /** Bonus paid out when goal is hit. */
  goalBonus?: number;
}

export async function createStorefrontScene(
  app: Application,
  opts: SceneOptions,
): Promise<StorefrontHandle> {
  const stage = app.stage;
  const root = new Container();
  stage.addChild(root);

  const state = opts.state;
  const revenueGoal = opts.revenueGoal ?? 0;
  const goalBonus = opts.goalBonus ?? 0;

  const world = new Container();
  root.addChild(world);

  // === Background ===
  const bg = new Graphics();
  bg.rect(0, 0, W, COUNTER_TOP_Y).fill(WALL);
  for (let x = 0; x < W; x += 60) {
    bg.rect(x, 0, 30, COUNTER_TOP_Y).fill({ color: WALL_DARK, alpha: 0.18 });
  }
  bg.rect(0, FLOOR_Y, W, H - FLOOR_Y).fill(FLOOR);
  for (let i = 0; i < 6; i++) {
    const y = FLOOR_Y + i * (H - FLOOR_Y) / 6;
    bg.rect(0, y, W, 3).fill(FLOOR_DARK);
  }
  bg.rect(0, COUNTER_TOP_Y + COUNTER_H - 4, W, 4).fill(0x4d3320);
  world.addChild(bg);

  // Counter
  const counter = new Graphics();
  counter.rect(0, COUNTER_TOP_Y, W, COUNTER_H).fill(COUNTER);
  counter.rect(0, COUNTER_TOP_Y, W, 14).fill(COUNTER_LIGHT);
  for (let i = 0; i < 3; i++) {
    counter.moveTo(0, COUNTER_TOP_Y + 22 + i * 12)
      .lineTo(W, COUNTER_TOP_Y + 22 + i * 12)
      .stroke({ color: 0x4d3320, width: 1, alpha: 0.45 });
  }
  // cash register on the counter
  counter.roundRect(W / 2 - 60, COUNTER_TOP_Y - 10, 120, 24, 4).fill(0x4d3320);
  counter.roundRect(W / 2 - 55, COUNTER_TOP_Y - 7, 110, 8, 2).fill(0x2a1a0e);
  counter.roundRect(W / 2 - 28, COUNTER_TOP_Y + 2, 56, 10, 2).fill(0xc0a065);
  world.addChild(counter);

  // Sign
  const sign = new Text({
    text: 'Salt, 0',
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 52,
      fontWeight: '700',
      fill: 0x6d4d2e,
      letterSpacing: 4,
    },
  });
  sign.anchor.set(0.5, 0);
  sign.x = W / 2;
  sign.y = 38;
  world.addChild(sign);

  const subSign = new Text({
    text: '솔트빵 · 홍대',
    style: { fontFamily: 'sans-serif', fontSize: 22, fill: 0x8b6f47 },
  });
  subSign.anchor.set(0.5, 0);
  subSign.x = W / 2;
  subSign.y = 102;
  world.addChild(subSign);

  // === Display case (shelf) ===
  const shelf = new Graphics();
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, SHELF_H, 14).fill(SHELF_BG);
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, 18, 14).fill(SHELF_TRIM);
  shelf.roundRect(SHELF_X, SHELF_Y + SHELF_H - 18, SHELF_W, 18, 14).fill(SHELF_TRIM);
  shelf.rect(SHELF_X, SHELF_Y + SHELF_H / 2 - 3, SHELF_W, 6).fill(SHELF_TRIM);
  shelf.rect(SHELF_X + 6, SHELF_Y + 20, SHELF_W - 12, 4).fill({ color: 0xffffff, alpha: 0.18 });
  shelf.rect(SHELF_X + 6, SHELF_Y + SHELF_H / 2 + 3, SHELF_W - 12, 4).fill({ color: 0xffffff, alpha: 0.18 });
  world.addChild(shelf);

  // === Load assets ===
  const breadTypes = getAllBreadTypes();
  const [breadTextures, customerTextures] = await Promise.all([
    Promise.all(breadTypes.map((t) => Assets.load<Texture>(BREAD_DATA[t].image))),
    (async () => {
      const out: Record<Persona, Texture> = {} as Record<Persona, Texture>;
      const personas: Persona[] = ['commuter', 'tourist', 'student', 'evening'];
      const tx = await Promise.all(personas.map((p) => Assets.load<Texture>(CUSTOMER_TEXTURES[p])));
      personas.forEach((p, i) => { out[p] = tx[i]; });
      return out;
    })(),
  ]);

  // Place breads on shelf — locked variants start with 0 stock since the
  // player can't bake them yet.
  const initialUnlocked = unlockedBreads(state.upgrades);
  const slots: BreadSlot[] = [];
  const COLS = 4;
  const cellW = SHELF_W / COLS;
  const cellH = (SHELF_H - 36) / 2;
  for (let i = 0; i < breadTypes.length; i++) {
    const type = breadTypes[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = SHELF_X + cellW * col + cellW / 2;
    const cy = SHELF_Y + 18 + cellH * row + cellH / 2;

    const sprite = new Sprite(breadTextures[i]);
    sprite.anchor.set(0.5);
    sprite.x = cx;
    sprite.y = cy;
    sprite.scale.set((cellW * 0.78) / sprite.width);
    world.addChild(sprite);
    slots.push({
      type, sprite, baseX: cx, baseY: cy,
      inStock: initialUnlocked.has(type) ? STARTING_STOCK : 0,
    });
  }

  // Stock badges
  const stockTexts = slots.map((slot) => {
    const wrap = new Container();
    const badgeBg = new Graphics();
    badgeBg.circle(0, 0, 13).fill(0x6d4d2e);
    badgeBg.circle(0, 0, 13).stroke({ color: 0xffffff, width: 1.5 });
    wrap.addChild(badgeBg);
    const t = new Text({
      text: `${slot.inStock}`,
      style: { fontFamily: 'sans-serif', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
    });
    t.anchor.set(0.5);
    wrap.addChild(t);
    wrap.x = slot.baseX + cellW * 0.32;
    wrap.y = slot.baseY - cellH * 0.36;
    world.addChild(wrap);
    return { t, wrap, slot };
  });

  function refreshStock() {
    for (const s of stockTexts) {
      s.t.text = `${s.slot.inStock}`;
      s.wrap.alpha = s.slot.inStock > 0 ? 1 : 0.3;
      s.slot.sprite.alpha = s.slot.inStock > 0 ? 1 : 0.25;
    }
  }
  refreshStock();

  // === Ovens — built dynamically based on state.upgrades ===
  const ovenLayer = new Container();
  world.addChild(ovenLayer);
  let ovens: OvenSlot[] = [];

  function buildOvens(count: number) {
    // Tear down existing
    for (const o of ovens) {
      ovenLayer.removeChild(o.bodyGfx);
      ovenLayer.removeChild(o.labelText);
      ovenLayer.removeChild(o.glow);
      ovenLayer.removeChild(o.doorContainer);
      ovenLayer.removeChild(o.tray);
      ovenLayer.removeChild(o.steam);
      ovenLayer.removeChild(o.digital);
      ovenLayer.removeChild(o.progressBarBg);
      ovenLayer.removeChild(o.progressBar);
      if (o.trayBread) o.trayBread.destroy();
      o.bodyGfx.destroy();
      o.labelText.destroy();
      o.glow.destroy();
      o.tray.destroy();
      o.steam.destroy({ children: true });
      o.digital.destroy();
      o.progressBarBg.destroy();
      o.progressBar.destroy();
    }
    ovens = [];

    const totalW = count * OVEN_W + (count - 1) * 16;
    const startX = (W - totalW) / 2;

    for (let i = 0; i < count; i++) {
      const ox = startX + i * (OVEN_W + 16);
      const oy = OVEN_AREA_Y;

      const body = new Graphics();
      // Outer brushed-steel body with a slight gradient (faked with two rects)
      body.roundRect(ox, oy, OVEN_W, OVEN_H, 8).fill(OVEN_BODY);
      body.roundRect(ox, oy, OVEN_W, 18, 8).fill(OVEN_BODY_LIGHT);   // top edge highlight
      body.roundRect(ox, oy + OVEN_H - 14, OVEN_W, 14, 8).fill(OVEN_BODY_DARK); // bottom edge shadow
      body.roundRect(ox, oy, OVEN_W, OVEN_H, 8).stroke({ color: OVEN_TRIM, width: 2 });
      // Brushed-steel hatch lines on the top control strip
      for (let k = 0; k < 6; k++) {
        body.moveTo(ox + 16 + k * 4, oy + 5)
          .lineTo(ox + 18 + k * 4, oy + 13)
          .stroke({ color: 0x8a8581, width: 1, alpha: 0.6 });
      }

      // Digital display (recessed black panel, top-left of control strip)
      const ddX = ox + 8;
      const ddY = oy + 3;
      const ddW = 56;
      const ddH = 14;
      body.roundRect(ddX, ddY, ddW, ddH, 2).fill(0x0a0807);
      body.roundRect(ddX, ddY, ddW, ddH, 2).stroke({ color: 0x000000, width: 1 });

      // Two control knobs (right side of control strip)
      for (let k = 0; k < 2; k++) {
        const kx = ox + OVEN_W - 30 + k * 14;
        const ky = oy + 10;
        body.circle(kx, ky, 6).fill(OVEN_KNOB);
        body.circle(kx, ky, 6).stroke({ color: 0x000000, width: 1 });
        body.moveTo(kx, ky - 5).lineTo(kx + 3, ky - 1).stroke({ color: 0xff5a30, width: 1.5 });
      }

      // Door area (the big glass window)
      const doorPad = 10;
      const doorX = ox + doorPad;
      const doorY = oy + 24;
      const doorW = OVEN_W - doorPad * 2;
      const doorH = OVEN_H - 32;
      body.roundRect(doorX, doorY, doorW, doorH, 5).fill(OVEN_BODY_DARK);
      body.roundRect(doorX, doorY, doorW, doorH, 5).stroke({ color: OVEN_TRIM, width: 1.5 });
      // Inner glass
      const glassX = doorX + 6;
      const glassY = doorY + 5;
      const glassW = doorW - 12;
      const glassH = doorH - 16;
      body.roundRect(glassX, glassY, glassW, glassH, 3).fill(OVEN_GLASS_DARK);
      // Inner racks (horizontal lines inside glass) — gives "real oven" feel
      body.moveTo(glassX + 3, glassY + glassH * 0.45)
        .lineTo(glassX + glassW - 3, glassY + glassH * 0.45)
        .stroke({ color: 0x3a3530, width: 1 });
      body.moveTo(glassX + 3, glassY + glassH * 0.85)
        .lineTo(glassX + glassW - 3, glassY + glassH * 0.85)
        .stroke({ color: 0x3a3530, width: 1 });
      // Bottom handle (chrome bar)
      body.roundRect(doorX + 12, doorY + doorH - 7, doorW - 24, 4, 2).fill(OVEN_HANDLE);
      body.roundRect(doorX + 12, doorY + doorH - 7, doorW - 24, 1.5, 1)
        .fill({ color: 0xffffff, alpha: 0.35 });

      ovenLayer.addChild(body);

      // "오븐 N" label sits on the body
      const label = new Text({
        text: `OVEN ${i + 1}`,
        style: { fontFamily: 'sans-serif', fontSize: 9, fill: 0xb8b8b8, fontWeight: 'bold', letterSpacing: 1 },
      });
      label.anchor.set(0, 0);
      label.x = ox + 70;
      label.y = oy + 6;
      ovenLayer.addChild(label);

      // Digital display text (over the recessed panel)
      const digital = new Text({
        text: 'READY',
        style: {
          fontFamily: 'Menlo, monospace', fontSize: 11,
          fill: OVEN_DIGITAL, fontWeight: 'bold', letterSpacing: 1,
        },
      });
      digital.anchor.set(0.5);
      digital.x = ddX + ddW / 2;
      digital.y = ddY + ddH / 2;
      ovenLayer.addChild(digital);

      // Interior glow (orange, while baking)
      const glow = new Graphics();
      ovenLayer.addChild(glow);

      // Metal tray sitting on a rack inside the glass
      const tray = new Graphics();
      const trayY = glassY + glassH * 0.65;
      tray.roundRect(glassX + 4, trayY, glassW - 8, 4, 1.5).fill(TRAY);
      tray.roundRect(glassX + 4, trayY, glassW - 8, 1.5, 1).fill({ color: 0xffffff, alpha: 0.25 });
      tray.visible = false;
      ovenLayer.addChild(tray);

      // Bread sprite holder — sits ON TOP of the tray
      const trayBreadContainer = new Container();
      trayBreadContainer.x = glassX + glassW / 2;
      trayBreadContainer.y = trayY - 4;
      ovenLayer.addChild(trayBreadContainer);

      // Steam puffs above the oven (visible while baking)
      const steam = new Container();
      for (let k = 0; k < 3; k++) {
        const p = new Graphics();
        p.circle(0, 0, 6 + k).fill({ color: 0xffffff, alpha: 0.5 });
        p.x = ox + OVEN_W * 0.3 + k * (OVEN_W * 0.2);
        p.y = oy - 4;
        steam.addChild(p);
      }
      steam.visible = false;
      ovenLayer.addChild(steam);

      // Progress bar below the oven
      const pbBg = new Graphics();
      pbBg.roundRect(ox, oy + OVEN_H + 6, OVEN_W, 5, 2)
        .fill({ color: 0x2e2a26, alpha: 0.85 });
      ovenLayer.addChild(pbBg);

      const pb = new Graphics();
      ovenLayer.addChild(pb);

      ovens.push({
        index: i,
        baking: null,
        remainingMs: 0,
        totalMs: 0,
        doorContainer: trayBreadContainer,
        tray,
        trayBread: null,
        glow,
        steam,
        digital,
        progressBar: pb,
        progressBarBg: pbBg,
        bodyGfx: body,
        labelText: label,
      });
    }
  }
  buildOvens(ovenCount(state.upgrades));

  function drawOvenProgress(o: OvenSlot, idx: number) {
    o.progressBar.clear();
    o.glow.clear();

    // recompute oven X based on current oven count layout
    const count = ovens.length;
    const totalW = count * OVEN_W + (count - 1) * 16;
    const startX = (W - totalW) / 2;
    const ox = startX + idx * (OVEN_W + 16);
    const oy = OVEN_AREA_Y;

    // BreadType.Plain === 0 — can't use `!o.baking` as idle check.
    if (o.baking === null) {
      o.digital.text = 'READY';
      o.digital.style.fill = OVEN_DIGITAL;
      o.tray.visible = false;
      o.steam.visible = false;
      return;
    }

    o.tray.visible = true;
    o.steam.visible = true;

    const pct = 1 - o.remainingMs / o.totalMs;
    o.progressBar.roundRect(ox, oy + OVEN_H + 6, OVEN_W * pct, 5, 2)
      .fill({ color: 0xff8a3d });

    const remain = Math.ceil(o.remainingMs / 1000);
    o.digital.text = `${remain.toString().padStart(2, '0')}s`;
    o.digital.style.fill = OVEN_DIGITAL;

    // Pulsing interior glow
    const doorPad = 10;
    const doorX = ox + doorPad;
    const doorY = oy + 24;
    const doorW = OVEN_W - doorPad * 2;
    const doorH = OVEN_H - 32;
    const glassX = doorX + 6;
    const glassY = doorY + 5;
    const glassW = doorW - 12;
    const glassH = doorH - 16;
    const t = (Date.now() / 400) % (Math.PI * 2);
    const intensity = 0.45 + Math.sin(t) * 0.20;
    o.glow.roundRect(glassX, glassY, glassW, glassH, 3)
      .fill({ color: OVEN_GLASS_GLOW, alpha: intensity });

    // Drift the steam puffs upward + reset on cycle
    const driftT = (Date.now() / 60) % 100;
    for (let k = 0; k < o.steam.children.length; k++) {
      const puff = o.steam.children[k] as Graphics;
      const phase = (driftT + k * 30) % 100;
      puff.y = oy - 4 - phase * 0.4;
      puff.alpha = Math.max(0, 0.6 - phase * 0.012);
    }
  }

  // === Customer queue ===
  const customerLayer = new Container();
  world.addChild(customerLayer);

  const queue: Customer[] = [];
  const onSaleCbs: Array<(r: number, t: BreadType) => void> = [];
  const onLostCbs: Array<() => void> = [];
  const onDayEndCbs: Array<(r: DayResult) => void> = [];
  const onCashCbs: Array<(c: number) => void> = [];
  const onOvenCbs: Array<(s: OvenStateView[]) => void> = [];
  const onOvenDoneCbs: Array<() => void> = [];
  const onTimeChangeCbs: Array<(m: number, phase: string, day: number) => void> = [];

  // === Day/sim state ===
  let gameMin = OPEN_MIN;
  let lastTickGameMin = OPEN_MIN;
  let dayActive = true;
  let dayStats = { revenue: 0, branchRevenue: 0, cogs: 0, served: 0, lost: 0, expected: 0 };
  let spawnTimer = 0;
  let lastReportedMin = -1;
  let lastPhaseLabel = '';
  let albaTimer = 0;
  let activeTrafficBoost = trafficBoost(state.upgrades.pendingNextDay);

  function emitTime() {
    const phase = phaseAt(gameMin);
    if (Math.floor(gameMin) !== lastReportedMin || phase.label !== lastPhaseLabel) {
      lastReportedMin = Math.floor(gameMin);
      lastPhaseLabel = phase.label;
      for (const cb of onTimeChangeCbs) cb(gameMin, phase.label, state.dayNumber);
    }
  }
  function emitCash() {
    for (const cb of onCashCbs) cb(state.cash);
  }
  function emitOvens() {
    const states: OvenStateView[] = ovens.map((o, i) => ({
      index: i, baking: o.baking,
      progress: o.totalMs > 0 ? 1 - o.remainingMs / o.totalMs : 0,
    }));
    for (const cb of onOvenCbs) cb(states);
  }
  emitTime();
  emitCash();
  emitOvens();

  function isBreadUnlocked(type: BreadType): boolean {
    return unlockedBreads(state.upgrades).has(type);
  }

  function bakeTray(type: BreadType): boolean {
    if (!dayActive || gameMin >= CLOSE_MIN) return false;
    if (!isBreadUnlocked(type)) return false;
    if (ovens.some((o) => o.baking === type)) return false;
    const oven = ovens.find((o) => o.baking === null);
    if (!oven) return false;
    const econ = BREAD_ECONOMY[type];
    if (state.cash < econ.costPerTray) return false;

    state.cash -= econ.costPerTray;
    dayStats.cogs += econ.costPerTray;

    oven.baking = type;
    const adjustedTime = econ.bakeTimeMs * bakeTimeMultiplier(state.upgrades);
    oven.remainingMs = adjustedTime;
    oven.totalMs = adjustedTime;

    if (oven.trayBread) {
      oven.doorContainer.removeChild(oven.trayBread);
      oven.trayBread.destroy();
    }
    const idx = breadTypes.indexOf(type);
    const trayBread = new Sprite(breadTextures[idx]);
    trayBread.anchor.set(0.5);
    trayBread.scale.set(60 / trayBread.width);
    oven.doorContainer.addChild(trayBread);
    oven.trayBread = trayBread;

    emitCash();
    emitOvens();
    return true;
  }

  /** Alba: pick the lowest-stock UNLOCKED bread we can afford and bake it. */
  function albaAutoBake() {
    const unlocked = unlockedBreads(state.upgrades);
    const baking = new Set(ovens.filter((o) => o.baking !== null).map((o) => o.baking!));
    const candidate = [...slots]
      .filter((s) => unlocked.has(s.type)
        && !baking.has(s.type)
        && state.cash >= BREAD_ECONOMY[s.type].costPerTray)
      .sort((a, b) => a.inStock - b.inStock)[0];
    if (candidate) bakeTray(candidate.type);
  }

  function targetXForQueuePos(i: number): number {
    return QUEUE_START_X + i * QUEUE_SPACING;
  }

  function spawnCustomer() {
    if (queue.length >= QUEUE_CAPACITY_BASE) return;
    const phase = phaseAt(gameMin);
    const persona = pickPersona(phase.weights);
    const profile = PERSONA_PROFILE[persona];
    // Customers only ask for breads the player can actually bake.
    const unlockedList = breadTypes.filter((t) => unlockedBreads(state.upgrades).has(t));
    if (unlockedList.length === 0) return;
    const wantedType = unlockedList[Math.floor(Math.random() * unlockedList.length)];
    const [qLo, qHi] = profile.purchaseQtyRange;
    const wantedQty = Math.floor(qLo + Math.random() * (qHi - qLo + 1));
    dayStats.expected++;

    const c = new Container();

    // Inner container holds the persona sprite so we can bob it without
    // also moving the speech bubble / patience bar.
    const spriteContainer = new Container();
    const sprite = new Sprite(customerTextures[persona]);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(210 / sprite.height);
    sprite.y = 0;
    spriteContainer.addChild(sprite);
    c.addChild(spriteContainer);

    // Speech bubble
    const bubble = new Container();
    const bbg = new Graphics();
    bbg.roundRect(-42, -300, 84, 54, 12).fill(0xffffff);
    bbg.roundRect(-42, -300, 84, 54, 12).stroke({ color: 0x6d4d2e, width: 2 });
    bbg.moveTo(-8, -246).lineTo(0, -234).lineTo(8, -246).fill(0xffffff);
    bbg.moveTo(-8, -246).lineTo(0, -234).lineTo(8, -246).stroke({ color: 0x6d4d2e, width: 2 });
    bubble.addChild(bbg);
    const wantedSprite = new Sprite(breadTextures[breadTypes.indexOf(wantedType)]);
    wantedSprite.anchor.set(0.5);
    wantedSprite.scale.set(38 / wantedSprite.width);
    wantedSprite.x = -10;
    wantedSprite.y = -272;
    bubble.addChild(wantedSprite);
    // Qty text
    const qtyText = new Text({
      text: `×${wantedQty}`,
      style: { fontFamily: 'sans-serif', fontSize: 16, fontWeight: 'bold', fill: 0x6d4d2e },
    });
    qtyText.anchor.set(0, 0.5);
    qtyText.x = 11;
    qtyText.y = -272;
    bubble.addChild(qtyText);
    c.addChild(bubble);

    // Patience bar
    const patienceBg = new Graphics();
    patienceBg.roundRect(-34, -322, 68, 7, 3).fill({ color: 0x000000, alpha: 0.3 });
    c.addChild(patienceBg);
    const patienceFill = new Graphics();
    c.addChild(patienceFill);

    c.x = -120;
    c.y = QUEUE_Y;
    customerLayer.addChild(c);

    const queueIndex = queue.length;
    queue.push({
      container: c,
      spriteContainer,
      patienceFill,
      bubbleQtyText: qtyText,
      speed: profile.walkSpeed,
      state: 'arriving',
      queueIndex,
      patienceMaxMs: profile.patienceMs,
      patienceLeftMs: profile.patienceMs,
      serveDwellMs: profile.buyDwellMs,
      dwellElapsed: 0,
      wantedType,
      wantedQty,
      persona,
      animPhase: Math.random() * Math.PI * 2,
    });
  }

  function drawPatience(cu: Customer) {
    const pct = Math.max(0, cu.patienceLeftMs / cu.patienceMaxMs);
    const w = 68 * pct;
    const color = pct > 0.5 ? 0x57b85a : pct > 0.25 ? 0xe6a64a : 0xd64545;
    cu.patienceFill.clear();
    cu.patienceFill.roundRect(-34, -322, w, 7, 3).fill(color);
    cu.patienceFill.alpha = cu.state !== 'arriving' ? 1 : 0;
  }

  function reindexQueue() {
    for (let i = 0; i < queue.length; i++) {
      queue[i].queueIndex = i;
    }
  }

  function endDay() {
    dayActive = false;
    const wages = dailyWages(state.upgrades);
    state.cash -= wages;
    const goalHit = revenueGoal > 0 && dayStats.revenue >= revenueGoal;
    if (goalHit) state.cash += goalBonus;
    emitCash();
    const satisfaction = dayStats.expected > 0
      ? dayStats.served / dayStats.expected
      : 1;
    const result: DayResult = {
      dayNumber: state.dayNumber,
      revenue: dayStats.revenue,
      branchRevenue: dayStats.branchRevenue,
      cogs: dayStats.cogs,
      wages,
      served: dayStats.served,
      lost: dayStats.lost,
      satisfaction,
      cashEnd: state.cash,
      goalHit,
      goalBonus: goalHit ? goalBonus : 0,
    };
    for (const cb of onDayEndCbs) cb(result);
  }

  // === Tick ===
  app.ticker.add((tk) => {
    const dt = tk.deltaMS;

    if (dayActive) {
      lastTickGameMin = gameMin;
      gameMin += (dt / 1000) * TIME_SCALE;
      if (gameMin >= CLOSE_MIN) gameMin = CLOSE_MIN;
      emitTime();

      // Branch passive income — accrues per game-minute that passed this tick.
      const minutesPassed = gameMin - lastTickGameMin;
      if (minutesPassed > 0) {
        const passive = branchPassivePerMin(state.upgrades) * minutesPassed;
        if (passive > 0) {
          state.cash += passive;
          dayStats.branchRevenue += passive;
          emitCash();
        }
      }

      const phase = phaseAt(gameMin);
      if (gameMin < CLOSE_MIN) {
        spawnTimer += dt;
        const baseInterval = phase.spawnIntervalMs / activeTrafficBoost;
        const interval = baseInterval * (0.7 + Math.random() * 0.6);
        if (spawnTimer >= interval) {
          spawnTimer = 0;
          spawnCustomer();
        }
      }

      // Alba auto-bake (one alba bakes every 6s, multiple albas stagger via timer)
      const albas = albaCount(state.upgrades);
      if (albas > 0) {
        albaTimer += dt * albas; // multiple albas tick faster collectively
        if (albaTimer >= 6000) {
          albaTimer = 0;
          albaAutoBake();
        }
      }
    }

    // Oven progression
    let ovenChanged = false;
    for (let i = 0; i < ovens.length; i++) {
      const oven = ovens[i];
      // NB: BreadType.Plain === 0 so `if (oven.baking)` would be falsy. Use null check.
      if (oven.baking !== null) {
        oven.remainingMs -= dt;
        if (oven.remainingMs <= 0) {
          const slot = slots.find((s) => s.type === oven.baking);
          if (slot) {
            slot.inStock = Math.min(shelfCapacity(state.upgrades),
              slot.inStock + BREAD_ECONOMY[oven.baking!].breadsPerTray);
            refreshStock();
          }
          oven.baking = null;
          oven.remainingMs = 0;
          oven.totalMs = 0;
          if (oven.trayBread) {
            oven.doorContainer.removeChild(oven.trayBread);
            oven.trayBread.destroy();
            oven.trayBread = null;
          }
          ovenChanged = true;
          for (const cb of onOvenDoneCbs) cb();
        }
      }
      drawOvenProgress(oven, i);
    }
    if (ovenChanged) emitOvens();

    // Customers
    for (let i = queue.length - 1; i >= 0; i--) {
      const cu = queue[i];

      // Animation: bob & sway. Walking states get a bigger amplitude.
      cu.animPhase += dt * 0.012;
      const isWalking = cu.state === 'arriving' || cu.state === 'leaving';
      const bobAmp = isWalking ? 6 : 2;
      const bobFreq = isWalking ? 2.0 : 0.8;
      const swayAmp = isWalking ? 0.06 : 0.02;
      cu.spriteContainer.y = -Math.abs(Math.sin(cu.animPhase * bobFreq)) * bobAmp;
      cu.spriteContainer.rotation = Math.sin(cu.animPhase * bobFreq * 0.5) * swayAmp;

      if (cu.state === 'arriving') {
        const target = targetXForQueuePos(cu.queueIndex);
        cu.container.x += cu.speed * tk.deltaTime * 1.4;
        if (cu.container.x >= target) {
          cu.container.x = target;
          cu.state = cu.queueIndex === 0 ? 'serving' : 'waiting';
          cu.dwellElapsed = 0;
          drawPatience(cu);
        }
      } else if (cu.state === 'waiting') {
        // Drift to assigned queue spot if it changed
        const target = targetXForQueuePos(cu.queueIndex);
        if (cu.container.x !== target) {
          const dx = target - cu.container.x;
          const step = Math.sign(dx) * Math.min(Math.abs(dx), cu.speed * tk.deltaTime);
          cu.container.x += step;
        }
        // If now at front, start serving
        if (cu.queueIndex === 0) {
          cu.state = 'serving';
          cu.dwellElapsed = 0;
        } else {
          cu.patienceLeftMs -= dt;
          drawPatience(cu);
          if (cu.patienceLeftMs <= 0) {
            dayStats.lost += 1;
            for (const cb of onLostCbs) cb();
            showAngryFloater(cu.container.x, cu.container.y - 230);
            cu.state = 'leaving';
          }
        }
      } else if (cu.state === 'serving') {
        cu.patienceLeftMs -= dt;
        cu.dwellElapsed += dt;
        drawPatience(cu);
        const slot = slots.find((s) => s.type === cu.wantedType);
        // Need ALL requested qty in stock simultaneously
        if (slot && slot.inStock >= cu.wantedQty && cu.dwellElapsed >= cu.serveDwellMs) {
          slot.inStock -= cu.wantedQty;
          refreshStock();
          const price = BREAD_DATA[slot.type].price * cu.wantedQty;
          dayStats.revenue += price;
          dayStats.served += 1;
          state.cash += price;
          emitCash();
          for (const cb of onSaleCbs) cb(price, slot.type);
          showSaleFloater(cu.container.x, cu.container.y - 230, price);
          cu.state = 'leaving';
        } else if (cu.patienceLeftMs <= 0) {
          dayStats.lost += 1;
          for (const cb of onLostCbs) cb();
          showAngryFloater(cu.container.x, cu.container.y - 230);
          cu.state = 'leaving';
        }
      } else {
        // leaving — walk off-stage right
        cu.container.x += cu.speed * tk.deltaTime * 1.8;
        cu.container.alpha -= 0.012 * tk.deltaTime;
        if (cu.container.x > W + 120 || cu.container.alpha <= 0) {
          customerLayer.removeChild(cu.container);
          cu.container.destroy({ children: true });
          queue.splice(i, 1);
          reindexQueue();
        }
      }
    }

    // End-of-day check
    if (dayActive && gameMin >= CLOSE_MIN && queue.length === 0
        && ovens.every((o) => o.baking === null)) {
      endDay();
    }
  });

  // === Floaters ===
  function showSaleFloater(x: number, y: number, amount: number) {
    const t = new Text({
      text: `+₩${amount.toLocaleString()}`,
      style: { fontFamily: 'sans-serif', fontSize: 22, fontWeight: 'bold', fill: 0x2a8c4a },
    });
    t.anchor.set(0.5);
    t.x = x; t.y = y;
    world.addChild(t);
    const start = performance.now();
    const tick = () => {
      const e = performance.now() - start;
      t.y = y - e * 0.04;
      t.alpha = Math.max(0, 1 - e / 1200);
      if (e < 1200) requestAnimationFrame(tick);
      else { world.removeChild(t); t.destroy(); }
    };
    requestAnimationFrame(tick);
  }
  function showAngryFloater(x: number, y: number) {
    const t = new Text({ text: '💢', style: { fontFamily: 'sans-serif', fontSize: 32 } });
    t.anchor.set(0.5);
    t.x = x; t.y = y;
    world.addChild(t);
    const start = performance.now();
    const tick = () => {
      const e = performance.now() - start;
      t.y = y - e * 0.05;
      t.alpha = Math.max(0, 1 - e / 1200);
      if (e < 1200) requestAnimationFrame(tick);
      else { world.removeChild(t); t.destroy(); }
    };
    requestAnimationFrame(tick);
  }

  function resize(w: number, h: number) {
    const scale = Math.min(w / W, h / H);
    world.scale.set(scale);
    world.x = (w - W * scale) / 2;
    world.y = (h - H * scale) / 2;
  }
  resize(app.screen.width, app.screen.height);

  const controller: PixiSceneController = {
    destroy: () => {
      app.ticker.stop();
      stage.removeChild(root);
      root.destroy({ children: true });
    },
    resize,
  };

  return {
    controller,
    bakeTray,
    isBreadUnlocked,
    startNextDay: () => {
      // Consume marketing items for the now-starting day, then clear pending
      activeTrafficBoost = trafficBoost(state.upgrades.pendingNextDay);
      state.upgrades.pendingNextDay = [];
      buildOvens(ovenCount(state.upgrades));
      gameMin = OPEN_MIN;
      lastTickGameMin = OPEN_MIN;
      dayActive = true;
      dayStats = { revenue: 0, branchRevenue: 0, cogs: 0, served: 0, lost: 0, expected: 0 };
      spawnTimer = 0;
      lastReportedMin = -1;
      albaTimer = 0;
      const unlockedNow = unlockedBreads(state.upgrades);
      for (const slot of slots) {
        slot.inStock = unlockedNow.has(slot.type) ? STARTING_STOCK : 0;
      }
      refreshStock();
      for (const cu of queue) {
        customerLayer.removeChild(cu.container);
        cu.container.destroy({ children: true });
      }
      queue.length = 0;
      emitTime();
      emitOvens();
    },
    refreshUpgrades: () => {
      buildOvens(ovenCount(state.upgrades));
      emitOvens();
    },
    onDayEnd: (cb) => { onDayEndCbs.push(cb); },
    onSale: (cb) => { onSaleCbs.push(cb); },
    onCustomerLost: (cb) => { onLostCbs.push(cb); },
    onCashChange: (cb) => { onCashCbs.push(cb); },
    onOvenChange: (cb) => { onOvenCbs.push(cb); },
    onOvenDone: (cb) => { onOvenDoneCbs.push(cb); },
    onTimeChange: (cb) => { onTimeChangeCbs.push(cb); },
  };
}
