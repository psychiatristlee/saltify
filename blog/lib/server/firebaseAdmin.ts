import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }
  // App Hosting / Cloud Run uses Application Default Credentials.
  // The runtime service account has Firestore + Storage access by default.
  // storageBucket must be explicit — App Hosting's auto FIREBASE_CONFIG
  // doesn't always populate it, leading to "Bucket name not specified" at
  // first getStorage().bucket() call.
  adminApp = initializeApp({
    credential: applicationDefault(),
    storageBucket: 'saltify-game.firebasestorage.app',
  });
  return adminApp;
}

export function adminDb(): Firestore {
  return getFirestore(getApp());
}
