import styles from './BottomTabBar.module.css';

export type Tab = 'home' | 'orders' | 'game' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  cartCount?: number;
  couponCount?: number;
}

interface TabConfig {
  id: Tab;
  icon: string;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'home', icon: '🥖', label: '메뉴' },
  { id: 'orders', icon: '🧾', label: '주문내역' },
  { id: 'game', icon: '🎮', label: '게임' },
  { id: 'profile', icon: '👤', label: '내정보' },
];

export default function BottomTabBar({ active, onChange, couponCount = 0 }: Props) {
  return (
    <nav className={styles.tabBar} aria-label="기본 내비게이션">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span className={styles.icon} aria-hidden="true">{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
            {tab.id === 'profile' && couponCount > 0 && (
              <span className={styles.badge}>{couponCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
