import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES, Language } from '../lib/i18n';
import styles from './LanguageSelector.module.css';

interface Props {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: Props) {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <select
        className={styles.compactSelect}
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.code.toUpperCase()}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={styles.container}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`${styles.langButton} ${language === lang.code ? styles.active : ''}`}
          onClick={() => setLanguage(lang.code)}
        >
          <span className={styles.flag}>{lang.flag}</span>
          <span className={styles.name}>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
