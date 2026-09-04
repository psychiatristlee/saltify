import Link from 'next/link';
import Image from 'next/image';
import { STORE } from '@/lib/storeInfo';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import { t, type Language } from '@/lib/i18n';
import styles from './StoreInfoPage.module.css';

/**
 * Server-rendered store info page, one per language.
 *
 * The homepage switches language client-side, which means Google only ever
 * indexes the Korean copy — useless for the foreign visitors who are most of
 * the walk-in traffic. These pages give each language a real, crawlable URL
 * so `hreflang` has something to point at.
 */

type Lang = Exclude<Language, 'ko'>;

/** Local path form of STORE.ogImage — the same salt-bread close-up. */
const HERO_IMAGE = new URL(STORE.ogImage).pathname;

interface Copy {
  heading: string;
  intro: string;
  sectionInfo: string;
  sectionMenu: string;
  sectionDrinks: string;
  sectionAccess: string;
  labelName: string;
  labelAddress: string;
  labelAddressRoman: string;
  labelHours: string;
  labelClosed: string;
  labelPhone: string;
  labelInstagram: string;
  accessBody: string;
  showDriver: string;
  backHome: string;
  otherLangs: string;
}

const COPY: Record<Lang, Copy> = {
  en: {
    heading: 'Salt,θ (Salt Bread) — Yeonnam-dong, Seoul',
    intro:
      'A small salt bread (shio-pan) bakery in Yeonnam-dong, five minutes on foot from Hongik Univ. Station. Every bread is baked here with French cultured butter and Maldon sea salt.',
    sectionInfo: 'Store information',
    sectionMenu: 'Salt bread',
    sectionDrinks: 'Drinks',
    sectionAccess: 'Getting here',
    labelName: 'Name',
    labelAddress: 'Address',
    labelAddressRoman: 'Address (romanised)',
    labelHours: 'Hours',
    labelClosed: 'Closing day',
    labelPhone: 'Phone',
    labelInstagram: 'Instagram',
    accessBody:
      'Take Line 2 or the AREX to Hongik Univ. Station and leave from Exit 3. Walk about 5 minutes into Yeonnam-dong; we are on the first floor. Baking finishes through the day, so popular breads can sell out before closing time.',
    showDriver: 'Show this to a taxi driver:',
    backHome: '← Home',
    otherLangs: 'Other languages',
  },
  ja: {
    heading: 'ソルトパン Salt,θ (Salt Bread) — ソウル・延南洞',
    intro:
      'ソウル延南洞（ヨンナムドン）、弘大入口駅から徒歩5分の塩パン専門店です。フランス産発酵バターとマルドンの海塩を使い、店内で毎日焼き上げています。',
    sectionInfo: '店舗情報',
    sectionMenu: '塩パン',
    sectionDrinks: 'お飲み物',
    sectionAccess: 'アクセス',
    labelName: '店名',
    labelAddress: '住所',
    labelAddressRoman: '住所（ローマ字）',
    labelHours: '営業時間',
    labelClosed: '定休日',
    labelPhone: '電話',
    labelInstagram: 'Instagram',
    accessBody:
      '地下鉄2号線または空港鉄道（AREX）の弘大入口駅で下車し、3番出口から徒歩約5分。延南洞側へ進んだ建物の1階です。焼き上がり次第の販売のため、人気のパンは閉店前に売り切れる場合があります。',
    showDriver: 'タクシーの運転手さんにこちらをお見せください:',
    backHome: '← ホーム',
    otherLangs: '他の言語',
  },
  'zh-CN': {
    heading: 'Salt,θ (Salt Bread) — 首尔延南洞',
    intro:
      '位于首尔延南洞的盐面包（shio-pan）专卖店，距弘大入口站步行5分钟。全部面包均使用法国发酵黄油与马尔顿海盐在店内烘焙。',
    sectionInfo: '门店信息',
    sectionMenu: '盐面包',
    sectionDrinks: '饮品',
    sectionAccess: '交通方式',
    labelName: '店名',
    labelAddress: '地址',
    labelAddressRoman: '地址（罗马字）',
    labelHours: '营业时间',
    labelClosed: '休息日',
    labelPhone: '电话',
    labelInstagram: 'Instagram',
    accessBody:
      '乘坐地铁2号线或机场铁路至弘大入口站，从3号出口出站后向延南洞方向步行约5分钟，本店位于一楼。面包全天分批出炉，人气品项可能在打烊前售完。',
    showDriver: '可将此地址出示给出租车司机:',
    backHome: '← 首页',
    otherLangs: '其他语言',
  },
};

/** BCP-47 tag for the `lang` attribute (and `<html lang>` via the inline script). */
const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  ja: 'ja',
  'zh-CN': 'zh-Hans',
};

const LANG_LINKS: { code: Language; href: string; label: string; hrefLang: string }[] = [
  { code: 'ko', href: '/', label: '한국어', hrefLang: 'ko' },
  { code: 'en', href: '/en', label: 'English', hrefLang: 'en' },
  { code: 'ja', href: '/ja', label: '日本語', hrefLang: 'ja' },
  { code: 'zh-CN', href: '/zh', label: '简体中文', hrefLang: 'zh-Hans' },
];

