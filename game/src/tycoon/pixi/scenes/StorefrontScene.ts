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
import type { PixiSceneController } from '../PixiCanvas';

const SHELF_BG = 0xb88a5a;
const SHELF_TRIM = 0x6d4d2e;
const FLOOR = 0xf3e3c0;
const WALL = 0xfff2d6;

interface BreadSlot {
  type: BreadType;
  sprite: Sprite;
  shadow: Graphics;
  baseY: number;
  inStock: number;
}

interface Customer {
  container: Container;
  speed: number;
  lifetime: number;
  state: 'arriving' | 'browsing' | 'leaving';
  targetSlot: BreadSlot | null;
  patience: number;
  wantedType: BreadType;
}

export interface StorefrontHandle {
  controller: PixiSceneController;
  /** Called by HUD when player taps "굽기" — restocks one slot of given type. */
  bake: (type: BreadType) => void;
  onSale: (cb: (revenue: number, type: BreadType) => void) => void;
  onCustomerLost: (cb: () => void) => void;
}

export async function createStorefrontScene(app: Application): Promise<StorefrontHandle> {
  const stage = app.stage;
  const root = new Container();
  stage.addChild(root);

  // Logical canvas size — we letterbox into the actual viewport
  const W = 720;
  const H = 1280;
  const world = new Container();
  root.addChild(world);

  // --- Background: wall + floor ---
  const bg = new Graphics();
  bg.rect(0, 0, W, H * 0.55).fill(WALL);
  bg.rect(0, H * 0.55, W, H * 0.45).fill(FLOOR);
  world.addChild(bg);

  // Subtle floor lines for perspective
  const floorLines = new Graphics();
  for (let i = 0; i < 6; i++) {
    const y = H * 0.55 + (i + 1) * (H * 0.45) / 7;
    floorLines.moveTo(0, y).lineTo(W, y).stroke({ color: 0xe8d2a3, width: 2 });
  }
  world.addChild(floorLines);

  // Store sign
  const sign = new Text({
    text: 'Salt, 0',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0x6d4d2e,
      letterSpacing: 4,
    },
  });
  sign.anchor.set(0.5, 0);
  sign.x = W / 2;
  sign.y = 60;
  world.addChild(sign);

  const subSign = new Text({
    text: '솔트빵 · 홍대',
    style: {
      fontFamily: 'sans-serif',
      fontSize: 24,
      fill: 0x8b6f47,
    },
  });
  subSign.anchor.set(0.5, 0);
  subSign.x = W / 2;
  subSign.y = 120;
  world.addChild(subSign);

  // --- Display case (shelf) ---
  const SHELF_X = 60;
  const SHELF_Y = 320;
  const SHELF_W = W - 120;
  const SHELF_H = 360;

  const shelf = new Graphics();
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, SHELF_H, 16).fill(SHELF_BG);
  shelf.roundRect(SHELF_X, SHELF_Y, SHELF_W, 28, 16).fill(SHELF_TRIM);
  shelf.roundRect(SHELF_X, SHELF_Y + SHELF_H - 28, SHELF_W, 28, 16).fill(SHELF_TRIM);
  // mid divider
  shelf.rect(SHELF_X, SHELF_Y + SHELF_H / 2 - 4, SHELF_W, 8).fill(SHELF_TRIM);
  world.addChild(shelf);

  // --- Load bread textures + place on shelf ---
  const breadTypes = getAllBreadTypes();
  const textures = await Promise.all(
    breadTypes.map((t) => Assets.load<Texture>(BREAD_DATA[t].image))
  );

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

    const shadow = new Graphics();
    shadow.ellipse(0, 36, 50, 10).fill({ color: 0x000000, alpha: 0.18 });
    shadow.x = cx;
    shadow.y = cy;
    world.addChild(shadow);

    const sprite = new Sprite(textures[i]);
    sprite.anchor.set(0.5);
    sprite.x = cx;
    sprite.y = cy;
    const targetW = cellW * 0.7;
    const scale = targetW / sprite.width;
    sprite.scale.set(scale);
    world.addChild(sprite);

    // Price tag
    const tag = new Text({
      text: `${(BREAD_DATA[type].price / 1000).toFixed(1)}k`,
      style: {
        fontFamily: 'sans-serif',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0x6d4d2e,
      },
    });
    tag.anchor.set(0.5, 0);
    tag.x = cx;
    tag.y = cy + 50;
    world.addChild(tag);

    slots.push({ type, sprite, shadow, baseY: cy, inStock: 3 });
  }

  // Stock counter overlays
  const stockTexts = slots.map((slot) => {
    const t = new Text({
      text: `×${slot.inStock}`,
      style: { fontFamily: 'sans-serif', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' },
    });
    t.anchor.set(1, 0);
    t.x = slot.sprite.x + cellW * 0.32;
    t.y = slot.baseY - cellH * 0.4;
    const bg = new Graphics();
    bg.roundRect(t.x - 32, t.y - 2, 36, 22, 6).fill({ color: 0x6d4d2e, alpha: 0.85 });
    world.addChildAt(bg, world.getChildIndex(slot.sprite));
    world.addChild(t);
    return { t, bg, slot };
  });

  function refreshStockText() {
    for (const s of stockTexts) {
      s.t.text = `×${s.slot.inStock}`;
      s.t.alpha = s.slot.inStock > 0 ? 1 : 0.3;
      s.slot.sprite.alpha = s.slot.inStock > 0 ? 1 : 0.25;
    }
  }
  refreshStockText();

  // --- Customer system ---
  const customerLayer = new Container();
  world.addChild(customerLayer);

  const customers: Customer[] = [];
  const onSaleCbs: Array<(rev: number, t: BreadType) => void> = [];
  const onLostCbs: Array<() => void> = [];

  function spawnCustomer() {
    const wantedType = breadTypes[Math.floor(Math.random() * breadTypes.length)];
    const c = new Container();
    // Body — simple rounded blob
    const body = new Graphics();
    const tint = 0x000000 | (Math.floor(Math.random() * 0xffffff));
    body.roundRect(-26, -70, 52, 70, 16).fill(tint);
    body.circle(0, -90, 22).fill(0xf2c894);
    c.addChild(body);

    // Speech bubble showing wanted bread
    const bubble = new Container();
    const bg = new Graphics();
    bg.roundRect(-32, -130, 64, 38, 10).fill(0xffffff);
    bg.moveTo(-6, -92).lineTo(0, -82).lineTo(6, -92).fill(0xffffff);
    bubble.addChild(bg);
    const wantedSprite = new Sprite(textures[breadTypes.indexOf(wantedType)]);
    wantedSprite.anchor.set(0.5);
    wantedSprite.scale.set(28 / wantedSprite.width);
    wantedSprite.x = 0;
    wantedSprite.y = -111;
    bubble.addChild(wantedSprite);
    c.addChild(bubble);

    c.x = -60;
    c.y = H * 0.86;
    customerLayer.addChild(c);
    customers.push({
      container: c,
      speed: 1.3,
      lifetime: 0,
      state: 'arriving',
      targetSlot: slots.find((s) => s.type === wantedType && s.inStock > 0) ?? null,
      patience: 12_000,
      wantedType,
    });
  }

  // --- Tick ---
  let spawnTimer = 0;
  const SPAWN_INTERVAL_MS = 4000;
  app.ticker.add((tk) => {
    const dt = tk.deltaMS;
    spawnTimer += dt;
    if (spawnTimer > SPAWN_INTERVAL_MS && customers.length < 4) {
      spawnTimer = 0;
      spawnCustomer();
    }

    for (let i = customers.length - 1; i >= 0; i--) {
      const cu = customers[i];
      cu.lifetime += dt;

      if (cu.state === 'arriving') {
        cu.container.x += cu.speed * tk.deltaTime * 1.4;
        // Walk up to a slot or front-and-center
        const targetX = cu.targetSlot
          ? cu.targetSlot.sprite.x
          : W / 2 + (Math.random() - 0.5) * 120;
        if (cu.container.x >= targetX) {
          cu.container.x = targetX;
          cu.state = 'browsing';
        }
      } else if (cu.state === 'browsing') {
        cu.patience -= dt;
        // If wanted slot has stock, "buy" automatically after small dwell
        const slot = slots.find((s) => s.type === cu.wantedType);
        if (slot && slot.inStock > 0 && cu.lifetime > 1500) {
          slot.inStock -= 1;
          refreshStockText();
          for (const cb of onSaleCbs) cb(BREAD_DATA[slot.type].price, slot.type);
          cu.state = 'leaving';
        } else if (cu.patience <= 0) {
          for (const cb of onLostCbs) cb();
          cu.state = 'leaving';
        }
      } else {
        // leaving — walk off-stage right
        cu.container.x += cu.speed * tk.deltaTime * 1.8;
        cu.container.alpha -= 0.01 * tk.deltaTime;
        if (cu.container.x > W + 80 || cu.container.alpha <= 0) {
          customerLayer.removeChild(cu.container);
          cu.container.destroy({ children: true });
          customers.splice(i, 1);
        }
      }
    }
  });

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
      refreshStockText();
    },
    onSale: (cb) => { onSaleCbs.push(cb); },
    onCustomerLost: (cb) => { onLostCbs.push(cb); },
  };
}
