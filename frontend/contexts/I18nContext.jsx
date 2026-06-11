import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { messages, RTL_LOCALES } from '../i18n/messages.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const I18nContext = createContext(null);

I18nProvider.propTypes = { children: PropTypes.node.isRequired };

function resolveKey(obj, key) {
  return key.split('.').reduce((acc, cur) => acc?.[cur], obj);
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('fr');
  const [dbTranslations, setDbTranslations] = useState({});

  const isRtl = RTL_LOCALES.has(locale);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, isRtl]);

  useEffect(() => {
    fetch(`${API_BASE}/pg/translations/${locale}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setDbTranslations(data.translations); })
      .catch(() => {}); // messages.js reste actif si l'API est indisponible
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    isRtl,
    t: (key, fallback = key) => {
      const dbVal = resolveKey(dbTranslations, key);
      if (dbVal !== undefined && dbVal !== null) return dbVal;
      const jsVal = resolveKey(messages[locale] ?? messages.fr, key);
      return jsVal ?? fallback;
    },
  }), [locale, isRtl, dbTranslations]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
