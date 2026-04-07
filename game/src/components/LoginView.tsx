import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isRestrictedWebview, isNativeApp, isTossApp, getStoreUrl } from '../lib/platform';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './LoginView.module.css';

interface Props {
  onBackToLanding: () => void;
}

export default function LoginView({ onBackToLanding }: Props) {
  const { signInWithGoogle, signInWithKakao, signInWithApple, isLoading, error } = useAuth();
  const { t } = useLanguage();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const isToss = isTossApp();

  const isInWebview = isRestrictedWebview();

  // In restricted webviews, redirect to app store
  useEffect(() => {
    if (isInWebview) {
      window.location.href = getStoreUrl();
    }
  }, [isInWebview]);

  const handleGoogleLogin = async () => {
    if (isRestrictedWebview()) {
      window.location.href = getStoreUrl();
      return;
    }

    try {
      await signInWithGoogle();
    } catch {
      // error is shown via useAuth error state
    }
  };

  const handleKakaoLogin = async () => {
    if (isRestrictedWebview()) {
      window.location.href = getStoreUrl();
      return;
    }

    try {
      await signInWithKakao();
    } catch {
      // error is shown via useAuth error state
    }
  };

  const handleTossLogin = async () => {
    try {
      await signInWithGoogle(); // Delegates to signInWithToss internally
    } catch {
      // error is shown via useAuth error state
    }
  };

  const handleAppleLogin = async () => {
    if (isRestrictedWebview()) {
      window.location.href = getStoreUrl();
      return;
    }

    try {
      await signInWithApple();
    } catch {
      // error is shown via useAuth error state
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img
          src="/brandings/header.png"
          alt={t('storeName')}
          className={styles.headerImage}
          onClick={onBackToLanding}
        />
      </header>
      <div className={styles.content}>
        <img
          src="/breads/plain.png"
          alt={t('storeName')}
          className={styles.logo}
        />
        <h1 className={styles.title}>{t('loginTitle')}</h1>
        <p className={styles.subtitle}>{t('loginSubtitle')}</p>

        {isToss ? (
          <>
            <div className={styles.termsCheckboxes}>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className={styles.termsCheckbox}
                />
                <span>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>이용약관</a>에 동의합니다 (필수)
                </span>
              </label>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className={styles.termsCheckbox}
                />
                <span>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>개인정보 처리방침</a>에 동의합니다 (필수)
                </span>
              </label>
              <label className={styles.termsLabel}>
                <input
                  type="checkbox"
                  checked={termsAgreed && privacyAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked);
                    setPrivacyAgreed(e.target.checked);
                  }}
                  className={styles.termsCheckbox}
                />
                <span className={styles.termsAllAgree}>전체 동의</span>
              </label>
            </div>
            <button
              className={styles.kakaoButton}
              onClick={handleTossLogin}
              disabled={isLoading || !termsAgreed || !privacyAgreed}
              style={{ background: '#0064FF', color: '#fff' }}
            >
              {isLoading ? t('loggingIn') : '토스로 시작하기'}
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.googleButton}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className={styles.googleIcon} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? t('loggingIn') : t('loginWithGoogle')}
            </button>

            <button
              className={styles.kakaoButton}
              onClick={handleKakaoLogin}
              disabled={isLoading}
            >
              <svg className={styles.kakaoIcon} viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M12 3C6.477 3 2 6.463 2 10.691c0 2.687 1.79 5.049 4.478 6.377-.197.732-.715 2.654-.819 3.065-.129.512.188.506.395.368.163-.109 2.593-1.76 3.644-2.475.753.111 1.527.169 2.302.169 5.523 0 10-3.463 10-7.504C22 6.463 17.523 3 12 3z"
                />
              </svg>
              {isLoading ? t('loggingIn') : t('loginWithKakao')}
            </button>

            {isNativeApp() && (
              <button
                className={styles.appleButton}
                onClick={handleAppleLogin}
                disabled={isLoading}
              >
                <svg className={styles.appleIcon} viewBox="0 0 24 24">
                  <path
                    fill="#FFFFFF"
                    d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                  />
                </svg>
                {isLoading ? t('loggingIn') : t('loginWithApple')}
              </button>
            )}
          </>
        )}

        {error && <p className={styles.error} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12 }}>{error}</p>}

        <p className={styles.notice}>{t('loginNotice')}</p>
      </div>

    </div>
  );
}
