import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGameViewModel } from './hooks/useGameViewModel';
import { useCouponManager } from './hooks/useCouponManager';
import { useReferral } from './hooks/useReferral';
import { useLanguage } from './contexts/LanguageContext';
import { firestoreScoreService } from './services/score';
import { getReferrerFromUrl } from './services/referral';
import { BREAD_DATA } from './models/BreadType';
import { isEmbeddedApp, isTossApp } from './lib/platform';
import { isUserAdmin } from './services/admin';
import {
  trackScreenView,
  trackCouponViewOpen,
  trackInviteBubbleClick,
  trackLandingStart,
  trackReferralComplete,
} from './services/analytics';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import GameBoardView from './components/GameBoardView';
import ComboView from './components/ComboView';
import GameOverView from './components/GameOverView';
import LevelUpView from './components/LevelUpView';
import CouponView from './components/CouponView';
import CouponCelebration from './components/CouponCelebration';
import BreadProgressPanel from './components/BreadProgressPanel';
import InviteButton from './components/InviteButton';
import AdminPage from './components/AdminPage';
import RankingView from './components/RankingView';
import ProfileView from './components/ProfileView';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AccountDeletion from './components/AccountDeletion';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/account-deletion" element={<AccountDeletion />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp() {
  const { user, isLoading, isAuthenticated, signOut, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const couponManager = useCouponManager(user?.id || null);
  const game = useGameViewModel(couponManager.addCrushedBread);
  const referral = useReferral(user?.id || null);
  const [showCouponView, setShowCouponView] = useState(false);
  const [showInviteBubble, setShowInviteBubble] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showFriendsView, setShowFriendsView] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [savedPointsAmount, setSavedPointsAmount] = useState(0);
  const [showLanding, setShowLanding] = useState(() => {
    // Skip landing page on native apps and Toss mini app
    if (isEmbeddedApp()) return false;
    // Skip landing page if accessing via referral link - go directly to login
    if (getReferrerFromUrl()) return false;
    // Show landing for web first-time visitors
    return !localStorage.getItem('saltify_visited');
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const hasRecordedGameOver = useRef(false);
  const referralProcessed = useRef(false);

  const handleStartGame = () => {
    trackLandingStart();
    localStorage.setItem('saltify_visited', 'true');
    setShowLanding(false);
  };

  const confirmLogout = async () => {
    await signOut();
    if (!isEmbeddedApp()) setShowLanding(true);
  };

  // Submit score to Toss Game Center leaderboard
  useEffect(() => {
    if (game.gameState === 'gameOver' && isTossApp()) {
      import('@apps-in-toss/web-framework').then(({ submitGameCenterLeaderBoardScore }) => {
        submitGameCenterLeaderBoardScore({ score: String(game.score) }).catch(console.error);
      });
    }
  }, [game.gameState, game.score]);

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
          // New user - give referral coupons
          const couponSuccess = await couponManager.addReferralCoupons(
            referral.pendingReferrerId,
            user.id
          );
          if (couponSuccess) {
            couponManager.showReferralCouponAlert();
            trackReferralComplete();
          }
        } else if (result.isExistingUser) {
          // Existing user - show friend ranking view
          setShowFriendsView(true);
        }
      });
    }
  }, [user, referral, couponManager]);

  // Save bread points to Firestore when level up
  useEffect(() => {
    if (game.showLevelUp && user) {
      const earned = couponManager.levelEarnedRef.current;
      couponManager.savePointsToFirestore().then(() => {
        setSavedPointsAmount(earned);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2500);
        couponManager.resetLevelEarned();
      });
    }
  }, [game.showLevelUp, user, couponManager.savePointsToFirestore, couponManager.levelEarnedRef, couponManager.resetLevelEarned]);

  // Save score and points to Firestore when game ends
  useEffect(() => {
    if (game.gameState === 'gameOver' && user && !hasRecordedGameOver.current) {
      hasRecordedGameOver.current = true;
      couponManager.savePointsToFirestore().then(() => couponManager.resetLevelEarned());
      firestoreScoreService.saveGameRecord({
        userId: user.id,
        score: game.score,
        level: game.level,
        saltBreadCrushed: couponManager.totalPoints,
      }).catch(console.error);
    }
    if (game.gameState === 'idle' && hasRecordedGameOver.current) {
      hasRecordedGameOver.current = false;
    }
  }, [game.gameState, game.score, game.level, user, couponManager.totalPoints, couponManager.savePointsToFirestore]);

  // Check admin status
  useEffect(() => {
    if (user) {
      isUserAdmin(user.id).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Track screen views
  useEffect(() => {
    if (isLoading) return;
    if (showLanding) {
      trackScreenView('landing');
    } else if (!isAuthenticated) {
      trackScreenView('login');
    } else {
      trackScreenView('game');
    }
  }, [isLoading, showLanding, isAuthenticated]);

  if (isLoading) {
    return (
      <div
        className={styles.loadingContainer}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          background: 'linear-gradient(to bottom, #FFF6E0, #FFEAD0)',
        }}
      >
        <img
          src="/breads/plain.png"
          alt={t('loading')}
          className={styles.loadingIcon}
          style={{ width: 80, height: 80 }}
        />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (showLanding) {
    return (
      <LandingPage onStartGame={handleStartGame} />
    );
  }

  if (!isAuthenticated) {
    return <LoginView onBackToLanding={() => { if (!isEmbeddedApp()) setShowLanding(true); }} />;
  }

  return (
    <div
      className={styles.container}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'linear-gradient(to bottom, #FFF6E0, #FFEAD0)',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.rankingButton}
            onClick={() => setShowFriendsView(true)}
          >
            👥
          </button>
        </div>
        <img
          src="/brandings/header.png"
          alt={t('storeName')}
          className={styles.logoImage}
          onClick={() => { if (!isEmbeddedApp()) setShowLanding(true); }}
        />
        {!isTossApp() && (
          <div className={styles.headerRight}>
            <button
              className={styles.couponButton}
              onClick={() => { trackCouponViewOpen(); setShowCouponView(true); }}
            >
              🎟️
              {couponManager.availableCoupons.length > 0 && (
                <span className={styles.couponBadge}>
                  {couponManager.availableCoupons.length}
                </span>
              )}
            </button>
            <button className={styles.profileButton} onClick={() => setShowProfileView(true)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className={styles.profileImg} referrerPolicy="no-referrer" />
              ) : (
                <span>👤</span>
              )}
            </button>
          </div>
        )}
      </header>

      <BreadProgressPanel
        level={game.level}
        moves={game.moves}
        score={game.score}
        targetScore={game.targetScore}
        getProgressForBread={couponManager.getProgressForBread}
        getCouponsForBread={couponManager.getCouponsForBread}
        onBreadClick={() => setShowCouponView(true)}
        rightActions={isTossApp() ? (
          <div className={styles.headerRight}>
            <button
              className={styles.couponButton}
              onClick={() => { trackCouponViewOpen(); setShowCouponView(true); }}
            >
              🎟️
              {couponManager.availableCoupons.length > 0 && (
                <span className={styles.couponBadge}>
                  {couponManager.availableCoupons.length}
                </span>
              )}
            </button>
            <button className={styles.profileButton} onClick={() => setShowProfileView(true)}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className={styles.profileImg} referrerPolicy="no-referrer" />
              ) : (
                <span>👤</span>
              )}
            </button>
          </div>
        ) : undefined}
      />

      <div
        className={styles.boardArea}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '12px 8px 0',
          minHeight: 0,
        }}
      >
        <GameBoardView
          board={game.board}
          selectedPosition={game.selectedPosition}
          matchedPositions={game.matchedPositions}
          isAnimating={game.isAnimating}
          moves={game.moves}
          feverActive={game.isFeverActive}
          isBigMatch={game.isBigMatch}
          comboCount={game.comboCount}
          onCellTap={game.selectCell}
          onSwap={game.trySwap}
        />
      </div>

      <div className={styles.actionButtons} style={isEmbeddedApp() ? { paddingBottom: 48 } : undefined}>
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
        <div className={styles.inviteBubble} onClick={() => { trackInviteBubbleClick(); setShowInviteModal(true); }}>
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
            <button className={styles.shareButton} onClick={referral.shareReferralLink}>
              📤 {t('share')}
            </button>
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
            {referral.referredCount > 0 && (
              <div className={styles.inviteStats}>
                <span>👥 {t('invitedFriends')}: {referral.referredCount}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bonus moves float */}
      {game.showBonusMoves && (
        <div className={styles.bonusMovesFloat}>+{game.bonusMoves}</div>
      )}

      {/* Fever indicator */}
      {game.isFeverActive && (
        <div className={styles.feverIndicator}>
          <span className={styles.feverEmoji}>🔥</span>
          <span>{t('feverMode')} {t('feverScore')}</span>
          <span className={styles.feverCount}>{game.feverMovesLeft}</span>
        </div>
      )}

      {/* Fever start flash */}
      {game.showFeverStart && (
        <div className={styles.feverStartOverlay}>
          <div className={styles.feverStartText}>🔥 {t('feverMode')} 🔥</div>
        </div>
      )}

      {game.showCombo && <ComboView key={game.comboCount} comboCount={game.comboCount} comboScore={game.comboScore} />}

      {game.gameState === 'gameOver' && (
        <GameOverView
          totalPoints={couponManager.totalPoints}
          availableCouponsCount={couponManager.availableCoupons.length}
          onRestart={game.startNewGame}
        />
      )}

      {game.showLevelUp && (
        <LevelUpView level={game.level} />
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
        />
      )}


      {showFriendsView && user && (
        <RankingView
          currentUserId={user.id}
          onClose={() => setShowFriendsView(false)}
        />
      )}

      {showProfileView && user && (
        <ProfileView
          userName={user.displayName || ''}
          photoURL={user.photoURL || null}
          isAdmin={isAdmin}
          onLogout={() => {
            setShowProfileView(false);
            confirmLogout();
          }}
          onDeleteAccount={async () => {
            await deleteAccount();
            setShowProfileView(false);
            if (!isEmbeddedApp()) setShowLanding(true);
          }}
          onClose={() => setShowProfileView(false)}
        />
      )}

      {showSaveToast && (
        <div className={styles.saveToastOverlay}>
          <div className={styles.saveToastPaper}>
            <div className={styles.saveToastIcon}>&#128221;</div>
            <div className={styles.saveToastText}>{t('pointsSaved')}</div>
            {savedPointsAmount > 0 && (
              <div className={styles.saveToastPoints}>{savedPointsAmount.toLocaleString()}P</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
