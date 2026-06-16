import { useEffect, useState } from 'react';
import { listMyOrders, statusLabel, formatPrice, Order, OrderStatus } from '../services/order';
import OrderTicket from './OrderTicket';
import styles from './OrdersPage.module.css';

const PROGRESS_STEPS: { key: OrderStatus | 'created'; label: string; icon: string }[] = [
  { key: 'created', label: '주문', icon: '🧾' },
  { key: 'paid', label: '결제', icon: '💳' },
  { key: 'preparing', label: '준비', icon: '🔥' },
  { key: 'ready', label: '준비완료', icon: '✅' },
  { key: 'picked_up', label: '픽업', icon: '📦' },
];

function currentStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending': return 0;
    case 'paid': return 1;
    case 'preparing': return 2;
    case 'ready': return 3;
    case 'picked_up': return 4;
    case 'cancelled':
    case 'failed':
      return -1;
    default: return 0;
  }
}

interface Props {
  userId: string;
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
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage({ userId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

  useEffect(() => {
    listMyOrders(userId)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>주문 내역</h1>
      </header>
      <div className={styles.content}>
        {loading ? (
          <p className={styles.placeholder}>불러오는 중…</p>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🧾</div>
            <p>아직 주문 내역이 없습니다</p>
            <p className={styles.emptySub}>메뉴 탭에서 첫 주문을 시작해 보세요</p>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((o) => {
              const stepIdx = currentStepIndex(o.status);
              const isTerminated = o.status === 'cancelled' || o.status === 'failed';
              return (
              <article key={o.id} className={styles.card}>
                <header className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <span className={styles.dateLabel}>{formatTs(o.createdAt)}</span>
                  </div>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: `${STATUS_COLOR[o.status]}1a`,
                      color: STATUS_COLOR[o.status],
                      border: `1px solid ${STATUS_COLOR[o.status]}55`,
                    }}
                  >
                    <span className={styles.statusDot} style={{ background: STATUS_COLOR[o.status] }} />
                    {statusLabel(o.status)}
                  </span>
                </header>

                {o.pickupNumber && o.status !== 'picked_up' && !isTerminated && (
                  <div className={styles.pickupRow}>
                    <span>픽업 번호</span>
                    <strong>{o.pickupNumber}</strong>
                  </div>
                )}

                {!isTerminated && (
                  <div className={styles.progress}>
                    {PROGRESS_STEPS.map((s, i) => (
                      <div
                        key={s.key}
                        className={`${styles.progStep} ${i <= stepIdx ? styles.progDone : ''} ${i === stepIdx ? styles.progCurrent : ''}`}
                      >
                        <div className={styles.progDot}>{i <= stepIdx ? '●' : '○'}</div>
                        <div className={styles.progLabel}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                <ul className={styles.items}>
                  {o.items.map((it, idx) => (
                    <li key={idx}>
                      <span>{it.name}</span>
                      <span>× {it.qty}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.total}>
                  <span>총 {o.itemCount}개</span>
                  <strong>{formatPrice(o.totalAmount)}</strong>
                </div>

                <button
                  type="button"
                  className={styles.printBtn}
                  onClick={() => setTicketOrder(o)}
                >
                  🖨️ 주문표 출력
                </button>
              </article>
              );
            })}
          </div>
        )}
      </div>

      {ticketOrder && (
        <OrderTicket
          order={ticketOrder}
          autoPrint
          onClose={() => setTicketOrder(null)}
        />
      )}
    </div>
  );
}
