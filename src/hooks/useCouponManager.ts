import { useState, useCallback, useEffect, useRef } from 'react';
import { Coupon, createCoupon } from '../models/Coupon';
import { loadData, saveData } from '../utils/storage';

const COUPONS_KEY = 'savedCoupons';
const POINTS_KEY = 'totalPoints';

const POINTS_PER_COUPON = 3000;

export interface CouponManagerState {
  coupons: Coupon[];
  points: number;
  showCouponAlert: boolean;
  newCouponMessage: string;
}

export function useCouponManager() {
  const [state, setState] = useState<CouponManagerState>({
    coupons: [],
    points: 0,
    showCouponAlert: false,
    newCouponMessage: '',
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      const coupons = await loadData<Coupon[]>(COUPONS_KEY, []);
      const points = await loadData<number>(POINTS_KEY, 0);
      setState((prev) => ({
        ...prev,
        coupons,
        points,
      }));
    }
    init();
  }, []);

  const persist = useCallback((coupons: Coupon[], points: number) => {
    saveData(COUPONS_KEY, coupons);
    saveData(POINTS_KEY, points);
  }, []);

  const availableCoupons = state.coupons.filter((c) => !c.isUsed);
  const progressToNextCoupon = (state.points % POINTS_PER_COUPON) / POINTS_PER_COUPON;
  const remainingForNextCoupon = POINTS_PER_COUPON - (state.points % POINTS_PER_COUPON);

  const addCrushedSaltBread = useCallback((count: number) => {
    setState((prev) => {
      const newPoints = prev.points + count;
      const prevCouponCount = Math.floor(prev.points / POINTS_PER_COUPON);
      const newCouponCount = Math.floor(newPoints / POINTS_PER_COUPON);
      const earnedCoupons = newCouponCount - prevCouponCount;

      const newCoupons = [...prev.coupons];
      let alertMessage = '';

      for (let i = 0; i < earnedCoupons; i++) {
        newCoupons.push(createCoupon());
        alertMessage = `축하합니다! 🎉\n소금빵 1+1 쿠폰을 획득했어요!`;
      }

      persist(newCoupons, newPoints);

      return {
        ...prev,
        points: newPoints,
        coupons: newCoupons,
        showCouponAlert: alertMessage !== '',
        newCouponMessage: alertMessage,
      };
    });
  }, [persist]);

  const useCoupon = useCallback((): boolean => {
    if (availableCoupons.length === 0) return false;

    setState((prev) => {
      let marked = false;
      const finalCoupons = prev.coupons.map((c) => {
        if (!c.isUsed && !marked) {
          marked = true;
          return { ...c, isUsed: true };
        }
        return c;
      });

      persist(finalCoupons, prev.points);
      return { ...prev, coupons: finalCoupons };
    });

    return true;
  }, [availableCoupons.length, persist]);

  const dismissAlert = useCallback(() => {
    setState((prev) => ({ ...prev, showCouponAlert: false }));
  }, []);

  return {
    ...state,
    totalSaltBreadCrushed: state.points,
    availableCoupons,
    progressToNextCoupon,
    remainingForNextCoupon,
    addCrushedSaltBread,
    useCoupon,
    dismissAlert,
  };
}
