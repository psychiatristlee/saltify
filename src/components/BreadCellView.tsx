import { memo } from 'react';
import { BreadCell } from '../models/BreadCell';
import { BREAD_DATA } from '../models/BreadType';
import styles from './BreadCellView.module.css';

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
}: Props) {
  const breadInfo = BREAD_DATA[cell.breadType];

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
    backgroundColor: breadInfo.color,
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
      <img
        src={breadInfo.image}
        alt={breadInfo.nameKo}
        className={styles.icon}
        style={{ width: cellSize * 0.85, height: cellSize * 0.85 }}
        draggable={false}
      />
    </div>
  );
});
