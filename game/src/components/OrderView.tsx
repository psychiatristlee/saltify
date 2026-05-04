import { useEffect, useMemo, useState } from 'react';
import { listMenuItems, MenuItem } from '../services/menu';
import { OrderItem, formatPrice } from '../services/order';
import styles from './OrderView.module.css';

interface Props {
  user: { id: string; displayName?: string | null; email?: string | null };
  onClose: () => void;
  onCheckout: (items: OrderItem[]) => void;
}

interface CartLine {
  item: MenuItem;
  qty: number;
}

export default function OrderView({ onClose, onCheckout }: Props) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<'all' | MenuItem['category']>('all');

  useEffect(() => {
    listMenuItems({ onlyAvailable: true })
      .then(setMenus)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (category === 'all' ? menus : menus.filter((m) => m.category === category)),
    [menus, category],
  );

  const lines: CartLine[] = useMemo(
    () =>
      menus
        .filter((m) => cart[m.id] > 0)
        .map((m) => ({ item: m, qty: cart[m.id] })),
    [menus, cart],
  );

  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: string) => setCart((c) => {
    const next = { ...c };
    if (next[id] > 1) next[id] -= 1; else delete next[id];
    return next;
  });

  const handleCheckout = () => {
    if (lines.length === 0) return;
    const items: OrderItem[] = lines.map((l) => ({
      menuItemId: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
      image: l.item.image,
    }));
    onCheckout(items);
  };

  const cats: Array<'all' | MenuItem['category']> = ['all', 'bread', 'drink', 'tteok', 'other'];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.testBanner}>
          🧪 테스트 중 — 실제 결제는 이루어지지 않습니다
        </div>
        <header className={styles.header}>
          <h2>주문하기 (픽업)</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </header>

        <div className={styles.catRow}>
          {cats.map((c) => (
            <button
              key={c}
              className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? '전체' : c === 'bread' ? '🥖 빵' : c === 'drink' ? '☕ 음료' : c === 'tteok' ? '🍡 떡' : '기타'}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <p className={styles.loading}>메뉴 불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>판매 중인 메뉴가 없습니다</p>
          ) : (
            <div className={styles.menuGrid}>
              {filtered.map((m) => {
                const qty = cart[m.id] || 0;
                return (
                  <div key={m.id} className={styles.menuCard}>
                    {m.image ? (
                      <img src={m.image} alt={m.name} className={styles.menuImage} />
                    ) : (
                      <div className={styles.menuImagePh}>—</div>
                    )}
                    <div className={styles.menuBody}>
                      <h3 className={styles.menuName}>{m.name}</h3>
                      {m.description && (
                        <p className={styles.menuDesc}>{m.description}</p>
                      )}
                      <div className={styles.menuFoot}>
                        <span className={styles.menuPrice}>{formatPrice(m.price)}</span>
                        {qty === 0 ? (
                          <button className={styles.addBtn} onClick={() => inc(m.id)}>+ 담기</button>
                        ) : (
                          <div className={styles.qtyBox}>
                            <button className={styles.qtyBtn} onClick={() => dec(m.id)}>−</button>
                            <span className={styles.qtyVal}>{qty}</span>
                            <button className={styles.qtyBtn} onClick={() => inc(m.id)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {itemCount > 0 && (
          <button className={styles.checkoutBar} onClick={handleCheckout}>
            <span>{itemCount}개 · {formatPrice(total)}</span>
            <span>주문하기 →</span>
          </button>
        )}
      </div>
    </div>
  );
}
