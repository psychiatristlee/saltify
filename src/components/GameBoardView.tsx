import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Board, ROWS, COLS, isAdjacent } from '../models/GameBoard';
import { Position, positionKey, SpecialItemType, isSpecialItem } from '../models/BreadCell';
import { BREAD_DATA } from '../models/BreadType';
import BreadCellView from './BreadCellView';
import ParticleEffect from './ParticleEffect';
import ExplosionEffect from './ExplosionEffect';
import styles from './GameBoardView.module.css';

interface Props {
  board: Board;
  selectedPosition: Position | null;
  matchedPositions: Position[];
  isAnimating: boolean;
  moves: number;
  feverActive: boolean;
  isBigMatch?: boolean;
  comboCount?: number;
  onCellTap: (row: number, col: number) => void;
  onSwap: (from: Position, to: Position) => void;
}

interface DragState {
  position: Position;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface SpecialExplosion {
  id: number;
  x: number;
  y: number;
  type: SpecialItemType;
}

export default function GameBoardView({
  board,
  selectedPosition,
  matchedPositions,
  isAnimating,
  moves,
  feverActive,
  isBigMatch = false,
  comboCount = 0,
  onCellTap,
  onSwap,
}: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<Position | null>(null);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);
  const [specialExplosions, setSpecialExplosions] = useState<SpecialExplosion[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const effectIdRef = useRef(0);
  const prevMatchedRef = useRef<string[]>([]);
  const prevBoardRef = useRef<Board | null>(null);

  const matchedSet = useMemo(() => {
    const set = new Set<string>();
    matchedPositions.forEach((p) => set.add(positionKey(p)));
    return set;
  }, [matchedPositions]);

  const cellSize = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const availableWidth = viewportWidth - 32 - 12 - (COLS - 1) * 3;
    return Math.min(Math.floor(availableWidth / COLS), 48);
  }, []);

  const gap = 3;
  const padding = 6;

  // Trigger pop effects and special explosions when matches occur
  useEffect(() => {
    if (matchedPositions.length === 0) {
      prevMatchedRef.current = [];
      prevBoardRef.current = board;
      return;
    }

    const currentKeys = matchedPositions.map(positionKey);
    const newMatches = currentKeys.filter(k => !prevMatchedRef.current.includes(k));

    if (newMatches.length > 0 && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const newEffects: PopEffect[] = [];
      const newExplosions: SpecialExplosion[] = [];

      // Use previous board state to check for special items (they might already be removed from current board)
      const boardToCheck = prevBoardRef.current || board;

      matchedPositions.forEach((pos) => {
        const key = positionKey(pos);
        if (newMatches.includes(key)) {
          const cell = boardToCheck[pos.row]?.[pos.col] || board[pos.row][pos.col];
          const x = rect.left + padding + pos.col * (cellSize + gap) + cellSize / 2;
          const y = rect.top + padding + pos.row * (cellSize + gap) + cellSize / 2;

          // Check if this was a special item
          if (isSpecialItem(cell)) {
            newExplosions.push({
              id: effectIdRef.current++,
              x,
              y,
              type: cell.specialType,
            });
          } else {
            newEffects.push({
              id: effectIdRef.current++,
              x,
              y,
              color: BREAD_DATA[cell.breadType].color,
            });
          }
        }
      });

      if (newEffects.length > 0) {
        setPopEffects(prev => [...prev, ...newEffects]);
      }
      if (newExplosions.length > 0) {
        setSpecialExplosions(prev => [...prev, ...newExplosions]);
      }
    }

    prevMatchedRef.current = currentKeys;
    prevBoardRef.current = board;
  }, [matchedPositions, board, cellSize]);

  const removePopEffect = useCallback((id: number) => {
    setPopEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  // Auto-remove special explosions after animation completes
  useEffect(() => {
    if (specialExplosions.length === 0) return;

    const timer = setTimeout(() => {
      setSpecialExplosions([]);
    }, 800);

    return () => clearTimeout(timer);
  }, [specialExplosions]);

  const handlePointerDown = useCallback((row: number, col: number, e: React.PointerEvent) => {
    if (isAnimating) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      position: { row, col },
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, [isAnimating]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    // Determine the primary direction (horizontal or vertical) based on which has larger movement
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    let constrainedX = dragState.startX;
    let constrainedY = dragState.startY;
    let targetRow = dragState.position.row;
    let targetCol = dragState.position.col;

    const threshold = cellSize * 0.3; // Minimum drag distance to trigger direction

    if (absX > absY && absX > threshold) {
      // Horizontal movement - constrain to horizontal axis
      const maxOffset = cellSize + gap;
      constrainedX = dragState.startX + Math.max(-maxOffset, Math.min(maxOffset, dx));
      targetCol = dx > 0 ? Math.min(dragState.position.col + 1, COLS - 1) : Math.max(dragState.position.col - 1, 0);
    } else if (absY > absX && absY > threshold) {
      // Vertical movement - constrain to vertical axis
      const maxOffset = cellSize + gap;
      constrainedY = dragState.startY + Math.max(-maxOffset, Math.min(maxOffset, dy));
      targetRow = dy > 0 ? Math.min(dragState.position.row + 1, ROWS - 1) : Math.max(dragState.position.row - 1, 0);
    }

    const newDragState = {
      ...dragState,
      currentX: constrainedX,
      currentY: constrainedY,
    };
    setDragState(newDragState);

    const targetPos = { row: targetRow, col: targetCol };
    if (isAdjacent(dragState.position, targetPos)) {
      setDropTarget(targetPos);
    } else {
      setDropTarget(null);
    }
  }, [dragState, cellSize, gap]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const threshold = cellSize * 0.3;

    // Determine target based on cardinal direction
    let targetPos: Position | null = null;

    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      const targetCol = dx > 0
        ? Math.min(dragState.position.col + 1, COLS - 1)
        : Math.max(dragState.position.col - 1, 0);
      targetPos = { row: dragState.position.row, col: targetCol };
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      const targetRow = dy > 0
        ? Math.min(dragState.position.row + 1, ROWS - 1)
        : Math.max(dragState.position.row - 1, 0);
      targetPos = { row: targetRow, col: dragState.position.col };
    }

    if (targetPos && isAdjacent(dragState.position, targetPos)) {
      onSwap(dragState.position, targetPos);
    } else {
      // If no significant drag, treat as tap
      if (absX < 5 && absY < 5) {
        onCellTap(dragState.position.row, dragState.position.col);
      }
    }

    setDragState(null);
    setDropTarget(null);
  }, [dragState, cellSize, onSwap, onCellTap]);

  const getDragOffset = useCallback((row: number, col: number): { x: number; y: number } | null => {
    if (!dragState || dragState.position.row !== row || dragState.position.col !== col) {
      return null;
    }
    return {
      x: dragState.currentX - dragState.startX,
      y: dragState.currentY - dragState.startY,
    };
  }, [dragState]);

  return (
    <>
      <div
        ref={boardRef}
        className={`${styles.board}${isBigMatch ? ` ${styles.boardShake}` : ''}${feverActive ? ` ${styles.feverGlow}` : moves <= 3 ? ` ${styles.urgentCritical}` : moves <= 5 ? ` ${styles.urgentLow}` : ''}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className={styles.row}>
            {Array.from({ length: COLS }, (_, col) => {
              const cell = board[row][col];
              const isSelected =
                selectedPosition?.row === row && selectedPosition?.col === col;
              const isMatched = matchedSet.has(positionKey({ row, col }));
              const isDragging = dragState?.position.row === row && dragState?.position.col === col;
              const isDropTargetCell = dropTarget?.row === row && dropTarget?.col === col;

              return (
                <BreadCellView
                  key={`${row}-${col}`}
                  cell={cell}
                  isSelected={isSelected}
                  isMatched={isMatched}
                  isDragging={isDragging}
                  isDropTarget={isDropTargetCell}
                  cellSize={cellSize}
                  dragOffset={getDragOffset(row, col)}
                  onTap={() => {}}
                  onDragStart={(e) => handlePointerDown(row, col, e)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {popEffects.map((effect) => (
        <ParticleEffect
          key={effect.id}
          type="pop"
          x={effect.x}
          y={effect.y}
          color={effect.color}
          comboLevel={comboCount}
          onComplete={() => removePopEffect(effect.id)}
        />
      ))}

      {specialExplosions.map((explosion) => (
        <ExplosionEffect
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          type={explosion.type}
        />
      ))}
    </>
  );
}
