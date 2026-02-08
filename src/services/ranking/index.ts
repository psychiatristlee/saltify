import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BreadType } from '../../models/BreadType';
import { t, getDefaultLanguage } from '../../lib/i18n';

const COUPONS_COLLECTION = 'coupons';
const USERS_COLLECTION = 'users';
const REFERRALS_COLLECTION = 'referrals';

export interface BreadCouponCount {
  breadType: BreadType;
  count: number;
}

export interface UserRanking {
  rank: number;
  userId: string;
  displayName: string;
  photoURL: string | null;
  totalIssued: number;
  totalUsed: number;
  breadCounts: BreadCouponCount[];
}

// Get the referral network for a user (referrer + referred users + self)
async function getReferralNetwork(userId: string): Promise<Set<string>> {
  const network = new Set<string>();
  network.add(userId); // Include self

  try {
    const referralRef = doc(db, REFERRALS_COLLECTION, userId);
    const referralDoc = await getDoc(referralRef);

    if (referralDoc.exists()) {
      const data = referralDoc.data();

      // Add the user who referred me
      if (data.referredBy) {
        network.add(data.referredBy);
      }

      // Add users I've referred
      if (data.referredUsers && Array.isArray(data.referredUsers)) {
        data.referredUsers.forEach((id: string) => network.add(id));
      }
    }

    // Also check if the current user is in someone else's referredUsers
    // (in case their own referral doc doesn't have referredBy set)
    const allReferralsSnapshot = await getDocs(collection(db, REFERRALS_COLLECTION));
    allReferralsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // If this doc's referredUsers contains current user, add the doc owner (referrer)
      if (data.referredUsers?.includes(userId)) {
        network.add(docSnap.id);
      }
      // If this doc was referred by current user, add them
      if (data.referredBy === userId) {
        network.add(docSnap.id);
      }
    });
  } catch (error) {
    console.error('Error fetching referral network:', error);
  }

  return network;
}

export async function fetchRankings(currentUserId?: string | null): Promise<UserRanking[]> {
  // Get referral network if user is logged in
  let networkFilter: Set<string> | null = null;
  if (currentUserId) {
    networkFilter = await getReferralNetwork(currentUserId);
  }

  // Fetch all coupons
  const couponsSnapshot = await getDocs(collection(db, COUPONS_COLLECTION));

  // Aggregate by user
  const userStats: Map<string, {
    totalIssued: number;
    totalUsed: number;
    breadCounts: Map<BreadType, number>;
  }> = new Map();

  couponsSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const odwnerId = data.userId as string;
    const breadType = data.breadType as BreadType;
    const isUsed = data.isUsed as boolean;
    const usedFor = data.usedFor as string | undefined;

    // Filter by network if logged in
    if (networkFilter && !networkFilter.has(odwnerId)) {
      return; // Skip users not in network
    }

    if (!userStats.has(odwnerId)) {
      userStats.set(odwnerId, {
        totalIssued: 0,
        totalUsed: 0,
        breadCounts: new Map(),
      });
    }

    const stats = userStats.get(odwnerId)!;
    stats.totalIssued++;
    if (isUsed && usedFor !== 'upgrade') {
      stats.totalUsed++;
    }
    stats.breadCounts.set(breadType, (stats.breadCounts.get(breadType) || 0) + 1);
  });

  // Ensure current user is in the list even if they have no coupons
  if (currentUserId && networkFilter && !userStats.has(currentUserId)) {
    userStats.set(currentUserId, {
      totalIssued: 0,
      totalUsed: 0,
      breadCounts: new Map(),
    });
  }

  // Fetch user info
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  const userInfo: Map<string, { displayName: string; photoURL: string | null }> = new Map();

  usersSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    userInfo.set(docSnap.id, {
      displayName: data.displayName || t('anonymous', getDefaultLanguage()),
      photoURL: data.photoURL || null,
    });
  });

  // Convert to array and sort
  const rankings: UserRanking[] = [];

  userStats.forEach((stats, odwnerId) => {
    const info = userInfo.get(odwnerId) || { displayName: t('anonymous', getDefaultLanguage()), photoURL: null };

    // Convert breadCounts map to array
    const breadCounts: BreadCouponCount[] = [];
    stats.breadCounts.forEach((count, breadType) => {
      breadCounts.push({ breadType, count });
    });

    // Sort bread counts by BREAD_DATA order
    const breadOrder = Object.values(BreadType);
    breadCounts.sort((a, b) => breadOrder.indexOf(a.breadType) - breadOrder.indexOf(b.breadType));

    rankings.push({
      rank: 0,
      userId: odwnerId,
      displayName: info.displayName,
      photoURL: info.photoURL,
      totalIssued: stats.totalIssued,
      totalUsed: stats.totalUsed,
      breadCounts,
    });
  });

  // Sort by totalUsed (desc), then totalIssued (desc)
  rankings.sort((a, b) => {
    if (b.totalUsed !== a.totalUsed) {
      return b.totalUsed - a.totalUsed;
    }
    return b.totalIssued - a.totalIssued;
  });

  // Assign ranks
  rankings.forEach((user, index) => {
    user.rank = index + 1;
  });

  return rankings;
}
