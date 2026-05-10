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
  BREAD_ECONOMY, DAILY_WAGES, MAX_STOCK_PER_SLOT,
  OVEN_SLOT_COUNT, STARTING_CASH, STARTING_STOCK,
} from '../../data/economy';
import type { PixiSceneController } from '../PixiCanvas';

// Refined warm bakery palette
const WALL = 0xfaf2e2;
const WALL_DARK = 0xeadcb8;
const FLOOR = 0xb88a5a;
const FLOOR_DARK = 0x8b6a3e;
const COUNTER = 0x6d4d2e;
const COUNTER_LIGHT = 0x8e6e44;
const SHELF_BG = 0xc9a06d;
const SHELF_TRIM = 0x7a5635;
const OVEN_BODY = 0x3e3a36;
const OVEN_DOOR = 0x1f1d1b;
const OVEN_GLASS_GLOW = 0xff8a3a;
const OVEN_HANDLE = 0xc0a065;

interface BreadSlot {
  type: BreadType;
  sprite: Sprite;
  baseX: number;
  baseY: number;
  inStock: number;
}

interface Customer {
  container: Container;
  patienceFill: Graphics;
  speed: number;
  state: 'arriving' | 'browsing' | 'leaving';
  arriveTargetX: number;
  patienceMaxMs: number;
  patienceLeftMs: number;
  buyDwellMs: number;
  dwellElapsed: number;
  wantedType: BreadType;
  persona: Persona;
}

interface OvenSlot {
  baking: BreadType | null;
  remainingMs: number;
  totalMs: number;
  // visuals
  doorContainer: Container;
  trayBread: Sprite | null;
  glow: Graphics;
  progressBar: Graphics;
  progressBarBg: Graphics;
  progressLabel: Text;
}

export interface OvenStateView {
  index: number;
  baking: BreadType | null;
  progress: number; // 0..1
}

export interface DayResult {
  dayNumber: number;
  revenue: number;
  cogs: number;
  wages: number;
  served: number;
  lost: number;
  satisfaction: number;
  cashEnd: number;
}

export interface StorefrontHandle {
  controller: PixiSceneController;
  /** Try to start a tray bake. Returns true if successful, false if no oven free / no cash / already baking. */
  bakeTray: (type: BreadType) => boolean;
  startNextDay: () => void;
  onDayEnd: (cb: (r: DayResult) => void) => void;
  onSale: (cb: (revenue: number, type: BreadType) => void) => void;
  onCustomerLost: (cb: () => void) => void;
  onCashChange: (cb: (cash: number) => void) => void;
  onOvenChange: (cb: (states: OvenStateView[]) => void) => void;
  onTimeChange: (cb: (gameMin: number, phaseLabel: string, dayNumber: number) => void) => void;
}

const CUSTOMER_TEXTURES: Record<Persona, string> = {
  commuter: '/customers/commuter.png',
  tourist: '/customers/tourist.png',
  student: '/customers/student.png',
  evening: '/customers/evening.png',
};

