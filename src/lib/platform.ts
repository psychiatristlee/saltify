import { Capacitor } from '@capacitor/core';

/**
 * Returns true if the app is running as a native mobile app (iOS or Android)
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Returns the current platform: 'ios', 'android', or 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Detects if running in an in-app browser that blocks Google OAuth
 * (KakaoTalk, Instagram, Facebook, LINE, etc.)
 */
export function isRestrictedWebview(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('kakaotalk') ||
    ua.includes('instagram') ||
    ua.includes('fbav') || // Facebook App
    ua.includes('fban') || // Facebook App
    ua.includes('line') ||
    ua.includes('naver') ||
    ua.includes('twitter')
  );
}

/**
 * Get the name of the restricted webview for display
 */
export function getRestrictedWebviewName(): string | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('kakaotalk')) return '카카오톡';
  if (ua.includes('instagram')) return '인스타그램';
  if (ua.includes('fbav') || ua.includes('fban')) return '페이스북';
  if (ua.includes('line')) return 'LINE';
  if (ua.includes('naver')) return '네이버';
  if (ua.includes('twitter')) return '트위터';
  return null;
}

/**
 * Open URL in external browser (escaping from in-app webview)
 */
export function openInExternalBrowser(url: string): void {
  // For KakaoTalk: use kakaotalk://web/openExternal?url=
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('kakaotalk')) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
  } else if (ua.includes('line')) {
    window.location.href = `${url}?openExternalBrowser=1`;
  } else {
    // Generic fallback - try to open in new tab/window
    window.open(url, '_system');
  }
}
