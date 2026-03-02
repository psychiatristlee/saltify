import { Capacitor } from '@capacitor/core';

let _isTossApp: boolean | null = null;

/**
 * Returns true if the app is running inside the Toss app WebView (Apps in Toss)
 */
export function isTossApp(): boolean {
  if (_isTossApp !== null) return _isTossApp;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getOperationalEnvironment } = require('@apps-in-toss/web-framework');
    const env = getOperationalEnvironment();
    _isTossApp = env === 'toss' || env === 'sandbox';
  } catch {
    const ua = navigator.userAgent.toLowerCase();
    _isTossApp = ua.includes('tossapp');
  }
  return _isTossApp;
}

/**
 * Returns true if the app is running as a native mobile app (iOS or Android)
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns true if embedded in a native app or Toss WebView (not a standalone browser)
 */
export function isEmbeddedApp(): boolean {
  return isNativeApp() || isTossApp();
}

/**
 * Returns the current platform: 'ios', 'android', 'web', or 'toss'
 */
export function getPlatform(): 'ios' | 'android' | 'web' | 'toss' {
  if (isTossApp()) return 'toss';
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

const APP_STORE_URL = 'https://apps.apple.com/us/app/%EC%86%94%ED%8A%B8%EB%B9%B5/id6758907825';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.saltbbang';

/**
 * Returns true if the device is running Android
 */
export function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/**
 * Returns true if the device is running iOS
 */
export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Returns the appropriate app store URL for the current platform
 */
export function getStoreUrl(): string {
  return isAndroid() ? PLAY_STORE_URL : APP_STORE_URL;
}

/**
 * Detects if running in an in-app browser that blocks Google OAuth
 * (KakaoTalk, Instagram, Facebook, LINE, etc.)
 */
export function isRestrictedWebview(): boolean {
  // Our own native app's WebView is not restricted
  if (isNativeApp()) return false;
  // Toss WebView is not restricted
  if (isTossApp()) return false;

  const ua = navigator.userAgent.toLowerCase();

  // Check for common in-app browser indicators
  const isRestricted = (
    ua.includes('kakaotalk') ||
    ua.includes('instagram') ||
    ua.includes('fbav') || // Facebook App Android
    ua.includes('fban') || // Facebook App iOS
    ua.includes('fb_iab') || // Facebook In-App Browser
    ua.includes('fbios') || // Facebook iOS
    ua.includes('line') ||
    ua.includes('naver') ||
    ua.includes('twitter') ||
    // Generic in-app browser detection
    ua.includes('wv') || // Android WebView
    (ua.includes('iphone') && !ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios')) // iOS webview (no Safari, Chrome, Firefox)
  );

  return isRestricted;
}

/**
 * Get the name of the restricted webview for display
 */
export function getRestrictedWebviewName(): string | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('kakaotalk')) return '카카오톡';
  if (ua.includes('instagram')) return '인스타그램';
  if (ua.includes('fbav') || ua.includes('fban') || ua.includes('fb_iab') || ua.includes('fbios')) return '페이스북';
  if (ua.includes('line')) return 'LINE';
  if (ua.includes('naver')) return '네이버';
  if (ua.includes('twitter')) return '트위터';
  // Generic webview detection
  if (ua.includes('wv')) return '앱 내 브라우저';
  if (ua.includes('iphone') && !ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios')) return '앱 내 브라우저';
  return null;
}

/**
 * Open URL in external browser (escaping from in-app webview)
 * Returns true if a known method was used, false if manual action is needed
 */
export function openInExternalBrowser(url: string): boolean {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('kakaotalk')) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    return true;
  }

  if (ua.includes('line')) {
    window.location.href = `${url}?openExternalBrowser=1`;
    return true;
  }

  if (ua.includes('naver') && ua.includes('android')) {
    // Naver app on Android - try intent scheme
    window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    return true;
  }

  // Instagram/Facebook in-app browser doesn't have a direct external browser scheme
  // User needs to manually open in external browser
  if (ua.includes('instagram') || ua.includes('fbav') || ua.includes('fban') || ua.includes('fb_iab') || ua.includes('fbios')) {
    return false;
  }

  // Twitter/X in-app browser - also needs manual action
  if (ua.includes('twitter')) {
    return false;
  }

  // Naver iOS - no reliable external browser scheme
  if (ua.includes('naver') && !ua.includes('android')) {
    return false;
  }

  // Generic fallback - try to open in new tab/window
  // This often fails in webviews, so return false to show the copy dialog
  const newWindow = window.open(url, '_blank');
  // If popup was blocked or we're in a restricted environment
  if (!newWindow || newWindow.closed) {
    return false;
  }
  return true;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
