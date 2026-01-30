import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BreadType, BREAD_DATA, getAllBreadTypes, randomBreadType } from '../../models/BreadType';

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
  source: 'game' | 'referral' | 'upgrade';
}

// Create a coupon for a user in Firestore
export async function createCouponForUser(
  userId: string,
  breadType: BreadType,
  source: 'game' | 'referral' | 'upgrade',
  validityDays: number = COUPON_VALIDITY_DAYS
): Promise<FirestoreCoupon> {
  const couponId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

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

// Bread points collection
const BREAD_POINTS_COLLECTION = 'breadPoints';
const BREAD_POINTS_LOCAL_KEY = 'breadPoints';

// Merge two bread points records by taking the MAX of each key
function mergeBreadPoints(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...a };
  for (const key of Object.keys(b)) {
    merged[key] = Math.max(merged[key] || 0, b[key]);
  }
  return merged;
}

// Save bread points to Firestore (with localStorage backup)
export async function saveBreadPointsToFirestore(
  userId: string,
  breadPoints: Record<string, number>
): Promise<void> {
  // Save to localStorage first (synchronous, survives tab close)
  try {
    localStorage.setItem(BREAD_POINTS_LOCAL_KEY, JSON.stringify(breadPoints));
  } catch (_) {
    // localStorage might be unavailable (private browsing, quota exceeded)
  }

  try {
    await setDoc(doc(db, BREAD_POINTS_COLLECTION, userId), {
      ...breadPoints,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving bread points to Firestore (saved locally):', error);
  }
}

// Issued coupon info returned from savePointsAndIssueCoupons
export interface IssuedCouponInfo {
  breadType: BreadType;
  count: number;
}

// Save points to Firestore, issue coupons for thresholds crossed, save remainder
// Returns: issued coupons list and the remainder points saved to Firestore
export async function savePointsAndIssueCoupons(
  userId: string,
  localPoints: Record<string, number>
): Promise<{ issuedCoupons: IssuedCouponInfo[]; remainderPoints: Record<string, number> }> {
  const issuedCoupons: IssuedCouponInfo[] = [];

  try {
    // 1. Read current Firestore points
    const docRef = doc(db, BREAD_POINTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    let firestorePoints: Record<string, number> = {};
    if (docSnap.exists()) {
      const data = docSnap.data();
      const { updatedAt, ...points } = data;
      firestorePoints = points as Record<string, number>;
    }

    // 2. Merge local and Firestore points (take MAX of each)
    const mergedPoints: Record<string, number> = { ...firestorePoints };
    for (const key of Object.keys(localPoints)) {
      mergedPoints[key] = Math.max(mergedPoints[key] || 0, localPoints[key] || 0);
    }

    // 3. For each bread type, check how many coupons to issue and compute remainder
    const remainderPoints: Record<string, number> = {};

    for (const breadType of getAllBreadTypes()) {
      const key = String(breadType);
      const totalPoints = mergedPoints[key] || 0;
      const price = BREAD_DATA[breadType].price;
      const couponsToIssue = Math.floor(totalPoints / price);
      const remainder = totalPoints % price;

      remainderPoints[key] = remainder;

      // Compare with previously issued coupons from Firestore
      // firestorePoints already had remainder from last save, so any full price amounts are new
      const prevPoints = firestorePoints[key] || 0;
      const prevCoupons = Math.floor(prevPoints / price);
      const newCoupons = couponsToIssue - prevCoupons;

      if (newCoupons > 0) {
        issuedCoupons.push({ breadType, count: newCoupons });
        // Issue coupons in Firestore
        for (let i = 0; i < newCoupons; i++) {
          await createCouponForUser(userId, breadType, 'game');
        }
      }
    }

    // 4. Save remainder points to Firestore
    await setDoc(doc(db, BREAD_POINTS_COLLECTION, userId), {
      ...remainderPoints,
      updatedAt: serverTimestamp(),
    });

    // 5. Update localStorage with remainder
    try {
      localStorage.setItem(BREAD_POINTS_LOCAL_KEY, JSON.stringify(remainderPoints));
    } catch (_) {}

    return { issuedCoupons, remainderPoints };
  } catch (error) {
    console.error('Error in savePointsAndIssueCoupons:', error);
    // Fallback: save to localStorage at least
    try {
      localStorage.setItem(BREAD_POINTS_LOCAL_KEY, JSON.stringify(localPoints));
    } catch (_) {}
    return { issuedCoupons: [], remainderPoints: localPoints };
  }
}

// Load bread points from Firestore (with localStorage fallback and merge)
export async function loadBreadPointsFromFirestore(
  userId: string
): Promise<Record<string, number> | null> {
  // Read localStorage backup
  let localPoints: Record<string, number> | null = null;
  try {
    const raw = localStorage.getItem(BREAD_POINTS_LOCAL_KEY);
    if (raw) {
      localPoints = JSON.parse(raw) as Record<string, number>;
    }
  } catch (_) {
    // ignore parse errors
  }

  try {
    const docRef = doc(db, BREAD_POINTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    let firestorePoints: Record<string, number> | null = null;
    if (docSnap.exists()) {
      const data = docSnap.data();
      const { updatedAt, ...points } = data;
      firestorePoints = points as Record<string, number>;
    }

    // Merge: take MAX of each bread type from both sources
    if (firestorePoints && localPoints) {
      const merged = mergeBreadPoints(firestorePoints, localPoints);

      // If local had higher values, sync back to Firestore
      const needsSync = Object.keys(merged).some(
        (k) => merged[k] > (firestorePoints![k] || 0)
      );
      if (needsSync) {
        setDoc(doc(db, BREAD_POINTS_COLLECTION, userId), {
          ...merged,
          updatedAt: serverTimestamp(),
        }).catch((err) => console.error('Error syncing merged points:', err));
      }

      // Cache merged result locally
      try {
        localStorage.setItem(BREAD_POINTS_LOCAL_KEY, JSON.stringify(merged));
      } catch (_) {}

      return merged;
    }

    if (firestorePoints) {
      // Cache Firestore data locally
      try {
        localStorage.setItem(BREAD_POINTS_LOCAL_KEY, JSON.stringify(firestorePoints));
      } catch (_) {}
      return firestorePoints;
    }

    return localPoints;
  } catch (error) {
    console.error('Error loading bread points from Firestore:', error);
    // Fallback to localStorage data
    return localPoints;
  }
}

// Upgrade 3 coupons into 1 upgraded coupon (3-month validity, random bread type)
// 50% success rate. On failure, all 3 coupons are destroyed.
const UPGRADE_VALIDITY_DAYS = 90;

export interface UpgradeResult {
  success: boolean;
  newCoupon?: FirestoreCoupon;
}

export async function upgradeCoupons(
  userId: string,
  couponIds: string[]
): Promise<UpgradeResult> {
  if (couponIds.length !== 3) {
    throw new Error('Exactly 3 coupons are required for upgrade');
  }

  // Mark all 3 coupons as used for upgrade
  for (const couponId of couponIds) {
    const couponRef = doc(db, COUPONS_COLLECTION, couponId);
    await updateDoc(couponRef, {
      isUsed: true,
      usedAt: serverTimestamp(),
      usedFor: 'upgrade',
    });
  }

  // 50% success rate
  const success = Math.random() < 0.5;

  if (success) {
    const newBreadType = randomBreadType();
    const newCoupon = await createCouponForUser(
      userId,
      newBreadType,
      'upgrade',
      UPGRADE_VALIDITY_DAYS
    );
    return { success: true, newCoupon };
  }

  return { success: false };
}
