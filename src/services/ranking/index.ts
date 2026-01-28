import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BreadType } from '../../models/BreadType';

const COUPONS_COLLECTION = 'coupons';
const USERS_COLLECTION = 'users';

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

export async function fetchRankings(): Promise<UserRanking[]> {
  // Fetch all coupons
  const couponsSnapshot = await getDocs(collection(db, COUPONS_COLLECTION));

  // Aggregate by user
  const userStats: Map<string, {
    totalIssued: number;
    totalUsed: number;
    breadCounts: Map<BreadType, number>;
  }> = new Map();

  couponsSnapshot.forEach((doc) => {
    const data = doc.data();
    const userId = data.userId as string;
    const breadType = data.breadType as BreadType;
    const isUsed = data.isUsed as boolean;

    if (!userStats.has(userId)) {
      userStats.set(userId, {
        totalIssued: 0,
        totalUsed: 0,
        breadCounts: new Map(),
      });
    }

    const stats = userStats.get(userId)!;
    stats.totalIssued++;
    if (isUsed) {
      stats.totalUsed++;
    }
    stats.breadCounts.set(breadType, (stats.breadCounts.get(breadType) || 0) + 1);
  });

  // Fetch user info
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  const userInfo: Map<string, { displayName: string; photoURL: string | null }> = new Map();

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    userInfo.set(doc.id, {
      displayName: data.displayName || '익명',
      photoURL: data.photoURL || null,
    });
  });

  // Convert to array and sort
  const rankings: UserRanking[] = [];

  userStats.forEach((stats, userId) => {
    const info = userInfo.get(userId) || { displayName: '익명', photoURL: null };

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
      userId,
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

  // Assign ranks based on totalIssued
  rankings.forEach((user, index) => {
    user.rank = index + 1;
  });

  return rankings;
}
