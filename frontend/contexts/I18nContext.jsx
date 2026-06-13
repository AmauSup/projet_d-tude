import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { messages, RTL_LOCALES } from '../i18n/messages.js';

// URL de base du backend, réutilisée ici pour charger les traductions depuis la BDD.
// Dupliquée depuis apiClient.js car I18nContext est un module bas niveau
// qui ne doit pas dépendre de apiClient (pas de JWT, pas de gestion d'erreurs HTTP).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Contexte React qui expose locale, t() et isRtl à tous les composants enfants.
// null avant que I18nProvider soit monté (l'erreur dans useI18n() protège contre ça).
const I18nContext = createContext(null);

I18nProvider.propTypes = { children: PropTypes.node.isRequired };

// Résout une clé de traduction pointée (ex: "chatbot.title") dans un objet imbriqué.
// Parcourt les niveaux successifs via reduce :
//   resolveKey({ chatbot: { title: 'Bot' } }, 'chatbot.title') → 'Bot'
//   resolveKey({ a: { b: null } }, 'a.b.c') → undefined (ne plante pas)
// Paramètres :
//   obj (object) — objet de traductions (ex: messages['fr'])
//   key (string) — chemin pointé vers la valeur
// Retourne :
//   (any) — valeur trouvée, ou undefined si le chemin n'existe pas
function resolveKey(obj, key) {
  return key.split('.').reduce((acc, cur) => acc?.[cur], obj);
}

// Fournisseur de traductions — à placer au plus haut de l'arbre React (dans main.jsx).
// Gère deux sources de traductions avec priorité :
//   1. Base de données (chargée via API au changement de locale) — priorité haute
//   2. Fichier messages.js local                                 — fallback
export function I18nProvider({ children }) {
  // locale : code langue actif ('fr', 'en', 'ar', etc.)
  const [locale, setLocale] = useState('fr');
  // dbTranslations : traductions chargées depuis la BDD pour la locale actuelle
  // Structure : { "chatbot.title": "Bot", "header.search": "Rechercher", ... }
  const [dbTranslations, setDbTranslations] = useState({});

  // isRtl : true si la langue se lit de droite à gauche (arabe, hébreu...).
  // RTL_LOCALES est un Set défini dans messages.js.
  const isRtl = RTL_LOCALES.has(locale);

  // Applique la direction de lecture et la langue sur <html> quand la locale change.
  // dir="rtl" inverse la mise en page CSS (flexbox, marges, etc.) sans toucher au code.
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale);
  }, [locale, isRtl]);

  // Charge les traductions depuis la base de données à chaque changement de locale.
  // Si l'API échoue (backend indispo), dbTranslations reste vide et messages.js prend le relais.
  useEffect(() => {
    fetch(`${API_BASE}/pg/translations/${locale}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setDbTranslations(data.translations); })
      .catch(() => {}); // messages.js reste actif si l'API est indisponible
  }, [locale]);

  // value : objet mémoïsé exposé à tous les enfants via useI18n().
  // useMemo évite de recréer l'objet à chaque rendu (seul un changement de locale/dbTranslations le recrée).
  const value = useMemo(() => ({
    locale,      // Code langue actif — utilisé pour conditionner des rendus (dates, nombres...)
    setLocale,   // Fonction pour changer la langue (ex: depuis un sélecteur de langue)
    isRtl,       // true si la langue est RTL — utilisé pour inverser des icônes de flèche
    // t(key, fallback) : fonction de traduction principale.
    //   1. Cherche dans dbTranslations (BDD) — priorité haute
    //   2. Cherche dans messages.js pour la locale actuelle, sinon 'fr'
    //   3. Retourne fallback si aucune traduction trouvée (par défaut la clé elle-même)
    t: (key, fallback = key) => {
      const dbVal = resolveKey(dbTranslations, key);
      if (dbVal !== undefined && dbVal !== null) return dbVal;
      const jsVal = resolveKey(messages[locale] ?? messages.fr, key);
      return jsVal ?? fallback;
    },
  }), [locale, isRtl, dbTranslations]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Hook pour accéder aux traductions depuis n'importe quel composant enfant de I18nProvider.
// Lance une erreur claire si utilisé hors du Provider (erreur de configuration).
// Retourne :
//   { locale, setLocale, isRtl, t } — le même objet que value ci-dessus
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
