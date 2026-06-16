import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import styles from './ProfilePage.module.css';

interface Props {
  userName: string;
  email?: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  totalPoints?: number;
  couponCount?: number;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function ProfilePage({
  userName,
  email,
  photoURL,
  isAdmin,
  totalPoints = 0,
  couponCount = 0,
  onLogout,
  onDeleteAccount,
}: Props) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('profileTitle')}</h1>
      </header>

      <div className={styles.content}>
        {/* Profile summary */}
        <section className={styles.profileCard}>
          <div className={styles.avatar}>
            {photoURL ? (
              <img src={photoURL} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.avatarPh}>👤</span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{userName || '게스트'}</div>
            {email && <div className={styles.profileEmail}>{email}</div>}
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconPoint}`} aria-hidden="true">⭐</div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>적립 포인트</span>
              <strong className={styles.statValue}>{totalPoints.toLocaleString()}P</strong>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statIconCoupon}`} aria-hidden="true">🎟️</div>
            <div className={styles.statBody}>
              <span className={styles.statLabel}>보유 쿠폰</span>
              <strong className={styles.statValue}>{couponCount}장</strong>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>언어 / Language</h3>
          <LanguageSelector />
        </section>

        {/* Links */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>약관 및 정책</h3>
          <a className={styles.linkRow} href="/privacy">
            <span>개인정보 처리방침</span>
            <span className={styles.linkArrow}>›</span>
          </a>
          <a className={styles.linkRow} href="/terms">
            <span>이용약관</span>
            <span className={styles.linkArrow}>›</span>
          </a>
          <a className={styles.linkRow} href="/account-deletion">
            <span>계정 삭제 안내</span>
            <span className={styles.linkArrow}>›</span>
          </a>
        </section>

        {/* Admin */}
        {isAdmin && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>관리자</h3>
            <a
              className={styles.linkRow}
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>📦 관리자 페이지</span>
              <span className={styles.linkArrow}>›</span>
            </a>
            <a
              className={styles.linkRow}
              href="https://salt-bbang.com/admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>✍️ 블로그 작성</span>
              <span className={styles.linkArrow}>›</span>
            </a>
          </section>
        )}

        {/* Account */}
        <section className={styles.section}>
          <button type="button" className={styles.logoutBtn} onClick={onLogout}>
            {t('logout')}
          </button>
          {!showDeleteConfirm ? (
            <button
              type="button"
              className={styles.deleteLink}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('deleteAccount')}
            </button>
          ) : (
            <div className={styles.deleteConfirm}>
              <p className={styles.deleteWarning}>{t('deleteWarning')}</p>
              <div className={styles.deleteButtons}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  {t('cancel')}
                </button>
                <button type="button" className={styles.confirmDeleteBtn} onClick={onDeleteAccount}>
                  {t('deleteConfirm')}
                </button>
              </div>
            </div>
          )}
        </section>

        <p className={styles.version}>솔트빵 v1.0</p>
      </div>
    </div>
  );
}
