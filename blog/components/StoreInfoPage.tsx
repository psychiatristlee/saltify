import Link from 'next/link';
import Image from 'next/image';
import { STORE } from '@/lib/storeInfo';
import { MENU_BREADS, MENU_DRINKS } from '@/lib/breadData';
import { t, type Language } from '@/lib/i18n';
import { menuSections } from '@/lib/menuSchema';
import { LOCALES, getLocale } from '@/lib/locales';
import { EXTRA_BUNDLES } from '@/lib/translations';
import type { InfoCopy } from '@/lib/translations/types';
import type { BreadItem } from '@/lib/breadData';
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

// Copy for the original four foreign languages lives here; the newer ones
// come from lib/translations/<code>.ts.
const COPY: Record<Lang, InfoCopy> = {
  vi: EXTRA_BUNDLES.vi.info,
  th: EXTRA_BUNDLES.th.info,
  id: EXTRA_BUNDLES.id.info,
  es: EXTRA_BUNDLES.es.info,
  fr: EXTRA_BUNDLES.fr.info,
  ru: EXTRA_BUNDLES.ru.info,
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
  'zh-Hant': {
    heading: 'Salt,θ (Salt Bread) — 首爾延南洞',
    intro:
      '位於首爾延南洞的鹽可頌（鹽麵包 / shio-pan）專賣店，距弘大入口站步行5分鐘。所有麵包都使用法國發酵奶油與馬爾頓海鹽，在店內每日現烤。',
    sectionInfo: '門市資訊',
    sectionMenu: '鹽可頌',
    sectionDrinks: '飲品',
    sectionAccess: '交通方式',
    labelName: '店名',
    labelAddress: '地址',
    labelAddressRoman: '地址（羅馬拼音）',
    labelHours: '營業時間',
    labelClosed: '公休日',
    labelPhone: '電話',
    labelInstagram: 'Instagram',
    accessBody:
      '搭乘地鐵2號線或機場鐵路至弘大入口站，從3號出口出站後往延南洞方向步行約5分鐘，本店位於一樓。麵包全天分批出爐，人氣品項可能在打烊前售完。',
    showDriver: '可將此地址出示給計程車司機:',
    backHome: '← 首頁',
    otherLangs: '其他語言',
  },
};

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
      hasMenuSection: menuSections(lang, { breads: c.sectionMenu, drinks: c.sectionDrinks }),
    },
    hasMap: [STORE.naverPlaceUrl, STORE.googleMapsUrl],
    sameAs: [STORE.naverPlaceUrl, STORE.googleMapsUrl, STORE.instagramUrl],
  };

  const htmlLang = getLocale(lang).htmlLang;
  const current = getLocale(lang);

  const menuItem = (item: BreadItem) => (
    <li key={item.id} className={styles.menuItem}>
      <div className={styles.menuThumb}>
        {item.image ? (
          <Image src={item.image} alt={tr(item.nameKey)} width={160} height={160} className={styles.menuImg} />
        ) : (
          <span className={styles.menuThumbEmpty} aria-hidden="true">
            {item.nameKey.startsWith('drink') ? '☕' : '🥐'}
          </span>
        )}
      </div>
      <div className={styles.menuText}>
        <span className={styles.menuName}>
          {tr(item.nameKey)}
          {item.signature && <span className={styles.badge}>{tr('signatureBadge')}</span>}
        </span>
        {/* The Korean name is what staff read — visitors can point at it. */}
        <span className={styles.menuKo} lang="ko">
          {t(item.nameKey, 'ko')}
        </span>
        <span className={styles.menuDesc}>{tr(item.descKey)}</span>
      </div>
      <span className={styles.menuPrice}>₩{item.price.toLocaleString('en-US')}</span>
    </li>
  );

  return (
    <div className={styles.container} lang={htmlLang}>
      {/* The root layout hardcodes <html lang="ko">. A nested layout cannot
          override it — only a second root layout in its own route group could,
          which would mean restructuring every existing route (and reworking
          not-found handling) for an attribute Google does not use for language
          detection. The container carries the real `lang`; this corrects the
          document element for screen readers and for Bing. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(htmlLang)}`,
        }}
      />

      <nav className={styles.topBar}>
        <Link href="/" className={styles.brand} aria-label={c.backHome}>
          <Image src="/brandings/plain.png" alt="" width={34} height={34} className={styles.brandMark} />
          <span className={styles.brandName}>{STORE.englishNameFull}</span>
        </Link>
        {/* <details> keeps the language menu working without client JS. */}
        <details className={styles.langMenu}>
          <summary className={styles.langTrigger} aria-label={c.otherLangs}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            <span className={styles.langName}>{current.nativeName}</span>
            <span className={styles.langShort}>{current.short}</span>
          </summary>
          <div className={styles.langList}>
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={l.path}
                hrefLang={l.hreflang}
                lang={l.htmlLang}
                className={l.code === lang ? styles.langActive : undefined}
                aria-current={l.code === lang ? 'page' : undefined}
              >
                {l.nativeName}
              </Link>
            ))}
          </div>
        </details>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroArt}>
          <Image
            src={HERO_IMAGE}
            alt={c.heading}
            width={640}
            height={640}
            sizes="(max-width: 860px) 100vw, 420px"
            className={styles.heroImage}
            priority
          />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{tr('heroEyebrow')}</p>
          <h1 className={styles.title}>{c.heading}</h1>
          <p className={styles.intro}>{c.intro}</p>
          <ul className={styles.chips}>
            <li>🕚 {tr('heroHoursChip')}</li>
            <li>📅 {tr('heroNoClosingChip')}</li>
            <li>🚇 {tr('heroStationChip')}</li>
          </ul>
          <div className={styles.actions}>
            <a href={STORE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>
              📍 Google Maps
            </a>
            <a href={STORE.naverPlaceUrl} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
              Naver Map
            </a>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionInfo}</h2>
        <dl className={styles.card}>
          <div className={styles.infoRow}>
            <dt>{c.labelName}</dt>
            <dd>
              {tr('storeName')} · <span lang="ko">{STORE.name}</span>
            </dd>
          </div>
          <div className={styles.infoRow}>
            <dt>{c.labelAddress}</dt>
            <dd>{tr('storeAddress')}</dd>
          </div>
          {/* Where the localised address is already romanised, the extra row
              would just repeat itself. */}
          {!tr('storeAddress').includes('Donggyo-ro') && (
            <div className={styles.infoRow}>
              <dt>{c.labelAddressRoman}</dt>
              <dd>{STORE.addressEn}</dd>
            </div>
          )}
          <div className={styles.infoRow}>
            <dt>{c.labelHours}</dt>
            <dd>{tr('hoursDetail')}</dd>
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
        <p className={styles.tip}>💡 {tr('orderTip')}</p>
        <ul className={styles.menuList}>{MENU_BREADS.map(menuItem)}</ul>
        {/* Japanese is the one foreign language with a full menu board page. */}
        {lang === 'ja' && (
          <Link href="/menu/jp" className={styles.boardLink}>
            {tr('viewFullMenu')} →
          </Link>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionDrinks}</h2>
        <ul className={styles.menuList}>{MENU_DRINKS.map(menuItem)}</ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{c.sectionAccess}</h2>
        <div className={styles.card}>
          <p className={styles.bodyStrong}>🚇 {tr('gettingHere')}</p>
          <p className={styles.body}>{c.accessBody}</p>
          <div className={styles.taxi}>
            <p className={styles.taxiLabel}>🚕 {c.showDriver}</p>
            <p className={styles.taxiAddress} lang="ko">
              {STORE.addressFull}
            </p>
            <p className={styles.taxiName} lang="ko">
              {STORE.fullName} · {STORE.telephoneDisplay}
            </p>
          </div>
          <div className={styles.actions}>
            <a href={STORE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>
              📍 Google Maps
            </a>
            <a href={STORE.naverPlaceUrl} target="_blank" rel="noopener noreferrer" className={styles.btnSecondary}>
              Naver Map
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.homeLink}>
          {c.backHome}
        </Link>
        <nav className={styles.footerLangs} aria-label={c.otherLangs}>
          {LOCALES.map((l) => (
            <Link key={l.code} href={l.path} hrefLang={l.hreflang} lang={l.htmlLang}>
              {l.nativeName}
            </Link>
          ))}
        </nav>
        <p className={styles.copyright}>
          &copy; 2026 {STORE.fullName}
          {tr('allRightsReserved')}
        </p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
