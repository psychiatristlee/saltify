/* eslint-disable */
import './index.css';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import OrdersPage from './components/OrdersPage';
import type { Order } from './services/order';

const ts = (iso: string) => ({ toDate: () => new Date(iso) }) as never;

const sample: Order[] = [
  {
    id: 'ORD_001', userId: 'u1', userName: '홍길동', userEmail: 'g@x.com', customerPhone: '010-1234-5678',
    items: [
      { menuItemId: 'plain', name: '플레인 소금빵', price: 3500, qty: 2 },
      { menuItemId: 'latte', name: '콜드브루 라떼', price: 6000, qty: 1 },
    ],
    itemCount: 3, totalAmount: 13000, status: 'ready', pickupNumber: '0042', pickupDate: '2026-05-16',
    createdAt: ts('2026-05-16T10:30:00+09:00'), paidAt: ts('2026-05-16T10:31:00+09:00'),
    readyAt: ts('2026-05-16T10:55:00+09:00'), pickedUpAt: null, cancelledAt: null,
  },
  {
    id: 'ORD_002', userId: 'u1',
    items: [
      { menuItemId: 'choco', name: '초코번 소금빵', price: 4300, qty: 1 },
      { menuItemId: 'milktea', name: '제로슈가 밀크티', price: 7000, qty: 1 },
    ],
    itemCount: 2, totalAmount: 11300, status: 'preparing', pickupNumber: '0041', pickupDate: '2026-05-16',
    createdAt: ts('2026-05-16T10:15:00+09:00'), paidAt: ts('2026-05-16T10:16:00+09:00'),
    readyAt: null, pickedUpAt: null, cancelledAt: null,
  },
  {
    id: 'ORD_003', userId: 'u1',
    items: [
      { menuItemId: 'garlic', name: '갈릭버터 소금빵', price: 4300, qty: 3 },
    ],
    itemCount: 3, totalAmount: 12900, status: 'picked_up', pickupNumber: '0038', pickupDate: '2026-05-15',
    createdAt: ts('2026-05-15T15:20:00+09:00'), paidAt: ts('2026-05-15T15:21:00+09:00'),
    readyAt: ts('2026-05-15T15:40:00+09:00'), pickedUpAt: ts('2026-05-15T16:00:00+09:00'), cancelledAt: null,
  },
];

(window as unknown as { __MOCK_ORDERS: Order[] }).__MOCK_ORDERS = sample;

const root = createRoot(document.getElementById('root')!);
root.render(
  <LanguageProvider>
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', background: 'white' }}>
      <OrdersPage userId="u1" />
    </div>
  </LanguageProvider>,
);
