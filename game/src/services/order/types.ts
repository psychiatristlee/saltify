/**
 * Order / pickup data model — shared by customer + admin code paths.
 *
 *   pending   — order document created, awaiting payment (5-minute TTL on client)
 *   paid      — payment verified by Cloud Function
 *   preparing — staff acknowledged, baking
 *   ready     — pickup-ready (customer notified)
 *   picked_up — staff confirmed pickup
 *   cancelled — user-initiated or admin cancellation (refund handled separately)
 *   failed    — payment failed (final, no retry on this doc)
 */

import type { Timestamp } from 'firebase/firestore';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'
  | 'failed';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  customerPhone?: string;
  notes?: string;

  items: OrderItem[];
  itemCount: number;            // sum of qty
  totalAmount: number;          // KRW

  status: OrderStatus;

  // Pickup
  pickupNumber: string | null;  // 4-digit, e.g. "0042" (per-day counter, set once payment succeeds)
  pickupDate: string;           // yyyy-mm-dd of expected pickup (defaults to today)

  // Timestamps for the lifecycle (denormalized for easy display)
  createdAt: Timestamp;
  paidAt: Timestamp | null;
  readyAt: Timestamp | null;
  pickedUpAt: Timestamp | null;
  cancelledAt: Timestamp | null;
}

export interface OrderEvent {
  id: string;
  type: 'placed' | 'paid' | 'preparing' | 'ready' | 'picked_up' | 'cancelled' | 'failed';
  by: 'customer' | 'staff' | 'system';
  byUserId?: string;
  byStaffName?: string;
  note?: string;
  timestamp: Timestamp;
}

export interface PaymentRecord {
  id: string;
  paymentKey: string;       // toss payments paymentKey
  orderRef: string;         // toss orderId we sent (== order doc id)
  method: string;           // 카드, 가상계좌, etc.
  amount: number;
  status: 'success' | 'failed' | 'cancelled' | 'refunded';
  receiptUrl?: string;
  approvedAt: Timestamp | null;
  rawResponse?: Record<string, unknown>;
}
