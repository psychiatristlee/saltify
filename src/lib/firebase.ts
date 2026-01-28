import { initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

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
export const auth = getAuth(app);

// Set persistence to indexedDB to avoid sessionStorage issues
setPersistence(auth, indexedDBLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics, logEvent };
export default app;
