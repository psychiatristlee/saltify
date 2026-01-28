import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { AuthService, User } from './types';

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
    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);
    if (!user) throw new Error('Failed to sign in');
    return user;
  },

  async signInWithKakao() {
    const provider = new OAuthProvider('oidc.kakao');
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
