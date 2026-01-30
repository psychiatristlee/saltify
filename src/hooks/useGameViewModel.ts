import { useState, useCallback, useRef } from 'react';
import { Position } from '../models/BreadCell';
import { BreadType, getAllBreadTypes } from '../models/BreadType';
import { trackGameStart, trackGameOver, trackLevelUp } from '../services/analytics';
import {
  Board,
  BreadCrushCounts,
  fillBoardWithoutMatches,
  findMatchesWithInfo,
  swapCells,
  removeMatches,
  applyGravity,
  isAdjacent,
  hasPossibleMoves,
  shuffleBoard,
} from '../models/GameBoard';

export type GameState = 'idle' | 'selected' | 'animating' | 'levelUp' | 'gameOver';

const MOVES_PER_LEVEL = 30;
const SWAP_REJECT_DELAY = 300;
const GRAVITY_DELAY = 400;
const CASCADE_DELAY = 300;
const COMBO_DISPLAY_DURATION = 1200;
const LEVEL_UP_DISPLAY_DURATION = 2000;

// Candy Crush style: target score increases with each level
function getTargetScore(level: number): number {
  return 1000 + (level - 1) * 500;
}

interface State {
  board: Board;
  score: number;
  moves: number;
  level: number;
  targetScore: number;
  selectedPosition: Position | null;
  gameState: GameState;
  matchedPositions: Position[];
  comboCount: number;
  showCombo: boolean;
  showLevelUp: boolean;
}

// Callback type for when breads are crushed (called with bread type and count)
type OnBreadCrushed = (breadType: BreadType, count: number) => void;

