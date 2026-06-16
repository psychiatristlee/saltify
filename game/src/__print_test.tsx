/* eslint-disable */
import './index.css';
import { createRoot } from 'react-dom/client';
import OrderTicket from './components/OrderTicket';
import type { Order } from './services/order';

const fakeTs = (iso: string) => ({ toDate: () => new Date(iso) }) as never;

const order: Order = {
  id: 'ORDER_TEST_42',
  userId: 'u1',
  userName: '홍길동',
  userEmail: 'gildong@example.com',
  customerPhone: '010-1234-5678',
  items: [
    { menuItemId: 'plain', name: '플레인 소금빵', price: 3500, qty: 2, image: '/x.png' },
    { menuItemId: 'latte', name: '콜드브루 라떼', price: 6000, qty: 1, image: '/x.png' },
    { menuItemId: 'milktea', name: '제로슈가 밀크티', price: 7000, qty: 1, image: '/x.png' },
  ],
  itemCount: 4,
  totalAmount: 20000,
  status: 'paid',
  pickupNumber: '0042',
  pickupDate: '2026-05-16',
  notes: '갈릭버터 잘 익은 걸로 부탁드려요',
  createdAt: fakeTs('2026-05-16T10:30:00+09:00'),
  paidAt: fakeTs('2026-05-16T10:31:00+09:00'),
  readyAt: null,
  pickedUpAt: null,
  cancelledAt: null,
};

declare global {
  interface Window {
    _printed?: number;
    _closedAt?: number;
  }
}

window._printed = 0;
const origPrint = window.print;
window.print = () => {
  window._printed = (window._printed || 0) + 1;
  if (typeof origPrint === 'function') {
    try { origPrint.call(window); } catch { /* ignore: jsdom/headless print not supported */ }
  }
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <OrderTicket
    order={order}
    autoPrint
    onClose={() => { window._closedAt = Date.now(); }}
  />,
);
