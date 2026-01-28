import { useRef } from 'react';
import styles from './LandingPage.module.css';
import { BREAD_DATA, getAllBreadTypes } from '../models/BreadType';
import { useNaverMap, openNaverMapPlace } from '../hooks/useNaverMap';

// 랜딩 페이지 전용 메뉴 (게임에 포함되지 않음)
const LANDING_ONLY_BREADS = [
  {
    id: 'cube-choco',
    nameKo: '큐브 초코크림',
    price: 4800,
    description: '꾸덕하고 진한 초코크림과 입안에서 톡 터지는 초코칩이 가득 들어가 있는 큐브 소금빵',
    image: '/brandings/cube-choco-cream.png',
  },
  {
    id: 'cube-matcha',
    nameKo: '큐브 말차크림',
    price: 4800,
    description: '4면이 바삭한 귀여운 큐브소금빵 안에 꾸덕한 말차크림이 한가득 들어간 소금빵',
    image: '/brandings/cube-matcha-cream.png',
  },
];

interface Props {
  onStartGame: () => void;
  onAdminClick?: () => void;
}

export default function LandingPage({ onStartGame, onAdminClick }: Props) {
  const allBreadTypes = getAllBreadTypes();
  const mapRef = useRef<HTMLDivElement>(null);
  useNaverMap(mapRef);

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.heroHeader}>
        <img
          src="/brandings/horizontal-thumbnail.png"
          alt="솔트빵"
          className={styles.heroHeaderImage}
        />
      </header>

      {/* Game CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>솔트, 빵 💥 퍼즐</h2>
          <p className={styles.ctaDesc}>
            게임을 플레이하고 <strong>솔트빵 무료 쿠폰</strong>을 받아보세요!
          </p>
          <div className={styles.howToPlay}>
            <div className={styles.howToPlayItem}>
              <span className={styles.howToPlayIcon}>🧩</span>
              <span>같은 빵 3개를 맞추면 빵이 터져요!</span>
            </div>
            <div className={styles.howToPlayItem}>
              <span className={styles.howToPlayIcon}>🎁</span>
              <span>빵을 터뜨리면 무료 쿠폰을 드려요!</span>
            </div>
            <div className={styles.howToPlayItem}>
              <span className={styles.howToPlayIcon}>✨</span>
              <span>4개 이상 맞추면 특수 아이템 등장!</span>
            </div>
          </div>
          <button className={styles.ctaButton} onClick={onStartGame}>
            게임 시작하기
          </button>
        </div>
      </section>

      {/* Menu Section */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>메뉴</h2>
        <div className={styles.menuGrid}>
          {allBreadTypes.map((breadType) => {
            const breadInfo = BREAD_DATA[breadType];
            return (
              <div key={breadType} className={styles.menuCard}>
                <img
                  src={breadInfo.image}
                  alt={breadInfo.nameKo}
                  className={styles.menuImage}
                />
                <h3 className={styles.menuName}>{breadInfo.nameKo}</h3>
                <p className={styles.menuDesc}>{breadInfo.description}</p>
                <span className={styles.menuPrice}>
                  {breadInfo.price.toLocaleString()}원
                </span>
              </div>
            );
          })}
          {LANDING_ONLY_BREADS.map((bread) => (
            <div key={bread.id} className={styles.menuCard}>
              <img
                src={bread.image}
                alt={bread.nameKo}
                className={styles.menuImage}
              />
              <h3 className={styles.menuName}>{bread.nameKo}</h3>
              <p className={styles.menuDesc}>{bread.description}</p>
              <span className={styles.menuPrice}>
                {bread.price.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Map Section - Naver Map API */}
      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>찾아오는 길</h2>
        <div className={styles.mapCard}>
          <div ref={mapRef} className={styles.mapContainer} />
          <div className={styles.storeInfo}>
            <span className={styles.storeName}>솔트빵</span>
            <span className={styles.storeAddress}>
              서울 마포구 동교로 39길 10 1층
            </span>
            <span className={styles.storeHours}>
              영업시간: 11:00 - 21:00 (일요일 휴무)
            </span>
          </div>
          <button className={styles.mapButton} onClick={openNaverMapPlace}>
            네이버 지도에서 길찾기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <a
          href="https://www.instagram.com/salt_bread_official"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.instagramLink}
        >
          <svg className={styles.instagramIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>@salt_bread_official</span>
        </a>
        <p className={styles.footerText}>
          © 2026{' '}
          <span
            className={styles.adminTrigger}
            onClick={onAdminClick}
          >
            솔티파이
          </span>
          . All rights reserved.
        </p>
      </footer>
    </div>
  );
}
