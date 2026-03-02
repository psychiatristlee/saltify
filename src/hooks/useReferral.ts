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
import { isTossApp, isNativeApp } from '../lib/platform';

interface ReferralState {
  referralLink: string | null;
  referredCount: number;
  pendingReferrerId: string | null;
  isProcessing: boolean;
  existingUserConnected: boolean; // True if existing user was connected as friend
}

export function useReferral(userId: string | null) {
  const [state, setState] = useState<ReferralState>({
    referralLink: null,
    referredCount: 0,
    pendingReferrerId: null,
    isProcessing: false,
    existingUserConnected: false,
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
    isExistingUser?: boolean;
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
          existingUserConnected: false,
        }));
      } else if (result.isExistingUser) {
        // Existing user connected as friend - mark as success for UI purposes
        clearReferralFromUrl();
        setState((prev) => ({
          ...prev,
          pendingReferrerId: null,
          isProcessing: false,
          existingUserConnected: true,
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

  // Share referral link using native share sheet
  const shareReferralLink = useCallback(async (): Promise<boolean> => {
    if (!state.referralLink) return false;

    // Use Toss share SDK when running in Toss
    if (isTossApp()) {
      try {
        const { share, getTossShareLink } = await import('@apps-in-toss/web-framework');
        const tossLink = await getTossShareLink(state.referralLink);
        await share({ message: `${t('shareText', getDefaultLanguage())} ${tossLink}` });
        trackReferralShare();
        return true;
      } catch (error) {
        console.error('Toss share failed:', error);
        return false;
      }
    }

    // Use Capacitor Share plugin on native apps
    if (isNativeApp()) {
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: t('shareTitle', getDefaultLanguage()),
          text: t('shareText', getDefaultLanguage()),
          url: state.referralLink,
          dialogTitle: t('inviteTitle', getDefaultLanguage()),
        });
        trackReferralShare();
        return true;
      } catch (error) {
        console.error('Native share failed:', error);
        return false;
      }
    }

    // Use Web Share API on supported browsers
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
    }

    // Fallback: copy to clipboard
    return copyReferralLink();
  }, [state.referralLink, copyReferralLink]);

  // Reset existing user connected state
  const resetExistingUserConnected = useCallback(() => {
    setState((prev) => ({ ...prev, existingUserConnected: false }));
  }, []);

  return {
    ...state,
    processPendingReferral,
    copyReferralLink,
    shareReferralLink,
    hasPendingReferral: !!state.pendingReferrerId,
    resetExistingUserConnected,
  };
}
