import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages, RTL_LOCALES } from '../i18n/messages.js';

const I18nContext = createContext(null);

function resolveKey(dictionary, key) {
  return key.split('.').reduce((accumulator, current) => accumulator?.[current], dictionary);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('fr');

  const isRtl = RTL_LOCALES.has(locale);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, isRtl]);

  const value = useMemo(() => {
    const dictionary = messages[locale] ?? messages.fr;
    return {
      locale,
      setLocale,
      isRtl,
      t: (key, fallback = key) => resolveKey(dictionary, key) ?? fallback,
    };
  }, [locale, isRtl]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
