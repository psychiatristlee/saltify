import { useState } from 'react';
import { useGameViewModel } from './hooks/useGameViewModel';
import { useCouponManager } from './hooks/useCouponManager';
import GameBoardView from './components/GameBoardView';
import ScoreView from './components/ScoreView';
import ComboView from './components/ComboView';
import GameOverView from './components/GameOverView';
import LevelUpView from './components/LevelUpView';
import CouponView from './components/CouponView';
import styles from './App.module.css';

export default function App() {
  const couponManager = useCouponManager();
  const game = useGameViewModel(couponManager.addCrushedSaltBread);
  const [showCouponView, setShowCouponView] = useState(false);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>소금빵 크러쉬</h1>
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
      </header>

      <ScoreView
        level={game.level}
        score={game.score}
        targetScore={game.targetScore}
        moves={game.moves}
        points={couponManager.points}
        progressToNextCoupon={couponManager.progressToNextCoupon}
        availableCouponsCount={couponManager.availableCoupons.length}
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
          totalSaltBreadCrushed={couponManager.totalSaltBreadCrushed}
          availableCouponsCount={couponManager.availableCoupons.length}
          onRestart={game.startNewGame}
        />
      )}

      {game.showLevelUp && (
        <LevelUpView level={game.level} score={game.score} />
      )}

      {couponManager.showCouponAlert && (
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
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
    </div>
  );
}
