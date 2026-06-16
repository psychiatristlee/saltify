import { useEffect, useRef, useState } from 'react';
import { BREAD_DATA } from '../models/BreadType';
import { useLanguage } from '../contexts/LanguageContext';
import { isEmbeddedApp, isTossApp } from '../lib/platform';
import { firestoreScoreService } from '../services/score';
import {
  trackCouponViewOpen,
  trackInviteBubbleClick,
} from '../services/analytics';
import { useGameViewModel } from '../hooks/useGameViewModel';
import { useCouponManager } from '../hooks/useCouponManager';
import { useReferral } from '../hooks/useReferral';
import GameBoardView from './GameBoardView';
import ComboView from './ComboView';
import GameOverView from './GameOverView';
import LevelUpView from './LevelUpView';
import BreadProgressPanel from './BreadProgressPanel';
import CouponView from './CouponView';
import CouponCelebration from './CouponCelebration';
import InviteButton from './InviteButton';
import RankingView from './RankingView';
import styles from './GamePage.module.css';

interface Props {
  user: { id: string; displayName?: string | null; photoURL?: string | null };
  game: ReturnType<typeof useGameViewModel>;
  couponManager: ReturnType<typeof useCouponManager>;
  referral: ReturnType<typeof useReferral>;
  onSavedPoints: (earned: number) => void;
}

export default function GamePage({ user, game, couponManager, referral, onSavedPoints }: Props) {
  const { t } = useLanguage();
  const [showCouponView, setShowCouponView] = useState(false);
  const [showFriendsView, setShowFriendsView] = useState(false);
  const [showInviteBubble, setShowInviteBubble] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const hasRecordedGameOver = useRef(false);

  useEffect(() => {
    if (game.gameState === 'gameOver' && isTossApp()) {
      import('@apps-in-toss/web-framework').then(({ submitGameCenterLeaderBoardScore }) => {
        submitGameCenterLeaderBoardScore({ score: String(game.score) }).catch(console.error);
      });
    }
  }, [game.gameState, game.score]);

  useEffect(() => {
    if (game.showLevelUp && user) {
      const earned = couponManager.levelEarnedRef.current;
      couponManager.savePointsToFirestore().then(() => {
        onSavedPoints(earned);
        couponManager.resetLevelEarned();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.showLevelUp, user]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameState, game.score, game.level, user]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setShowFriendsView(true)}
          aria-label="친구 랭킹"
        >
          👥
        </button>
        <h1 className={styles.title}>🍞 솔트빵 게임</h1>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => { trackCouponViewOpen(); setShowCouponView(true); }}
          aria-label="쿠폰"
        >
          🎟️
          {couponManager.availableCoupons.length > 0 && (
            <span className={styles.badge}>{couponManager.availableCoupons.length}</span>
          )}
        </button>
      </header>

      <BreadProgressPanel
        level={game.level}
        moves={game.moves}
        score={game.score}
        targetScore={game.targetScore}
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
          moves={game.moves}
          feverActive={game.isFeverActive}
          isBigMatch={game.isBigMatch}
          comboCount={game.comboCount}
          onCellTap={game.selectCell}
          onSwap={game.trySwap}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.newGameBtn} onClick={game.startNewGame}>
          ↻ {t('newGame')}
        </button>
        <InviteButton
          referralLink={referral.referralLink}
          referredCount={referral.referredCount}
          onCopy={referral.copyReferralLink}
          onShare={referral.shareReferralLink}
        />
      </div>

      {showInviteBubble && referral.referralLink && (
        <div
          className={styles.inviteBubble}
          onClick={() => {
            trackInviteBubbleClick();
            setShowInviteModal(true);
          }}
        >
          <img src="/breads/plain.png" alt="" className={styles.bubbleImage} />
          <span>{t('inviteBubble')}</span>
          <button
            type="button"
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

      {showInviteModal && referral.referralLink && (
        <div className={styles.alertOverlay}>
          <div className={styles.inviteModal}>
            <button type="button" className={styles.modalCloseButton} onClick={() => setShowInviteModal(false)}>
              ✕
            </button>
            <div className={styles.inviteIcon}>🎁</div>
            <h3 className={styles.inviteTitle}>{t('inviteTitle')}</h3>
            <p className={styles.inviteDesc}>{t('inviteDesc')}</p>
            <button type="button" className={styles.shareButton} onClick={referral.shareReferralLink}>
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
                type="button"
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

      {game.showBonusMoves && (
        <div className={styles.bonusMovesFloat}>+{game.bonusMoves}</div>
      )}

      {game.isFeverActive && (
        <div className={styles.feverIndicator}>
          <span className={styles.feverEmoji}>🔥</span>
          <span>{t('feverMode')} {t('feverScore')}</span>
          <span className={styles.feverCount}>{game.feverMovesLeft}</span>
        </div>
      )}

      {game.showFeverStart && (
        <div className={styles.feverStartOverlay}>
          <div className={styles.feverStartText}>🔥 {t('feverMode')} 🔥</div>
        </div>
      )}

      {game.showCombo && (
        <ComboView key={game.comboCount} comboCount={game.comboCount} comboScore={game.comboScore} />
      )}

      {game.gameState === 'gameOver' && (
        <GameOverView
          totalPoints={couponManager.totalPoints}
          availableCouponsCount={couponManager.availableCoupons.length}
          onRestart={game.startNewGame}
        />
      )}

      {game.showLevelUp && <LevelUpView level={game.level} />}

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

      {showFriendsView && (
        <RankingView currentUserId={user.id} onClose={() => setShowFriendsView(false)} />
      )}

      {isEmbeddedApp() && <div className={styles.safePad} />}
    </div>
  );
}
