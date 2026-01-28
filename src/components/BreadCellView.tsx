import { memo } from 'react';
import { BreadCell, SpecialItemType, isSpecialItem } from '../models/BreadCell';
import { BREAD_DATA } from '../models/BreadType';
import styles from './BreadCellView.module.css';

// Special item images and info
const SPECIAL_ITEM_INFO: Record<SpecialItemType, { image: string; name: string; color: string }> = {
  [SpecialItemType.None]: { image: '', name: '', color: '' },
  [SpecialItemType.Matcha]: {
    image: '/brandings/cube-matcha-cream.png',
    name: '말차 소금빵',
    color: '#a8d5a2',
  },
  [SpecialItemType.Choco]: {
    image: '/brandings/cube-choco-cream.png',
    name: '초코 크림 큐브빵',
    color: '#8b4513',
  },
  [SpecialItemType.MilkTea]: {
    image: '/breads/milktea.png',
    name: '밀크티',
    color: '#f5e6d3',
  },
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
  const isSpecial = isSpecialItem(cell);
  const specialInfo = isSpecial ? SPECIAL_ITEM_INFO[cell.specialType] : null;

  const className = [
    styles.cell,
    isSelected ? styles.selected : '',
    isMatched ? styles.matched : '',
    isDragging ? styles.dragging : '',
    isDropTarget ? styles.dropTarget : '',
    isSpecial ? styles.special : '',
    isSpecial && cell.specialType === SpecialItemType.Matcha ? styles.specialMatcha : '',
    isSpecial && cell.specialType === SpecialItemType.Choco ? styles.specialChoco : '',
    isSpecial && cell.specialType === SpecialItemType.MilkTea ? styles.specialMilkTea : '',
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    width: cellSize,
    height: cellSize,
    backgroundColor: isSpecial && specialInfo ? specialInfo.color : breadInfo.color,
  };

  if (isDragging && dragOffset) {
    style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.15)`;
    style.zIndex = 100;
  }

  const imageSrc = isSpecial && specialInfo ? specialInfo.image : breadInfo.image;
  const imageAlt = isSpecial && specialInfo ? specialInfo.name : breadInfo.nameKo;

  return (
    <div
      className={className}
      style={style}
      onClick={onTap}
      onPointerDown={onDragStart}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className={styles.icon}
        style={{ width: cellSize * 0.85, height: cellSize * 0.85 }}
        draggable={false}
      />
    </div>
  );
});
