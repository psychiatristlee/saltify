import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../../lib/firebase';

const BRANCHES_COLLECTION = 'branches';

// Role constants
export const ROLE_ADMIN = 'admin';

// User interface for admin management
export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isAdmin: boolean;
}

// Check if the current user is an admin by checking custom claims
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      return false;
    }

    // Force refresh the token to get the latest custom claims
    const tokenResult = await user.getIdTokenResult(true);
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Search users by email (via Cloud Function)
export async function searchUsersByEmail(emailQuery: string): Promise<UserInfo[]> {
  try {
    const searchUsers = httpsCallable<{ emailQuery: string }, { users: UserInfo[] }>(
      functions,
      'searchUsersByEmail'
    );
    const result = await searchUsers({ emailQuery });
    return result.data.users;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// Get all admin users (via Cloud Function)
export async function getAllAdmins(): Promise<UserInfo[]> {
  try {
    const getAdmins = httpsCallable<object, { admins: UserInfo[] }>(
      functions,
      'getAllAdmins'
    );
    const result = await getAdmins({});
    return result.data.admins.map((admin) => ({ ...admin, isAdmin: true }));
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
}

// Add admin role to a user (via Cloud Function)
export async function addAdminRole(userId: string): Promise<boolean> {
  try {
    const addAdmin = httpsCallable<{ userId: string }, { success: boolean }>(
      functions,
      'addAdminRole'
    );
    const result = await addAdmin({ userId });
    return result.data.success;
  } catch (error) {
    console.error('Error adding admin role:', error);
    return false;
  }
}

// Remove admin role from a user (via Cloud Function)
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    const removeAdmin = httpsCallable<{ userId: string }, { success: boolean }>(
      functions,
      'removeAdminRole'
    );
    const result = await removeAdmin({ userId });
    return result.data.success;
  } catch (error) {
    console.error('Error removing admin role:', error);
    return false;
  }
}

// Branch interface
export interface Branch {
  id: string;
  name: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

// Get all branches
export async function getAllBranches(): Promise<Branch[]> {
  try {
    const branchesRef = collection(db, BRANCHES_COLLECTION);
    const snapshot = await getDocs(branchesRef);
    const branches: Branch[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      branches.push({
        id: doc.id,
        name: data.name,
        password: data.password,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return branches;
  } catch (error) {
    console.error('Error getting branches:', error);
    return [];
  }
}

// Create or update a branch
export async function saveBranch(
  branch: { id?: string; name: string; password: string }
): Promise<Branch> {
  const branchId = branch.id || crypto.randomUUID();
  const branchRef = doc(db, BRANCHES_COLLECTION, branchId);
  const existingDoc = await getDoc(branchRef);

  const now = new Date().toISOString();
  const branchData = {
    name: branch.name,
    password: branch.password,
    updatedAt: serverTimestamp(),
    ...(existingDoc.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(branchRef, branchData, { merge: true });

  return {
    id: branchId,
    name: branch.name,
    password: branch.password,
    createdAt: existingDoc.exists() ? existingDoc.data()?.createdAt : now,
    updatedAt: now,
  };
}

// Delete a branch
export async function deleteBranch(branchId: string): Promise<boolean> {
  try {
    const branchRef = doc(db, BRANCHES_COLLECTION, branchId);
    await deleteDoc(branchRef);
    return true;
  } catch (error) {
    console.error('Error deleting branch:', error);
    return false;
  }
}

// Validate branch password
export async function validateBranchPassword(password: string): Promise<Branch | null> {
  try {
    const branchesRef = collection(db, BRANCHES_COLLECTION);
    const q = query(branchesRef, where('password', '==', password));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      password: data.password,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    console.error('Error validating branch password:', error);
    return null;
  }
}

// Coupon usage statistics by branch
export interface BranchStats {
  branchId: string;
  branchName: string;
  totalUsed: number;
  usageByBreadType: Record<number, number>;
  recentUsages: Array<{
    couponId: string;
    breadType: number;
    usedAt: string;
    userId: string;
  }>;
}

// Get coupon usage statistics
export async function getCouponStatsByBranch(): Promise<BranchStats[]> {
  try {
    // Get all branches first
    const branches = await getAllBranches();
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    // Query coupons that have been used (have branchId)
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('isUsed', '==', true));
    const snapshot = await getDocs(q);

    // Aggregate stats by branch
    const statsMap = new Map<string, BranchStats>();

    // Initialize stats for all branches
    branches.forEach((branch) => {
      statsMap.set(branch.id, {
        branchId: branch.id,
        branchName: branch.name,
        totalUsed: 0,
        usageByBreadType: {},
        recentUsages: [],
      });
    });

    // Add "Unknown" branch for coupons without branchId
    statsMap.set('unknown', {
      branchId: 'unknown',
      branchName: '미지정',
      totalUsed: 0,
      usageByBreadType: {},
      recentUsages: [],
    });

    snapshot.forEach((doc) => {
      const data = doc.data();
      const branchId = data.usedAtBranchId || 'unknown';

      if (!statsMap.has(branchId)) {
        const branch = branchMap.get(branchId);
        statsMap.set(branchId, {
          branchId,
          branchName: branch?.name || '알 수 없음',
          totalUsed: 0,
          usageByBreadType: {},
          recentUsages: [],
        });
      }

      const stats = statsMap.get(branchId)!;
      stats.totalUsed++;

      const breadType = data.breadType;
      stats.usageByBreadType[breadType] = (stats.usageByBreadType[breadType] || 0) + 1;

      stats.recentUsages.push({
        couponId: doc.id,
        breadType: data.breadType,
        usedAt: data.usedAt?.toDate?.()?.toISOString() || data.usedAt || '',
        userId: data.userId,
      });
    });

    // Sort recent usages by date and limit
    statsMap.forEach((stats) => {
      stats.recentUsages.sort((a, b) =>
        new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
      );
      stats.recentUsages = stats.recentUsages.slice(0, 20);
    });

    return Array.from(statsMap.values()).filter((s) => s.totalUsed > 0 || s.branchId !== 'unknown');
  } catch (error) {
    console.error('Error getting coupon stats:', error);
    return [];
  }
}
