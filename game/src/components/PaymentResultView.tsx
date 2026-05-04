import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import styles from './OrderView.module.css';
import resultStyles from './PaymentResultView.module.css';

interface Props {
  orderId: string;
  paymentKey: string;
  amount: number;
  onDone: () => void;
}

/**
 * Mounted when Toss redirects back to /?payment=success&orderId=...&paymentKey=...&amount=...
 * Calls Cloud Function `confirmTossPayment` which verifies + assigns pickup number.
 */
export default function PaymentResultView({ orderId, paymentKey, amount, onDone }: Props) {
  const [state, setState] = useState<'confirming' | 'success' | 'failed'>('confirming');
  const [pickupNumber, setPickupNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const call = httpsCallable<
          { orderId: string; paymentKey: string; amount: number },
          { ok: boolean; pickupNumber?: string; receiptUrl?: string; alreadyConfirmed?: boolean }
        >(functions, 'confirmTossPayment');
        const res = await call({ orderId, paymentKey, amount });
        if (cancelled) return;
        if (res.data.ok) {
          setPickupNumber(res.data.pickupNumber || null);
          setReceiptUrl(res.data.receiptUrl || null);
          setState('success');
        } else {
          setState('failed');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '결제 확인 실패');
        setState('failed');
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, paymentKey, amount]);

  return (
    <div className={styles.overlay} onClick={state !== 'confirming' ? onDone : undefined}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={resultStyles.center}>
          {state === 'confirming' && (
            <>
              <div className={resultStyles.spinner} />
              <p>결제 확인 중...</p>
            </>
          )}
          {state === 'success' && (
            <>
              <div className={resultStyles.bigEmoji}>✅</div>
              <h2 className={resultStyles.title}>결제가 완료되었습니다</h2>
              {pickupNumber && (
                <div className={resultStyles.pickupBox}>
                  <span className={resultStyles.pickupLabel}>픽업 번호</span>
                  <span className={resultStyles.pickupNumber}>{pickupNumber}</span>
                  <span className={resultStyles.pickupHint}>
                    매장에서 이 번호를 알려주세요
                  </span>
                </div>
              )}
              {receiptUrl && (
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer"
                   className={resultStyles.receiptLink}>
                  📄 영수증 보기
                </a>
              )}
              <button className={resultStyles.primaryBtn} onClick={onDone}>확인</button>
            </>
          )}
          {state === 'failed' && (
            <>
              <div className={resultStyles.bigEmoji}>❌</div>
              <h2 className={resultStyles.title}>결제 처리 실패</h2>
              {error && <p className={resultStyles.errMsg}>{error}</p>}
              <button className={resultStyles.primaryBtn} onClick={onDone}>닫기</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
