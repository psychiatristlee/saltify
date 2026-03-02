import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { Capacitor } from '@capacitor/core';
import { isTossApp } from './platform';

const firebaseConfig = {
  apiKey: "AIzaSyAq5RwfKdw9USo4DVvpghmM_Vh_qwm0szc",
  authDomain: "saltify-game.firebaseapp.com",
  projectId: "saltify-game",
  storageBucket: "saltify-game.firebasestorage.app",
  messagingSenderId: "586425648216",
  appId: "1:586425648216:web:24ff720492615ed90af62d",
  measurementId: "G-NM6V696P1L"
};

const app = initializeApp(firebaseConfig);

const isNative = Capacitor.isNativePlatform();
const isToss = isTossApp();

// App Check with reCAPTCHA v3 (web only - doesn't work in native WebView or Toss WebView)
if (typeof window !== 'undefined' && !isNative && !isToss) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lc7F1ksAAAAAE6SsCE2B8Zf9fn9N6jh-C5swoci'),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize auth with proper persistence from the start
// Native/Toss: browserLocalPersistence (localStorage works, indexedDB may hang)
// Web: indexedDBLocalPersistence for best persistence
export const auth = (isNative || isToss)
  ? initializeAuth(app, { persistence: [browserLocalPersistence, inMemoryPersistence] })
  : getAuth(app);

export const db = getFirestore(app);
export const functions = getFunctions(app);

// Analytics (web and Toss WebView - native doesn't support web analytics)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && !isNative) {
  analytics = getAnalytics(app);
}

export { analytics, logEvent };
export default app;
