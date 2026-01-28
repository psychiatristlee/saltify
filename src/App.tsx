import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameViewModel } from './hooks/useGameViewModel';
import { useCouponManager } from './hooks/useCouponManager';
import { useReferral } from './hooks/useReferral';
import { useLanguage } from './contexts/LanguageContext';
import { firestoreScoreService } from './services/score';
import { getReferrerFromUrl } from './services/referral';
import { BREAD_DATA } from './models/BreadType';
import { isNativeApp } from './lib/platform';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import GameBoardView from './components/GameBoardView';
import ComboView from './components/ComboView';
import GameOverView from './components/GameOverView';
import LevelUpView from './components/LevelUpView';
import CouponView from './components/CouponView';
import CouponCelebration from './components/CouponCelebration';
import RankingView from './components/RankingView';
import BreadProgressPanel from './components/BreadProgressPanel';
import InviteButton from './components/InviteButton';
import AdminView from './components/AdminView';
import styles from './App.module.css';

export default function App() {
  const { user, isLoading, isAuthenticated, signOut, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const couponManager = useCouponManager(user?.id || null);
  const game = useGameViewModel(couponManager.addCrushedBread);
  const referral = useReferral(user?.id || null);
  const [showCouponView, setShowCouponView] = useState(false);
  const [showRankingView, setShowRankingView] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [showInviteBubble, setShowInviteBubble] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    // Skip landing page on native apps
    if (isNativeApp()) return false;
    // Skip landing page if accessing via referral link - go directly to login
    if (getReferrerFromUrl()) return false;
    // Show landing for web first-time visitors
    return !localStorage.getItem('saltify_visited');
  });
  const hasRecordedGameOver = useRef(false);
  const referralProcessed = useRef(false);

  const handleStartGame = () => {
    localStorage.setItem('saltify_visited', 'true');
    setShowLanding(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    setShowLanding(true);
  };

  // Process referral when user signs in
  useEffect(() => {
    if (
      user &&
      referral.hasPendingReferral &&
      referral.pendingReferrerId &&
      !referralProcessed.current &&
      !referral.isProcessing
    ) {
      referralProcessed.current = true;
      referral.processPendingReferral().then(async (result) => {
        if (result.success && referral.pendingReferrerId) {
          // Give coupon to both referrer and new user in Firestore
          const couponSuccess = await couponManager.addReferralCoupons(
            referral.pendingReferrerId,
            user.id
          );
          if (couponSuccess) {
            // Show alert for the current user
            couponManager.showReferralCouponAlert();
          }
        }
      });
    }
  }, [user, referral, couponManager]);

  // Save bread points to Firestore when level up
  useEffect(() => {
    if (game.showLevelUp && user) {
      couponManager.savePointsToFirestore();
    }
  }, [game.showLevelUp, user, couponManager.savePointsToFirestore]);

  // Save score and points to Firestore when game ends
  useEffect(() => {
    if (game.gameState === 'gameOver' && user && !hasRecordedGameOver.current) {
      hasRecordedGameOver.current = true;
      // Save bread points to Firestore
      couponManager.savePointsToFirestore();
      // Save game record
      firestoreScoreService.saveGameRecord({
        userId: user.id,
        score: game.score,
        level: game.level,
        saltBreadCrushed: couponManager.totalPoints,
      }).then(() => {
        // Show save toast
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2000);
      }).catch(console.error);
    }
    // Reset flag when game restarts
    if (game.gameState === 'idle' && hasRecordedGameOver.current) {
      hasRecordedGameOver.current = false;
    }
  }, [game.gameState, game.score, game.level, user, couponManager.totalPoints, couponManager.savePointsToFirestore]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <img src="/breads/plain.png" alt={t('loading')} className={styles.loadingIcon} />
        <p>{t('loading')}</p>
      </div>
    );
  }

  // Show landing page
  if (showLanding) {
    return (
      <>
        <LandingPage
          onStartGame={handleStartGame}
          onAdminClick={() => setShowAdminView(true)}
        />
        {showAdminView && (
          <AdminView
            userId={user?.id || null}
            onClose={() => setShowAdminView(false)}
          />
        )}
      </>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onBackToLanding={() => setShowLanding(true)} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.rankingButton}
            onClick={() => setShowRankingView(true)}
          >
            🏆
          </button>
        </div>
        <img
          src="/brandings/header.png"
          alt={t('storeName')}
          className={styles.logoImage}
          onClick={() => setShowLanding(true)}
        />
        <div className={styles.headerRight}>
          <button
            className={styles.couponButton}
            onClick={() => setShowCouponView(true)}
          >
            🎟️
            {couponManager.availableCoupons.length > 0 && (
              <span className={styles.couponBadge}>
                {couponManager.availableCoupons.length}
              </span>
            )}
          </button>
          <button className={styles.profileButton} onClick={handleLogout}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.profileImg} />
            ) : (
              <span>👤</span>
            )}
          </button>
        </div>
      </header>

      <BreadProgressPanel
        level={game.level}
        moves={game.moves}
        getProgressForBread={couponManager.getProgressForBread}
        getCouponsForBread={couponManager.getCouponsForBread}
        onBreadClick={() => setShowCouponView(true)}
      />

      <div className={styles.boardArea}>
        <GameBoardView
          board={game.board}
          selectedPosition={game.selectedPosition}
          matchedPositions={game.matchedPositions}
          isAnimating={game.isAnimating}
          onCellTap={game.selectCell}
          onSwap={game.trySwap}
        />
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.newGameButton} onClick={game.startNewGame}>
          ↻ {t('newGame')}
        </button>
        <InviteButton
          referralLink={referral.referralLink}
          referredCount={referral.referredCount}
          onCopy={referral.copyReferralLink}
          onShare={referral.shareReferralLink}
        />
      </div>

      {/* Invite bubble */}
      {showInviteBubble && referral.referralLink && (
        <div className={styles.inviteBubble} onClick={() => setShowInviteModal(true)}>
          <img src="/breads/plain.png" alt="" className={styles.bubbleImage} />
          <span>{t('inviteBubble')}</span>
          <button
            className={styles.bubbleClose}
            onClick={(e) => {
              e.stopPropagation();
              setShowInviteBubble(false);
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && referral.referralLink && (
        <div className={styles.alertOverlay}>
          <div className={styles.inviteModal}>
            <button className={styles.modalCloseButton} onClick={() => setShowInviteModal(false)}>
              ✕
            </button>
            <div className={styles.inviteIcon}>🎁</div>
            <h3 className={styles.inviteTitle}>{t('inviteTitle')}</h3>
            <p className={styles.inviteDesc}>{t('inviteDesc')}</p>
            <div className={styles.linkBox}>
              <input
                type="text"
                value={referral.referralLink}
                readOnly
                className={styles.linkInput}
              />
              <button
                className={styles.copyButton}
                onClick={async () => {
                  const success = await referral.copyReferralLink();
                  if (success) alert(t('linkCopied'));
                }}
              >
                {t('copy')}
              </button>
            </div>
            <button className={styles.shareButton} onClick={referral.shareReferralLink}>
              📤 {t('share')}
            </button>
            {referral.referredCount > 0 && (
              <div className={styles.inviteStats}>
                <span>👥 {t('invitedFriends')}: {referral.referredCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {game.showCombo && <ComboView key={game.comboCount} comboCount={game.comboCount} />}

      {game.gameState === 'gameOver' && (
        <GameOverView
          score={game.score}
          totalPoints={couponManager.totalPoints}
          availableCouponsCount={couponManager.availableCoupons.length}
          onRestart={game.startNewGame}
        />
      )}

      {game.showLevelUp && (
        <LevelUpView level={game.level} score={game.score} />
      )}

      {couponManager.showCouponAlert && couponManager.newCouponBreadType !== null && (
        <CouponCelebration
          breadImage={BREAD_DATA[couponManager.newCouponBreadType].image}
          breadName={BREAD_DATA[couponManager.newCouponBreadType].nameKo}
          message={couponManager.newCouponMessage}
          onClose={couponManager.dismissAlert}
        />
      )}

      {showCouponView && (
        <CouponView
          couponManager={couponManager}
          level={game.level}
          score={game.score}
          targetScore={game.targetScore}
          onClose={() => setShowCouponView(false)}
          onDeleteAccount={async () => {
            await deleteAccount();
            setShowCouponView(false);
            setShowLanding(true);
          }}
        />
      )}

      {showRankingView && (
        <RankingView
          currentUserId={user?.id || null}
          onClose={() => setShowRankingView(false)}
        />
      )}

      {showLogoutConfirm && (
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
            <h3>{t('logout')}</h3>
            <p>{t('logoutConfirm')}</p>
            <div className={styles.alertButtons}>
              <button
                className={styles.alertCancelButton}
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t('cancel')}
              </button>
              <button
                className={styles.alertConfirmButton}
                onClick={confirmLogout}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveToast && (
        <div className={styles.saveToast}>
          ✓ {t('pointsSaved')}
        </div>
      )}
    </div>
  );
}
