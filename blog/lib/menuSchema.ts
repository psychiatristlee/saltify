import { MENU_BREADS, MENU_DRINKS, type BreadItem } from './breadData';
import { t, type Language } from './i18n';

/**
 * schema.org MenuSection nodes for the current menu in one language. Shared by
 * every page that publishes `hasMenu`, so structured data cannot drift from
 * breadData the way hand-written JSON-LD did.
 */
export function menuSections(lang: Language, names: { breads: string; drinks: string }) {
  const toItem = (m: BreadItem) => ({
    '@type': 'MenuItem',
    name: t(m.nameKey, lang),
    description: t(m.descKey, lang),
    offers: { '@type': 'Offer', price: m.price, priceCurrency: 'KRW' },
  });

  return [
    { '@type': 'MenuSection', name: names.breads, hasMenuItem: MENU_BREADS.map(toItem) },
    { '@type': 'MenuSection', name: names.drinks, hasMenuItem: MENU_DRINKS.map(toItem) },
  ];
}
