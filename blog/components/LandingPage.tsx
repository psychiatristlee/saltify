'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { MENU_BREADS } from '@/lib/breadData';
import NaverMap, { openNaverMapPlace } from './NaverMap';
import BlogList from './BlogList';
import styles from './LandingPage.module.css';

const GAME_URL = 'https://game.salt-bbang.com';

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.heroHeader}>
        <LanguageSelector />
        <Image
          src="/brandings/horizontal-thumbnail.png"
          alt={t('storeName')}
          width={430}
          height={430}
          className={styles.heroHeaderImage}
          priority
        />
      </header>

      {/* Game CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <p className={styles.ctaDesc}>{t('ctaDesc')}</p>
          <a href={GAME_URL} className={styles.ctaButton}>
            {t('startGame')}
          </a>
        </div>
      </section>

      {/* App Download Section */}
      <section className={styles.downloadSection}>
        <h2 className={styles.sectionTitle}>{t('downloadApp')}</h2>
        <div className={styles.downloadButtons}>
          <a
            href="https://apps.apple.com/us/app/%EC%86%94%ED%8A%B8%EB%B9%B5/id6758907825"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <div className={styles.downloadText}>
              <span className={styles.downloadLabel}>Download on the</span>
              <span className={styles.downloadStore}>App Store</span>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.saltbbang"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.49c-.36-.17-.56-.48-.6-.85L1.06 12.32c-.04-.37.1-.72.38-.95L12 2.5l10.56 8.87c.28.23.42.58.38.95l-1.52 10.32c-.04.37-.24.68-.6.85L12 27.5 3.18 23.49z" opacity="0" />
              <path d="M1 2.87L1 21.13C1 21.58 1.15 21.98 1.4 22.27L12.39 11.5L1.4 1.73C1.15 2.02 1 2.42 1 2.87Z" fill="#4285F4" />
              <path d="M17.44 15.28L12.39 11.5L17.44 7.72L23.29 11.08C23.72 11.32 24 11.64 24 12C24 12.36 23.72 12.68 23.29 12.92L17.44 15.28Z" fill="#FBBC04" />
              <path d="M1.4 22.27C1.72 22.63 2.2 22.82 2.74 22.63L17.44 15.28L12.39 11.5L1.4 22.27Z" fill="#EA4335" />
              <path d="M1.4 1.73L12.39 11.5L17.44 7.72L2.74 1.37C2.2 1.18 1.72 1.37 1.4 1.73Z" fill="#34A853" />
            </svg>
            <div className={styles.downloadText}>
              <span className={styles.downloadLabel}>GET IT ON</span>
              <span className={styles.downloadStore}>Google Play</span>
            </div>
          </a>
        </div>
      </section>

      {/* Menu Section */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>{t('menu')}</h2>
        <div className={styles.menuGrid}>
          {MENU_BREADS.map((bread) => (
            <div key={bread.id} className={styles.menuCard}>
              <Image
                src={bread.image}
                alt={t(bread.nameKey)}
                width={90}
                height={90}
                className={styles.menuImage}
              />
              <h3 className={styles.menuName}>{t(bread.nameKey)}</h3>
              <p className={styles.menuDesc}>{t(bread.descKey)}</p>
              <span className={styles.menuPrice}>
                {bread.price.toLocaleString()}{t('currencyUnit')}
              </span>
            </div>
          ))}
        </div>

        {/* Japanese PDF Menu Link */}
        {language === 'ja' && (
          <Link href="/menu/jp" className={styles.pdfMenuLink}>
            📄 {t('viewFullMenu')}
          </Link>
        )}
      </section>

      {/* Blog Section */}
      <BlogList />

      {/* Map Section */}
      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>{t('findUs')}</h2>
        <div className={styles.mapCard}>
          <NaverMap />
          <div className={styles.storeInfo}>
            <span className={styles.storeName}>{t('storeName')}</span>
            <span className={styles.storeAddress}>{t('storeAddress')}</span>
            <span className={styles.storeHours}>{t('storeHours')}</span>
          </div>
          <button className={styles.mapButton} onClick={openNaverMapPlace}>
            {t('getDirections')}
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
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <span>@salt_bread_official</span>
        </a>
        <p className={styles.footerText}>
          &copy; 2026 <a href="/admin" className={styles.adminLink}>Saltify</a>{t('allRightsReserved')}
        </p>
      </footer>
    </div>
  );
}
