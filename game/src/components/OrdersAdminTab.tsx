import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import {
  listOrders, statusLabel, formatPrice, Order, OrderStatus,
} from '../services/order';
import styles from './AdminPage.module.css';
import dashStyles from './OrdersAdminTab.module.css';

const STATUS_GROUPS: Array<{ label: string; statuses: OrderStatus[] }> = [
  { label: '결제 완료 / 준비 중', statuses: ['paid', 'preparing'] },
  { label: '픽업 가능', statuses: ['ready'] },
  { label: '픽업 완료', statuses: ['picked_up'] },
  { label: '취소 / 실패', statuses: ['cancelled', 'failed'] },
];

const ALL_STATUSES: OrderStatus[] = [
  'paid', 'preparing', 'ready', 'picked_up', 'cancelled', 'failed',
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#999',
  paid: '#FF8C00',
  preparing: '#FB8C00',
  ready: '#43A047',
  picked_up: '#888',
  cancelled: '#C62828',
  failed: '#C62828',
};

function fmtTs(t: { toDate?: () => Date } | null | undefined): string {
  if (!t || typeof t.toDate !== 'function') return '-';
  return t.toDate().toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function todayKst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

export default function OrdersAdminTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupDate, setPickupDate] = useState<string>(todayKst());
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await listOrders({
        pickupDate,
        status: ALL_STATUSES,
        max: 200,
      });
      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupDate]);

  const handleStatusChange = async (
    orderId: string, to: 'preparing' | 'ready' | 'picked_up' | 'cancelled',
  ) => {
    if (to === 'cancelled' && !confirm('이 주문을 취소하시겠습니까? (Toss 환불은 별도 처리)')) return;
    setBusy(orderId);
    try {
      const call = httpsCallable<
        { orderId: string; to: typeof to; staffName?: string },
        { ok: boolean }
      >(functions, 'markOrderStatus');
      await call({ orderId, to });
      await reload();
    } catch (err) {
      alert('상태 변경 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    } finally {
      setBusy(null);
    }
  };

  const handleRefund = async (orderId: string) => {
    const reason = prompt('환불 사유를 입력하세요');
    if (!reason) return;
    setBusy(orderId);
    try {
      const call = httpsCallable<
        { orderId: string; reason: string },
        { ok: boolean; refundedAmount?: number }
      >(functions, 'cancelOrderRefund');
      const res = await call({ orderId, reason });
      alert(`환불 처리됨: ${res.data.refundedAmount?.toLocaleString() || '?'}원`);
      await reload();
    } catch (err) {
      alert('환불 실패: ' + (err instanceof Error ? err.message : 'unknown'));
    } finally {
      setBusy(null);
    }
  };

  const grouped = STATUS_GROUPS.map((g) => ({
    ...g,
    items: orders.filter((o) => g.statuses.includes(o.status)),
  }));

  return (
    <div className={styles.section}>
      <div className={dashStyles.testBanner}>
        🧪 테스트 중 — 실제 결제는 이루어지지 않습니다 (목업 모드)
      </div>
      <div className={styles.sectionHeader}>
        <h3>주문 ({orders.length})</h3>
        <div className={dashStyles.dateRow}>
          <label>픽업일</label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className={styles.input}
            style={{ width: 'auto', margin: 0 }}
          />
          <button className={styles.smallButton} onClick={reload}>↻</button>
        </div>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : orders.length === 0 ? (
        <p className={styles.emptyHint}>해당 날짜에 주문이 없습니다.</p>
      ) : (
        <div className={dashStyles.groups}>
          {grouped.map((g) => (
            g.items.length === 0 ? null : (
              <section key={g.label} className={dashStyles.group}>
                <h4 className={dashStyles.groupTitle}>{g.label} · {g.items.length}건</h4>
                <div className={dashStyles.cards}>
                  {g.items.map((o) => (
                    <article key={o.id} className={dashStyles.card}>
                      <header className={dashStyles.cardHeader}>
                        {o.pickupNumber ? (
                          <span className={dashStyles.pickupBig}>{o.pickupNumber}</span>
                        ) : (
                          <span className={dashStyles.pickupBig} style={{ color: '#bbb' }}>—</span>
                        )}
                        <span
                          className={dashStyles.statusBadge}
                          style={{ background: STATUS_COLOR[o.status] }}
                        >
                          {statusLabel(o.status)}
                        </span>
                      </header>

                      <div className={dashStyles.userRow}>
                        <strong>{o.userName || o.userEmail || '익명'}</strong>
                        {o.customerPhone && <span>· {o.customerPhone}</span>}
                      </div>

                      <ul className={dashStyles.items}>
                        {o.items.map((it, idx) => (
                          <li key={idx}>
                            <span>{it.name}</span>
                            <span>× {it.qty}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={dashStyles.totalRow}>
                        <span>총 {o.itemCount}개</span>
                        <strong>{formatPrice(o.totalAmount)}</strong>
                      </div>

                      <div className={dashStyles.timeline}>
                        <span>주문 {fmtTs(o.createdAt)}</span>
                        <span>결제 {fmtTs(o.paidAt)}</span>
                        <span>준비 {fmtTs(o.readyAt)}</span>
                        <span>픽업 {fmtTs(o.pickedUpAt)}</span>
                      </div>

                      <div className={dashStyles.actions}>
                        {o.status === 'paid' && (
                          <button
                            className={dashStyles.actionBtn}
                            onClick={() => handleStatusChange(o.id, 'preparing')}
                            disabled={busy === o.id}
                          >
                            🔥 준비 시작
                          </button>
                        )}
                        {(o.status === 'paid' || o.status === 'preparing') && (
                          <button
                            className={dashStyles.actionBtn}
                            style={{ background: '#43A047' }}
                            onClick={() => handleStatusChange(o.id, 'ready')}
                            disabled={busy === o.id}
                          >
                            ✅ 준비 완료
                          </button>
                        )}
                        {o.status === 'ready' && (
                          <button
                            className={dashStyles.actionBtn}
                            style={{ background: '#1976D2' }}
                            onClick={() => handleStatusChange(o.id, 'picked_up')}
                            disabled={busy === o.id}
                          >
                            📦 픽업 처리
                          </button>
                        )}
                        {(o.status === 'paid' || o.status === 'preparing' || o.status === 'ready') && (
                          <button
                            className={`${dashStyles.actionBtn} ${dashStyles.danger}`}
                            onClick={() => handleRefund(o.id)}
                            disabled={busy === o.id}
                          >
                            환불
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          ))}
        </div>
      )}
    </div>
  );
}
