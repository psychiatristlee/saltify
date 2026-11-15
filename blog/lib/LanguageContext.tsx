'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, t as translate, TranslationKey } from './i18n';
import { LOCALES, detectLanguage } from './locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);
const STORAGE_KEY = 'saltify_lang';

function readSavedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && LOCALES.some((l) => l.code === saved) ? (saved as Language) : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start as Korean so the client's first render matches the server
  // HTML; the visitor's language is applied right after hydration.
  const [language, setLangState] = useState<Language>('ko');

  useEffect(() => {
    const preferred = readSavedLanguage() ?? detectLanguage(navigator.language || 'ko');
    if (preferred !== 'ko') setLangState(preferred);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key, language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
