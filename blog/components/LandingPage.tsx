'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { MENU_BREADS, MENU_DRINKS, type BreadItem } from '@/lib/breadData';
import NaverMap, { openNaverMapPlace } from './NaverMap';
import BlogList, { BlogListItem } from './BlogList';
import { STORE } from '@/lib/storeInfo';
import styles from './LandingPage.module.css';

interface Props {
  posts?: BlogListItem[];
}

/* ---------- small inline icons (kept local — no icon library) ---------- */

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function IconTrain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 10h14M9 21l1.5-3M15 21l-1.5-3" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Placeholder for menu items whose photo hasn't been shot yet. */
function BreadPlaceholder() {
  return (
    <svg className={styles.placeholderIcon} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M10 40c-4-8 6-20 22-20s26 12 22 20c-2 4-8 6-22 6S12 44 10 40z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M26 24c-2 5-2 10 0 16M38 24c2 5 2 10 0 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="30" r="1.4" fill="currentColor" />
      <circle cx="44" cy="31" r="1.4" fill="currentColor" />
      <circle cx="33" cy="26" r="1.4" fill="currentColor" />
    </svg>
  );
}

/* ---------- menu card ---------- */

function MenuCard({ item }: { item: BreadItem }) {
  const { t } = useLanguage();
  return (
    <article className={styles.menuCard}>
      <div className={styles.menuMedia}>
        {item.image ? (
          <Image
            src={item.image}
            alt={t(item.nameKey)}
            width={480}
            height={480}
            sizes="(max-width: 640px) 50vw, 240px"
            className={styles.menuImage}
          />
        ) : (
          <div className={styles.menuPlaceholder}>
            <BreadPlaceholder />
          </div>
        )}
        {item.signature && <span className={styles.signatureBadge}>{t('signatureBadge')}</span>}
      </div>
      <div className={styles.menuBody}>
        <div className={styles.menuRow}>
          <h3 className={styles.menuName}>{t(item.nameKey)}</h3>
          <span className={styles.menuPrice}>
            {item.price.toLocaleString()}
            <span className={styles.menuUnit}>{t('currencyUnit')}</span>
          </span>
        </div>
        <p className={styles.menuDesc}>{t(item.descKey)}</p>
      </div>
    </article>
  );
}

/* ---------- page ---------- */

