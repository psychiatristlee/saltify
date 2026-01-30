import { BreadType, BREAD_DATA } from './BreadType';

// Coupon expires 2 weeks after creation
const COUPON_VALIDITY_DAYS = 14;

export interface Coupon {
  id: string;
  type: 'one-plus-one';
  breadType: BreadType;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  source: 'game' | 'referral' | 'upgrade';
}

export function createCoupon(breadType: BreadType, source: 'game' | 'referral' | 'upgrade' = 'game'): Coupon {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  return {
    id: crypto.randomUUID(),
    type: 'one-plus-one',
    breadType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    source,
  };
}

export function isCouponExpired(coupon: Coupon): boolean {
  return new Date(coupon.expiresAt) < new Date();
}

export function getDaysUntilExpiration(coupon: Coupon): number {
  const now = new Date();
  const expiresAt = new Date(coupon.expiresAt);
  const diffMs = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function getCouponDisplayInfo(coupon: Coupon) {
  const breadInfo = BREAD_DATA[coupon.breadType];
  return {
    title: `${breadInfo.name} Coupon`,
    titleKo: `${breadInfo.nameKo} 쿠폰`,
    price: breadInfo.price,
    description: breadInfo.description,
    image: breadInfo.image,
  };
}
