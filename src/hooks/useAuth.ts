import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/auth';
import { syncUserProfile, deleteUserData } from '../services/score';
import { t, getDefaultLanguage } from '../lib/i18n';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: authService.getCurrentUser(),
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setState({ user, isLoading: false, error: null });
      // Sync user profile to Firestore when logged in
      if (user) {
        syncUserProfile(user).catch(console.error);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signInWithGoogle();
      setState({ user, isLoading: false, error: null });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('loginFailed', getDefaultLanguage());
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithKakao = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signInWithKakao();
      setState({ user, isLoading: false, error: null });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('kakaoLoginFailed', getDefaultLanguage());
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.signOut();
      setState({ user: null, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('logoutFailed', getDefaultLanguage());
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const currentUser = state.user;
    if (!currentUser) throw new Error(t('loginRequired', getDefaultLanguage()));

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Delete user data from Firestore first
      await deleteUserData(currentUser.id);
      // Then delete the Firebase Auth account
      await authService.deleteAccount();
      // Clear local storage
      localStorage.removeItem('breadPoints');
      localStorage.removeItem('saltify_visited');
      setState({ user: null, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('deleteAccountFailed', getDefaultLanguage());
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [state.user]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    error: state.error,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    deleteAccount,
  };
}