export default function LandingPage({ posts = [] }: Props) {
  const { language, t } = useLanguage();
  const taglineLines = t('heroTagline').split('\n');
  const menuBoardHref = language === 'ja' ? '/menu/jp' : '/menu';
  const showMenuBoard = language === 'ko' || language === 'ja';

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <Link href="/" className={styles.brand} aria-label={t('storeName')}>
          <Image
            src="/brandings/plain.png"
            alt=""
            width={36}
            height={36}
            className={styles.brandMark}
            priority
          />
          <span className={styles.brandName}>{t('storeName')}</span>
        </Link>
        <LanguageSelector />
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroArt}>
          <Image
            src="/brandings/horizontal-thumbnail.png"
            alt={t('storeName')}
            width={1536}
            height={1024}
            sizes="(max-width: 760px) 100vw, 720px"
            className={styles.heroImage}
            priority
          />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t('heroEyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('storeName')}</h1>
          <p className={styles.heroTagline}>
            {taglineLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < taglineLines.length - 1 && <br />}
              </span>
            ))}
          </p>
          <ul className={styles.chips} aria-label="Quick facts">
            <li className={styles.chip}>
              <IconClock />
              {t('heroHoursChip')}
            </li>
            <li className={styles.chip}>
              <IconCalendar />
              {t('heroNoClosingChip')}
            </li>
            <li className={styles.chip}>
              <IconTrain />
              {t('heroStationChip')}
            </li>
          </ul>
          <div className={styles.heroActions}>
            <a href="#menu" className={styles.btnPrimary}>
              {t('heroCtaMenu')}
              <IconArrow />
            </a>
            <button type="button" className={styles.btnSecondary} onClick={openNaverMapPlace}>
              <IconPin />
              {t('heroCtaDirections')}
            </button>
          </div>
        </div>
      </section>

      {/* Bake times */}
      <section className={styles.bakeStrip} aria-labelledby="bake-title">
        <div className={styles.bakeText}>
          <h2 id="bake-title" className={styles.bakeTitle}>{t('bakeTimesTitle')}</h2>
          <p className={styles.bakeNote}>{t('bakeTimesNote')}</p>
        </div>
        <ol className={styles.bakeTimes}>
          {STORE.bakeTimes.map((time) => (
            <li key={time} className={styles.bakeTime}>{time}</li>
          ))}
        </ol>
      </section>

      {/* Menu */}
      <section className={styles.section} id="menu">
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('menu')}</h2>
          <p className={styles.sectionSub}>{t('menuSubtitle')}</p>
        </header>
        <div className={styles.menuGrid}>
          {MENU_BREADS.map((bread) => (
            <MenuCard key={bread.id} item={bread} />
          ))}
        </div>
        {/* Menu board — published in Korean (/menu) and Japanese (/menu/jp) */}
        {showMenuBoard && (
          <Link href={menuBoardHref} className={styles.menuBoardLink}>
            {t('viewFullMenu')}
            <IconArrow />
          </Link>
        )}
      </section>

      {/* Drinks */}
      <section className={styles.section}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('drinks')}</h2>
          <p className={styles.sectionSub}>{t('drinksSubtitle')}</p>
        </header>
        <div className={styles.menuGrid}>
          {MENU_DRINKS.map((drink) => (
            <MenuCard key={drink.id} item={drink} />
          ))}
        </div>
      </section>

      {/* Blog */}
      <BlogList posts={posts} />

      {/* Find us */}
      <section className={styles.section} id="find-us">
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('findUs')}</h2>
          <p className={styles.sectionSub}>{t('findUsSubtitle')}</p>
        </header>
        <div className={styles.mapCard}>
          <div className={styles.mapFrame}>
            <NaverMap />
          </div>
          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>
                <IconPin />
                {t('labelAddress')}
              </dt>
              <dd className={styles.infoValue}>
                {t('storeAddress')}
                {/* Romanised address — foreign visitors show this to a taxi driver. */}
                {language !== 'ko' && (
                  <span className={styles.infoMuted}>{t('storeAddressRoman')}</span>
                )}
              </dd>
            </div>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>
                <IconClock />
                {t('labelHours')}
              </dt>
              <dd className={styles.infoValue}>
                {t('hoursDetail')}
                <span className={styles.infoStrong}>{t('openEveryDay')}</span>
              </dd>
            </div>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>
                <IconTrain />
                {t('labelAccess')}
              </dt>
              <dd className={styles.infoValue}>{t('gettingHere')}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>
                <IconPhone />
                {t('storePhone')}
              </dt>
              <dd className={styles.infoValue}>
                <a href={`tel:${STORE.telephone}`} className={styles.infoLink}>
                  {STORE.telephoneDisplay}
                </a>
              </dd>
            </div>
          </dl>
          <div className={styles.mapButtons}>
            <button type="button" className={styles.btnPrimary} onClick={openNaverMapPlace}>
              <IconPin />
              {t('getDirections')}
            </button>
            <a
              href={STORE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnSecondary}
            >
              Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/brandings/plain.png" alt="" width={44} height={44} className={styles.footerMark} />
          <span className={styles.footerName}>{STORE.fullName}</span>
        </div>
        <div className={styles.footerLinks}>
          <a
            href={STORE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pill}
          >
            <IconInstagram />
            <span>{STORE.instagram}</span>
          </a>
          <a
            href={STORE.naverPlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pill}
          >
            <IconPin />
            <span>Naver</span>
          </a>
          <a
            href={STORE.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pill}
          >
            <IconPin />
            <span>Google Maps</span>
          </a>
        </div>
        {/* Crawlable links to the per-language info pages — hreflang alone is
            not enough; Google needs real links to discover and rank them. */}
        <nav className={styles.langLinks} aria-label="Language versions">
          <Link href="/en" hrefLang="en">English</Link>
          <Link href="/ja" hrefLang="ja">日本語</Link>
          <Link href="/zh" hrefLang="zh-Hans">简体中文</Link>
          <Link href="/zh-hant" hrefLang="zh-Hant">繁體中文</Link>
        </nav>
        <p className={styles.footerText}>
          &copy; 2026 <a href="/admin" className={styles.adminLink}>{STORE.fullName}</a>{t('allRightsReserved')}
        </p>
      </footer>
    </div>
  );
}
