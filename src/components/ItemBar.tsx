import { ItemType, ITEMS, Inventory } from '../models/Item';
import styles from './ItemBar.module.css';

interface Props {
  inventory: Inventory;
  isAnimating: boolean;
  onUseItem: (type: ItemType) => void;
}

export default function ItemBar({ inventory, isAnimating, onUseItem }: Props) {
  return (
    <div className={styles.container}>
      {ITEMS.map((item) => {
        const count = inventory[item.type];
        const canUse = count > 0;

        return (
          <button
            key={item.type}
            className={`${styles.itemButton}${canUse ? ` ${styles.available}` : ''}`}
            disabled={!canUse || isAnimating}
            onClick={() => canUse && onUseItem(item.type)}
          >
            <span className={styles.emoji}>{item.emoji}</span>
            <span className={`${styles.count}${count > 0 ? ` ${styles.hasItems}` : ''}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
