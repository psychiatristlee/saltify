'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { LANGUAGES, Language } from '@/lib/i18n';
import styles from './LanguageSelector.module.css';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        <span className={styles.flag}>{current.flag}</span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.item} ${lang.code === language ? styles.active : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span className={styles.name}>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
