import Link from 'next/link';
import { Noto_Serif } from 'next/font/google';
import { STORE } from '@/lib/storeInfo';
import { MENU_BREADS, MENU_DRINKS, type BreadItem } from '@/lib/breadData';
import { menuSections } from '@/lib/menuSchema';
import { t } from '@/lib/i18n';
import styles from './MenuBoard.module.css';

/**
 * The in-store menu board as a web page, one per language (/menu, /menu/jp).
 *
 * Rendered from breadData instead of embedding a PDF: mobile browsers cannot
 * show an <object> PDF inline — the old /menu/jp only ever said
 * "PDFを表示できません" — and Google cannot read items or prices out of one.
 * The downloadable PNG/PDF are renders of this same page
 * (scripts/render-menu-board.mjs), so page, files and data stay in step.
 */

// Serif for the wordmark, prices and English lines, as on the printed board.
// The greek subset carries the θ in "Salt,θ".
const serif = Noto_Serif({
  subsets: ['latin', 'greek'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-menu-serif',
});

export type BoardLang = 'ko' | 'ja';

const boardFile = (lang: BoardLang, ext: 'png' | 'pdf') =>
  `/menu-board/salt-bread-menu-${lang}.${ext}`;

interface Copy {
  path: string;
  brandLocal: string;
  tagline: string;
  bakeLabel: string;
  breadTitle: string;
  drinkTitle: string;
  signature: string;
  /** Visitors from Japan would otherwise read "3,000" as yen. */
  pricePrefix: string;
  priceNote?: string;
  address: string;
  hours: string;
  soldOut: string;
  back: { href: string; label: string };
  other: { href: string; label: string; lang: BoardLang };
  orderTip?: string;
  downloads?: { png: string; pdf: string };
}

const COPY: Record<BoardLang, Copy> = {
  ko: {
    path: '/menu',
    brandLocal: '솔트빵',
    tagline: '프랑스산 발효버터 · 말돈 소금',
    bakeLabel: 'FRESH FROM THE OVEN',
    breadTitle: '소금빵',
    drinkTitle: '음료',
    signature: '대표 메뉴',
    pricePrefix: '',
    address: '서울 마포구 동교로39길 10, 1층',
    hours: `매일 ${STORE.opens} – ${STORE.closes}`,
    soldOut: '소진 시 조기 마감',
    back: { href: '/', label: '← 홈' },
    other: { href: '/menu/jp', label: '日本語メニュー', lang: 'ja' },
  },
  ja: {
    path: '/menu/jp',
    brandLocal: 'ソルトパン',
    tagline: 'フランス産発酵バター · マルドンの海塩',
    bakeLabel: '焼き上がり',
    breadTitle: '塩パン',
    drinkTitle: 'ドリンク',
    signature: '看板メニュー',
    pricePrefix: '₩',
    priceNote: '価格は韓国ウォン（₩）',
    address: 'ソウル特別市 麻浦区 東橋路39キル 10, 1F',
    hours: `毎日 ${STORE.opens} – ${STORE.closes}`,
    soldOut: '売り切れ次第終了',
    back: { href: '/ja', label: '← ホーム' },
    other: { href: '/menu', label: '한국어 메뉴', lang: 'ko' },
    orderTip:
      'ご注文の際は、この画面をスタッフにお見せください。英語のメニュー名でも伝わります。',
    downloads: { png: 'メニュー表を画像で保存', pdf: '印刷用 PDF' },
  },
};

function Section({ title, titleEn, children }: {
  title: string;
  titleEn: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHead}>
        <span className={styles.sectionTitle}>{title}</span>{' '}
        <span className={styles.sectionTitleEn} lang="en">{titleEn}</span>
      </h2>
      {children}
    </section>
  );
}

