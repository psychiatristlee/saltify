/**
 * Order / pickup Cloud Functions.
 *
 * - confirmTossPayment: customer hands us the paymentKey + orderId returned
 *   by Toss after the user finished the hosted payment page; we call Toss's
 *   /v1/payments/confirm with the secret key, store the result in
 *   orders/{id}/payments/{paymentKey}, flip status → 'paid', and assign
 *   a 4-digit pickup number from the daily counter.
 *
 * - markOrderStatus: staff/admin transition (preparing / ready / picked_up
 *   / cancelled). Adds an event log entry + denormalized timestamp.
 *
 * - cancelOrderRefund: triggers Toss refund and flips status → cancelled.
 */

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const TOSS_SECRET_KEY = defineSecret('TOSS_SECRET_KEY');

const TOSS_API_BASE = 'https://api.tosspayments.com';

interface ConfirmInput {
  orderId: string;
  paymentKey: string;
  amount: number;
}

interface TossConfirmResp {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  approvedAt?: string;
  method?: string;
  receipt?: { url?: string };
  card?: Record<string, unknown>;
  [key: string]: unknown;
}

async function tossPost(path: string, body: unknown, secret: string): Promise<TossConfirmResp> {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TossConfirmResp & { code?: string; message?: string };
  if (!res.ok) {
    throw new HttpsError(
      'aborted',
      `Toss ${path} failed: ${data.code || res.status} ${data.message || ''}`,
    );
  }
  return data;
}

/**
 * Get-or-create today's pickup counter and increment atomically.
 * Counter resets at midnight KST (we key by yyyy-mm-dd in Asia/Seoul).
 */
async function nextPickupNumber(date: string): Promise<string> {
  const db = admin.firestore();
  const ref = db.doc(`pickupCounters/${date}`);
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const last = (snap.exists ? (snap.data()?.last as number) : 0) || 0;
    const value = last + 1;
    tx.set(ref, { last: value, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return value;
  });
  return String(next).padStart(4, '0');
}

export const confirmTossPayment = onCall(
  { secrets: [TOSS_SECRET_KEY], region: 'us-central1', maxInstances: 5 },
  async (req: CallableRequest<ConfirmInput>) => {
    if (!req.auth) {
      throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { orderId, paymentKey, amount } = req.data || ({} as ConfirmInput);
    if (!orderId || !paymentKey || !amount) {
      throw new HttpsError('invalid-argument', 'orderId, paymentKey, amount 필요');
    }

    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', '주문을 찾을 수 없습니다.');
    }
    const order = orderSnap.data() as {
      userId: string; totalAmount: number; status: string; pickupDate: string;
    };
    if (order.userId !== req.auth.uid) {
      throw new HttpsError('permission-denied', '본인 주문이 아닙니다.');
    }
    if (order.totalAmount !== amount) {
      throw new HttpsError('failed-precondition', '결제 금액이 주문 금액과 일치하지 않습니다.');
    }
    if (order.status === 'paid' || order.status === 'preparing'
        || order.status === 'ready' || order.status === 'picked_up') {
      // Idempotent — already confirmed
      return { ok: true, alreadyConfirmed: true };
    }

    // Mock paymentKey (pre-merchant-onboarding) — skip the real Toss
    // confirm call and pretend the payment went through. Pipeline still
    // writes a payment record so the rest of the system behaves identically.
    const isMock = paymentKey.startsWith('mock_');
    let tossResp: TossConfirmResp;
    if (isMock) {
      tossResp = {
        paymentKey,
        orderId,
        orderName: 'MOCK',
        status: 'DONE',
        totalAmount: amount,
        approvedAt: new Date().toISOString(),
        method: 'MOCK',
      };
    } else {
      tossResp = await tossPost('/v1/payments/confirm', {
        orderId, paymentKey, amount,
      }, TOSS_SECRET_KEY.value());
      if (tossResp.status !== 'DONE') {
        throw new HttpsError('aborted', `결제 미완료: ${tossResp.status}`);
      }
    }

    // Assign pickup number, write payment record, flip status, append event
    const pickupNumber = await nextPickupNumber(order.pickupDate);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.update(orderRef, {
      status: 'paid',
      paidAt: now,
      pickupNumber,
    });
    batch.set(orderRef.collection('payments').doc(paymentKey), {
      paymentKey,
      orderRef: orderId,
      method: tossResp.method || '카드',
      amount,
      status: 'success',
      receiptUrl: tossResp.receipt?.url || null,
      approvedAt: now,
      rawResponse: tossResp as unknown as Record<string, unknown>,
    });
    batch.set(orderRef.collection('events').doc(), {
      type: 'paid',
      by: 'system',
      note: `픽업번호 ${pickupNumber}`,
      timestamp: now,
    });
    await batch.commit();

    return { ok: true, pickupNumber, receiptUrl: tossResp.receipt?.url };
  },
);

