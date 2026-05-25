import React, { createContext, useContext, useMemo, useState } from 'react';
import { messages } from '../i18n/messages.js';

const I18nContext = createContext(null);
const STORAGE_KEY = 'althea-locale';

function resolveKey(dictionary, key) {
  return key.split('.').reduce((accumulator, current) => accumulator?.[current], dictionary);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'fr'; } catch { return 'fr'; }
  });

  const setLocale = (next) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
  };

  const value = useMemo(() => {
    const dictionary = messages[locale] ?? messages.fr;

    return {
      locale,
      setLocale,
      t: (key, fallback = key) => resolveKey(dictionary, key) ?? fallback,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
