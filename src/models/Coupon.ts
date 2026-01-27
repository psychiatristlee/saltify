import { BreadType, BREAD_DATA } from './BreadType';

export interface Coupon {
  id: string;
  type: 'one-plus-one';
  breadType: BreadType;
  createdAt: string;
  isUsed: boolean;
  source: 'game' | 'referral';
}

export function createCoupon(breadType: BreadType, source: 'game' | 'referral' = 'game'): Coupon {
  return {
    id: crypto.randomUUID(),
    type: 'one-plus-one',
    breadType,
    createdAt: new Date().toISOString(),
    isUsed: false,
    source,
  };
}

export function getCouponDisplayInfo(coupon: Coupon) {
  const breadInfo = BREAD_DATA[coupon.breadType];
  return {
    title: `${breadInfo.name} 1+1`,
    titleKo: `${breadInfo.nameKo} 1+1`,
    price: breadInfo.price,
    description: breadInfo.description,
    image: breadInfo.image,
  };
}
