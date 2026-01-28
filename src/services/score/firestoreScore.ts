import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GameRecord, UserStats, LeaderboardEntry, ScoreService } from './types';

const GAMES_COLLECTION = 'games';
const USERS_COLLECTION = 'users';

export const firestoreScoreService: ScoreService = {
  async saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
      ...record,
      timestamp: serverTimestamp(),
    });

    // Update user stats
    await updateUserStats(record.userId, record.score, record.level, record.saltBreadCrushed);

    return docRef.id;
  },

  async getUserStats(userId: string): Promise<UserStats | null> {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();
    return {
      highScore: data.highScore || 0,
      highLevel: data.highLevel || 0,
      totalGamesPlayed: data.totalGamesPlayed || 0,
      totalSaltBreadCrushed: data.totalSaltBreadCrushed || 0,
      lastPlayedAt: data.lastPlayedAt?.toDate() || new Date(),
    };
  },

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy('highScore', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      entries.push({
        rank: index + 1,
        userId: doc.id,
        displayName: data.displayName || 'Unknown',
        photoURL: data.photoURL || null,
        highScore: data.highScore || 0,
        highLevel: data.highLevel || 0,
      });
    });

    return entries;
  },

  async getUserGameHistory(userId: string, limit = 20): Promise<GameRecord[]> {
    const q = query(
      collection(db, GAMES_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        score: data.score,
        level: data.level,
        saltBreadCrushed: data.saltBreadCrushed,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
      };
    });
  },
};

async function updateUserStats(
  userId: string,
  score: number,
  level: number,
  saltBreadCrushed: number
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    await setDoc(
      userRef,
      {
        highScore: Math.max(data.highScore || 0, score),
        highLevel: Math.max(data.highLevel || 0, level),
        totalGamesPlayed: (data.totalGamesPlayed || 0) + 1,
        totalSaltBreadCrushed: (data.totalSaltBreadCrushed || 0) + saltBreadCrushed,
        lastPlayedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await setDoc(userRef, {
      highScore: score,
      highLevel: level,
      totalGamesPlayed: 1,
      totalSaltBreadCrushed: saltBreadCrushed,
      lastPlayedAt: serverTimestamp(),
    });
  }
}

// Helper function to initialize/update user profile from auth
export async function syncUserProfile(user: {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: string;
}): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(
    userRef,
    {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      provider: user.provider,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Delete all user data from Firestore
export async function deleteUserData(userId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete user document
  batch.delete(doc(db, USERS_COLLECTION, userId));

  // Delete referral document
  batch.delete(doc(db, 'referrals', userId));

  // Commit the batch
  await batch.commit();

  // Delete coupons (need to query first)
  const couponsQuery = query(
    collection(db, 'coupons'),
    where('userId', '==', userId)
  );
  const couponsSnapshot = await getDocs(couponsQuery);
  const couponBatch = writeBatch(db);
  couponsSnapshot.forEach((couponDoc) => {
    couponBatch.delete(couponDoc.ref);
  });
  if (!couponsSnapshot.empty) {
    await couponBatch.commit();
  }

  // Delete game records
  const gamesQuery = query(
    collection(db, GAMES_COLLECTION),
    where('userId', '==', userId)
  );
  const gamesSnapshot = await getDocs(gamesQuery);
  const gamesBatch = writeBatch(db);
  gamesSnapshot.forEach((gameDoc) => {
    gamesBatch.delete(gameDoc.ref);
  });
  if (!gamesSnapshot.empty) {
    await gamesBatch.commit();
  }
}
