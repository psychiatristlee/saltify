import { useState, useCallback, useEffect, useRef } from 'react';
import { Coupon, isCouponExpired } from '../models/Coupon';
import { BreadType, BREAD_DATA, POINTS_PER_CRUSH, getAllBreadTypes } from '../models/BreadType';
import { t, getDefaultLanguage } from '../lib/i18n';
import { trackCouponEarned } from '../services/analytics';
import {
  subscribeToCoupons,
  useCouponInFirestore,
  createReferralCoupons,
  FirestoreCoupon,
  loadBreadPointsFromFirestore,
  savePointsAndIssueCoupons,
  upgradeCoupons as upgradeCouponsService,
} from '../services/coupon';

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
  upgradeResult: { success: boolean; breadType?: BreadType } | null;
  showUpgradeResult: boolean;
}

export function useCouponManager(userId: string | null = null) {
  const [state, setState] = useState<CouponManagerState>({
    coupons: [],
    breadPoints: createInitialBreadPoints(),
    showCouponAlert: false,
    newCouponMessage: '',
    newCouponBreadType: null,
    upgradeResult: null,
    showUpgradeResult: false,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pointsLoadedRef = useRef(false);
  const breadPointsRef = useRef(state.breadPoints);
  breadPointsRef.current = state.breadPoints;
  const levelEarnedRef = useRef(0);

  // Subscribe to coupons and load points from Firestore when user is logged in
  useEffect(() => {
    if (!userId) {
      // Clear data when logged out
      setState((prev) => ({ ...prev, coupons: [], breadPoints: createInitialBreadPoints() }));
      pointsLoadedRef.current = false;
      return;
    }

    // Load bread points from Firestore
    if (!pointsLoadedRef.current) {
      pointsLoadedRef.current = true;
      loadBreadPointsFromFirestore(userId).then((points) => {
        if (points) {
          // Merge with initial points to ensure all bread types exist
          const mergedPoints = { ...createInitialBreadPoints() };
          getAllBreadTypes().forEach((breadType) => {
            if (points[breadType] !== undefined) {
              mergedPoints[breadType] = points[breadType];
            }
          });
          setState((prev) => ({ ...prev, breadPoints: mergedPoints }));
        }
      });
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

  // Save points to Firestore, issue coupons for thresholds, save remainder
  const savePointsToFirestore = useCallback(async (): Promise<number> => {
    if (!userId) return 0;

    // Use ref to always get latest breadPoints (avoids stale closure)
    const currentPoints = breadPointsRef.current;
    const totalSaved = Object.values(currentPoints).reduce((a, b) => a + b, 0);

    const { issuedCoupons, remainderPoints } = await savePointsAndIssueCoupons(
      userId,
      currentPoints
    );

    // Update local state with remainder points (after coupon deduction)
    const mergedRemainder = { ...createInitialBreadPoints() };
    getAllBreadTypes().forEach((breadType) => {
      const key = String(breadType);
      if (remainderPoints[key] !== undefined) {
        mergedRemainder[breadType] = remainderPoints[key];
      }
    });

    setState((prev) => ({
      ...prev,
      breadPoints: mergedRemainder,
    }));

    // Show coupon alert if any coupons were issued
    if (issuedCoupons.length > 0) {
      const first = issuedCoupons[0];
      issuedCoupons.forEach((c) => trackCouponEarned(String(c.breadType)));
      setState((prev) => ({
        ...prev,
        showCouponAlert: true,
        newCouponMessage: `🎉 ${BREAD_DATA[first.breadType].name}\n${t('congratsCoupon', getDefaultLanguage())}`,
        newCouponBreadType: first.breadType,
      }));
    }

    return totalSaved;
  }, [userId]);

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

  // Add points when breads are crushed (local accumulation only, no coupon issuance)
  const addCrushedBread = useCallback((breadType: BreadType, count: number) => {
    if (!userId) return;

    const pointsToAdd = count * POINTS_PER_CRUSH;
    levelEarnedRef.current += pointsToAdd;

    setState((prev) => ({
      ...prev,
      breadPoints: {
        ...prev.breadPoints,
        [breadType]: prev.breadPoints[breadType] + pointsToAdd,
      },
    }));
  }, [userId]);

  const resetLevelEarned = useCallback(() => {
    levelEarnedRef.current = 0;
  }, []);

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
      newCouponMessage: `${t('referralCouponMessage', getDefaultLanguage())} 🎁`,
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
    setState((prev) => ({ ...prev, showCouponAlert: false, showUpgradeResult: false, upgradeResult: null }));
  }, []);

  // Upgrade 3 coupons into 1 upgraded coupon (3-month validity)
  const attemptUpgrade = useCallback(async (couponIds: string[]): Promise<{ success: boolean; breadType?: BreadType }> => {
    if (!userId) return { success: false };

    try {
      const result = await upgradeCouponsService(userId, couponIds);

      if (result.success && result.newCoupon) {
        setState((prev) => ({
          ...prev,
          upgradeResult: { success: true, breadType: result.newCoupon!.breadType },
          showUpgradeResult: true,
        }));
        return { success: true, breadType: result.newCoupon.breadType };
      } else {
        setState((prev) => ({
          ...prev,
          upgradeResult: { success: false },
          showUpgradeResult: true,
        }));
        return { success: false };
      }
    } catch (error) {
      console.error('Error upgrading coupons:', error);
      return { success: false };
    }
  }, [userId]);

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
    levelEarnedRef,
    resetLevelEarned,
    availableCoupons,
    getProgressForBread,
    getRemainingForBread,
    getCouponsForBread,
    addCrushedBread,
    addReferralCoupons,
    showReferralCouponAlert,
    useCoupon,
    dismissAlert,
    attemptUpgrade,
    savePointsToFirestore,
  };
}
