import { useEffect, useMemo, useState } from 'react';
import { listMenuItems, MenuItem, MenuCategory } from '../services/menu';
import { OrderItem, formatPrice } from '../services/order';
import styles from './MenuHome.module.css';

interface Props {
  onCheckout: (items: OrderItem[]) => void | Promise<void>;
}

type CategoryFilter = 'all' | MenuCategory;

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'bread', label: '🥖 빵' },
  { id: 'drink', label: '☕ 음료' },
  { id: 'tteok', label: '🍡 떡' },
  { id: 'other', label: '기타' },
];

export default function MenuHome({ onCheckout }: Props) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    listMenuItems({ onlyAvailable: true })
      .then(setMenus)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (category === 'all' ? menus : menus.filter((m) => m.category === category)),
    [menus, category],
  );

  const lines = useMemo(
    () => menus.filter((m) => cart[m.id] > 0).map((m) => ({ item: m, qty: cart[m.id] })),
    [menus, cart],
  );

  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });

  const handleCheckout = async () => {
    if (lines.length === 0) return;
    const items: OrderItem[] = lines.map((l) => ({
      menuItemId: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
      image: l.item.image,
    }));
    await onCheckout(items);
  };

  return (
    <div className={styles.page}>
      <div className={styles.testBanner}>🧪 테스트 중 — 실제 결제는 이루어지지 않습니다</div>

      <header className={styles.header}>
        <img src="/brandings/header.png" alt="솔트빵" className={styles.logo} />
        <button
          type="button"
          className={styles.cartBtn}
          onClick={() => setShowCart(true)}
          aria-label="장바구니"
        >
          🛒
          {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
        </button>
      </header>

      <div className={styles.catRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.catBtn} ${category === c.id ? styles.catActive : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {loading ? (
          <p className={styles.placeholder}>메뉴 불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.placeholder}>판매 중인 메뉴가 없습니다</p>
        ) : (
          <div className={styles.menuGrid}>
            {filtered.map((m) => {
              const qty = cart[m.id] || 0;
              return (
                <article key={m.id} className={styles.menuCard}>
                  {m.image ? (
                    <img src={m.image} alt={m.name} className={styles.menuImage} />
                  ) : (
                    <div className={styles.menuImagePh}>—</div>
                  )}
                  <div className={styles.menuBody}>
                    <h3 className={styles.menuName}>{m.name}</h3>
                    {m.description && <p className={styles.menuDesc}>{m.description}</p>}
                    <div className={styles.menuFoot}>
                      <span className={styles.menuPrice}>{formatPrice(m.price)}</span>
                      {qty === 0 ? (
                        <button type="button" className={styles.addBtn} onClick={() => inc(m.id)}>
                          + 담기
                        </button>
                      ) : (
                        <div className={styles.qtyBox}>
                          <button type="button" className={styles.qtyBtn} onClick={() => dec(m.id)}>
                            −
                          </button>
                          <span className={styles.qtyVal}>{qty}</span>
                          <button type="button" className={styles.qtyBtn} onClick={() => inc(m.id)}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <button
          type="button"
          className={styles.checkoutBar}
          onClick={() => setShowCart(true)}
        >
          <span className={styles.checkoutCount}>
            <span className={styles.checkoutCountPill}>{itemCount}</span>
            {formatPrice(total)}
          </span>
          <span>장바구니 →</span>
        </button>
      )}

      {showCart && (
        <CartSheet
          lines={lines}
          total={total}
          itemCount={itemCount}
          onClose={() => setShowCart(false)}
          onInc={inc}
          onDec={dec}
          onCheckout={async () => {
            setShowCart(false);
            await handleCheckout();
          }}
        />
      )}
    </div>
  );
}

interface CartSheetProps {
  lines: { item: MenuItem; qty: number }[];
  total: number;
  itemCount: number;
  onClose: () => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onCheckout: () => void;
}

function CartSheet({ lines, total, itemCount, onClose, onInc, onDec, onCheckout }: CartSheetProps) {
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <header className={styles.sheetHeader}>
          <h2>장바구니</h2>
          <button type="button" className={styles.sheetClose} onClick={onClose}>
            ✕
          </button>
        </header>
        <div className={styles.sheetBody}>
          {lines.length === 0 ? (
            <p className={styles.placeholder}>장바구니가 비었습니다</p>
          ) : (
            <ul className={styles.cartList}>
              {lines.map((l) => (
                <li key={l.item.id} className={styles.cartRow}>
                  {l.item.image ? (
                    <img src={l.item.image} alt="" className={styles.cartThumb} />
                  ) : (
                    <div className={styles.cartThumbPh}>—</div>
                  )}
                  <div className={styles.cartInfo}>
                    <div className={styles.cartName}>{l.item.name}</div>
                    <div className={styles.cartPrice}>{formatPrice(l.item.price)}</div>
                  </div>
                  <div className={styles.qtyBox}>
                    <button type="button" className={styles.qtyBtn} onClick={() => onDec(l.item.id)}>
                      −
                    </button>
                    <span className={styles.qtyVal}>{l.qty}</span>
                    <button type="button" className={styles.qtyBtn} onClick={() => onInc(l.item.id)}>
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lines.length > 0 && (
          <footer className={styles.sheetFooter}>
            <div className={styles.totalRow}>
              <span>총 {itemCount}개</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button type="button" className={styles.checkoutBtn} onClick={onCheckout}>
              결제하기 →
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
