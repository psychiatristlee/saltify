import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameViewModel } from './hooks/useGameViewModel';
import { useCouponManager } from './hooks/useCouponManager';
import { useReferral } from './hooks/useReferral';
import { firestoreScoreService } from './services/score';
import { getReferrerFromUrl } from './services/referral';
import { BREAD_DATA } from './models/BreadType';
import { isNativeApp } from './lib/platform';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import GameBoardView from './components/GameBoardView';
import ScoreView from './components/ScoreView';
import ComboView from './components/ComboView';
import GameOverView from './components/GameOverView';
import LevelUpView from './components/LevelUpView';
import CouponView from './components/CouponView';
import BreadProgressPanel from './components/BreadProgressPanel';
import InviteButton from './components/InviteButton';
import styles from './App.module.css';

export default function App() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const couponManager = useCouponManager();
  const game = useGameViewModel(couponManager.addCrushedBread);
  const referral = useReferral(user?.id || null);
  const [showCouponView, setShowCouponView] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
      !referralProcessed.current &&
      !referral.isProcessing
    ) {
      referralProcessed.current = true;
      referral.processPendingReferral().then((result) => {
        if (result.success) {
          // Give coupon to both referrer and new user
          couponManager.addReferralCoupon();
        }
      });
    }
  }, [user, referral, couponManager]);

  // Save score to Firestore when game ends
  useEffect(() => {
    if (game.gameState === 'gameOver' && user && !hasRecordedGameOver.current) {
      hasRecordedGameOver.current = true;
      firestoreScoreService.saveGameRecord({
        userId: user.id,
        score: game.score,
        level: game.level,
        saltBreadCrushed: couponManager.totalPoints,
      }).catch(console.error);
    }
    // Reset flag when game restarts
    if (game.gameState === 'idle' && hasRecordedGameOver.current) {
      hasRecordedGameOver.current = false;
    }
  }, [game.gameState, game.score, game.level, user, couponManager.totalPoints]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <img src="/breads/plain.png" alt="로딩" className={styles.loadingIcon} />
        <p>로딩 중...</p>
      </div>
    );
  }

  // Show landing page
  if (showLanding) {
    return <LandingPage onStartGame={handleStartGame} />;
  }

  if (!isAuthenticated) {
    return <LoginView onBackToLanding={() => setShowLanding(true)} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <InviteButton
            referralLink={referral.referralLink}
            referredCount={referral.referredCount}
            onCopy={referral.copyReferralLink}
            onShare={referral.shareReferralLink}
          />
        </div>
        <img
          src="/brandings/header.png"
          alt="솔트빵"
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
              <img src={user.photoURL} alt="프로필" className={styles.profileImg} />
            ) : (
              <span>👤</span>
            )}
          </button>
        </div>
      </header>

      <BreadProgressPanel
        getProgressForBread={couponManager.getProgressForBread}
        getCouponsForBread={couponManager.getCouponsForBread}
      />

      <ScoreView
        level={game.level}
        score={game.score}
        targetScore={game.targetScore}
        moves={game.moves}
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

      <button className={styles.newGameButton} onClick={game.startNewGame}>
        ↻ 새 게임
      </button>

      {game.showCombo && <ComboView comboCount={game.comboCount} />}

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
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
            <img
              src={BREAD_DATA[couponManager.newCouponBreadType].image}
              alt=""
              className={styles.alertImage}
            />
            <h3>쿠폰 획득!</h3>
            <p>{couponManager.newCouponMessage}</p>
            <button onClick={couponManager.dismissAlert}>확인</button>
          </div>
        </div>
      )}

      {showCouponView && (
        <CouponView
          couponManager={couponManager}
          onClose={() => setShowCouponView(false)}
        />
      )}

      {showLogoutConfirm && (
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
            <h3>로그아웃</h3>
            <p>로그아웃 하시겠습니까?</p>
            <div className={styles.alertButtons}>
              <button
                className={styles.alertCancelButton}
                onClick={() => setShowLogoutConfirm(false)}
              >
                취소
              </button>
              <button
                className={styles.alertConfirmButton}
                onClick={confirmLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