export default function StoreInfoPage({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const tr = (key: Parameters<typeof t>[0]) => t(key, lang);

  // Same @id as the homepage Bakery node so Google treats these as one entity
  // rather than four competing businesses.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    '@id': `${STORE.websiteUrl}#bakery`,
    name: STORE.fullName,
    alternateName: [STORE.englishNameAscii, STORE.englishName, STORE.name],
    description: STORE.description,
    url: STORE.websiteUrl,
    telephone: STORE.telephone,
    image: STORE.ogImage,
    priceRange: '₩₩',
    servesCuisine: 'Bakery',
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.streetAddress,
      addressLocality: STORE.addressLocality,
      addressRegion: STORE.addressRegion,
      postalCode: STORE.postalCode,
      addressCountry: STORE.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: STORE.lat,
      longitude: STORE.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: STORE.openDays,
        opens: STORE.opens,
        closes: STORE.closes,
      },
    ],
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: [
        {
          '@type': 'MenuSection',
          name: c.sectionMenu,
          hasMenuItem: MENU_BREADS.map((b) => ({
            '@type': 'MenuItem',
            name: tr(b.nameKey),
            description: tr(b.descKey),
            offers: { '@type': 'Offer', price: b.price, priceCurrency: 'KRW' },
          })),
        },
        {
          '@type': 'MenuSection',
          name: c.sectionDrinks,
          hasMenuItem: MENU_DRINKS.map((d) => ({
            '@type': 'MenuItem',
            name: tr(d.nameKey),
            description: tr(d.descKey),
            offers: { '@type': 'Offer', price: d.price, priceCurrency: 'KRW' },
          })),
        },
      ],
    },
    hasMap: [STORE.naverPlaceUrl, STORE.googleMapsUrl],
    sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
  };

  return (
    <div className={styles.container} lang={HTML_LANG[lang]}>
      {/* The root layout hardcodes <html lang="ko">. A nested layout cannot
          override it — only a second root layout in its own route group could,
          which would mean restructuring every existing route (and reworking
          not-found handling) for an attribute Google does not use for language
          detection. The container carries the real `lang`; this corrects the
          document element for screen readers and for Bing. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[lang])}`,
        }}
      />

      <nav className={styles.topNav}>
        <Link href="/">{c.backHome}</Link>
        <div className={styles.langSwitch} aria-label={c.otherLangs}>
          {LANG_LINKS.filter((l) => l.code !== lang).map((l) => (
            <Link key={l.code} href={l.href} hrefLang={l.hrefLang}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <header className={styles.hero}>
        <Image
          src={HERO_IMAGE}
          alt={c.heading}
          width={640}
          height={640}
          className={styles.heroImage}
          priority
        />
        <h1 className={styles.title}>{c.heading}</h1>
        <p className={styles.intro}>{c.intro}</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionInfo}</h2>
        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt>{c.labelName}</dt>
            <dd>
              {tr('storeName')} · {STORE.name}
            </dd>
          </div>
          <div className={styles.infoRow}>
            <dt>{c.labelAddress}</dt>
            <dd>{tr('storeAddress')}</dd>
          </div>
          {/* On /en the localised address is already romanised, so the extra
              row would just repeat itself. */}
          {lang !== 'en' && (
            <div className={styles.infoRow}>
              <dt>{c.labelAddressRoman}</dt>
              <dd>{STORE.addressEn}</dd>
            </div>
          )}
          <div className={styles.infoRow}>
            <dt>{c.labelHours}</dt>
            <dd>{tr('storeHours')}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>{c.labelClosed}</dt>
            <dd className={styles.emphasis}>{tr('openEveryDay')}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>{c.labelPhone}</dt>
            <dd>
              <a href={`tel:${STORE.telephone}`}>{STORE.telephoneDisplay}</a>
            </dd>
          </div>
          <div className={styles.infoRow}>
            <dt>{c.labelInstagram}</dt>
            <dd>
              <a href={STORE.instagramUrl} target="_blank" rel="noopener noreferrer">
                {STORE.instagram}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionMenu}</h2>
        <ul className={styles.menuList}>
          {MENU_BREADS.map((bread) => (
            <li key={bread.id} className={styles.menuRow}>
              <span className={styles.menuName}>{tr(bread.nameKey)}</span>
              <span className={styles.menuDots} aria-hidden="true" />
              <span className={styles.menuPrice}>₩{bread.price.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionDrinks}</h2>
        <ul className={styles.menuList}>
          {MENU_DRINKS.map((drink) => (
            <li key={drink.id} className={styles.menuRow}>
              <span className={styles.menuName}>{tr(drink.nameKey)}</span>
              <span className={styles.menuDots} aria-hidden="true" />
              <span className={styles.menuPrice}>₩{drink.price.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionAccess}</h2>
        <p className={styles.body}>{tr('gettingHere')}</p>
        <p className={styles.body}>{c.accessBody}</p>
        <p className={styles.driverNote}>
          {c.showDriver}
          <strong className={styles.driverAddress}>{STORE.addressFull}</strong>
        </p>
        <div className={styles.mapButtons}>
          <a href={STORE.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            🗺️ Google Maps
          </a>
          <a href={STORE.naverPlaceUrl} target="_blank" rel="noopener noreferrer">
            📍 Naver Map
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <nav className={styles.langSwitch} aria-label={c.otherLangs}>
          {LANG_LINKS.map((l) => (
            <Link key={l.code} href={l.href} hrefLang={l.hrefLang}>
              {l.label}
            </Link>
          ))}
        </nav>
        <p className={styles.copyright}>&copy; 2026 {STORE.fullName}. All rights reserved.</p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
