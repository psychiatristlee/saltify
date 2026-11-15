import type { TranslationKey } from '../i18n';

/** Copy for the server-rendered per-language info page (StoreInfoPage). */
export interface InfoCopy {
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

/** Search-snippet copy for the info page's <head>. */
export interface PageMeta {
  title: string;
  description: string;
  /** Shorter description for og/twitter cards. */
  shortDescription: string;
  keywords: string;
}

export interface LocaleBundle {
  /** Every UI string — `Record` makes a missing key a type error. */
  dict: Record<TranslationKey, string>;
  info: InfoCopy;
  meta: PageMeta;
}
