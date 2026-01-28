import { useState, useCallback, useEffect, useRef } from 'react';
import { Coupon, isCouponExpired } from '../models/Coupon';
import { BreadType, BREAD_DATA, POINTS_PER_CRUSH, getAllBreadTypes } from '../models/BreadType';
import { loadData, saveData } from '../utils/storage';
import {
  createCouponForUser,
  subscribeToCoupons,
  useCouponInFirestore,
  createReferralCoupons,
  FirestoreCoupon,
} from '../services/coupon';

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

// Convert Firestore coupon to local Coupon type
function toLocalCoupon(fc: FirestoreCoupon): Coupon {
  return {
    id: fc.id,
    type: fc.type,
    breadType: fc.breadType,
    createdAt: fc.createdAt,
    expiresAt: fc.expiresAt,
    isUsed: fc.isUsed,
    source: fc.source,
  };
}

export interface CouponManagerState {
  coupons: Coupon[];
  breadPoints: BreadPoints;
  showCouponAlert: boolean;
  newCouponMessage: string;
  newCouponBreadType: BreadType | null;
}

export function useCouponManager(userId: string | null = null) {
  const [state, setState] = useState<CouponManagerState>({
    coupons: [],
    breadPoints: createInitialBreadPoints(),
    showCouponAlert: false,
    newCouponMessage: '',
    newCouponBreadType: null,
  });
  const initialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load bread points from localStorage (still local for game progress)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadPoints() {
      const breadPoints = await loadData<BreadPoints>(BREAD_POINTS_KEY, createInitialBreadPoints());
      setState((prev) => ({ ...prev, breadPoints }));
    }
    loadPoints();
  }, []);

  // Subscribe to coupons from Firestore when user is logged in
  useEffect(() => {
    if (!userId) {
      // Clear coupons when logged out
      setState((prev) => ({ ...prev, coupons: [] }));
      return;
    }

    // Subscribe to real-time coupon updates
    const unsubscribe = subscribeToCoupons(userId, (firestoreCoupons) => {
      const localCoupons = firestoreCoupons.map(toLocalCoupon);
      setState((prev) => ({ ...prev, coupons: localCoupons }));
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userId]);

  const persistPoints = useCallback((breadPoints: BreadPoints) => {
    saveData(BREAD_POINTS_KEY, breadPoints);
  }, []);

  const availableCoupons = state.coupons.filter((c) => !c.isUsed && !isCouponExpired(c));

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
    if (!userId) return;

    const pointsToAdd = count * POINTS_PER_CRUSH;

    setState((prev) => {
      const currentPoints = prev.breadPoints[breadType];
      const newPoints = currentPoints + pointsToAdd;
      const price = BREAD_DATA[breadType].price;

      const prevCouponCount = Math.floor(currentPoints / price);
      const newCouponCount = Math.floor(newPoints / price);
      const earnedCoupons = newCouponCount - prevCouponCount;

      const newBreadPoints = {
        ...prev.breadPoints,
        [breadType]: newPoints,
      };

      persistPoints(newBreadPoints);

      // Create coupons in Firestore for each earned
      if (earnedCoupons > 0) {
        for (let i = 0; i < earnedCoupons; i++) {
          createCouponForUser(userId, breadType, 'game').catch(console.error);
        }

        return {
          ...prev,
          breadPoints: newBreadPoints,
          showCouponAlert: true,
          newCouponMessage: `축하합니다! 🎉\n${BREAD_DATA[breadType].nameKo} 1+1 쿠폰을 획득했어요!`,
          newCouponBreadType: breadType,
        };
      }

      return {
        ...prev,
        breadPoints: newBreadPoints,
      };
    });
  }, [userId, persistPoints]);

  // Add referral coupons for both referrer and referred user
  const addReferralCoupons = useCallback(async (referrerId: string, referredUserId: string): Promise<boolean> => {
    try {
      await createReferralCoupons(referrerId, referredUserId);
      return true;
    } catch (error) {
      console.error('Error creating referral coupons:', error);
      return false;
    }
  }, []);

  // Show referral coupon alert (for the current user who just received one)
  const showReferralCouponAlert = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCouponAlert: true,
      newCouponMessage: '초대 보상으로 플레인 1+1 쿠폰을 받았어요! 🎁',
      newCouponBreadType: BreadType.Plain,
    }));
  }, []);

  const useCoupon = useCallback(async (
    couponId: string,
    branchId?: string,
    branchName?: string
  ): Promise<boolean> => {
    const coupon = state.coupons.find((c) => c.id === couponId && !c.isUsed);
    if (!coupon) return false;

    const success = await useCouponInFirestore(couponId, branchId, branchName);
    return success;
  }, [state.coupons]);

  const dismissAlert = useCallback(() => {
    setState((prev) => ({ ...prev, showCouponAlert: false }));
  }, []);

  // Get total points across all breads
  const totalPoints = Object.values(state.breadPoints).reduce((a, b) => a + b, 0);

  // Get coupons for a specific bread type (excludes used and expired)
  const getCouponsForBread = useCallback((breadType: BreadType) => {
    return state.coupons.filter((c) => c.breadType === breadType && !c.isUsed && !isCouponExpired(c));
  }, [state.coupons]);

  return {
    ...state,
    userId,
    totalPoints,
    availableCoupons,
    getProgressForBread,
    getRemainingForBread,
    getCouponsForBread,
    addCrushedBread,
    addReferralCoupons,
    showReferralCouponAlert,
    useCoupon,
    dismissAlert,
  };
}
