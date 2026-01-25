import { useState, useCallback, useRef } from 'react';
import { Position } from '../models/BreadCell';
import {
  Board,
  fillBoardWithoutMatches,
  findMatches,
  swapCells,
  removeMatches,
  applyGravity,
  isAdjacent,
} from '../models/GameBoard';

export type GameState = 'idle' | 'selected' | 'animating' | 'levelUp' | 'gameOver';

const MOVES_PER_LEVEL = 30;
const SWAP_REJECT_DELAY = 300;
const GRAVITY_DELAY = 400;
const CASCADE_DELAY = 300;
const COMBO_DISPLAY_DURATION = 800;
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

export function useGameViewModel(onSaltBreadCrushed: (count: number) => void) {
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

  const onSaltBreadCrushedRef = useRef(onSaltBreadCrushed);
  onSaltBreadCrushedRef.current = onSaltBreadCrushed;

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

  const processMatches = useCallback((
    matches: Position[],
    currentBoard: Board,
    currentScore: number,
    currentMoves: number,
    currentCombo: number,
    currentLevel: number,
  ) => {
    const newCombo = currentCombo + 1;

    if (newCombo > 1) {
      setState((prev) => ({ ...prev, showCombo: true, comboCount: newCombo }));
      setTimeout(() => {
        setState((prev) => ({ ...prev, showCombo: false }));
      }, COMBO_DISPLAY_DURATION);
    }

    const baseScore = matches.length * 10;
    const comboBonus = newCombo > 1 ? newCombo * 5 : 0;
    const newScore = currentScore + baseScore + comboBonus;

    const { board: boardAfterRemove, saltBreadCount } = removeMatches(currentBoard, matches);
    if (saltBreadCount > 0) {
      onSaltBreadCrushedRef.current(saltBreadCount);
    }

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
        const newMatches = findMatches(boardAfterGravity);
        if (newMatches.length > 0) {
          processMatches(newMatches, boardAfterGravity, newScore, currentMoves, newCombo, currentLevel);
        } else {
          // Check for level up or game over
          const { shouldLevelUp, isGameOver } = checkLevelUp(newScore, currentLevel, currentMoves);

          if (shouldLevelUp) {
            // Level up with bonus points for remaining moves
            const bonusPoints = currentMoves * 20;
            const finalScore = newScore + bonusPoints;
            const newLevel = currentLevel + 1;

            setState((prev) => ({
              ...prev,
              score: finalScore,
              showLevelUp: true,
              gameState: 'levelUp',
            }));

            // After level up animation, start new level
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
                const initialMatches = findMatches(newBoard);
                if (initialMatches.length > 0) {
                  processMatches(initialMatches, newBoard, 0, MOVES_PER_LEVEL, 0, newLevel);
                }
              }, 500);
            }, LEVEL_UP_DISPLAY_DURATION);
          } else if (isGameOver) {
            setState((prev) => ({
              ...prev,
              gameState: 'gameOver',
            }));
          } else {
            setState((prev) => ({
              ...prev,
              gameState: 'idle',
            }));
          }
        }
      }, CASCADE_DELAY);
    }, GRAVITY_DELAY);
  }, [checkLevelUp]);

  const trySwap = useCallback((from: Position, to: Position) => {
    setState((prev) => {
      if (prev.gameState === 'animating' || prev.gameState === 'levelUp') return prev;

      const swappedBoard = swapCells(prev.board, from, to);
      const matches = findMatches(swappedBoard);

      if (matches.length === 0) {
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
          processMatches(matches, swappedBoard, prev.score, newMoves, 0, prev.level);
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
  }, [processMatches]);

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
      const initialMatches = findMatches(newBoard);
      if (initialMatches.length > 0) {
        processMatches(initialMatches, newBoard, 0, MOVES_PER_LEVEL, 0, 1);
      }
    }, 500);
  }, [processMatches]);

  return {
    ...state,
    isAnimating: state.gameState === 'animating' || state.gameState === 'levelUp',
    selectCell,
    trySwap,
    startNewGame,
  };
}
