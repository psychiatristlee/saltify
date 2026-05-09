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
import type { PixiSceneController } from '../PixiCanvas';

const SHELF_BG = 0xb88a5a;
const SHELF_TRIM = 0x6d4d2e;
const COUNTER_TOP_COLOR = 0x8b6f47;
const COUNTER_FRONT_COLOR = 0x6d4d2e;
const FLOOR = 0xf3e3c0;
const WALL = 0xfff2d6;

interface BreadSlot {
  type: BreadType;
  sprite: Sprite;
  baseX: number;
  baseY: number;
  inStock: number;
}

interface Customer {
  container: Container;
  sprite: Sprite;
  patienceBg: Graphics;
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

export interface DayResult {
  dayNumber: number;
  revenue: number;
  served: number;
  lost: number;
  satisfaction: number; // 0..1
}

export interface StorefrontHandle {
  controller: PixiSceneController;
  bake: (type: BreadType) => void;
  startNextDay: () => void;
  /** Subscribe to day-end. Fired when game time hits CLOSE_MIN and remaining customers exit. */
  onDayEnd: (cb: (r: DayResult) => void) => void;
  onSale: (cb: (revenue: number, type: BreadType) => void) => void;
  onCustomerLost: (cb: () => void) => void;
  onTimeChange: (cb: (gameMin: number, phaseLabel: string, dayNumber: number) => void) => void;
}

const CUSTOMER_TEXTURES: Record<Persona, string> = {
  commuter: '/customers/commuter.png',
  tourist: '/customers/tourist.png',
  student: '/customers/student.png',
  evening: '/customers/evening.png',
};

export async function createStorefrontScene(app: Application, startDay = 1): Promise<StorefrontHandle> {
  const stage = app.stage;
  const root = new Container();
  stage.addChild(root);

  // Logical canvas — letterboxed to viewport
  const W = 720;
  const H = 1280;
  const COUNTER_TOP = 720;
  const COUNTER_H = 90;
  const FLOOR_Y = COUNTER_TOP + COUNTER_H;
  const CUSTOMER_LANE_Y = 1100;

  const world = new Container();
  root.addChild(world);

  // --- Background ---
  const bg = new Graphics();
  bg.rect(0, 0, W, COUNTER_TOP).fill(WALL);
  bg.rect(0, FLOOR_Y, W, H - FLOOR_Y).fill(FLOOR);
  world.addChild(bg);

  // Floor planks
  const floorLines = new Graphics();
  for (let i = 1; i <= 4; i++) {
    const y = FLOOR_Y + i * (H - FLOOR_Y) / 5;
    floorLines.moveTo(0, y).lineTo(W, y).stroke({ color: 0xe8d2a3, width: 2 });
  }
  world.addChild(floorLines);

  // Counter (between shelf and customer lane)
  const counter = new Graphics();
  counter.rect(0, COUNTER_TOP, W, COUNTER_H).fill(COUNTER_FRONT_COLOR);
  counter.rect(0, COUNTER_TOP, W, 18).fill(COUNTER_TOP_COLOR);
  // wood grain
  for (let i = 0; i < 4; i++) {
    counter.moveTo(0, COUNTER_TOP + 30 + i * 16)
      .lineTo(W, COUNTER_TOP + 30 + i * 16)
      .stroke({ color: 0x4d3320, width: 1, alpha: 0.4 });
  }
  world.addChild(counter);

  // Store sign
  const sign = new Text({
    text: 'Salt, 0',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 56,
      fontWeight: 'bold',
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
    style: { fontFamily: 'sans-serif', fontSize: 24, fill: 0x8b6f47 },
  });
  subSign.anchor.set(0.5, 0);
  subSign.x = W / 2;
  subSign.y = 110;
  world.addChild(subSign);

  // --- Display case (shelf) ---
  const SHELF_X = 50;
  const SHELF_Y = 170;
  const SHELF_W = W - 100;
  const SHELF_H = 520;

  const shelf = new Graphics();
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, SHELF_H, 16).fill(SHELF_BG);
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, 28, 16).fill(SHELF_TRIM);
  shelf.roundRect(SHELF_X, SHELF_Y + SHELF_H - 28, SHELF_W, 28, 16).fill(SHELF_TRIM);
  shelf.rect(SHELF_X, SHELF_Y + SHELF_H / 2 - 4, SHELF_W, 8).fill(SHELF_TRIM);
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
  const cellH = SHELF_H / 2;
  for (let i = 0; i < breadTypes.length; i++) {
    const type = breadTypes[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = SHELF_X + cellW * col + cellW / 2;
    const cy = SHELF_Y + cellH * row + cellH / 2 + 8;

    const sprite = new Sprite(breadTextures[i]);
    sprite.anchor.set(0.5);
    sprite.x = cx;
    sprite.y = cy;
    sprite.scale.set((cellW * 0.74) / sprite.width);
    world.addChild(sprite);

    // Price tag
    const tag = new Text({
      text: `${BREAD_DATA[type].price.toLocaleString()}`,
      style: { fontFamily: 'sans-serif', fontSize: 18, fontWeight: 'bold', fill: 0x6d4d2e },
    });
    tag.anchor.set(0.5, 0);
    tag.x = cx;
    tag.y = cy + cellH * 0.36;
    world.addChild(tag);

    slots.push({ type, sprite, baseX: cx, baseY: cy, inStock: 3 });
  }

  // Stock badges
  const stockTexts = slots.map((slot) => {
    const t = new Text({
      text: `${slot.inStock}`,
      style: { fontFamily: 'sans-serif', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' },
    });
    t.anchor.set(0.5);
    const tagBg = new Graphics();
    tagBg.circle(0, 0, 14).fill({ color: 0xc44d3a, alpha: 0.92 });
    const wrap = new Container();
    wrap.x = slot.baseX + cellW * 0.30;
    wrap.y = slot.baseY - cellH * 0.34;
    wrap.addChild(tagBg);
    wrap.addChild(t);
    world.addChild(wrap);
    return { t, wrap, slot };
  });

  function refreshStock() {
    for (const s of stockTexts) {
      s.t.text = `${s.slot.inStock}`;
      s.wrap.alpha = s.slot.inStock > 0 ? 1 : 0.35;
      s.slot.sprite.alpha = s.slot.inStock > 0 ? 1 : 0.25;
    }
  }
  refreshStock();

  // --- Customer system ---
  const customerLayer = new Container();
  world.addChild(customerLayer);

  const customers: Customer[] = [];
  const onSaleCbs: Array<(r: number, t: BreadType) => void> = [];
  const onLostCbs: Array<() => void> = [];
  const onDayEndCbs: Array<(r: DayResult) => void> = [];
  const onTimeChangeCbs: Array<(m: number, phase: string, day: number) => void> = [];

  // --- Time / phase state ---
  let dayNumber = startDay;
  let gameMin = OPEN_MIN;
  let dayActive = true;
  let dayStats = { revenue: 0, served: 0, lost: 0, expected: 0 };
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
  emitTime();

  function spawnCustomer() {
    const phase = phaseAt(gameMin);
    const persona = pickPersona(phase.weights);
    const profile = PERSONA_PROFILE[persona];
    const wantedType = breadTypes[Math.floor(Math.random() * breadTypes.length)];
    dayStats.expected++;

    const c = new Container();

    // Customer art sprite
    const sprite = new Sprite(customerTextures[persona]);
    sprite.anchor.set(0.5, 1);
    sprite.scale.set(220 / sprite.height);  // scale so each customer is ~220px tall
    sprite.y = 0;
    c.addChild(sprite);

    // Speech bubble showing wanted bread (above head)
    const bubble = new Container();
    const bbg = new Graphics();
    bbg.roundRect(-38, -300, 76, 50, 12).fill(0xffffff);
    bbg.roundRect(-38, -300, 76, 50, 12).stroke({ color: 0x6d4d2e, width: 2 });
    bbg.moveTo(-8, -250).lineTo(0, -238).lineTo(8, -250).fill(0xffffff);
    bbg.moveTo(-8, -250).lineTo(0, -238).lineTo(8, -250).stroke({ color: 0x6d4d2e, width: 2 });
    bubble.addChild(bbg);
    const wantedSprite = new Sprite(breadTextures[breadTypes.indexOf(wantedType)]);
    wantedSprite.anchor.set(0.5);
    wantedSprite.scale.set(38 / wantedSprite.width);
    wantedSprite.x = 0;
    wantedSprite.y = -275;
    bubble.addChild(wantedSprite);
    c.addChild(bubble);

    // Patience bar (above bubble)
    const patienceBg = new Graphics();
    patienceBg.roundRect(-32, -322, 64, 7, 3).fill({ color: 0x000000, alpha: 0.25 });
    c.addChild(patienceBg);
    const patienceFill = new Graphics();
    c.addChild(patienceFill);

    c.x = -120;
    c.y = CUSTOMER_LANE_Y;
    customerLayer.addChild(c);

    customers.push({
      container: c,
      sprite,
      patienceBg,
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
    const w = 64 * pct;
    const color = pct > 0.5 ? 0x57b85a : pct > 0.2 ? 0xe6a64a : 0xd64545;
    cu.patienceFill.clear();
    cu.patienceFill.roundRect(-32, -322, w, 7, 3).fill(color);
    cu.patienceFill.alpha = cu.state === 'browsing' ? 1 : 0;
  }

  function endDay() {
    dayActive = false;
    const satisfaction = dayStats.expected > 0
      ? dayStats.served / dayStats.expected
      : 1;
    const result: DayResult = {
      dayNumber,
      revenue: dayStats.revenue,
      served: dayStats.served,
      lost: dayStats.lost,
      satisfaction,
    };
    for (const cb of onDayEndCbs) cb(result);
  }

  // --- Tick ---
  app.ticker.add((tk) => {
    const dt = tk.deltaMS;

    if (dayActive) {
      // Advance game time
      gameMin += (dt / 1000) * TIME_SCALE;
      if (gameMin >= CLOSE_MIN) {
        gameMin = CLOSE_MIN;
      }
      emitTime();

      const phase = phaseAt(gameMin);
      // Spawn (only while open)
      if (gameMin < CLOSE_MIN) {
        spawnTimer += dt;
        // Add some jitter so customers don't arrive in lock-step
        const interval = phase.spawnIntervalMs * (0.7 + Math.random() * 0.6);
        if (spawnTimer >= interval && customers.length < 5) {
          spawnTimer = 0;
          spawnCustomer();
        }
      }
    }

    // Customer logic
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
          dayStats.revenue += BREAD_DATA[slot.type].price;
          dayStats.served += 1;
          for (const cb of onSaleCbs) cb(BREAD_DATA[slot.type].price, slot.type);
          // tiny "+가격" floater
          showSaleFloater(cu.container.x, cu.container.y - 230, BREAD_DATA[slot.type].price);
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
    if (dayActive && gameMin >= CLOSE_MIN && customers.length === 0) {
      endDay();
    }
  });

  // --- Floater effects ---
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
    const t = new Text({
      text: '💢',
      style: { fontFamily: 'sans-serif', fontSize: 32 },
    });
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

  // --- Resize: letterbox the world container into the actual viewport ---
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
    bake: (type: BreadType) => {
      const slot = slots.find((s) => s.type === type);
      if (!slot) return;
      slot.inStock = Math.min(slot.inStock + 1, 6);
      refreshStock();
    },
    startNextDay: () => {
      dayNumber += 1;
      gameMin = OPEN_MIN;
      dayActive = true;
      dayStats = { revenue: 0, served: 0, lost: 0, expected: 0 };
      spawnTimer = 0;
      lastReportedMin = -1;
      // Restock everything
      for (const slot of slots) slot.inStock = 3;
      refreshStock();
      // Clear any straggler customers
      for (const cu of customers) {
        customerLayer.removeChild(cu.container);
        cu.container.destroy({ children: true });
      }
      customers.length = 0;
      emitTime();
    },
    onDayEnd: (cb) => { onDayEndCbs.push(cb); },
    onSale: (cb) => { onSaleCbs.push(cb); },
    onCustomerLost: (cb) => { onLostCbs.push(cb); },
    onTimeChange: (cb) => { onTimeChangeCbs.push(cb); },
  };
}
