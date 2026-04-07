import type { TranslationKey } from './i18n';

export interface BreadItem {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  price: number;
  image: string;
}

export const MENU_BREADS: BreadItem[] = [
  { id: 'plain', nameKey: 'breadPlainName', descKey: 'breadPlainDesc', price: 3000, image: '/breads/plain.png' },
  { id: 'everything', nameKey: 'breadEverythingName', descKey: 'breadEverythingDesc', price: 3500, image: '/breads/everything.png' },
  { id: 'olive-cheese', nameKey: 'breadOliveCheeseName', descKey: 'breadOliveCheeseDesc', price: 3800, image: '/breads/olive-cheese.png' },
  { id: 'basil-tomato', nameKey: 'breadBasilTomatoName', descKey: 'breadBasilTomatoDesc', price: 3800, image: '/breads/basil-tomato.png' },
  { id: 'garlic-butter', nameKey: 'breadGarlicButterName', descKey: 'breadGarlicButterDesc', price: 4300, image: '/breads/garlic-butter.png' },
  { id: 'hotteok', nameKey: 'breadHotteokName', descKey: 'breadHotteokDesc', price: 4300, image: '/breads/hotteok.png' },
  { id: 'cube-choco', nameKey: 'landingCubeChocoName', descKey: 'landingCubeChocoDesc', price: 5000, image: '/brandings/cube-choco-cream.png' },
  { id: 'cube-matcha', nameKey: 'landingCubeMatchaName', descKey: 'landingCubeMatchaDesc', price: 5000, image: '/brandings/cube-matcha-cream.png' },
];
