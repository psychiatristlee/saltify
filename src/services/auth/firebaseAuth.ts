import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { isNativeApp } from '../../lib/platform';
import type { AuthService, User } from './types';

// Handle redirect result on app load (for native apps using redirect flow)
getRedirectResult(auth).catch(console.error);

function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    provider: 'firebase',
  };
}

export const firebaseAuthService: AuthService = {
  getCurrentUser() {
    return mapFirebaseUser(auth.currentUser);
  },

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();

    // Use redirect for native apps (popup is blocked in webviews)
    if (isNativeApp()) {
      await signInWithRedirect(auth, provider);
      // The result will be handled by getRedirectResult on app reload
      // Return a pending user (will be updated by onAuthStateChanged)
      return null as unknown as User;
    }

    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error('Failed to sign in');
    return user;
  },

  async signInWithKakao() {
    const provider = new OAuthProvider('oidc.kakao');

    // Use redirect for native apps (popup is blocked in webviews)
    if (isNativeApp()) {
      await signInWithRedirect(auth, provider);
      return null as unknown as User;
    }

    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error('Failed to sign in with Kakao');
    return user;
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    await deleteUser(user);
  },

  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  },
};