function Items({ items, lang, withDesc }: {
  items: BreadItem[];
  lang: BoardLang;
  withDesc: boolean;
}) {
  const c = COPY[lang];
  return (
    <ul className={withDesc ? styles.items : `${styles.items} ${styles.itemsCompact}`}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.itemHead}>
            <h3 className={styles.itemName}>
              <span lang="en">{t(item.nameKey, 'en')}</span>{' '}
              <span className={styles.itemLocal}>
                {t(item.nameKey, lang)}
                {item.signature && (
                  <span className={styles.dot} role="img" aria-label={c.signature} />
                )}
              </span>
            </h3>
            <span className={styles.price}>
              {c.pricePrefix}
              {item.price.toLocaleString('en-US')}
            </span>
          </div>
          {withDesc && (
            <>
              <p className={styles.desc}>{t(item.descKey, lang)}</p>
              <p className={styles.descEn} lang="en">{t(item.descKey, 'en')}</p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function MenuBoard({ lang }: { lang: BoardLang }) {
  const c = COPY[lang];

  // Same @id as the homepage Bakery node, so this is read as that shop's menu.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': `${STORE.websiteUrl}#bakery`,
    name: STORE.fullName,
    url: STORE.websiteUrl,
    hasMenu: {
      '@type': 'Menu',
      url: `${STORE.websiteUrl}${c.path}`,
      inLanguage: lang,
      hasMenuSection: menuSections(lang, { breads: c.breadTitle, drinks: c.drinkTitle }),
    },
  };

  return (
    <div className={`${styles.page} ${serif.variable}`} lang={lang}>
      {/* Root layout hardcodes <html lang="ko">; see StoreInfoPage for why. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(lang)}`,
        }}
      />

      <nav className={styles.nav}>
        <Link href={c.back.href}>{c.back.label}</Link>
        <Link href={c.other.href} hrefLang={c.other.lang} lang={c.other.lang}>
          {c.other.label}
        </Link>
      </nav>

      <article className={styles.board} data-menu-board>
        <header className={styles.masthead}>
          <h1 className={styles.brand}>
            <span className={styles.brandMark}>{STORE.englishName}</span>{' '}
            <span className={styles.brandLocal}>{c.brandLocal}</span>
          </h1>
          <p className={styles.ornament} aria-hidden="true">◇</p>
          <p className={styles.tagline}>{c.tagline}</p>
          <p className={styles.taglineEn} lang="en">
            Elle &amp; Vire cultured butter · Maldon sea salt
          </p>
          <p className={styles.bake}>
            {c.bakeLabel}&ensp;
            <span className={styles.bakeTimes}>{STORE.bakeTimes.join(' · ')}</span>
          </p>
        </header>

        <Section title={c.breadTitle} titleEn="SALT BREAD">
          <Items items={MENU_BREADS} lang={lang} withDesc />
        </Section>

        <Section title={c.drinkTitle} titleEn="DRINKS">
          <Items items={MENU_DRINKS} lang={lang} withDesc={false} />
        </Section>

        <p className={styles.legend}>
          <span className={styles.dot} aria-hidden="true" />
          <span>
            {c.signature} / <span lang="en">Signature</span>
          </span>
          <span className={styles.rule} aria-hidden="true" />
          {c.priceNote && <span>{c.priceNote}</span>}
        </p>

        <footer className={styles.boardFooter}>
          <div>
            <p className={styles.footStrong}>{c.address}</p>
            <p className={styles.footSerif} lang="en">{STORE.addressEn}</p>
            <p className={styles.footSmall}>
              {STORE.instagram} · {STORE.telephoneDisplay}
            </p>
          </div>
          <div className={styles.footRight}>
            <p className={styles.footStrong}>{c.hours}</p>
            <p className={styles.footSerif} lang="en">
              Open daily · Last order {STORE.lastOrder}
            </p>
            <p className={styles.footSmall}>
              {c.soldOut} · <span lang="en">While supplies last</span>
            </p>
          </div>
        </footer>
      </article>

      {(c.orderTip || c.downloads) && (
        <div className={styles.after}>
          {c.orderTip && <p className={styles.tip}>{c.orderTip}</p>}
          {c.downloads && (
            <div className={styles.downloads}>
              <a href={boardFile(lang, 'png')} download className={styles.downloadPrimary}>
                {c.downloads.png}
              </a>
              <a
                href={boardFile(lang, 'pdf')}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadSecondary}
              >
                {c.downloads.pdf}
              </a>
            </div>
          )}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