export async function createStorefrontScene(
  app: Application,
  startDay = 1,
  startCash = STARTING_CASH,
): Promise<StorefrontHandle> {
  const stage = app.stage;
  const root = new Container();
  stage.addChild(root);

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
  const CUSTOMER_LANE_Y = 1140;
  const OVEN_AREA_Y = 580;
  const OVEN_W = 260;
  const OVEN_H = 110;

  const world = new Container();
  root.addChild(world);

  // --- Layered background ---
  // Wall + wallpaper pattern
  const bg = new Graphics();
  bg.rect(0, 0, W, COUNTER_TOP_Y).fill(WALL);
  // subtle vertical wallpaper stripes
  for (let x = 0; x < W; x += 60) {
    bg.rect(x, 0, 30, COUNTER_TOP_Y).fill({ color: WALL_DARK, alpha: 0.18 });
  }
  // Wood floor
  bg.rect(0, FLOOR_Y, W, H - FLOOR_Y).fill(FLOOR);
  // floor planks
  for (let i = 0; i < 6; i++) {
    const y = FLOOR_Y + i * (H - FLOOR_Y) / 6;
    bg.rect(0, y, W, 3).fill(FLOOR_DARK);
  }
  // Wall-floor seam
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
  world.addChild(counter);

  // Decorative wall sign
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

  // --- Display case (shelf) ---
  const shelf = new Graphics();
  // shelf body
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, SHELF_H, 14).fill(SHELF_BG);
  // top + bottom dark trim
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, 18, 14).fill(SHELF_TRIM);
  shelf.roundRect(SHELF_X, SHELF_Y + SHELF_H - 18, SHELF_W, 18, 14).fill(SHELF_TRIM);
  // mid divider
  shelf.rect(SHELF_X, SHELF_Y + SHELF_H / 2 - 3, SHELF_W, 6).fill(SHELF_TRIM);
  // glass-pane shimmer
  shelf.rect(SHELF_X + 6, SHELF_Y + 20, SHELF_W - 12, 4).fill({ color: 0xffffff, alpha: 0.18 });
  shelf.rect(SHELF_X + 6, SHELF_Y + SHELF_H / 2 + 3, SHELF_W - 12, 4).fill({ color: 0xffffff, alpha: 0.18 });
  world.addChild(shelf);

  // --- Load assets ---
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

  // Place breads on shelf
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

    slots.push({ type, sprite, baseX: cx, baseY: cy, inStock: STARTING_STOCK });
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

  // --- Ovens ---
  const ovens: OvenSlot[] = [];
  const ovenLayer = new Container();
  world.addChild(ovenLayer);

  for (let i = 0; i < OVEN_SLOT_COUNT; i++) {
    const ox = i === 0 ? 56 : W - 56 - OVEN_W;
    const oy = OVEN_AREA_Y;

    const ovenBox = new Graphics();
    // body
    ovenBox.roundRect(ox, oy, OVEN_W, OVEN_H, 10).fill(OVEN_BODY);
    ovenBox.roundRect(ox, oy, OVEN_W, OVEN_H, 10).stroke({ color: 0x202020, width: 2 });
    // top vent
    ovenBox.rect(ox + 16, oy + 8, OVEN_W - 32, 6).fill({ color: 0x595550, alpha: 0.7 });
    // door area
    const doorPad = 10;
    const doorX = ox + doorPad;
    const doorY = oy + 22;
    const doorW = OVEN_W - doorPad * 2;
    const doorH = OVEN_H - 30;
    ovenBox.roundRect(doorX, doorY, doorW, doorH, 6).fill(OVEN_DOOR);
    // glass window inset
    ovenBox.roundRect(doorX + 8, doorY + 6, doorW - 16, doorH - 18, 4).fill(0x0c0a09);
    // handle
    ovenBox.roundRect(doorX + 12, doorY + doorH - 8, doorW - 24, 4, 2).fill(OVEN_HANDLE);
    // label
    ovenLayer.addChild(ovenBox);
    const label = new Text({
      text: `오븐 ${i + 1}`,
      style: { fontFamily: 'sans-serif', fontSize: 12, fill: 0xc0a065, fontWeight: 'bold' },
    });
    label.anchor.set(0, 0);
    label.x = ox + 14;
    label.y = oy + 4;
    ovenLayer.addChild(label);

    // Glow (shown when baking) — overlaid on glass window
    const glow = new Graphics();
    glow.roundRect(doorX + 10, doorY + 8, doorW - 20, doorH - 22, 3)
      .fill({ color: OVEN_GLASS_GLOW, alpha: 0 });
    ovenLayer.addChild(glow);

    // Tray bread (visible inside oven when baking)
    const trayBreadContainer = new Container();
    trayBreadContainer.x = doorX + doorW / 2;
    trayBreadContainer.y = doorY + (doorH - 18) / 2 + 4;
    ovenLayer.addChild(trayBreadContainer);

    // Progress bar UNDER the oven
    const pbBg = new Graphics();
    pbBg.roundRect(ox, oy + OVEN_H + 8, OVEN_W, 10, 5)
      .fill({ color: 0x2e2a26, alpha: 0.85 });
    ovenLayer.addChild(pbBg);

    const pb = new Graphics();
    ovenLayer.addChild(pb);

    const pl = new Text({
      text: '',
      style: { fontFamily: 'sans-serif', fontSize: 11, fill: 0xfff2d6, fontWeight: 'bold' },
    });
    pl.anchor.set(0.5);
    pl.x = ox + OVEN_W / 2;
    pl.y = oy + OVEN_H + 13;
    ovenLayer.addChild(pl);

    ovens.push({
      baking: null,
      remainingMs: 0,
      totalMs: 0,
      doorContainer: trayBreadContainer,
      trayBread: null,
      glow,
      progressBar: pb,
      progressBarBg: pbBg,
      progressLabel: pl,
    });
  }

  function drawOvenProgress(o: OvenSlot, idx: number) {
    o.progressBar.clear();
    if (!o.baking) {
      o.progressLabel.text = '대기 중';
      o.glow.clear();
      o.glow.roundRect(0, 0, 0, 0, 0).fill({ color: OVEN_GLASS_GLOW, alpha: 0 });
      return;
    }
    const ox = idx === 0 ? 56 : W - 56 - OVEN_W;
    const oy = OVEN_AREA_Y;
    const pct = 1 - o.remainingMs / o.totalMs;
    const w = OVEN_W * pct;
    o.progressBar.roundRect(ox, oy + OVEN_H + 8, w, 10, 5)
      .fill({ color: 0xff8a3d });
    const remain = Math.ceil(o.remainingMs / 1000);
    o.progressLabel.text = `${BREAD_DATA[o.baking].nameKo}  ${remain}s`;
    // Pulsing glow (sin)
    const t = (Date.now() / 400) % (Math.PI * 2);
    const intensity = 0.35 + Math.sin(t) * 0.18;
    o.glow.clear();
    const doorPad = 10;
    const doorX = ox + doorPad;
    const doorY = oy + 22;
    const doorW = OVEN_W - doorPad * 2;
    const doorH = OVEN_H - 30;
    o.glow.roundRect(doorX + 10, doorY + 8, doorW - 20, doorH - 22, 3)
      .fill({ color: OVEN_GLASS_GLOW, alpha: intensity });
  }

  // --- Customer system ---
  const customerLayer = new Container();
  world.addChild(customerLayer);

  const customers: Customer[] = [];
  const onSaleCbs: Array<(r: number, t: BreadType) => void> = [];
  const onLostCbs: Array<() => void> = [];
  const onDayEndCbs: Array<(r: DayResult) => void> = [];
  const onCashCbs: Array<(c: number) => void> = [];
  const onOvenCbs: Array<(s: OvenStateView[]) => void> = [];
  const onTimeChangeCbs: Array<(m: number, phase: string, day: number) => void> = [];

  // --- Day/sim state ---
  let dayNumber = startDay;
  let cash = startCash;
  let gameMin = OPEN_MIN;
  let dayActive = true;
  let dayStats = { revenue: 0, cogs: 0, served: 0, lost: 0, expected: 0 };
  let spawnTimer = 0;
  let lastReportedMin = -1;
  let lastPhaseLabel = '';

  function emitTime() {
    const phase = phaseAt(gameMin);
    if (Math.floor(gameMin) !== lastReportedMin || phase.label !== lastPhaseLabel) {
      lastReportedMin = Math.floor(gameMin);
      lastPhaseLabel = phase.label;
      for (const cb of onTimeChangeCbs) cb(gameMin, phase.label, dayNumber);
    }
  }
  function emitCash() {
    for (const cb of onCashCbs) cb(cash);
  }
  function emitOvens() {
    const states: OvenStateView[] = ovens.map((o, i) => ({
      index: i,
      baking: o.baking,
      progress: o.totalMs > 0 ? 1 - o.remainingMs / o.totalMs : 0,
    }));
    for (const cb of onOvenCbs) cb(states);
  }
  emitTime();
  emitCash();
  emitOvens();

  function bakeTray(type: BreadType): boolean {
    if (!dayActive || gameMin >= CLOSE_MIN) return false;
    // Already baking the same type? skip
    if (ovens.some((o) => o.baking === type)) return false;
    const oven = ovens.find((o) => o.baking === null);
    if (!oven) return false;
    const econ = BREAD_ECONOMY[type];
    if (cash < econ.costPerTray) return false;

    cash -= econ.costPerTray;
    dayStats.cogs += econ.costPerTray;

    oven.baking = type;
    oven.remainingMs = econ.bakeTimeMs;
    oven.totalMs = econ.bakeTimeMs;

    // Show the bread inside the oven
    if (oven.trayBread) {
      oven.doorContainer.removeChild(oven.trayBread);
      oven.trayBread.destroy();
    }
    const idx = breadTypes.indexOf(type);
    const trayBread = new Sprite(breadTextures[idx]);
    trayBread.anchor.set(0.5);
    trayBread.scale.set(64 / trayBread.width);
    oven.doorContainer.addChild(trayBread);
    oven.trayBread = trayBread;

    emitCash();
    emitOvens();
    return true;
  }

  function spawnCustomer() {
    const phase = phaseAt(gameMin);
    const persona = pickPersona(phase.weights);
    const profile = PERSONA_PROFILE[persona];
    const wantedType = breadTypes[Math.floor(Math.random() * breadTypes.length)];
    dayStats.expected++;

    const c = new Container();

    const sprite = new Sprite(customerTextures[persona]);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(220 / sprite.height);
    sprite.y = 0;
    c.addChild(sprite);

    // Speech bubble
    const bubble = new Container();
    const bbg = new Graphics();
    bbg.roundRect(-40, -300, 80, 52, 12).fill(0xffffff);
    bbg.roundRect(-40, -300, 80, 52, 12).stroke({ color: 0x6d4d2e, width: 2 });
    bbg.moveTo(-8, -250).lineTo(0, -238).lineTo(8, -250).fill(0xffffff);
    bbg.moveTo(-8, -250).lineTo(0, -238).lineTo(8, -250).stroke({ color: 0x6d4d2e, width: 2 });
    bubble.addChild(bbg);
    const wantedSprite = new Sprite(breadTextures[breadTypes.indexOf(wantedType)]);
    wantedSprite.anchor.set(0.5);
    wantedSprite.scale.set(40 / wantedSprite.width);
    wantedSprite.x = 0;
    wantedSprite.y = -274;
    bubble.addChild(wantedSprite);
    c.addChild(bubble);

    // Patience bar
    const patienceBg = new Graphics();
    patienceBg.roundRect(-34, -322, 68, 7, 3).fill({ color: 0x000000, alpha: 0.3 });
    c.addChild(patienceBg);
    const patienceFill = new Graphics();
    c.addChild(patienceFill);

    c.x = -120;
    c.y = CUSTOMER_LANE_Y;
    customerLayer.addChild(c);

    customers.push({
      container: c,
      patienceFill,
      speed: profile.walkSpeed,
      state: 'arriving',
      arriveTargetX: W / 2 + (Math.random() - 0.5) * (SHELF_W * 0.6),
      patienceMaxMs: profile.patienceMs,
      patienceLeftMs: profile.patienceMs,
      buyDwellMs: profile.buyDwellMs,
      dwellElapsed: 0,
      wantedType,
      persona,
    });
  }

  function drawPatience(cu: Customer) {
    const pct = Math.max(0, cu.patienceLeftMs / cu.patienceMaxMs);
    const w = 68 * pct;
    const color = pct > 0.5 ? 0x57b85a : pct > 0.25 ? 0xe6a64a : 0xd64545;
    cu.patienceFill.clear();
    cu.patienceFill.roundRect(-34, -322, w, 7, 3).fill(color);
    cu.patienceFill.alpha = cu.state === 'browsing' ? 1 : 0;
  }

  function endDay() {
    dayActive = false;
    cash -= DAILY_WAGES;
    emitCash();
    const satisfaction = dayStats.expected > 0
      ? dayStats.served / dayStats.expected
      : 1;
    const result: DayResult = {
      dayNumber,
      revenue: dayStats.revenue,
      cogs: dayStats.cogs,
      wages: DAILY_WAGES,
      served: dayStats.served,
      lost: dayStats.lost,
      satisfaction,
      cashEnd: cash,
    };
    for (const cb of onDayEndCbs) cb(result);
  }

  // --- Tick ---
  app.ticker.add((tk) => {
    const dt = tk.deltaMS;

    if (dayActive) {
      gameMin += (dt / 1000) * TIME_SCALE;
      if (gameMin >= CLOSE_MIN) gameMin = CLOSE_MIN;
      emitTime();

      const phase = phaseAt(gameMin);
      if (gameMin < CLOSE_MIN) {
        spawnTimer += dt;
        const interval = phase.spawnIntervalMs * (0.7 + Math.random() * 0.6);
        if (spawnTimer >= interval && customers.length < 5) {
          spawnTimer = 0;
          spawnCustomer();
        }
      }
    }

    // Oven progression
    let ovenChanged = false;
    for (let i = 0; i < ovens.length; i++) {
      const oven = ovens[i];
      if (oven.baking) {
        oven.remainingMs -= dt;
        if (oven.remainingMs <= 0) {
          // Bake complete — deposit breads onto shelf
          const slot = slots.find((s) => s.type === oven.baking);
          if (slot) {
            slot.inStock = Math.min(MAX_STOCK_PER_SLOT, slot.inStock + BREAD_ECONOMY[oven.baking!].breadsPerTray);
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
        }
        // glow + progress always update during bake
        drawOvenProgress(oven, i);
      } else {
        drawOvenProgress(oven, i);
      }
    }
    if (ovenChanged) emitOvens();

    // Customers
    for (let i = customers.length - 1; i >= 0; i--) {
      const cu = customers[i];

      if (cu.state === 'arriving') {
        cu.container.x += cu.speed * tk.deltaTime * 1.4;
        if (cu.container.x >= cu.arriveTargetX) {
          cu.container.x = cu.arriveTargetX;
          cu.state = 'browsing';
          cu.dwellElapsed = 0;
          drawPatience(cu);
        }
      } else if (cu.state === 'browsing') {
        cu.patienceLeftMs -= dt;
        cu.dwellElapsed += dt;
        drawPatience(cu);
        const slot = slots.find((s) => s.type === cu.wantedType);
        if (slot && slot.inStock > 0 && cu.dwellElapsed >= cu.buyDwellMs) {
          slot.inStock -= 1;
          refreshStock();
          const price = BREAD_DATA[slot.type].price;
          dayStats.revenue += price;
          dayStats.served += 1;
          cash += price;
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
        cu.container.x += cu.speed * tk.deltaTime * 1.8;
        cu.container.alpha -= 0.012 * tk.deltaTime;
        if (cu.container.x > W + 120 || cu.container.alpha <= 0) {
          customerLayer.removeChild(cu.container);
          cu.container.destroy({ children: true });
          customers.splice(i, 1);
        }
      }
    }

    // End-of-day check
    if (dayActive && gameMin >= CLOSE_MIN && customers.length === 0
        && ovens.every((o) => o.baking === null)) {
      endDay();
    }
  });

  // --- Floaters ---
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

  // --- Resize ---
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
    startNextDay: () => {
      dayNumber += 1;
      gameMin = OPEN_MIN;
      dayActive = true;
      dayStats = { revenue: 0, cogs: 0, served: 0, lost: 0, expected: 0 };
      spawnTimer = 0;
      lastReportedMin = -1;
      for (const slot of slots) slot.inStock = STARTING_STOCK;
      refreshStock();
      for (const cu of customers) {
        customerLayer.removeChild(cu.container);
        cu.container.destroy({ children: true });
      }
      customers.length = 0;
      // Clear ovens
      for (const o of ovens) {
        o.baking = null;
        o.remainingMs = 0;
        o.totalMs = 0;
        if (o.trayBread) { o.doorContainer.removeChild(o.trayBread); o.trayBread.destroy(); o.trayBread = null; }
      }
      emitTime();
      emitOvens();
    },
    onDayEnd: (cb) => { onDayEndCbs.push(cb); },
    onSale: (cb) => { onSaleCbs.push(cb); },
    onCustomerLost: (cb) => { onLostCbs.push(cb); },
    onCashChange: (cb) => { onCashCbs.push(cb); },
    onOvenChange: (cb) => { onOvenCbs.push(cb); },
    onTimeChange: (cb) => { onTimeChangeCbs.push(cb); },
  };
}
