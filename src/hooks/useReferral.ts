import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateReferralLink,
  getReferrerFromUrl,
  clearReferralFromUrl,
  processReferral,
  getReferralStats,
} from '../services/referral';
import { t, getDefaultLanguage } from '../lib/i18n';
import { trackReferralCopy, trackReferralShare } from '../services/analytics';

interface ReferralState {
  referralLink: string | null;
  referredCount: number;
  pendingReferrerId: string | null;
  isProcessing: boolean;
}

export function useReferral(userId: string | null) {
  const [state, setState] = useState<ReferralState>({
    referralLink: null,
    referredCount: 0,
    pendingReferrerId: null,
    isProcessing: false,
  });
  const initialized = useRef(false);
  const processedRef = useRef(false);

  // Check for referral code in URL on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const referrerId = getReferrerFromUrl();
    if (referrerId) {
      setState((prev) => ({ ...prev, pendingReferrerId: referrerId }));
    }
  }, []);

  // Generate referral link when user is logged in
  useEffect(() => {
    if (userId) {
      const link = generateReferralLink(userId);
      setState((prev) => ({ ...prev, referralLink: link }));

      // Load referral stats
      getReferralStats(userId).then((stats) => {
        setState((prev) => ({ ...prev, referredCount: stats.referredCount }));
      });
    }
  }, [userId]);

  // Process pending referral after user signs up
  const processPendingReferral = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!userId || !state.pendingReferrerId || processedRef.current) {
      return { success: false, message: '' };
    }

    processedRef.current = true;
    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const result = await processReferral(userId, state.pendingReferrerId);

      if (result.success) {
        clearReferralFromUrl();
        setState((prev) => ({
          ...prev,
          pendingReferrerId: null,
          isProcessing: false,
        }));
      } else {
        setState((prev) => ({ ...prev, isProcessing: false }));
        processedRef.current = false;
      }

      return result;
    } catch (error) {
      setState((prev) => ({ ...prev, isProcessing: false }));
      processedRef.current = false;
      return { success: false, message: t('errorOccurred', getDefaultLanguage()) };
    }
  }, [userId, state.pendingReferrerId]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    if (!state.referralLink) return false;

    try {
      await navigator.clipboard.writeText(state.referralLink);
      trackReferralCopy();
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }, [state.referralLink]);

  // Share referral link
  const shareReferralLink = useCallback(async (): Promise<boolean> => {
    if (!state.referralLink) return false;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('shareTitle', getDefaultLanguage()),
          text: t('shareText', getDefaultLanguage()),
          url: state.referralLink,
        });
        trackReferralShare();
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    } else {
      return copyReferralLink();
    }
  }, [state.referralLink, copyReferralLink]);

  return {
    ...state,
    processPendingReferral,
    copyReferralLink,
    shareReferralLink,
    hasPendingReferral: !!state.pendingReferrerId,
  };
}
