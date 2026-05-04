/**
 * Toss Payments client SDK wrapper.
 *
 * Until the merchant ID is issued we run in **MOCK** mode by default —
 * the SDK is never loaded; instead the customer is redirected straight
 * to the success URL with a fake `paymentKey`. The Cloud Function
 * `confirmTossPayment` recognizes the `mock_` prefix and skips the real
 * Toss /confirm call.
 *
 * Switch to real Toss by setting VITE_TOSS_CLIENT_KEY to a live test key.
 */

import { loadTossPayments } from '@tosspayments/payment-sdk';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || '';
const MOCK_MODE = !CLIENT_KEY;

interface RequestPaymentInput {
  orderId: string;
  orderName: string;          // Human-readable name (≤ 100 chars)
  amount: number;             // KRW
  customerEmail?: string;
  customerName?: string;
  customerMobilePhone?: string;
  successUrl: string;         // absolute
  failUrl: string;            // absolute
}

/**
 * Open the Toss-hosted payment widget. Resolves once Toss redirects to
 * successUrl (the user comes back to the same SPA route which then calls
 * Cloud Function `confirmTossPayment` with the paymentKey).
 *
 * For native apps this opens the iOS/Android system browser via Toss's
 * hosted page; the deep-link configured in successUrl brings users back.
 */
export async function requestTossPayment(input: RequestPaymentInput): Promise<void> {
  if (MOCK_MODE) {
    // Skip the real SDK; redirect to successUrl with a recognizable mock key.
    const url = new URL(input.successUrl);
    url.searchParams.set('orderId', input.orderId);
    url.searchParams.set('paymentKey', `mock_${Date.now()}`);
    url.searchParams.set('amount', String(input.amount));
    window.location.href = url.toString();
    return;
  }
  const toss = await loadTossPayments(CLIENT_KEY);
  await toss.requestPayment('카드', {
    amount: input.amount,
    orderId: input.orderId,
    orderName: input.orderName.slice(0, 100),
    customerEmail: input.customerEmail,
    customerName: input.customerName?.slice(0, 100),
    customerMobilePhone: input.customerMobilePhone,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  });
}

export const isMockMode = () => MOCK_MODE;
