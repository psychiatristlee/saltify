import { analytics, logEvent } from '../lib/firebase';

function track(eventName: string, params?: Record<string, string | number | boolean>) {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
}

// Screen views
export function trackScreenView(screenName: string) {
  track('screen_view', { screen_name: screenName });
}

// Auth
export function trackLogin(method: string) {
  track('login', { method });
}

export function trackSignUp(method: string) {
  track('sign_up', { method });
}

export function trackLogout() {
  track('logout');
}

export function trackAccountDelete() {
  track('account_delete');
}

// Game
export function trackGameStart(level: number) {
  track('game_start', { level });
}

export function trackLevelUp(level: number, score: number) {
  track('level_up', { level, score });
}

export function trackGameOver(level: number, score: number, totalPoints: number) {
  track('game_over', { level, score, total_points: totalPoints });
}

// Coupons
export function trackCouponEarned(breadType: string) {
  track('coupon_earned', { bread_type: breadType });
}

export function trackCouponUsed(breadType: string, branch: string) {
  track('coupon_used', { bread_type: breadType, branch });
}

export function trackCouponViewOpen() {
  track('coupon_view_open');
}

// Ranking
export function trackRankingViewOpen() {
  track('ranking_view_open');
}

// Referral
export function trackReferralCopy() {
  track('referral_copy');
}

export function trackReferralShare() {
  track('referral_share');
}

export function trackReferralComplete() {
  track('referral_complete');
}

// Engagement
export function trackInviteBubbleClick() {
  track('invite_bubble_click');
}

export function trackLandingStart() {
  track('landing_start');
}
