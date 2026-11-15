import type { Metadata } from 'next';
import { STORE } from './storeInfo';
import { getLocale, hreflangAlternates } from './locales';
import type { Language } from './i18n';
import type { PageMeta } from './translations/types';

/** <head> metadata for a per-language info page (/en, /vi, …). */
export function buildLocaleMetadata(code: Language, meta: PageMeta): Metadata {
  const locale = getLocale(code);
  const url = `${STORE.websiteUrl}${locale.path}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url, languages: hreflangAlternates() },
    openGraph: {
      type: 'website',
      url,
      title: meta.title,
      description: meta.shortDescription,
      images: [
        {
          url: STORE.ogImage,
          width: 1000,
          height: 1000,
          alt: '솔트빵 Salt,θ (Salt Bread) 소금빵 클로즈업 / Salt bread close-up, Yeonnam-dong, Seoul',
        },
      ],
      locale: locale.ogLocale,
      siteName: '솔트빵 Salt,θ',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.shortDescription,
      images: [STORE.ogImage],
    },
    robots: { index: true, follow: true },
  };
}
