'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import NaverMap, { openNaverMapPlace } from './NaverMap';
import BlogList, { BlogListItem } from './BlogList';
import { STORE } from '@/lib/storeInfo';
import styles from './LandingPage.module.css';

const GAME_URL = 'https://game.salt-bbang.com';

interface Props {
  posts?: BlogListItem[];
}

export default function LandingPage({ posts = [] }: Props) {
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

      {/* Menu Section */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>{t('menu')}</h2>
        <div className={styles.menuGrid}>
          {MENU_BREADS.map((bread) => (
            <div key={bread.id} className={styles.menuCard}>
              {bread.image && (
                <Image
                  src={bread.image}
                  alt={t(bread.nameKey)}
                  width={90}
                  height={90}
                  className={styles.menuImage}
                />
              )}
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

      {/* Drinks Section */}
      <section className={styles.menuSection}>
        <h2 className={styles.sectionTitle}>{t('drinks')}</h2>
        <div className={styles.menuGrid}>
          {MENU_DRINKS.map((drink) => (
            <div key={drink.id} className={styles.menuCard}>
              <h3 className={styles.menuName}>{t(drink.nameKey)}</h3>
              <p className={styles.menuDesc}>{t(drink.descKey)}</p>
              <span className={styles.menuPrice}>
                {drink.price.toLocaleString()}{t('currencyUnit')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      <BlogList posts={posts} />

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
          <div className={styles.mapButtons}>
            <button className={styles.mapButton} onClick={openNaverMapPlace}>
              📍 {t('getDirections')}
            </button>
            <a
              href={STORE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.googleMapButton}
            >
              🗺️ Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
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
          <a
            href={STORE.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.googleMapLink}
          >
            <svg className={styles.googleMapIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            <span>Google Maps</span>
          </a>
        </div>
        <p className={styles.footerText}>
          &copy; 2026 <a href="/admin" className={styles.adminLink}>Saltify</a>{t('allRightsReserved')}
        </p>
      </footer>
    </div>
  );
}
