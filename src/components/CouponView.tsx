import { useState, useRef } from 'react';
import { Coupon, getDaysUntilExpiration, isCouponExpired } from '../models/Coupon';
import { BreadType, getAllBreadTypes, BREAD_DATA } from '../models/BreadType';
import { BreadPoints } from '../hooks/useCouponManager';
import { useNaverMap, openNaverMapPlace } from '../hooks/useNaverMap';
import { validateBranchPassword } from '../services/admin';
import { hasUsedCouponToday } from '../services/coupon';
import { trackCouponUsed } from '../services/analytics';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../lib/i18n';
import styles from './CouponView.module.css';

const BREAD_I18N: Record<BreadType, { name: TranslationKey; desc: TranslationKey }> = {
  [BreadType.Plain]: { name: 'breadPlainName', desc: 'breadPlainDesc' },
  [BreadType.Everything]: { name: 'breadEverythingName', desc: 'breadEverythingDesc' },
  [BreadType.OliveCheese]: { name: 'breadOliveCheeseName', desc: 'breadOliveCheeseDesc' },
  [BreadType.BasilTomato]: { name: 'breadBasilTomatoName', desc: 'breadBasilTomatoDesc' },
  [BreadType.GarlicButter]: { name: 'breadGarlicButterName', desc: 'breadGarlicButterDesc' },
  [BreadType.Hotteok]: { name: 'breadHotteokName', desc: 'breadHotteokDesc' },
};

interface CouponManager {
  coupons: Coupon[];
  breadPoints: BreadPoints;
  totalPoints: number;
  availableCoupons: Coupon[];
  userId: string | null;
  upgradeResult: { success: boolean; breadType?: BreadType } | null;
  showUpgradeResult: boolean;
  getProgressForBread: (breadType: BreadType) => number;
  getRemainingForBread: (breadType: BreadType) => number;
  getCouponsForBread: (breadType: BreadType) => Coupon[];
  useCoupon: (couponId: string, branchId?: string, branchName?: string) => Promise<boolean>;
  attemptUpgrade: (couponIds: string[]) => Promise<{ success: boolean; breadType?: BreadType }>;
  dismissAlert: () => void;
}

interface Props {
  couponManager: CouponManager;
  level: number;
  score: number;
  targetScore: number;
  onClose: () => void;
}

