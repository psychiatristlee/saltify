export enum BreadType {
  Plain = 0,
  Everything = 1,
  OliveCheese = 2,
  BasilTomato = 3,
  GarlicButter = 4,
  Hotteok = 5,
}

export const BREAD_COUNT = 6;

export interface BreadInfo {
  id: BreadType;
  name: string;
  nameKo: string;
  price: number;
  description: string;
  image: string;
  color: string;
}

export const BREAD_DATA: Record<BreadType, BreadInfo> = {
  [BreadType.Plain]: {
    id: BreadType.Plain,
    name: 'Plain',
    nameKo: '플레인',
    price: 3000,
    description: '기본에 충실한 담백함과 바삭한 식감',
    image: '/breads/plain.png',
    color: 'rgb(245, 222, 179)',
  },
  [BreadType.Everything]: {
    id: BreadType.Everything,
    name: 'Everything',
    nameKo: '에브리띵',
    price: 3500,
    description: '양파,치아시드,참깨,검은깨 등이 토핑된 고소하면서도 담백하게 즐길 수 있는 소금빵',
    image: '/breads/everything.png',
    color: 'rgb(237, 201, 115)',
  },
  [BreadType.OliveCheese]: {
    id: BreadType.OliveCheese,
    name: 'Olive Cheese',
    nameKo: '올리브 치즈',
    price: 3800,
    description: '블랙올리브와 치즈의 짭짤고소한 조화',
    image: '/breads/olive-cheese.png',
    color: 'rgb(222, 184, 135)',
  },
  [BreadType.BasilTomato]: {
    id: BreadType.BasilTomato,
    name: 'Basil Tomato',
    nameKo: '바질 토마토',
    price: 3800,
    description: '직접만든 바질버터와 선드라이 토마토의 향과 산미',
    image: '/breads/basil-tomato.png',
    color: 'rgb(173, 217, 140)',
  },
  [BreadType.GarlicButter]: {
    id: BreadType.GarlicButter,
    name: 'Garlic Butter',
    nameKo: '갈릭 버터',
    price: 4300,
    description: '마늘향과 버터소스의 달콤하고 고소함',
    image: '/breads/garlic-butter.png',
    color: 'rgb(255, 193, 102)',
  },
  [BreadType.Hotteok]: {
    id: BreadType.Hotteok,
    name: 'Hotteok',
    nameKo: '호떡',
    price: 4300,
    description: '고소한 견과류와 달콤한 시럽이 가득찬 따끈한 호떡을 느낄 수 있는 소금빵',
    image: '/breads/hotteok.png',
    color: 'rgb(153, 77, 89)',
  },
};

// Points earned per bread crushed (1 point per bread)
export const POINTS_PER_CRUSH = 1;

export function randomBreadType(): BreadType {
  return Math.floor(Math.random() * BREAD_COUNT) as BreadType;
}

export function getBreadInfo(type: BreadType): BreadInfo {
  return BREAD_DATA[type];
}

export function getAllBreadTypes(): BreadType[] {
  return [
    BreadType.Plain,
    BreadType.Everything,
    BreadType.OliveCheese,
    BreadType.BasilTomato,
    BreadType.GarlicButter,
    BreadType.Hotteok,
  ];
}
