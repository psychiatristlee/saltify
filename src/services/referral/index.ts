import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

const REFERRALS_COLLECTION = 'referrals';

export interface ReferralInfo {
  referrerId: string;
  referredUsers: string[];
  createdAt: Date;
}

// Generate referral link for a user
export function generateReferralLink(userId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${userId}`;
}

// Get referrer ID from URL
export function getReferrerFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

// Clear referral param from URL (after processing)
export function clearReferralFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('ref');
  window.history.replaceState({}, '', url.toString());
}

// Process referral when a new user signs up
export async function processReferral(
  newUserId: string,
  referrerId: string
): Promise<{ success: boolean; message: string }> {
  // Don't allow self-referral
  if (newUserId === referrerId) {
    return { success: false, message: '자기 자신을 초대할 수 없습니다.' };
  }

  try {
    // Check if this user was already referred
    const newUserRef = doc(db, REFERRALS_COLLECTION, newUserId);
    const newUserDoc = await getDoc(newUserRef);

    if (newUserDoc.exists() && newUserDoc.data().referredBy) {
      return { success: false, message: '이미 다른 사용자에 의해 초대되었습니다.' };
    }

    // Check if referrer exists (check both users collection and referrals collection)
    const referrerUserRef = doc(db, 'users', referrerId);
    const referrerUserDoc = await getDoc(referrerUserRef);
    const referrerReferralCheckRef = doc(db, REFERRALS_COLLECTION, referrerId);
    const referrerReferralCheckDoc = await getDoc(referrerReferralCheckRef);

    // Referrer is valid if they exist in either collection (they have used the app)
    if (!referrerUserDoc.exists() && !referrerReferralCheckDoc.exists()) {
      // Try to create a minimal referrer entry if the referrer ID looks valid
      if (referrerId.length > 10) {
        // Assume valid referrer - they just haven't been recorded yet
        console.log('Referrer not found in DB, but ID looks valid:', referrerId);
      } else {
        return { success: false, message: '유효하지 않은 초대 코드입니다.' };
      }
    }

    // Mark new user as referred
    await setDoc(newUserRef, {
      referredBy: referrerId,
      referredAt: serverTimestamp(),
    }, { merge: true });

    // Add new user to referrer's list
    const referrerReferralRef = doc(db, REFERRALS_COLLECTION, referrerId);
    const referrerReferralDoc = await getDoc(referrerReferralRef);

    if (referrerReferralDoc.exists()) {
      await updateDoc(referrerReferralRef, {
        referredUsers: arrayUnion(newUserId),
      });
    } else {
      await setDoc(referrerReferralRef, {
        referredUsers: [newUserId],
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, message: '초대가 완료되었습니다!' };
  } catch (error) {
    console.error('Referral processing error:', error);
    return { success: false, message: '초대 처리 중 오류가 발생했습니다.' };
  }
}

// Get referral stats for a user
export async function getReferralStats(userId: string): Promise<{
  referredCount: number;
  referredBy: string | null;
}> {
  try {
    const referralRef = doc(db, REFERRALS_COLLECTION, userId);
    const referralDoc = await getDoc(referralRef);

    if (!referralDoc.exists()) {
      return { referredCount: 0, referredBy: null };
    }

    const data = referralDoc.data();
    return {
      referredCount: data.referredUsers?.length || 0,
      referredBy: data.referredBy || null,
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return { referredCount: 0, referredBy: null };
  }
}