export default function CouponView({ couponManager, level, score, targetScore, onClose }: Props) {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [usedMessage, setUsedMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [alreadyUsedToday, setAlreadyUsedToday] = useState(false);
  const [isCheckingDaily, setIsCheckingDaily] = useState(false);
  const [upgradeSelectedIds, setUpgradeSelectedIds] = useState<Set<string>>(new Set());
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useNaverMap(mapRef);

  const availableCouponsForUpgrade = couponManager.availableCoupons.filter((c) => c.source !== 'upgrade');
  const canUpgrade = availableCouponsForUpgrade.length >= 3;

  const toggleUpgradeSelect = (couponId: string) => {
    setUpgradeSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(couponId)) {
        next.delete(couponId);
      } else if (next.size < 3) {
        next.add(couponId);
      }
      return next;
    });
  };

  const handleUpgrade = async () => {
    setShowUpgradeConfirm(false);
    setIsUpgrading(true);
    await couponManager.attemptUpgrade(Array.from(upgradeSelectedIds));
    setIsUpgrading(false);
    setUpgradeSelectedIds(new Set());
  };

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

    const couponName = `${t(BREAD_I18N[selectedCoupon.breadType].name)} ${t('onePlusOneCoupon')}`;
    const success = await couponManager.useCoupon(selectedCoupon.id, branch.id, branch.name);
    if (success) {
      trackCouponUsed(String(selectedCoupon.breadType), branch.name);
    }
    setSelectedCoupon(null);
    setPassword('');
    setPasswordError(false);
    if (success) {
      setUsedMessage(`${couponName} ${t('couponUsedMessage')} (${branch.name})`);
      setTimeout(() => setUsedMessage(''), 2000);
    }
  };

  const allBreadTypes = getAllBreadTypes();

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>{t('myCoupons')}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {/* Level progress */}
          <div className={styles.levelSection}>
            <div className={styles.levelHeader}>
              <span className={styles.levelBadge}>{t('level')} {level}</span>
              <span className={styles.levelScore}>
                {score.toLocaleString()} / {targetScore.toLocaleString()}P
              </span>
            </div>
            <div className={styles.levelProgressBg}>
              <div
                className={styles.levelProgressFill}
                style={{ width: `${Math.min(score / targetScore, 1) * 100}%` }}
              />
            </div>
          </div>

          {/* Menu points */}
          <div className={styles.menuSection}>
            <h3 className={styles.sectionTitle}>{t('menuPoints')}</h3>
            <div className={styles.menuList}>
              {allBreadTypes.map((breadType) => {
                const breadInfo = BREAD_DATA[breadType];
                const i18nKeys = BREAD_I18N[breadType];
                const progress = couponManager.getProgressForBread(breadType);
                const currentPoints = couponManager.breadPoints[breadType];

                return (
                  <div key={breadType} className={styles.menuCard}>
                    <div className={styles.menuImageWrap}>
                      <img
                        src={breadInfo.image}
                        alt={t(i18nKeys.name)}
                        className={styles.menuImage}
                      />
                    </div>
                    <div className={styles.menuInfo}>
                      <div className={styles.menuHeader}>
                        <span className={styles.menuName}>{t(i18nKeys.name)}</span>
                        <span className={styles.menuPrice}>
                          {breadInfo.price.toLocaleString()}{t('currencyUnit')}
                        </span>
                      </div>
                      <p className={styles.menuDesc}>{t(i18nKeys.desc)}</p>
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade (Gacha) Section */}
          <div className={styles.upgradeSection}>
            <div className={styles.upgradeHeader}>
              <span className={styles.upgradeIcon}>⚗️</span>
              <span className={styles.upgradeTitleText}>{t('upgradeTitle')}</span>
            </div>
            <p className={styles.upgradeDesc}>{t('upgradeDesc')}</p>
            <p className={styles.upgradeChance}>{t('upgradeChance')}</p>

            {!canUpgrade ? (
              <p className={styles.upgradeNeedMore}>{t('upgradeNeedMore')}</p>
            ) : (
              <>
                <div className={styles.upgradeSelectLabel}>
                  <span>{t('upgradeSelectCoupons')}</span>
                  <span className={styles.upgradeSelectCount}>
                    {upgradeSelectedIds.size}/3{t('upgradeSelected')}
                  </span>
                </div>
                <div className={styles.upgradeList}>
                  {availableCouponsForUpgrade.map((coupon) => {
                    const isSelected = upgradeSelectedIds.has(coupon.id);
                    const couponBreadInfo = BREAD_DATA[coupon.breadType];
                    const couponI18n = BREAD_I18N[coupon.breadType];
                    const daysLeft = getDaysUntilExpiration(coupon);

                    return (
                      <div
                        key={coupon.id}
                        className={isSelected ? styles.upgradeCouponRowSelected : styles.upgradeCouponRow}
                        onClick={() => toggleUpgradeSelect(coupon.id)}
                      >
                        <img
                          src={couponBreadInfo.image}
                          alt=""
                          className={styles.upgradeCouponImage}
                        />
                        <div className={styles.upgradeCouponInfo}>
                          <span className={styles.upgradeCouponName}>
                            {t(couponI18n.name)} {t('onePlusOneCoupon')}
                          </span>
                          <span className={styles.upgradeCouponExpiry}>
                            D-{daysLeft}
                          </span>
                        </div>
                        <div className={isSelected ? styles.upgradeCheckSelected : styles.upgradeCheck}>
                          {isSelected ? '✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className={styles.upgradeButton}
                  disabled={upgradeSelectedIds.size !== 3 || isUpgrading}
                  onClick={() => setShowUpgradeConfirm(true)}
                >
                  {isUpgrading ? t('processing') : `⚗️ ${t('upgradeButton')}`}
                </button>
              </>
            )}
          </div>

          {/* Coupon history */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('couponHistory')}</h3>
            {couponManager.coupons.length === 0 ? (
              <p className={styles.emptyText}>{t('noCoupons')}</p>
            ) : (
              <div className={styles.couponList}>
                {[...couponManager.coupons].reverse().map((coupon) => {
                  const couponBreadInfo = BREAD_DATA[coupon.breadType];
                  const couponI18n = BREAD_I18N[coupon.breadType];
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
                        src={couponBreadInfo.image}
                        alt=""
                        className={styles.couponImage}
                      />
                      <div className={styles.couponInfo}>
                        <span className={isInactive ? styles.couponTextUsed : styles.couponText}>
                          {t(couponI18n.name)} {t('onePlusOneCoupon')}
                        </span>
                        <span className={styles.couponMeta}>
                          {coupon.source === 'referral' ? t('referralReward') : coupon.source === 'upgrade' ? t('upgradeSource') : t('gameEarned')}
                        </span>
                        <span className={isInactive ? styles.couponMeta : styles.couponExpiry}>
                          {t('expiryDate')}: {new Date(coupon.expiresAt).toLocaleDateString()}
                          {!isInactive && ` (D-${daysLeft})`}
                        </span>
                      </div>
                      <span className={styles.couponStatus}>
                        {coupon.isUsed ? t('used') : expired ? t('expired') : t('use')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <p className={styles.infoItem}>• {t('couponInfo1')}</p>
            <p className={styles.infoItem}>• {t('couponInfo2')}</p>
            <p className={styles.infoItem}>• {t('couponInfo3')}</p>
            <p className={styles.infoItem}>• {t('couponInfo4')}</p>
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
            <span>{t('followInstagram')}</span>
          </a>

          {/* Map section */}
          <div className={styles.mapSection}>
            <h3 className={styles.sectionTitle}>{t('findUs')}</h3>
            <div ref={mapRef} className={styles.mapContainer} />
            <div className={styles.storeInfo}>
              <span className={styles.storeName}>{t('storeName')}</span>
              <span className={styles.storeAddress}>{t('storeAddress')}</span>
              <span className={styles.storeHours}>{t('storeHours')}</span>
            </div>
            <button className={styles.directionsButton} onClick={openNaverMapPlace}>
              {t('getDirections')}
            </button>
          </div>

        </div>

        {/* Confirm dialog */}
        {selectedCoupon && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <img
                src={BREAD_DATA[selectedCoupon.breadType].image}
                alt=""
                className={styles.confirmImage}
              />
              <p>{t(BREAD_I18N[selectedCoupon.breadType].name)} {t('onePlusOneCoupon')} {t('useCouponConfirm')}</p>
              <p className={styles.couponUsageNote}>{t('couponUsageNote')}</p>
              <div className={styles.passwordSection}>
                <label className={styles.passwordLabel}>{t('password')}</label>
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
                  placeholder={t('passwordPlaceholder')}
                  autoFocus
                />
                {passwordError && (
                  <span className={styles.passwordErrorText}>{t('wrongPassword')}</span>
                )}
              </div>
              <div className={styles.confirmButtons}>
                <button onClick={() => setSelectedCoupon(null)}>{t('cancel')}</button>
                <button className={styles.confirmOk} onClick={confirmUse}>{t('use')}</button>
              </div>
            </div>
          </div>
        )}

        {/* 사용 완료 메시지 */}
        {usedMessage && (
          <div className={styles.toast}>{usedMessage}</div>
        )}

        {/* Already used today */}
        {alreadyUsedToday && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p className={styles.dailyLimitTitle}>⚠️ {t('alreadyUsedToday')}</p>
              <p className={styles.dailyLimitNote}>{t('alreadyUsedNote')}</p>
              <div className={styles.confirmButtons}>
                <button className={styles.confirmOk} onClick={() => setAlreadyUsedToday(false)}>{t('confirm')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isCheckingDaily && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p>{t('loading')}</p>
            </div>
          </div>
        )}

        {/* Upgrade confirm */}
        {showUpgradeConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
              <p>⚗️ {t('upgradeTitle')}</p>
              <p className={styles.couponUsageNote}>{t('upgradeConfirm')}</p>
              <div className={styles.confirmButtons}>
                <button onClick={() => setShowUpgradeConfirm(false)}>{t('cancel')}</button>
                <button
                  className={styles.confirmOk}
                  onClick={handleUpgrade}
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}
                >
                  {t('upgradeButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade result */}
        {couponManager.showUpgradeResult && couponManager.upgradeResult && (
          <div className={styles.upgradeResultOverlay}>
            <div className={styles.upgradeResultBox}>
              <div className={styles.upgradeResultIcon}>
                {couponManager.upgradeResult.success ? '✨' : '💨'}
              </div>
              <div className={couponManager.upgradeResult.success ? styles.upgradeResultTitleSuccess : styles.upgradeResultTitleFail}>
                {couponManager.upgradeResult.success ? t('upgradeSuccess') : t('upgradeFail')}
              </div>
              <p className={styles.upgradeResultMsg}>
                {couponManager.upgradeResult.success ? t('upgradeSuccessMsg') : t('upgradeFailMsg')}
              </p>
              {couponManager.upgradeResult.success && couponManager.upgradeResult.breadType !== undefined && (
                <div className={styles.upgradeResultCoupon}>
                  <img
                    src={BREAD_DATA[couponManager.upgradeResult.breadType].image}
                    alt=""
                    className={styles.upgradeResultCouponImage}
                  />
                  <span className={styles.upgradeResultCouponName}>
                    {t(BREAD_I18N[couponManager.upgradeResult.breadType].name)} {t('onePlusOneCoupon')}
                  </span>
                </div>
              )}
              <button
                className={couponManager.upgradeResult.success ? styles.upgradeResultButtonSuccess : styles.upgradeResultButtonFail}
                onClick={couponManager.dismissAlert}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
