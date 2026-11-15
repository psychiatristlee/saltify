import type { Language } from './i18n';
import { STORE } from './storeInfo';

/**
 * One row per supported language: where its crawlable info page lives, what
 * hreflang / <html lang> / og:locale it advertises, and how it names itself.
 *
 * Every surface that lists languages (selector, footers, hreflang alternates,
 * sitemap) reads from here, so adding a language is one row plus its copy —
 * the alternates stay reciprocal automatically, which Google requires.
 *
 * Order roughly follows inbound visitor volume to Korea: China, Japan,
 * Taiwan/HK, English speakers, then Southeast Asia, then Europe.
 */
export interface Locale {
  code: Language;
  /** Info-page path. Korean is the homepage itself. */
  path: string;
  /** hreflang value. */
  hreflang: string;
  /** BCP-47 for the `lang` attribute. */
  htmlLang: string;
  ogLocale: string;
  /** Endonym — what a speaker looks for in a language menu. */
  nativeName: string;
  /** Short label for compact buttons. */
  short: string;
}

export const LOCALES: Locale[] = [
  { code: 'ko', path: '/', hreflang: 'ko', htmlLang: 'ko', ogLocale: 'ko_KR', nativeName: '한국어', short: 'KO' },
  { code: 'en', path: '/en', hreflang: 'en', htmlLang: 'en', ogLocale: 'en_US', nativeName: 'English', short: 'EN' },
  { code: 'zh-CN', path: '/zh', hreflang: 'zh-Hans', htmlLang: 'zh-Hans', ogLocale: 'zh_CN', nativeName: '简体中文', short: '简' },
  { code: 'zh-Hant', path: '/zh-hant', hreflang: 'zh-Hant', htmlLang: 'zh-Hant', ogLocale: 'zh_TW', nativeName: '繁體中文', short: '繁' },
  { code: 'ja', path: '/ja', hreflang: 'ja', htmlLang: 'ja', ogLocale: 'ja_JP', nativeName: '日本語', short: 'JA' },
  { code: 'vi', path: '/vi', hreflang: 'vi', htmlLang: 'vi', ogLocale: 'vi_VN', nativeName: 'Tiếng Việt', short: 'VI' },
  { code: 'th', path: '/th', hreflang: 'th', htmlLang: 'th', ogLocale: 'th_TH', nativeName: 'ไทย', short: 'TH' },
  { code: 'id', path: '/id', hreflang: 'id', htmlLang: 'id', ogLocale: 'id_ID', nativeName: 'Bahasa Indonesia', short: 'ID' },
  { code: 'es', path: '/es', hreflang: 'es', htmlLang: 'es', ogLocale: 'es_ES', nativeName: 'Español', short: 'ES' },
  { code: 'fr', path: '/fr', hreflang: 'fr', htmlLang: 'fr', ogLocale: 'fr_FR', nativeName: 'Français', short: 'FR' },
  { code: 'ru', path: '/ru', hreflang: 'ru', htmlLang: 'ru', ogLocale: 'ru_RU', nativeName: 'Русский', short: 'RU' },
];

export function getLocale(code: Language): Locale {
  return LOCALES.find((l) => l.code === code)!;
}

/** Reciprocal hreflang map for metadata `alternates.languages` and the sitemap. */
export function hreflangAlternates(base: string = STORE.websiteUrl): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l.hreflang] = `${base}${l.path}`;
  out['x-default'] = `${base}/`;
  return out;
}

/** Map a browser language tag to the closest supported language. */
export function detectLanguage(tag: string): Language {
  const nav = tag.toLowerCase();
  // Taiwan/HK/Macau read Traditional characters; only mainland and Singapore
  // use Simplified. Serving Taiwanese visitors mainland copy is the single
  // biggest tell that a page was not written for them.
  if (/^zh(-|_)?(hant|tw|hk|mo)/.test(nav)) return 'zh-Hant';
  if (nav.startsWith('zh')) return 'zh-CN';
  if (nav.startsWith('ko')) return 'ko';
  // Malay readers understand Indonesian far better than Korean.
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id';
  for (const code of ['ja', 'vi', 'th', 'es', 'fr', 'ru', 'en'] as const) {
    if (nav.startsWith(code)) return code;
  }
  // Mongolian, Kazakh, Uzbek and Kyrgyz visitors commonly read Russian.
  if (/^(mn|kk|uz|ky)/.test(nav)) return 'ru';
  // Any other foreign browser: English beats Korean.
  return 'en';
}
