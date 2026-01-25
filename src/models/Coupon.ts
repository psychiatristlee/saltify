export interface Coupon {
  id: string;
  type: 'one-plus-one';
  createdAt: string;
  isUsed: boolean;
}

export function createCoupon(): Coupon {
  return {
    id: crypto.randomUUID(),
    type: 'one-plus-one',
    createdAt: new Date().toISOString(),
    isUsed: false,
  };
}

export function couponDisplayText(_coupon: Coupon): string {
  return '소금빵 1+1 쿠폰';
}
