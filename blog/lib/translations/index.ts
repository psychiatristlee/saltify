import type { LocaleBundle } from './types';
import { vi } from './vi';
import { th } from './th';
import { id } from './id';
import { es } from './es';
import { fr } from './fr';
import { ru } from './ru';

export const EXTRA_BUNDLES = { vi, th, id, es, fr, ru } satisfies Record<string, LocaleBundle>;

export type ExtraLanguage = keyof typeof EXTRA_BUNDLES;

export const EXTRA_TRANSLATIONS: Record<ExtraLanguage, LocaleBundle['dict']> = {
  vi: vi.dict,
  th: th.dict,
  id: id.dict,
  es: es.dict,
  fr: fr.dict,
  ru: ru.dict,
};
