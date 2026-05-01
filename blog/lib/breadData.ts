import type { TranslationKey } from './i18n';

export interface BreadItem {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  price: number;
  image: string;
}

// 소금빵 메뉴 (메뉴판 기준)
// Discontinued (kept here as a record so server-side cleanup can find them):
//   chive-cream-cheese, salt-butter-tteok, choco-cream, matcha-cream
export const DISCONTINUED_MENU_IDS = [
  'chive-cream-cheese',
  'salt-butter-tteok',
  'choco-cream',
  'matcha-cream',
] as const;

export const MENU_BREADS: BreadItem[] = [
  { id: 'plain', nameKey: 'breadPlainName', descKey: 'breadPlainDesc', price: 3000, image: '/breads/plain.png' },
  { id: 'everything', nameKey: 'breadEverythingName', descKey: 'breadEverythingDesc', price: 3500, image: '/breads/everything.png' },
  { id: 'olive-cheese', nameKey: 'breadOliveCheeseName', descKey: 'breadOliveCheeseDesc', price: 3800, image: '/breads/olive-cheese.png' },
  { id: 'basil-tomato', nameKey: 'breadBasilTomatoName', descKey: 'breadBasilTomatoDesc', price: 3800, image: '/breads/basil-tomato.png' },
  { id: 'garlic-butter', nameKey: 'breadGarlicButterName', descKey: 'breadGarlicButterDesc', price: 4300, image: '/breads/garlic-butter.png' },
  { id: 'almond', nameKey: 'breadAlmondName', descKey: 'breadAlmondDesc', price: 4300, image: '/brandings/plain.png' },
  { id: 'seed-hotteok', nameKey: 'breadHotteokName', descKey: 'breadHotteokDesc', price: 4300, image: '/breads/hotteok.png' },
];

// 음료 메뉴
export const MENU_DRINKS: BreadItem[] = [
  { id: 'cold-brew', nameKey: 'drinkColdBrewName', descKey: 'drinkColdBrewDesc', price: 5500, image: '/brandings/plain.png' },
  { id: 'cold-brew-latte', nameKey: 'drinkColdBrewLatteName', descKey: 'drinkColdBrewLatteDesc', price: 6000, image: '/brandings/plain.png' },
  { id: 'milk-tea', nameKey: 'drinkMilkTeaName', descKey: 'drinkMilkTeaDesc', price: 7000, image: '/brandings/plain.png' },
];
