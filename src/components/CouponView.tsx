import { useState } from 'react';
import { Coupon, couponDisplayText } from '../models/Coupon';
import styles from './CouponView.module.css';

interface CouponManager {
  coupons: Coupon[];
  points: number;
  totalSaltBreadCrushed: number;
  availableCoupons: Coupon[];
  progressToNextCoupon: number;
  remainingForNextCoupon: number;
  useCoupon: () => boolean;
}

interface Props {
  couponManager: CouponManager;
  onClose: () => void;
}

export default function CouponView({ couponManager, onClose }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [usedMessage, setUsedMessage] = useState('');

  const handleUseCoupon = () => {
    setShowConfirm(true);
  };

  const confirmUse = () => {
    const success = couponManager.useCoupon();
    setShowConfirm(false);
    if (success) {
      setUsedMessage('소금빵 1+1 쿠폰이 사용되었습니다!');
      setTimeout(() => setUsedMessage(''), 2000);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>내 쿠폰</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {/* 통계 */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <img
                src="/breads/salt-bread.png"
                alt="소금빵"
                className={styles.statIconImg}
              />
              <span className={styles.statLabel}>적립 포인트</span>
              <span className={styles.statValue}>{couponManager.points.toLocaleString()}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🎟️</span>
              <span className={styles.statLabel}>1+1 쿠폰</span>
              <span className={styles.statValue}>{couponManager.availableCoupons.length}장</span>
            </div>
          </div>

          {/* 진행도 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>다음 쿠폰까지</h3>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${couponManager.progressToNextCoupon * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {couponManager.remainingForNextCoupon.toLocaleString()} 포인트 더 모으면 1+1 쿠폰 획득!
            </span>
          </div>

          {/* 쿠폰 사용 */}
          {couponManager.availableCoupons.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>쿠폰 사용</h3>
              <button className={styles.useCouponButton} onClick={handleUseCoupon}>
                <span className={styles.useCouponIcon}>🎟️</span>
                <span className={styles.useCouponText}>소금빵 1+1 쿠폰 사용하기</span>
              </button>
            </div>
          )}

          {/* 쿠폰 목록 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>쿠폰 내역</h3>
            {couponManager.coupons.length === 0 ? (
              <p className={styles.emptyText}>아직 쿠폰이 없어요. 소금빵을 크러쉬하세요!</p>
            ) : (
              <div className={styles.couponList}>
                {[...couponManager.coupons].reverse().map((coupon) => (
                  <div
                    key={coupon.id}
                    className={coupon.isUsed ? styles.couponRowUsed : styles.couponRow}
                  >
                    <span className={styles.couponIcon}>{coupon.isUsed ? '🎫' : '🎟️'}</span>
                    <div className={styles.couponInfo}>
                      <span className={coupon.isUsed ? styles.couponTextUsed : styles.couponText}>
                        {couponDisplayText(coupon)}
                      </span>
                      <span className={styles.couponDate}>
                        {new Date(coupon.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <span className={styles.couponStatus}>
                      {coupon.isUsed ? '사용됨' : '사용가능'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 안내 */}
          <div className={styles.infoSection}>
            <p className={styles.infoItem}>• 소금빵 1개 크러쉬 = 1 포인트</p>
            <p className={styles.infoItem}>• 3,000 포인트 = 소금빵 1+1 쿠폰 1장</p>
          </div>
        </div>

        {/* 확인 다이얼로그 */}
        {showConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p>소금빵 1+1 쿠폰을 사용하시겠습니까?</p>
              <div className={styles.confirmButtons}>
                <button onClick={() => setShowConfirm(false)}>취소</button>
                <button className={styles.confirmOk} onClick={confirmUse}>사용하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 사용 완료 메시지 */}
        {usedMessage && (
          <div className={styles.toast}>{usedMessage}</div>
        )}
      </div>
    </div>
  );
}
