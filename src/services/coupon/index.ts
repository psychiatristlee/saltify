import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BreadType } from '../../models/BreadType';

const COUPONS_COLLECTION = 'coupons';

// Coupon expires 2 weeks after creation
const COUPON_VALIDITY_DAYS = 14;

export interface FirestoreCoupon {
  id: string;
  userId: string;
  type: 'one-plus-one';
  breadType: BreadType;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  source: 'game' | 'referral';
}

// Create a coupon for a user in Firestore
export async function createCouponForUser(
  userId: string,
  breadType: BreadType,
  source: 'game' | 'referral'
): Promise<FirestoreCoupon> {
  const couponId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  const coupon: FirestoreCoupon = {
    id: couponId,
    userId,
    type: 'one-plus-one',
    breadType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    source,
  };

  await setDoc(doc(db, COUPONS_COLLECTION, couponId), {
    ...coupon,
    serverCreatedAt: serverTimestamp(),
  });

  return coupon;
}

// Calculate expiresAt for legacy coupons that don't have it
function getExpiresAt(createdAt: string, expiresAt?: string): string {
  if (expiresAt) return expiresAt;
  // For legacy coupons, calculate from createdAt
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  return expires.toISOString();
}

// Load all coupons for a user
export async function loadUserCoupons(userId: string): Promise<FirestoreCoupon[]> {
  const q = query(
    collection(db, COUPONS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const coupons: FirestoreCoupon[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    coupons.push({
      id: data.id,
      userId: data.userId,
      type: data.type,
      breadType: data.breadType,
      createdAt: data.createdAt,
      expiresAt: getExpiresAt(data.createdAt, data.expiresAt),
      isUsed: data.isUsed,
      source: data.source,
    });
  });

  return coupons;
}

// Subscribe to coupon changes for a user (real-time updates)
export function subscribeToCoupons(
  userId: string,
  onCouponsChange: (coupons: FirestoreCoupon[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COUPONS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const coupons: FirestoreCoupon[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      coupons.push({
        id: data.id,
        userId: data.userId,
        type: data.type,
        breadType: data.breadType,
        createdAt: data.createdAt,
        expiresAt: getExpiresAt(data.createdAt, data.expiresAt),
        isUsed: data.isUsed,
        source: data.source,
      });
    });
    onCouponsChange(coupons);
  });
}

// Mark a coupon as used with branch information
export async function useCouponInFirestore(
  couponId: string,
  branchId?: string,
  branchName?: string
): Promise<boolean> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, couponId);
    await updateDoc(couponRef, {
      isUsed: true,
      usedAt: serverTimestamp(),
      ...(branchId && { usedAtBranchId: branchId }),
      ...(branchName && { usedAtBranchName: branchName }),
    });
    return true;
  } catch (error) {
    console.error('Error using coupon:', error);
    return false;
  }
}

// Check if user has used a coupon today
export async function hasUsedCouponToday(userId: string): Promise<boolean> {
  const q = query(
    collection(db, COUPONS_COLLECTION),
    where('userId', '==', userId),
    where('isUsed', '==', true)
  );

  const snapshot = await getDocs(q);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let usedToday = false;
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.usedAt) {
      const usedDate = data.usedAt.toDate ? data.usedAt.toDate() : new Date(data.usedAt);
      usedDate.setHours(0, 0, 0, 0);
      if (usedDate.getTime() === today.getTime()) {
        usedToday = true;
      }
    }
  });

  return usedToday;
}

// Create referral coupons for both users
export async function createReferralCoupons(
  referrerId: string,
  referredUserId: string
): Promise<{ referrerCoupon: FirestoreCoupon; referredCoupon: FirestoreCoupon }> {
  // Create coupon for referrer (Plain 1+1)
  const referrerCoupon = await createCouponForUser(
    referrerId,
    BreadType.Plain,
    'referral'
  );

  // Create coupon for referred user (Plain 1+1)
  const referredCoupon = await createCouponForUser(
    referredUserId,
    BreadType.Plain,
    'referral'
  );

  return { referrerCoupon, referredCoupon };
}
