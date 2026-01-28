import { useState, useRef } from 'react';
import { Coupon, getCouponDisplayInfo, getDaysUntilExpiration, isCouponExpired } from '../models/Coupon';
import { BreadType, getAllBreadTypes, BREAD_DATA } from '../models/BreadType';
import { BreadPoints } from '../hooks/useCouponManager';
import { useNaverMap, openNaverMapPlace } from '../hooks/useNaverMap';
import { validateBranchPassword } from '../services/admin';
import { hasUsedCouponToday } from '../services/coupon';
import styles from './CouponView.module.css';

interface CouponManager {
  coupons: Coupon[];
  breadPoints: BreadPoints;
  totalPoints: number;
  availableCoupons: Coupon[];
  userId: string | null;
  getProgressForBread: (breadType: BreadType) => number;
  getRemainingForBread: (breadType: BreadType) => number;
  getCouponsForBread: (breadType: BreadType) => Coupon[];
  useCoupon: (couponId: string, branchId?: string, branchName?: string) => Promise<boolean>;
}

interface Props {
  couponManager: CouponManager;
  level: number;
  score: number;
  targetScore: number;
  onClose: () => void;
  onDeleteAccount: () => Promise<void>;
}

export default function CouponView({ couponManager, level, score, targetScore, onClose, onDeleteAccount }: Props) {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [usedMessage, setUsedMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [alreadyUsedToday, setAlreadyUsedToday] = useState(false);
  const [isCheckingDaily, setIsCheckingDaily] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useNaverMap(mapRef);

  const handleUseCoupon = async (coupon: Coupon) => {
    if (!couponManager.userId) return;

    setIsCheckingDaily(true);
    const usedToday = await hasUsedCouponToday(couponManager.userId);
    setIsCheckingDaily(false);

    if (usedToday) {
      setAlreadyUsedToday(true);
      return;
    }

    setSelectedCoupon(coupon);
    setPassword('');
    setPasswordError(false);
  };

  const confirmUse = async () => {
    if (!selectedCoupon) return;

    // Validate password against branches
    const branch = await validateBranchPassword(password);
    if (!branch) {
      setPasswordError(true);
      return;
    }

    const info = getCouponDisplayInfo(selectedCoupon);
    const success = await couponManager.useCoupon(selectedCoupon.id, branch.id, branch.name);
    setSelectedCoupon(null);
    setPassword('');
    setPasswordError(false);
    if (success) {
      setUsedMessage(`${info.titleKo} 쿠폰이 사용되었습니다! (${branch.name})`);
      setTimeout(() => setUsedMessage(''), 2000);
    }
  };

  const allBreadTypes = getAllBreadTypes();

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>내 쿠폰</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {/* 레벨 프로그레스 */}
          <div className={styles.levelSection}>
            <div className={styles.levelHeader}>
              <span className={styles.levelBadge}>⭐ Lv.{level}</span>
              <span className={styles.levelScore}>
                {score.toLocaleString()} / {targetScore.toLocaleString()}
              </span>
            </div>
            <div className={styles.levelProgressBg}>
              <div
                className={styles.levelProgressFill}
                style={{ width: `${Math.min(score / targetScore, 1) * 100}%` }}
              />
            </div>
          </div>

          {/* 메뉴별 쿠폰 현황 - 네이버 플레이스 스타일 */}
          <div className={styles.menuSection}>
            <h3 className={styles.sectionTitle}>메뉴별 쿠폰</h3>
            <div className={styles.menuList}>
              {allBreadTypes.map((breadType) => {
                const breadInfo = BREAD_DATA[breadType];
                const coupons = couponManager.getCouponsForBread(breadType);
                const progress = couponManager.getProgressForBread(breadType);
                const currentPoints = couponManager.breadPoints[breadType];

                return (
                  <div key={breadType} className={styles.menuCard}>
                    <div className={styles.menuImageWrap}>
                      <img
                        src={breadInfo.image}
                        alt={breadInfo.nameKo}
                        className={styles.menuImage}
                      />
                      {coupons.length > 0 && (
                        <span className={styles.couponBadge}>{coupons.length}</span>
                      )}
                    </div>
                    <div className={styles.menuInfo}>
                      <div className={styles.menuHeader}>
                        <span className={styles.menuName}>{breadInfo.name}</span>
                        <span className={styles.menuPrice}>
                          {breadInfo.price.toLocaleString()}원
                        </span>
                      </div>
                      <p className={styles.menuDesc}>{breadInfo.description}</p>
                      <div className={styles.menuProgress}>
                        <div className={styles.progressBarBg}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>
                          {currentPoints % breadInfo.price}P / {breadInfo.price}P
                        </span>
                      </div>
                      {coupons.length > 0 && (
                        <button
                          className={styles.useCouponBtn}
                          onClick={() => handleUseCoupon(coupons[0])}
                        >
                          무료 쿠폰 사용
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 쿠폰 내역 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>쿠폰 내역</h3>
            {couponManager.coupons.length === 0 ? (
              <p className={styles.emptyText}>아직 쿠폰이 없어요. 게임을 플레이하세요!</p>
            ) : (
              <div className={styles.couponList}>
                {[...couponManager.coupons].reverse().map((coupon) => {
                  const info = getCouponDisplayInfo(coupon);
                  const expired = isCouponExpired(coupon);
                  const daysLeft = getDaysUntilExpiration(coupon);
                  const isInactive = coupon.isUsed || expired;
                  const canUse = !coupon.isUsed && !expired;

                  return (
                    <div
                      key={coupon.id}
                      className={`${isInactive ? styles.couponRowUsed : styles.couponRow} ${canUse ? styles.couponRowClickable : ''}`}
                      onClick={() => canUse && handleUseCoupon(coupon)}
                    >
                      <img
                        src={info.image}
                        alt=""
                        className={styles.couponImage}
                      />
                      <div className={styles.couponInfo}>
                        <span className={isInactive ? styles.couponTextUsed : styles.couponText}>
                          {info.titleKo}
                        </span>
                        <span className={styles.couponMeta}>
                          {coupon.source === 'referral' ? '초대 보상' : '게임 획득'}
                        </span>
                        <span className={isInactive ? styles.couponMeta : styles.couponExpiry}>
                          유효기간: {new Date(coupon.expiresAt).toLocaleDateString('ko-KR')}
                          {!isInactive && ` (D-${daysLeft})`}
                        </span>
                      </div>
                      <span className={styles.couponStatus}>
                        {coupon.isUsed ? '사용됨' : expired ? '만료됨' : '사용하기'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 안내 */}
          <div className={styles.infoSection}>
            <p className={styles.infoItem}>• 빵 1개 매치 = 1 포인트</p>
            <p className={styles.infoItem}>• 각 빵의 가격만큼 포인트를 모으면 해당 빵의 무료 쿠폰 획득!</p>
            <p className={styles.infoItem}>• 하루에 1개 사용 가능</p>
            <p className={styles.infoItem}>• 다른 물품 구매시 사용 가능</p>
          </div>

          {/* Instagram Link */}
          <a
            href="https://www.instagram.com/salt_bread_official"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramLink}
          >
            <svg className={styles.instagramIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>인스타그램 팔로우</span>
          </a>

          {/* 찾아오는 길 - Naver Map API */}
          <div className={styles.mapSection}>
            <h3 className={styles.sectionTitle}>솔트빵 찾아오는 길</h3>
            <div ref={mapRef} className={styles.mapContainer} />
            <div className={styles.storeInfo}>
              <span className={styles.storeName}>솔트빵</span>
              <span className={styles.storeAddress}>
                서울 마포구 동교로 39길 10 1층
              </span>
              <span className={styles.storeHours}>
                영업시간: 11:00 - 21:00 (일요일 휴무)
              </span>
            </div>
            <button className={styles.directionsButton} onClick={openNaverMapPlace}>
              네이버 지도에서 길찾기
            </button>
          </div>

          {/* 회원 탈퇴 */}
          <button
            className={styles.deleteAccountLink}
            onClick={() => setShowDeleteConfirm(true)}
          >
            회원 탈퇴
          </button>
        </div>

        {/* 확인 다이얼로그 */}
        {selectedCoupon && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <img
                src={getCouponDisplayInfo(selectedCoupon).image}
                alt=""
                className={styles.confirmImage}
              />
              <p>{getCouponDisplayInfo(selectedCoupon).titleKo}을 사용하시겠습니까?</p>
              <p className={styles.couponUsageNote}>하루 1개, 다른 물품 구매시 사용 가능</p>
              <div className={styles.passwordSection}>
                <label className={styles.passwordLabel}>비밀번호</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  className={`${styles.passwordInput} ${passwordError ? styles.passwordInputError : ''}`}
                  placeholder="4자리 비밀번호"
                  autoFocus
                />
                {passwordError && (
                  <span className={styles.passwordErrorText}>비밀번호가 틀렸습니다</span>
                )}
              </div>
              <div className={styles.confirmButtons}>
                <button onClick={() => setSelectedCoupon(null)}>취소</button>
                <button className={styles.confirmOk} onClick={confirmUse}>사용하기</button>
              </div>
            </div>
          </div>
        )}

        {/* 사용 완료 메시지 */}
        {usedMessage && (
          <div className={styles.toast}>{usedMessage}</div>
        )}

        {/* 오늘 이미 사용한 경우 */}
        {alreadyUsedToday && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p className={styles.dailyLimitTitle}>⚠️ 오늘 이미 쿠폰을 사용했습니다</p>
              <p className={styles.dailyLimitNote}>쿠폰은 하루에 1개만 사용할 수 있어요.<br />내일 다시 이용해주세요!</p>
              <div className={styles.confirmButtons}>
                <button className={styles.confirmOk} onClick={() => setAlreadyUsedToday(false)}>확인</button>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isCheckingDaily && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p>확인 중...</p>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 확인 */}
        {showDeleteConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p className={styles.deleteWarningTitle}>⚠️ 회원 탈퇴</p>
              <p className={styles.deleteWarningText}>
                탈퇴 시 모든 쿠폰과 포인트가<br />
                삭제되며 복구할 수 없습니다.<br />
                정말 탈퇴하시겠습니까?
              </p>
              <div className={styles.confirmButtons}>
                <button onClick={() => setShowDeleteConfirm(false)}>취소</button>
                <button
                  className={styles.deleteConfirmButton}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await onDeleteAccount();
                    } catch {
                      alert('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
                    }
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
