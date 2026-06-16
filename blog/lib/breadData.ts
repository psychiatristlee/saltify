import type { TranslationKey } from './i18n';

export interface BreadItem {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  price: number;
  image: string;
}

// Synced with Naver Place (the merchant's source of truth).
// Discontinued IDs are kept so server-side cleanup can find legacy photos.
export const DISCONTINUED_MENU_IDS = [
  'chive-cream-cheese',
  'salt-butter-tteok',
  'choco-cream',           // replaced by 'choco-bun'
  'almond',                // removed from Naver menu 2026-05
  'matcha-cream',          // removed from Naver menu 2026-04
] as const;

export const MENU_BREADS: BreadItem[] = [
  { id: 'plain', nameKey: 'breadPlainName', descKey: 'breadPlainDesc', price: 3000, image: '/breads/plain-naver.jpg' },
  { id: 'everything', nameKey: 'breadEverythingName', descKey: 'breadEverythingDesc', price: 3500, image: '/breads/everything-naver.jpg' },
  { id: 'olive-cheese', nameKey: 'breadOliveCheeseName', descKey: 'breadOliveCheeseDesc', price: 3800, image: '/breads/olive-cheese-naver.jpg' },
  { id: 'basil-tomato', nameKey: 'breadBasilTomatoName', descKey: 'breadBasilTomatoDesc', price: 3800, image: '/breads/basil-tomato-naver.jpg' },
  { id: 'garlic-butter', nameKey: 'breadGarlicButterName', descKey: 'breadGarlicButterDesc', price: 4300, image: '/breads/garlic-butter-naver.jpg' },
  { id: 'seed-hotteok', nameKey: 'breadHotteokName', descKey: 'breadHotteokDesc', price: 4300, image: '/breads/hotteok-naver.jpg' },
  { id: 'choco-bun', nameKey: 'breadChocoBunName', descKey: 'breadChocoBunDesc', price: 4300, image: '/breads/choco-bun-naver.jpg' },
  // 신메뉴 — Naver Place 2026-06. Photo asset pending: drop /breads/buldak-cheese-naver.jpg then set `image`.
  { id: 'buldak-cheese', nameKey: 'breadBuldakCheeseName', descKey: 'breadBuldakCheeseDesc', price: 6500, image: '' },
];

// 음료 메뉴
export const MENU_DRINKS: BreadItem[] = [
  { id: 'cold-brew', nameKey: 'drinkColdBrewName', descKey: 'drinkColdBrewDesc', price: 3900, image: '/breads/cold-brew-naver.png' },
  { id: 'cold-brew-latte', nameKey: 'drinkColdBrewLatteName', descKey: 'drinkColdBrewLatteDesc', price: 4900, image: '/breads/cold-brew-latte-naver.png' },
  { id: 'milk-tea', nameKey: 'drinkMilkTeaName', descKey: 'drinkMilkTeaDesc', price: 7000, image: '/breads/milktea-naver.jpg' },
  // 신메뉴 — Naver Place 2026-06 (no photo on Naver; cards render text-only)
  { id: 'zero-cola', nameKey: 'drinkZeroColaName', descKey: 'drinkZeroColaDesc', price: 2900, image: '' },
  { id: 'peach-iced-tea', nameKey: 'drinkPeachIcedTeaName', descKey: 'drinkPeachIcedTeaDesc', price: 2900, image: '' },
];
