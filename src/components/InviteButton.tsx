import { useState } from 'react';
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
        👥 친구 초대
      </button>

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
              ✕
            </button>

            <div className={styles.icon}>🎁</div>
            <h3 className={styles.title}>친구 초대하기</h3>
            <p className={styles.description}>
              친구를 초대하면 나와 친구 모두<br />
              <strong>플레인 1+1 쿠폰</strong>을 받아요!
            </p>

            <div className={styles.linkBox}>
              <input
                type="text"
                value={referralLink}
                readOnly
                className={styles.linkInput}
              />
              <button className={styles.copyButton} onClick={handleCopy}>
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>

            <button className={styles.shareButton} onClick={handleShare}>
              📤 공유하기
            </button>

            {referredCount > 0 && (
              <div className={styles.stats}>
                <span className={styles.statsIcon}>👥</span>
                <span>초대한 친구: {referredCount}명</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
