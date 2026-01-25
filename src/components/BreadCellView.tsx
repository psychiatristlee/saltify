import { memo } from 'react';
import { BreadCell } from '../models/BreadCell';
import { BreadType, BREAD_EMOJI, BREAD_DISPLAY_NAME, BREAD_COLOR } from '../models/BreadType';
import styles from './BreadCellView.module.css';

const BREAD_IMAGE: Record<BreadType, string> = {
  [BreadType.SaltBread]: '/breads/salt-bread.png',
  [BreadType.Croissant]: '/breads/croissant.png',
  [BreadType.Baguette]: '/breads/baguette.png',
  [BreadType.MelonBread]: '/breads/melon-bread.png',
  [BreadType.RedBeanBread]: '/breads/red-bean-bread.png',
  [BreadType.CreamBread]: '/breads/cream-bread.png',
};

interface Props {
  cell: BreadCell;
  isSelected: boolean;
  isMatched: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  cellSize: number;
  dragOffset: { x: number; y: number } | null;
  onTap: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  useImages: boolean;
}

export default memo(function BreadCellView({
  cell,
  isSelected,
  isMatched,
  isDragging,
  isDropTarget,
  cellSize,
  dragOffset,
  onTap,
  onDragStart,
  useImages,
}: Props) {
  const className = [
    styles.cell,
    isSelected ? styles.selected : '',
    isMatched ? styles.matched : '',
    isDragging ? styles.dragging : '',
    isDropTarget ? styles.dropTarget : '',
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    width: cellSize,
    height: cellSize,
    backgroundColor: BREAD_COLOR[cell.breadType],
  };

  if (isDragging && dragOffset) {
    style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.15)`;
    style.zIndex = 100;
  }

  return (
    <div
      className={className}
      style={style}
      onClick={onTap}
      onPointerDown={onDragStart}
    >
      {useImages ? (
        <img
          src={BREAD_IMAGE[cell.breadType]}
          alt={BREAD_DISPLAY_NAME[cell.breadType]}
          className={styles.icon}
          style={{ width: cellSize * 0.85, height: cellSize * 0.85 }}
          draggable={false}
        />
      ) : (
        <span className={styles.emoji} style={{ fontSize: cellSize * 0.5 }}>
          {BREAD_EMOJI[cell.breadType]}
        </span>
      )}
    </div>
  );
});
