import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '../services/auth';
import { syncUserProfile, deleteUserData } from '../services/score';
import { t, getDefaultLanguage } from '../lib/i18n';
import { trackLogin, trackLogout, trackAccountDelete } from '../services/analytics';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Format error message with technical details for debugging
function formatErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return `${fallback} [${String(error)}]`;
  const code = (error as { code?: string }).code;
  const parts = [fallback];
  if (code) parts.push(`[${code}]`);
  parts.push(error.message);
  return parts.join('\n');
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

    // Timeout fallback: if auth never resolves in native app, stop loading after 5s
    const timeout = setTimeout(() => {
      setState(prev => {
        if (prev.isLoading) return { ...prev, isLoading: false };
        return prev;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signInWithGoogle();
      setState({ user, isLoading: false, error: null });
      trackLogin('google');
      return user;
    } catch (error) {
      const message = formatErrorMessage(error, t('loginFailed', getDefaultLanguage()));
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithKakao = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signInWithKakao();
      setState({ user, isLoading: false, error: null });
      trackLogin('kakao');
      return user;
    } catch (error) {
      const message = formatErrorMessage(error, t('kakaoLoginFailed', getDefaultLanguage()));
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.signInWithApple();
      setState({ user, isLoading: false, error: null });
      trackLogin('apple');
      return user;
    } catch (error) {
      const message = formatErrorMessage(error, t('loginFailed', getDefaultLanguage()));
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.signOut();
      trackLogout();
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
      trackAccountDelete();
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
    signInWithApple,
    signOut,
    deleteAccount,
  };
}
