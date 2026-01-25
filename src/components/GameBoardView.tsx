import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Board, ROWS, COLS, isAdjacent } from '../models/GameBoard';
import { Position, positionKey } from '../models/BreadCell';
import { BREAD_COLOR } from '../models/BreadType';
import BreadCellView from './BreadCellView';
import ParticleEffect from './ParticleEffect';
import styles from './GameBoardView.module.css';

interface Props {
  board: Board;
  selectedPosition: Position | null;
  matchedPositions: Position[];
  isAnimating: boolean;
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

export default function GameBoardView({
  board,
  selectedPosition,
  matchedPositions,
  isAnimating,
  onCellTap,
  onSwap,
}: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<Position | null>(null);
  const [useImages, setUseImages] = useState(false);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const effectIdRef = useRef(0);
  const prevMatchedRef = useRef<string[]>([]);

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

  // Check if images exist
  useEffect(() => {
    fetch('/breads/salt-bread.png', { method: 'HEAD' })
      .then((res) => setUseImages(res.ok))
      .catch(() => setUseImages(false));
  }, []);

  // Trigger pop effects when matches occur
  useEffect(() => {
    if (matchedPositions.length === 0) {
      prevMatchedRef.current = [];
      return;
    }

    const currentKeys = matchedPositions.map(positionKey);
    const newMatches = currentKeys.filter(k => !prevMatchedRef.current.includes(k));

    if (newMatches.length > 0 && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const newEffects: PopEffect[] = [];

      matchedPositions.forEach((pos) => {
        const key = positionKey(pos);
        if (newMatches.includes(key)) {
          const cell = board[pos.row][pos.col];
          const x = rect.left + padding + pos.col * (cellSize + gap) + cellSize / 2;
          const y = rect.top + padding + pos.row * (cellSize + gap) + cellSize / 2;

          newEffects.push({
            id: effectIdRef.current++,
            x,
            y,
            color: BREAD_COLOR[cell.breadType],
          });
        }
      });

      setPopEffects(prev => [...prev, ...newEffects]);
    }

    prevMatchedRef.current = currentKeys;
  }, [matchedPositions, board, cellSize]);

  const removePopEffect = useCallback((id: number) => {
    setPopEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const getPositionFromPoint = useCallback((x: number, y: number): Position | null => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const relX = x - rect.left - padding;
    const relY = y - rect.top - padding;

    const col = Math.floor(relX / (cellSize + gap));
    const row = Math.floor(relY / (cellSize + gap));

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      return { row, col };
    }
    return null;
  }, [cellSize]);

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

    const newDragState = {
      ...dragState,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    setDragState(newDragState);

    const targetPos = getPositionFromPoint(e.clientX, e.clientY);
    if (targetPos && isAdjacent(dragState.position, targetPos)) {
      setDropTarget(targetPos);
    } else {
      setDropTarget(null);
    }
  }, [dragState, getPositionFromPoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const targetPos = getPositionFromPoint(e.clientX, e.clientY);

    if (targetPos && isAdjacent(dragState.position, targetPos)) {
      onSwap(dragState.position, targetPos);
    } else {
      const dx = Math.abs(e.clientX - dragState.startX);
      const dy = Math.abs(e.clientY - dragState.startY);
      if (dx < 5 && dy < 5) {
        onCellTap(dragState.position.row, dragState.position.col);
      }
    }

    setDragState(null);
    setDropTarget(null);
  }, [dragState, getPositionFromPoint, onSwap, onCellTap]);

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
        className={styles.board}
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
                  useImages={useImages}
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
          onComplete={() => removePopEffect(effect.id)}
        />
      ))}
    </>
  );
}