export function useGameViewModel(onBreadCrushed: OnBreadCrushed) {
  const [state, setState] = useState<State>(() => ({
    board: fillBoardWithoutMatches(),
    score: 0,
    moves: MOVES_PER_LEVEL,
    level: 1,
    targetScore: getTargetScore(1),
    selectedPosition: null,
    gameState: 'idle',
    matchedPositions: [],
    comboCount: 0,
    showCombo: false,
    showLevelUp: false,
  }));

  const onBreadCrushedRef = useRef(onBreadCrushed);
  onBreadCrushedRef.current = onBreadCrushed;

  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to notify all crushed breads (with combo multiplier)
  const notifyCrushedBreads = useCallback((crushCounts: BreadCrushCounts, comboMultiplier: number = 1) => {
    getAllBreadTypes().forEach((breadType) => {
      const count = crushCounts[breadType];
      if (count > 0) {
        onBreadCrushedRef.current(breadType, count * comboMultiplier);
      }
    });
  }, []);

  const checkLevelUp = useCallback((score: number, level: number, moves: number): { shouldLevelUp: boolean; isGameOver: boolean } => {
    const targetScore = getTargetScore(level);
    if (score >= targetScore) {
      return { shouldLevelUp: true, isGameOver: false };
    }
    if (moves <= 0) {
      return { shouldLevelUp: false, isGameOver: true };
    }
    return { shouldLevelUp: false, isGameOver: false };
  }, []);

  const processMatchesWithInfo = useCallback((
    currentBoard: Board,
    currentScore: number,
    currentMoves: number,
    currentCombo: number,
    currentLevel: number,
  ) => {
    const matchResult = findMatchesWithInfo(currentBoard);
    const matches = matchResult.positions;

    if (matches.length === 0) {
      // Check for level up or game over
      const { shouldLevelUp, isGameOver } = checkLevelUp(currentScore, currentLevel, currentMoves);

      if (shouldLevelUp) {
        const bonusPoints = currentMoves * 20;
        const finalScore = currentScore + bonusPoints;
        const newLevel = currentLevel + 1;

        trackLevelUp(newLevel, finalScore);

        setState((prev) => ({
          ...prev,
          score: finalScore,
          showLevelUp: true,
          gameState: 'levelUp',
        }));

        setTimeout(() => {
          const newBoard = fillBoardWithoutMatches();
          setState((prev) => ({
            ...prev,
            board: newBoard,
            score: 0,
            moves: MOVES_PER_LEVEL,
            level: newLevel,
            targetScore: getTargetScore(newLevel),
            showLevelUp: false,
            gameState: 'idle',
          }));

          // Check for initial matches on new board
          setTimeout(() => {
            setState((prev) => {
              const initialResult = findMatchesWithInfo(prev.board);
              if (initialResult.positions.length > 0) {
                setTimeout(() => {
                  processMatchesWithInfo(prev.board, 0, MOVES_PER_LEVEL, 0, newLevel);
                }, 0);
              }
              return prev;
            });
          }, 500);
        }, LEVEL_UP_DISPLAY_DURATION);
      } else if (isGameOver) {
        trackGameOver(currentLevel, currentScore, 0);
        setState((prev) => ({
          ...prev,
          gameState: 'gameOver',
        }));
      } else {
        // Check for deadlock before returning to idle
        if (!hasPossibleMoves(currentBoard)) {
          const shuffled = shuffleBoard(currentBoard);
          setState((prev) => ({ ...prev, board: shuffled, gameState: 'animating' }));
          setTimeout(() => {
            processMatchesWithInfo(shuffled, currentScore, currentMoves, 0, currentLevel);
          }, CASCADE_DELAY);
        } else {
          setState((prev) => ({
            ...prev,
            gameState: 'idle',
          }));
        }
      }
      return;
    }

    const newCombo = currentCombo + 1;

    if (newCombo > 1) {
      // Clear previous combo timeout to reset timer for new combo
      if (comboTimeoutRef.current) {
        clearTimeout(comboTimeoutRef.current);
      }
      setState((prev) => ({ ...prev, showCombo: true, comboCount: newCombo }));
      comboTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, showCombo: false }));
        comboTimeoutRef.current = null;
      }, COMBO_DISPLAY_DURATION);
    }

    const baseScore = matches.length * 10;
    const comboBonus = newCombo > 1 ? newCombo * 5 : 0;
    const newScore = currentScore + baseScore + comboBonus;

    const { board: boardAfterRemove, crushCounts } = removeMatches(
      currentBoard,
      matches,
      matchResult.specialSpawnPosition,
      matchResult.specialSpawnType,
      matchResult.specialSpawnBreadType
    );

    // Notify each bread type that was crushed (multiplied by combo count)
    notifyCrushedBreads(crushCounts, newCombo);

    setState((prev) => ({
      ...prev,
      board: boardAfterRemove,
      score: newScore,
      matchedPositions: matches,
      comboCount: newCombo,
      gameState: 'animating',
    }));

    setTimeout(() => {
      const boardAfterGravity = applyGravity(boardAfterRemove);

      setState((prev) => ({
        ...prev,
        board: boardAfterGravity,
        matchedPositions: [],
      }));

      setTimeout(() => {
        processMatchesWithInfo(boardAfterGravity, newScore, currentMoves, newCombo, currentLevel);
      }, CASCADE_DELAY);
    }, GRAVITY_DELAY);
  }, [checkLevelUp, notifyCrushedBreads]);

  const trySwap = useCallback((from: Position, to: Position) => {
    setState((prev) => {
      if (prev.gameState === 'animating' || prev.gameState === 'levelUp') return prev;

      const swappedBoard = swapCells(prev.board, from, to);
      const matchResult = findMatchesWithInfo(swappedBoard);

      if (matchResult.positions.length === 0) {
        setTimeout(() => {
          setState((p) => ({
            ...p,
            board: swapCells(p.board, from, to),
            gameState: 'idle',
          }));
        }, SWAP_REJECT_DELAY);

        return {
          ...prev,
          board: swappedBoard,
          gameState: 'animating' as GameState,
          selectedPosition: null,
        };
      } else {
        const newMoves = prev.moves - 1;

        setTimeout(() => {
          processMatchesWithInfo(swappedBoard, prev.score, newMoves, 0, prev.level);
        }, 0);

        return {
          ...prev,
          board: swappedBoard,
          moves: newMoves,
          selectedPosition: null,
          comboCount: 0,
          gameState: 'animating' as GameState,
        };
      }
    });
  }, [processMatchesWithInfo]);

  const selectCell = useCallback((row: number, col: number) => {
    setState((prev) => {
      if (prev.gameState === 'animating' || prev.gameState === 'levelUp') return prev;

      const newPosition: Position = { row, col };

      if (prev.selectedPosition) {
        if (isAdjacent(prev.selectedPosition, newPosition)) {
          trySwap(prev.selectedPosition, newPosition);
          return { ...prev, selectedPosition: null };
        } else {
          return { ...prev, selectedPosition: newPosition, gameState: 'selected' };
        }
      } else {
        return { ...prev, selectedPosition: newPosition, gameState: 'selected' };
      }
    });
  }, [trySwap]);

  const startNewGame = useCallback(() => {
    trackGameStart(1);
    const newBoard = fillBoardWithoutMatches();
    setState({
      board: newBoard,
      score: 0,
      moves: MOVES_PER_LEVEL,
      level: 1,
      targetScore: getTargetScore(1),
      selectedPosition: null,
      gameState: 'idle',
      matchedPositions: [],
      comboCount: 0,
      showCombo: false,
      showLevelUp: false,
    });

    setTimeout(() => {
      processMatchesWithInfo(newBoard, 0, MOVES_PER_LEVEL, 0, 1);
    }, 500);
  }, [processMatchesWithInfo]);

  return {
    ...state,
    isAnimating: state.gameState === 'animating' || state.gameState === 'levelUp',
    selectCell,
    trySwap,
    startNewGame,
  };
}
