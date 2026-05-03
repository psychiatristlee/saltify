/**
 * Order service — minimal client-side helpers used by the customer + admin
 * UI. Most write paths (status transitions, payment confirm, refund) are
 * intentionally NOT here — they're Cloud Functions that run server-side.
 */

import {
  collection, doc, getDocs, getDoc, setDoc, query, where, orderBy, limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Order, OrderItem, OrderStatus } from './types';

export * from './types';

const COLLECTION = 'orders';

// -------- Customer --------

/**
 * Create a `pending` order document. The client immediately follows up with
 * a Toss Payments call; on success Cloud Function `confirmTossPayment` flips
 * status → 'paid' and assigns a pickup number.
 */
export async function createPendingOrder(input: {
  userId: string;
  userName?: string;
  userEmail?: string;
  customerPhone?: string;
  notes?: string;
  items: OrderItem[];
  pickupDate?: string;
}): Promise<string> {
  const docRef = doc(collection(db, COLLECTION));
  const totalAmount = input.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const itemCount = input.items.reduce((sum, it) => sum + it.qty, 0);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const data: Omit<Order, 'id'> = {
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    customerPhone: input.customerPhone,
    notes: input.notes,
    items: input.items,
    itemCount,
    totalAmount,
    status: 'pending',
    pickupNumber: null,
    pickupDate: input.pickupDate || today,
    createdAt: Timestamp.now(),
    paidAt: null,
    readyAt: null,
    pickedUpAt: null,
    cancelledAt: null,
  };
  await setDoc(docRef, data);
  return docRef.id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

/**
 * Customer-facing list of their own orders, newest first.
 */
export async function listMyOrders(userId: string, max = 50): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

// -------- Admin --------

/**
 * Admin dashboard list. Default: all orders newest-first; optionally filter
 * to a specific status (used by the "오늘의 픽업 대기" view).
 */
export async function listOrders(opts?: {
  status?: OrderStatus | OrderStatus[];
  pickupDate?: string;
  max?: number;
}): Promise<Order[]> {
  const max = opts?.max ?? 100;
  const filters = [];
  if (opts?.pickupDate) {
    filters.push(where('pickupDate', '==', opts.pickupDate));
  }
  if (opts?.status) {
    const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
    if (statuses.length === 1) filters.push(where('status', '==', statuses[0]));
    else if (statuses.length > 1) filters.push(where('status', 'in', statuses));
  }
  const q = filters.length === 0
    ? query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(max))
    : query(collection(db, COLLECTION), ...filters, orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

// -------- Display helpers --------

export function formatPrice(krw: number): string {
  return krw.toLocaleString('ko-KR') + '원';
}

export function statusLabel(s: OrderStatus): string {
  return ({
    pending: '결제 대기',
    paid: '주문 접수',
    preparing: '준비 중',
    ready: '픽업 가능',
    picked_up: '픽업 완료',
    cancelled: '취소됨',
    failed: '결제 실패',
  } as const)[s] ?? s;
}
