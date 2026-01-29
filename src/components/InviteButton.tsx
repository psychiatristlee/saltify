import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import styles from './InviteButton.module.css';

interface Props {
  referralLink: string | null;
  referredCount: number;
  onCopy: () => Promise<boolean>;
  onShare: () => Promise<boolean>;
}

export default function InviteButton({
  referralLink,
  referredCount,
  onCopy,
  onShare,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await onShare();
  };

  if (!referralLink) return null;

  return (
    <>
      <button className={styles.inviteButton} onClick={() => setShowModal(true)}>
        👥 {t('inviteFriend')}
      </button>

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              ✕
            </button>

            <div className={styles.icon}>🎁</div>
            <h3 className={styles.title}>{t('inviteTitle')}</h3>
            <p className={styles.description}>{t('inviteDesc')}</p>

            <div className={styles.linkBox}>
              <input
                type="text"
                value={referralLink}
                readOnly
                className={styles.linkInput}
              />
              <button className={styles.copyButton} onClick={handleCopy}>
                {copied ? t('copied') : t('copy')}
              </button>
            </div>

            <button className={styles.shareButton} onClick={handleShare}>
              📤 {t('share')}
            </button>

            {referredCount > 0 && (
              <div className={styles.stats}>
                <span className={styles.statsIcon}>👥</span>
                <span>{t('invitedFriends')}: {referredCount}{t('people')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
