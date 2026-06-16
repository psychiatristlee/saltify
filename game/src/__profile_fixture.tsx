/* eslint-disable */
import './index.css';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import ProfilePage from './components/ProfilePage';
import BottomTabBar from './components/BottomTabBar';
import { useState } from 'react';

function Demo() {
  const [tab, setTab] = useState<'home' | 'orders' | 'game' | 'profile'>('profile');
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', height: '100dvh', background: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ProfilePage
          userName="홍길동"
          email="gildong@example.com"
          photoURL={null}
          isAdmin={false}
          totalPoints={2400}
          couponCount={3}
          onLogout={() => {}}
          onDeleteAccount={() => {}}
        />
      </div>
      <BottomTabBar active={tab} onChange={setTab} couponCount={3} />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<LanguageProvider><Demo /></LanguageProvider>);