interface StatusInput {
  orderId: string;
  to: 'preparing' | 'ready' | 'picked_up' | 'cancelled';
  staffName?: string;
  note?: string;
}

export const markOrderStatus = onCall(
  { region: 'us-central1', maxInstances: 5 },
  async (req: CallableRequest<StatusInput>) => {
    if (!req.auth?.token?.admin) {
      throw new HttpsError('permission-denied', '관리자만 가능합니다.');
    }
    const { orderId, to, staffName, note } = req.data || ({} as StatusInput);
    if (!orderId || !to) throw new HttpsError('invalid-argument', 'orderId/to 필요');

    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    const snap = await orderRef.get();
    if (!snap.exists) throw new HttpsError('not-found', '주문 없음');
    const order = snap.data() as { status: string };

    const tsField =
      to === 'preparing' ? null :
      to === 'ready' ? 'readyAt' :
      to === 'picked_up' ? 'pickedUpAt' :
      to === 'cancelled' ? 'cancelledAt' : null;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const update: Record<string, unknown> = { status: to };
    if (tsField) update[tsField] = now;

    const batch = db.batch();
    batch.update(orderRef, update);
    batch.set(orderRef.collection('events').doc(), {
      type: to,
      by: 'staff',
      byStaffName: staffName || req.auth.token?.name || req.auth.token?.email || null,
      byUserId: req.auth.uid,
      note: note || null,
      timestamp: now,
    });
    await batch.commit();
    return { ok: true, from: order.status, to };
  },
);

interface RefundInput {
  orderId: string;
  reason: string;
}

export const cancelOrderRefund = onCall(
  { secrets: [TOSS_SECRET_KEY], region: 'us-central1', maxInstances: 5 },
  async (req: CallableRequest<RefundInput>) => {
    if (!req.auth?.token?.admin) {
      throw new HttpsError('permission-denied', '관리자만 가능합니다.');
    }
    const { orderId, reason } = req.data || ({} as RefundInput);
    if (!orderId || !reason) throw new HttpsError('invalid-argument', 'orderId/reason 필요');

    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new HttpsError('not-found', '주문 없음');

    // Find the success payment
    const paymentsSnap = await orderRef.collection('payments')
      .where('status', '==', 'success').limit(1).get();
    if (paymentsSnap.empty) {
      throw new HttpsError('failed-precondition', '결제 기록이 없습니다.');
    }
    const payment = paymentsSnap.docs[0];
    const paymentKey = payment.id;

    const isMock = paymentKey.startsWith('mock_');
    const tossResp = isMock
      ? { totalAmount: (payment.data().amount as number) || 0 } as TossConfirmResp
      : await tossPost(
          `/v1/payments/${paymentKey}/cancel`,
          { cancelReason: reason },
          TOSS_SECRET_KEY.value(),
        );

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.update(orderRef, { status: 'cancelled', cancelledAt: now });
    batch.update(payment.ref, { status: 'refunded' });
    batch.set(orderRef.collection('events').doc(), {
      type: 'cancelled',
      by: 'staff',
      byUserId: req.auth.uid,
      note: `환불: ${reason}`,
      timestamp: now,
    });
    await batch.commit();

    return { ok: true, refundedAmount: tossResp.totalAmount };
  },
);
