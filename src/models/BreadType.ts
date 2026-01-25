export enum BreadType {
  SaltBread = 0,
  Croissant = 1,
  Baguette = 2,
  MelonBread = 3,
  RedBeanBread = 4,
  CreamBread = 5,
}

export const BREAD_COUNT = 6;

export const BREAD_EMOJI: Record<BreadType, string> = {
  [BreadType.SaltBread]: '🥖',
  [BreadType.Croissant]: '🥐',
  [BreadType.Baguette]: '🥖',
  [BreadType.MelonBread]: '🍈',
  [BreadType.RedBeanBread]: '🫘',
  [BreadType.CreamBread]: '🍞',
};

export const BREAD_DISPLAY_NAME: Record<BreadType, string> = {
  [BreadType.SaltBread]: '소금빵',
  [BreadType.Croissant]: '크로와상',
  [BreadType.Baguette]: '바게트',
  [BreadType.MelonBread]: '멜론빵',
  [BreadType.RedBeanBread]: '단팥빵',
  [BreadType.CreamBread]: '크림빵',
};

export const BREAD_COLOR: Record<BreadType, string> = {
  [BreadType.SaltBread]: 'rgb(245, 222, 179)',
  [BreadType.Croissant]: 'rgb(237, 201, 115)',
  [BreadType.Baguette]: 'rgb(222, 184, 135)',
  [BreadType.MelonBread]: 'rgb(173, 217, 140)',
  [BreadType.RedBeanBread]: 'rgb(153, 77, 89)',
  [BreadType.CreamBread]: 'rgb(255, 242, 204)',
};

export function randomBreadType(): BreadType {
  return Math.floor(Math.random() * BREAD_COUNT) as BreadType;
}
