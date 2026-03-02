import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { t, getDefaultLanguage } from '../../lib/i18n';
import { isTossApp } from '../../lib/platform';

const REFERRALS_COLLECTION = 'referrals';

export interface ReferralInfo {
  referrerId: string;
  referredUsers: string[];
  createdAt: Date;
}

// Generate referral link for a user
export function generateReferralLink(userId: string): string {
  if (isTossApp()) {
    return `intoss://salt-bbang?ref=${userId}`;
  }
  const baseUrl = 'https://salt-bbang.com';
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

// Process referral securely via Cloud Function
export async function processReferral(
  _newUserId: string, // Not used - server uses auth.uid
  referrerId: string
): Promise<{ success: boolean; message: string; isExistingUser?: boolean }> {
  try {
    const processReferralSecure = httpsCallable<
      { referrerId: string },
      { success: boolean; message: string; isExistingUser: boolean }
    >(functions, 'processReferralSecure');

    const result = await processReferralSecure({ referrerId });
    return result.data;
  } catch (error) {
    console.error('Referral processing error:', error);
    return { success: false, message: t('referralProcessError', getDefaultLanguage()) };
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
