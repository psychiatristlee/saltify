import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../lib/firebase';
import type { AuthService, User } from './types';

function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || '토스 사용자',
    photoURL: firebaseUser.photoURL,
    provider: 'toss',
  };
}

async function signInWithToss(): Promise<User> {
  // Use getUserKeyForGame for game-category mini apps (simpler, no OAuth setup needed)
  const { getUserKeyForGame } = await import('@apps-in-toss/web-framework');
  const result = await getUserKeyForGame();

  if (!result || result === 'INVALID_CATEGORY' || result === 'ERROR') {
    // Fallback to appLogin for non-game or when getUserKeyForGame fails
    const { appLogin } = await import('@apps-in-toss/web-framework');
    const { authorizationCode, referrer } = await appLogin();

    const exchangeToken = httpsCallable<
      { authorizationCode: string; referrer: string },
      { customToken: string }
    >(functions, 'exchangeTossToken');

    const { data } = await exchangeToken({ authorizationCode, referrer });
    const userCredential = await signInWithCustomToken(auth, data.customToken);
    const user = mapFirebaseUser(userCredential.user);
    if (!user) throw new Error('토스 로그인에 실패했습니다.');
    return user;
  }

  // Use game user hash to create Firebase custom token
  const createToken = httpsCallable<
    { tossUserHash: string },
    { customToken: string }
  >(functions, 'createTossGameToken');

  const { data } = await createToken({ tossUserHash: result.hash });
  const userCredential = await signInWithCustomToken(auth, data.customToken);
  const user = mapFirebaseUser(userCredential.user);
  if (!user) throw new Error('토스 로그인에 실패했습니다.');
  return user;
}

export const tossAuthService: AuthService = {
  getCurrentUser() {
    return mapFirebaseUser(auth.currentUser);
  },

  // In Toss, all auth methods delegate to Toss login
  async signInWithGoogle() {
    return signInWithToss();
  },

  async signInWithKakao() {
    return signInWithToss();
  },

  async signInWithApple() {
    return signInWithToss();
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) throw new Error('로그인이 필요합니다.');
    // Toss users: delete Firebase data via Cloud Function (can't deleteUser for custom-token users)
    const deleteAccountFn = httpsCallable(functions, 'deleteUserAccount');
    await deleteAccountFn();
  },

  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  },
};
