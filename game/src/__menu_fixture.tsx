/* eslint-disable */
import './index.css';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import MenuHome from './components/MenuHome';
import type { MenuItem } from './services/menu';

const menus: MenuItem[] = [
  { id: 'plain', name: '플레인 소금빵', description: '바삭하고 담백한 클래식 소금빵', price: 3500, image: '/breads/plain.png', category: 'bread', available: true, sortOrder: 1 } as MenuItem,
  { id: 'everything', name: '에브리띵 소금빵', description: '치아시드·참깨·검은깨 토핑', price: 3500, image: '/breads/everything.png', category: 'bread', available: true, sortOrder: 2 } as MenuItem,
  { id: 'olive', name: '올리브 치즈 소금빵', description: '블랙올리브와 치즈의 짭짤 고소', price: 3800, image: '/breads/olive-cheese.png', category: 'bread', available: true, sortOrder: 3 } as MenuItem,
  { id: 'basil', name: '바질토마토 소금빵', description: '바질버터와 선드라이 토마토', price: 3800, image: '/breads/basil-tomato.png', category: 'bread', available: true, sortOrder: 4 } as MenuItem,
  { id: 'garlic', name: '갈릭버터 소금빵', description: '진한 마늘버터향', price: 4300, image: '/breads/garlic-butter.png', category: 'bread', available: true, sortOrder: 5 } as MenuItem,
  { id: 'hotteok', name: '호떡 소금빵', description: '달콤한 호떡 필링', price: 4300, image: '/breads/hotteok.png', category: 'bread', available: true, sortOrder: 6 } as MenuItem,
  { id: 'choco', name: '초코번 소금빵', description: '시그니처 진한 초코크림', price: 4300, image: '/breads/choco-bun-naver.jpg', category: 'bread', available: true, sortOrder: 7 } as MenuItem,
  { id: 'cold-brew', name: '콜드브루', description: '진한 콜드브루', price: 3900, image: '/breads/cold-brew-naver.png', category: 'drink', available: true, sortOrder: 10 } as MenuItem,
  { id: 'latte', name: '콜드브루 라떼', description: '부드러운 라떼', price: 4900, image: '/breads/cold-brew-latte-naver.png', category: 'drink', available: true, sortOrder: 11 } as MenuItem,
  { id: 'milktea', name: '제로슈가 밀크티', description: '제로슈가, 부드러운 밀크티', price: 7000, image: '/breads/milktea-naver.jpg', category: 'drink', available: true, sortOrder: 12 } as MenuItem,
];
(window as unknown as { __MOCK_MENUS: MenuItem[] }).__MOCK_MENUS = menus;

const root = createRoot(document.getElementById('root')!);
root.render(
  <LanguageProvider>
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', background: 'white' }}>
      <MenuHome onCheckout={() => {}} />
    </div>
  </LanguageProvider>,
);
