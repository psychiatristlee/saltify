import type { TranslationKey } from './i18n';

export interface BreadItem {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  price: number;
  image: string;
  /** Marked "• 대표 메뉴 / Signature" on the in-store menu board. */
  signature?: boolean;
}

// Source of truth: the in-store menu board (2026-09). Order, prices and
// signature marks follow the board, so /menu and /menu/jp read the same as it.
// Discontinued IDs are kept so server-side cleanup can find legacy photos.
export const DISCONTINUED_MENU_IDS = [
  'chive-cream-cheese',
  'salt-butter-tteok',
  'choco-cream',           // replaced by 'choco-bun'
  'almond',                // removed from Naver menu 2026-05
  'matcha-cream',          // removed from Naver menu 2026-04
  'chapssaltteok',         // removed from menu board 2026-09
  'buldak-cheese',         // removed from menu board 2026-09
  'milk-tea',              // removed from menu board 2026-09
] as const;

// Photo assets pending for items with `image: ''` — drop /breads/<id>-naver.jpg
// in, then set `image`. Cards render text-only until then.
export const MENU_BREADS: BreadItem[] = [
  { id: 'plain', nameKey: 'breadPlainName', descKey: 'breadPlainDesc', price: 3000, image: '/breads/plain-naver.jpg', signature: true },
  { id: 'everything', nameKey: 'breadEverythingName', descKey: 'breadEverythingDesc', price: 3500, image: '/breads/everything-naver.jpg', signature: true },
  { id: 'corn-cheese', nameKey: 'breadCornCheeseName', descKey: 'breadCornCheeseDesc', price: 3900, image: '', signature: true },
  { id: 'olive-cheese', nameKey: 'breadOliveCheeseName', descKey: 'breadOliveCheeseDesc', price: 3900, image: '/breads/olive-cheese-naver.jpg', signature: true },
  { id: 'basil-tomato', nameKey: 'breadBasilTomatoName', descKey: 'breadBasilTomatoDesc', price: 3900, image: '/breads/basil-tomato-naver.jpg', signature: true },
  { id: 'garlic-butter', nameKey: 'breadGarlicButterName', descKey: 'breadGarlicButterDesc', price: 4300, image: '/breads/garlic-butter-naver.jpg' },
  { id: 'seed-hotteok', nameKey: 'breadHotteokName', descKey: 'breadHotteokDesc', price: 4300, image: '/breads/hotteok-naver.jpg' },
  { id: 'choco-bun', nameKey: 'breadChocoBunName', descKey: 'breadChocoBunDesc', price: 4300, image: '/breads/choco-bun-naver.jpg' },
  { id: 'jalapeno-ham-cheese', nameKey: 'breadJalapenoHamCheeseName', descKey: 'breadJalapenoHamCheeseDesc', price: 4500, image: '', signature: true },
];

// 음료 메뉴
export const MENU_DRINKS: BreadItem[] = [
  { id: 'cold-brew', nameKey: 'drinkColdBrewName', descKey: 'drinkColdBrewDesc', price: 4400, image: '/breads/cold-brew-naver.png', signature: true },
  { id: 'cold-brew-bottle', nameKey: 'drinkColdBrewBottleName', descKey: 'drinkColdBrewBottleDesc', price: 5200, image: '' },
  { id: 'cold-brew-latte', nameKey: 'drinkColdBrewLatteName', descKey: 'drinkColdBrewLatteDesc', price: 5400, image: '/breads/cold-brew-latte-naver.png' },
  { id: 'zero-cola', nameKey: 'drinkZeroColaName', descKey: 'drinkZeroColaDesc', price: 2900, image: '' },
  { id: 'peach-iced-tea', nameKey: 'drinkPeachIcedTeaName', descKey: 'drinkPeachIcedTeaDesc', price: 2900, image: '' },
];
