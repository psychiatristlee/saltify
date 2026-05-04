import { useEffect, useState } from 'react';
import { listMyOrders, statusLabel, formatPrice, Order, OrderStatus } from '../services/order';
import styles from './OrderView.module.css';
import myStyles from './MyOrdersView.module.css';

interface Props {
  userId: string;
  onClose: () => void;
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#999',
  paid: '#FF8C00',
  preparing: '#FB8C00',
  ready: '#43A047',
  picked_up: '#888',
  cancelled: '#C62828',
  failed: '#C62828',
};

function formatTs(t: { toDate?: () => Date } | null | undefined): string {
  if (!t || typeof t.toDate !== 'function') return '-';
  return t.toDate().toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyOrdersView({ userId, onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyOrders(userId).then((list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [userId]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.testBanner}>
          🧪 테스트 중 — 실제 결제는 이루어지지 않습니다
        </div>
        <header className={styles.header}>
          <h2>내 주문 내역</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </header>

        <div className={styles.content}>
          {loading ? (
            <p className={styles.loading}>불러오는 중...</p>
          ) : orders.length === 0 ? (
            <p className={styles.empty}>아직 주문 내역이 없습니다</p>
          ) : (
            <div className={myStyles.list}>
              {orders.map((o) => (
                <article key={o.id} className={myStyles.card}>
                  <header className={myStyles.cardHeader}>
                    <span className={myStyles.dateLabel}>{formatTs(o.createdAt)}</span>
                    <span
                      className={myStyles.statusBadge}
                      style={{ background: STATUS_COLOR[o.status] }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </header>

                  {o.pickupNumber && o.status !== 'picked_up' && o.status !== 'cancelled' && (
                    <div className={myStyles.pickupRow}>
                      <span>픽업 번호</span>
                      <strong>{o.pickupNumber}</strong>
                    </div>
                  )}

                  <ul className={myStyles.items}>
                    {o.items.map((it, idx) => (
                      <li key={idx}>
                        <span>{it.name}</span>
                        <span>× {it.qty}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={myStyles.total}>
                    <span>총 {o.itemCount}개</span>
                    <strong>{formatPrice(o.totalAmount)}</strong>
                  </div>

                  <div className={myStyles.timeline}>
                    <span>주문 {formatTs(o.createdAt)}</span>
                    <span>결제 {formatTs(o.paidAt)}</span>
                    <span>준비 완료 {formatTs(o.readyAt)}</span>
                    <span>픽업 {formatTs(o.pickedUpAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
