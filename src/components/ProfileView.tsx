import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './ProfileView.module.css';

interface Props {
  userName: string;
  photoURL: string | null;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}

export default function ProfileView({
  userName,
  photoURL,
  onLogout,
  onDeleteAccount,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('profileTitle')}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {/* Profile summary */}
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              {photoURL ? (
                <img src={photoURL} alt="" className={styles.profilePhoto} />
              ) : (
                <div className={styles.profilePhotoPlaceholder}>👤</div>
              )}
            </div>
            <div className={styles.profileName}>{userName}</div>
          </div>

          {/* Game Guide */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎮</span>
              <h3 className={styles.sectionTitle}>{t('guideTitle')}</h3>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.guideCard}>
                <span className={styles.cardEmoji}>👆</span>
                <p className={styles.cardText}>{t('guideSwap')}</p>
              </div>
              <div className={styles.guideCard}>
                <span className={styles.cardEmoji}>💥</span>
                <p className={styles.cardText}>{t('guideCombo')}</p>
              </div>
              <div className={styles.guideCard}>
                <span className={styles.cardEmoji}>🔥</span>
                <p className={styles.cardText}>{t('guideFever')}</p>
              </div>
              <div className={styles.guideCard}>
                <span className={styles.cardEmoji}>🎟️</span>
                <p className={styles.cardText}>{t('guideCoupon')}</p>
              </div>
            </div>
          </section>

          {/* Special Items Guide */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>✨</span>
              <h3 className={styles.sectionTitle}>{t('specialItemsGuide')}</h3>
            </div>
            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <img src="/brandings/cube-matcha-cream.png" alt="" className={styles.specialItemImage} />
                <div className={styles.infoContent}>
                  <div className={styles.infoLabel}>{t('matchaCube')}</div>
                  <div className={styles.infoDesc}>{t('matchaCubeRule')}</div>
                  <div className={styles.infoDesc}>{t('matchaCubeEffect')}</div>
                </div>
              </div>
              <div className={styles.infoCard}>
                <img src="/brandings/cube-choco-cream.png" alt="" className={styles.specialItemImage} />
                <div className={styles.infoContent}>
                  <div className={styles.infoLabel}>{t('chocoCream')}</div>
                  <div className={styles.infoDesc}>{t('chocoCreamRule')}</div>
                  <div className={styles.infoDesc}>{t('chocoCreamEffect')}</div>
                </div>
              </div>
              <div className={styles.infoCard}>
                <img src="/breads/milktea.png" alt="" className={styles.specialItemImage} />
                <div className={styles.infoContent}>
                  <div className={styles.infoLabel}>{t('milkTea')}</div>
                  <div className={styles.infoDesc}>{t('milkTeaRule')}</div>
                  <div className={styles.infoDesc}>{t('milkTeaEffect')}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className={styles.section}>
            <div className={styles.accountButtons}>
              <button className={styles.logoutButton} onClick={onLogout}>
                {t('logout')}
              </button>
              {!showDeleteConfirm ? (
                <button
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
                      className={styles.deleteCancelButton}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      className={styles.deleteConfirmButton}
                      onClick={onDeleteAccount}
                    >
                      {t('deleteConfirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
