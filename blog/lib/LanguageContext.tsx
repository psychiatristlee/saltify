'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, t as translate, TranslationKey } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function getDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const saved = localStorage.getItem('saltify_lang');
  if (saved) return saved as Language;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('zh-tw') || nav.startsWith('zh-hant')) return 'zh-TW';
  if (nav.startsWith('zh')) return 'zh-CN';
  if (nav.startsWith('en')) return 'en';
  return 'ko';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>(getDefaultLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem('saltify_lang', lang);
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
