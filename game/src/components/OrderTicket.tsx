import { useEffect } from 'react';
import { Order, formatPrice, statusLabel } from '../services/order';
import styles from './OrderTicket.module.css';

interface Props {
  order: Order;
  /** When true, fire window.print() once after mount and close on afterprint. */
  autoPrint?: boolean;
  onClose: () => void;
}

function fmtTs(t: { toDate?: () => Date } | null | undefined): string {
  if (!t || typeof t.toDate !== 'function') return '-';
  return t.toDate().toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderTicket({ order, autoPrint = true, onClose }: Props) {
  useEffect(() => {
    if (!autoPrint) return;
    // Defer one tick so the ticket has painted before the browser snapshots it.
    const t = setTimeout(() => window.print(), 50);
    const onAfter = () => onClose();
    window.addEventListener('afterprint', onAfter);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', onAfter);
    };
  }, [autoPrint, onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.controlsNoPrint}>
          <button type="button" className={styles.ctrlBtn} onClick={() => window.print()}>
            🖨️ 인쇄
          </button>
          <button type="button" className={styles.ctrlClose} onClick={onClose}>닫기</button>
        </div>

        <article className={styles.ticket} data-ticket="order">
          <header className={styles.head}>
            <div className={styles.shopName}>솔트빵 Saltify</div>
            <div className={styles.shopSub}>YEONNAM-DONG · HONGDAE</div>
            <div className={styles.shopRule} />
          </header>

          <div className={styles.pickupBlock}>
            <div className={styles.pickupLabel}>픽업 번호 · Pickup No.</div>
            <div className={styles.pickupNumber}>
              {order.pickupNumber || '—'}
            </div>
            <div className={styles.statusLine}>{statusLabel(order.status)}</div>
          </div>

          <div className={styles.metaGrid}>
            <span>주문 일시</span><span>{fmtTs(order.createdAt)}</span>
            <span>픽업 예정일</span><span>{order.pickupDate}</span>
            <span>고객</span><span>{order.userName || order.userEmail || '익명'}</span>
            {order.customerPhone && (<><span>연락처</span><span>{order.customerPhone}</span></>)}
          </div>

          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th className={styles.thName}>품목</th>
                <th className={styles.thQty}>수량</th>
                <th className={styles.thPrice}>금액</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td className={styles.tdQty}>{it.qty}</td>
                  <td className={styles.tdPrice}>{formatPrice(it.price * it.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>합계 ({order.itemCount}개)</td>
                <td className={styles.tdPrice}>{formatPrice(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {order.notes && (
            <div className={styles.notes}>
              <strong>요청사항:</strong> {order.notes}
            </div>
          )}

          <footer className={styles.foot}>
            <div>주문번호 · Order ID: {order.id}</div>
            <div className={styles.thanks}>픽업 시 위 픽업 번호를 알려주세요</div>
          </footer>
        </article>
      </div>
    </div>
  );
}
