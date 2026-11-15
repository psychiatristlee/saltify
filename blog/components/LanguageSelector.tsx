'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { LOCALES, getLocale } from '@/lib/locales';
import type { Language } from '@/lib/i18n';
import styles from './LanguageSelector.module.css';

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Globe + endonym rather than a flag: flag emoji don't render on Windows
 * (they show as "KR"), and a flag names a country, not a language.
 */
export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getLocale(language);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('languageLabel')} / Language: ${current.nativeName}`}
      >
        <IconGlobe />
        <span className={styles.triggerName}>{current.nativeName}</span>
        <span className={styles.triggerShort}>{current.short}</span>
      </button>
      {open && (
        <ul className={styles.dropdown} role="listbox" aria-label="Language">
          {LOCALES.map((l) => {
            const active = l.code === language;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  lang={l.htmlLang}
                  className={`${styles.item} ${active ? styles.active : ''}`}
                  onClick={() => handleSelect(l.code)}
                >
                  <span className={styles.name}>{l.nativeName}</span>
                  {active && <IconCheck />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
