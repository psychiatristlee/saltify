import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithCustomToken,
  updateProfile,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth, functions } from '../../lib/firebase';
import { isNativeApp, getPlatform } from '../../lib/platform';
import type { AuthService, User } from './types';

function mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL?.replace('http://', 'https://') ?? null,
    provider: 'firebase',
  };
}

export const firebaseAuthService: AuthService = {
  getCurrentUser() {
    return mapFirebaseUser(auth.currentUser);
  },

  async signInWithGoogle() {
    // Native: use Capacitor Firebase Authentication (native Google Sign-In SDK)
    if (isNativeApp()) {
      console.log('[Auth] Starting native Google Sign-In...');
      try {
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('[Auth] Native Google Sign-In result:', JSON.stringify(result));
        const idToken = result.credential?.idToken;
        const accessToken = result.credential?.accessToken;
        if (!idToken) throw new Error('Google Sign-In failed: no ID token');

        console.log('[Auth] Calling signInWithCredential...');
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        const userCredential = await signInWithCredential(auth, credential);
        console.log('[Auth] signInWithCredential done');
        const user = mapFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to sign in');
        return user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Auth] Native Google Sign-In error:', msg);
        throw error;
      }
    }

    // Web: use popup with redirect fallback
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(result.user);
      if (!user) throw new Error('Failed to sign in');
      return user;
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
        // Popup blocked - try redirect as fallback
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, provider);
        return null as unknown as User;
      }
      throw error;
    }
  },

  async signInWithKakao() {
    // Native: use Capacitor Firebase Authentication plugin (opens system browser sheet)
    // OIDC nonce prevents reusing the idToken across SDK instances, so we:
    // 1. Let native Firebase SDK complete the sign-in (skipNativeAuth: false)
    // 2. Get the Firebase ID token from the native user
    // 3. Exchange it for a custom token via Cloud Function
    // 4. Sign in the web SDK with the custom token
    if (isNativeApp()) {
      console.log('[Auth] Starting native Kakao Sign-In...');
      try {
        const nativeResult = await FirebaseAuthentication.signInWithOpenIdConnect({
          providerId: 'oidc.kakao',
          skipNativeAuth: false,
        });
        console.log('[Auth] Native Kakao Sign-In done, getting ID token...');

        // Get Firebase ID token from native SDK user
        const { token: nativeIdToken } = await FirebaseAuthentication.getIdToken();
        console.log('[Auth] Got native ID token, creating custom token...');

        // Exchange for custom token via Cloud Function
        const createCustomTokenFn = httpsCallable<{ idToken: string }, { customToken: string }>(functions, 'createCustomToken');
        const { data } = await createCustomTokenFn({ idToken: nativeIdToken });
        console.log('[Auth] Got custom token, signing in web SDK...');

        // Sign in web SDK
        const userCredential = await signInWithCustomToken(auth, data.customToken);

        // Sync profile from native result (custom token doesn't carry profile data)
        const nativeUser = nativeResult.user;
        if (nativeUser && userCredential.user) {
          const profileUpdate: { displayName?: string; photoURL?: string } = {};
          if (nativeUser.displayName) profileUpdate.displayName = nativeUser.displayName;
          if (nativeUser.photoUrl) profileUpdate.photoURL = nativeUser.photoUrl.replace('http://', 'https://');
          if (Object.keys(profileUpdate).length > 0) {
            await updateProfile(userCredential.user, profileUpdate);
          }
        }

        const user = mapFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to sign in with Kakao');
        return user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Auth] Native Kakao Sign-In error:', msg);
        throw error;
      }
    }

    // Web: use popup with redirect fallback
    const provider = new OAuthProvider('oidc.kakao');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(result.user);
      if (!user) throw new Error('Failed to sign in with Kakao');
      return user;
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, provider);
        return null as unknown as User;
      }
      throw error;
    }
  },

  async signInWithApple() {
    // Android native: use Kakao-like flow (let native SDK handle full OAuth, then exchange token)
    // Android doesn't have native Apple Sign-In SDK, so nonce handling with skipNativeAuth: true
    // can fail. Instead, let native Firebase SDK complete the sign-in and exchange for custom token.
    if (isNativeApp() && getPlatform() === 'android') {
      console.log('[Auth] Starting Android Apple Sign-In (custom token flow)...');
      try {
        const nativeResult = await FirebaseAuthentication.signInWithApple({
          skipNativeAuth: false,
        });
        console.log('[Auth] Android Apple Sign-In done, getting ID token...');

        const { token: nativeIdToken } = await FirebaseAuthentication.getIdToken();
        console.log('[Auth] Got native ID token, creating custom token...');

        const createCustomTokenFn = httpsCallable<{ idToken: string }, { customToken: string }>(functions, 'createCustomToken');
        const { data } = await createCustomTokenFn({ idToken: nativeIdToken });
        console.log('[Auth] Got custom token, signing in web SDK...');

        const userCredential = await signInWithCustomToken(auth, data.customToken);

        // Sync profile from native result
        const nativeUser = nativeResult.user;
        if (nativeUser && userCredential.user) {
          const profileUpdate: { displayName?: string; photoURL?: string } = {};
          if (nativeUser.displayName) profileUpdate.displayName = nativeUser.displayName;
          if (nativeUser.photoUrl) profileUpdate.photoURL = nativeUser.photoUrl.replace('http://', 'https://');
          if (Object.keys(profileUpdate).length > 0) {
            await updateProfile(userCredential.user, profileUpdate);
          }
        }

        const user = mapFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to sign in with Apple');
        return user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Auth] Android Apple Sign-In error:', msg);
        throw error;
      }
    }

    // iOS native: use Capacitor Firebase Authentication (native Apple Sign-In)
    if (isNativeApp()) {
      console.log('[Auth] Starting native Apple Sign-In...');
      try {
        const result = await FirebaseAuthentication.signInWithApple();
        console.log('[Auth] Native Apple Sign-In result:', JSON.stringify(result));
        const idToken = result.credential?.idToken;
        const nonce = result.credential?.nonce;
        if (!idToken) throw new Error('Apple Sign-In failed: no ID token');

        const credential = new OAuthProvider('apple.com').credential({
          idToken,
          rawNonce: nonce,
        });
        const userCredential = await signInWithCredential(auth, credential);
        const user = mapFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to sign in with Apple');
        return user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[Auth] Native Apple Sign-In error:', msg);
        throw error;
      }
    }

    // Web: use popup with redirect fallback
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = mapFirebaseUser(result.user);
      if (!user) throw new Error('Failed to sign in with Apple');
      return user;
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, provider);
        return null as unknown as User;
      }
      throw error;
    }
  },

  async signOut() {
    // Sign out from native provider too
    if (isNativeApp()) {
      await FirebaseAuthentication.signOut();
    }
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
