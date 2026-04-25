import type { TranslationKey } from './i18n';

export interface BreadItem {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  price: number;
  image: string;
}

// 소금빵 메뉴 (메뉴판 기준)
export const MENU_BREADS: BreadItem[] = [
  { id: 'plain', nameKey: 'breadPlainName', descKey: 'breadPlainDesc', price: 3000, image: '/breads/plain.png' },
  { id: 'everything', nameKey: 'breadEverythingName', descKey: 'breadEverythingDesc', price: 3500, image: '/breads/everything.png' },
  { id: 'olive-cheese', nameKey: 'breadOliveCheeseName', descKey: 'breadOliveCheeseDesc', price: 3800, image: '/breads/olive-cheese.png' },
  { id: 'basil-tomato', nameKey: 'breadBasilTomatoName', descKey: 'breadBasilTomatoDesc', price: 3800, image: '/breads/basil-tomato.png' },
  { id: 'garlic-butter', nameKey: 'breadGarlicButterName', descKey: 'breadGarlicButterDesc', price: 4300, image: '/breads/garlic-butter.png' },
  { id: 'almond', nameKey: 'breadAlmondName', descKey: 'breadAlmondDesc', price: 4300, image: '/brandings/plain.png' },
  { id: 'seed-hotteok', nameKey: 'breadHotteokName', descKey: 'breadHotteokDesc', price: 4300, image: '/breads/hotteok.png' },
  { id: 'chive-cream-cheese', nameKey: 'breadChiveCreamCheeseName', descKey: 'breadChiveCreamCheeseDesc', price: 5500, image: '/brandings/plain.png' },
  { id: 'salt-butter-tteok', nameKey: 'breadSaltButterTteokName', descKey: 'breadSaltButterTteokDesc', price: 3900, image: '/brandings/plain.png' },
  { id: 'choco-cream', nameKey: 'breadChocoName', descKey: 'breadChocoDesc', price: 5000, image: '/brandings/cube-choco-cream.png' },
  { id: 'matcha-cream', nameKey: 'breadMatchaName', descKey: 'breadMatchaDesc', price: 5000, image: '/brandings/cube-matcha-cream.png' },
];

// 음료 메뉴
export const MENU_DRINKS: BreadItem[] = [
  { id: 'cold-brew', nameKey: 'drinkColdBrewName', descKey: 'drinkColdBrewDesc', price: 5500, image: '/brandings/plain.png' },
  { id: 'cold-brew-latte', nameKey: 'drinkColdBrewLatteName', descKey: 'drinkColdBrewLatteDesc', price: 6000, image: '/brandings/plain.png' },
  { id: 'milk-tea', nameKey: 'drinkMilkTeaName', descKey: 'drinkMilkTeaDesc', price: 7000, image: '/brandings/plain.png' },
];
