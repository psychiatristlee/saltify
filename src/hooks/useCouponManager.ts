import { useState, useCallback, useEffect, useRef } from 'react';
import { Coupon, createCoupon } from '../models/Coupon';
import { BreadType, BREAD_DATA, POINTS_PER_CRUSH, getAllBreadTypes } from '../models/BreadType';
import { loadData, saveData } from '../utils/storage';

const COUPONS_KEY = 'savedCoupons';
const BREAD_POINTS_KEY = 'breadPoints';

// Points per bread type (initialized to 0 for each)
export type BreadPoints = Record<BreadType, number>;

function createInitialBreadPoints(): BreadPoints {
  const points: Partial<BreadPoints> = {};
  getAllBreadTypes().forEach((type) => {
    points[type] = 0;
  });
  return points as BreadPoints;
}

export interface CouponManagerState {
  coupons: Coupon[];
  breadPoints: BreadPoints;
  showCouponAlert: boolean;
  newCouponMessage: string;
  newCouponBreadType: BreadType | null;
}

export function useCouponManager() {
  const [state, setState] = useState<CouponManagerState>({
    coupons: [],
    breadPoints: createInitialBreadPoints(),
    showCouponAlert: false,
    newCouponMessage: '',
    newCouponBreadType: null,
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      const coupons = await loadData<Coupon[]>(COUPONS_KEY, []);
      const breadPoints = await loadData<BreadPoints>(BREAD_POINTS_KEY, createInitialBreadPoints());
      setState((prev) => ({
        ...prev,
        coupons,
        breadPoints,
      }));
    }
    init();
  }, []);

  const persist = useCallback((coupons: Coupon[], breadPoints: BreadPoints) => {
    saveData(COUPONS_KEY, coupons);
    saveData(BREAD_POINTS_KEY, breadPoints);
  }, []);

  const availableCoupons = state.coupons.filter((c) => !c.isUsed);

  // Get progress for a specific bread type (0 to 1)
  const getProgressForBread = useCallback((breadType: BreadType): number => {
    const points = state.breadPoints[breadType];
    const price = BREAD_DATA[breadType].price;
    return (points % price) / price;
  }, [state.breadPoints]);

  // Get remaining points needed for next coupon
  const getRemainingForBread = useCallback((breadType: BreadType): number => {
    const points = state.breadPoints[breadType];
    const price = BREAD_DATA[breadType].price;
    return price - (points % price);
  }, [state.breadPoints]);

  // Add points when breads are crushed (called with bread type and count)
  const addCrushedBread = useCallback((breadType: BreadType, count: number) => {
    const pointsToAdd = count * POINTS_PER_CRUSH;

    setState((prev) => {
      const currentPoints = prev.breadPoints[breadType];
      const newPoints = currentPoints + pointsToAdd;
      const price = BREAD_DATA[breadType].price;

      const prevCouponCount = Math.floor(currentPoints / price);
      const newCouponCount = Math.floor(newPoints / price);
      const earnedCoupons = newCouponCount - prevCouponCount;

      const newCoupons = [...prev.coupons];
      let alertMessage = '';
      let alertBreadType: BreadType | null = null;

      for (let i = 0; i < earnedCoupons; i++) {
        newCoupons.push(createCoupon(breadType, 'game'));
        alertMessage = `축하합니다! 🎉\n${BREAD_DATA[breadType].nameKo} 1+1 쿠폰을 획득했어요!`;
        alertBreadType = breadType;
      }

      const newBreadPoints = {
        ...prev.breadPoints,
        [breadType]: newPoints,
      };

      persist(newCoupons, newBreadPoints);

      return {
        ...prev,
        breadPoints: newBreadPoints,
        coupons: newCoupons,
        showCouponAlert: alertMessage !== '',
        newCouponMessage: alertMessage,
        newCouponBreadType: alertBreadType,
      };
    });
  }, [persist]);

  // Add referral coupon (Plain 1+1)
  const addReferralCoupon = useCallback(() => {
    setState((prev) => {
      const newCoupons = [...prev.coupons, createCoupon(BreadType.Plain, 'referral')];
      persist(newCoupons, prev.breadPoints);
      return {
        ...prev,
        coupons: newCoupons,
        showCouponAlert: true,
        newCouponMessage: '초대 보상으로 플레인 1+1 쿠폰을 받았어요! 🎁',
        newCouponBreadType: BreadType.Plain,
      };
    });
  }, [persist]);

  const useCoupon = useCallback((couponId: string): boolean => {
    const coupon = state.coupons.find((c) => c.id === couponId && !c.isUsed);
    if (!coupon) return false;

    setState((prev) => {
      const finalCoupons = prev.coupons.map((c) =>
        c.id === couponId ? { ...c, isUsed: true } : c
      );
      persist(finalCoupons, prev.breadPoints);
      return { ...prev, coupons: finalCoupons };
    });

    return true;
  }, [state.coupons, persist]);

  const dismissAlert = useCallback(() => {
    setState((prev) => ({ ...prev, showCouponAlert: false }));
  }, []);

  // Get total points across all breads
  const totalPoints = Object.values(state.breadPoints).reduce((a, b) => a + b, 0);

  // Get coupons for a specific bread type
  const getCouponsForBread = useCallback((breadType: BreadType) => {
    return state.coupons.filter((c) => c.breadType === breadType && !c.isUsed);
  }, [state.coupons]);

  return {
    ...state,
    totalPoints,
    availableCoupons,
    getProgressForBread,
    getRemainingForBread,
    getCouponsForBread,
    addCrushedBread,
    addReferralCoupon,
    useCoupon,
    dismissAlert,
  };
}
