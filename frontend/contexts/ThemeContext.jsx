import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// Contexte de thème — expose isDark et toggleTheme à tous les composants.
// La valeur par défaut (isDark: false, toggleTheme vide) n'est utilisée que si un composant
// accède au contexte sans être enveloppé dans ThemeProvider (cas à éviter).
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });

ThemeProvider.propTypes = { children: PropTypes.node.isRequired };

// Fournisseur de thème clair/sombre — à placer au-dessus de toute l'application.
// Le thème est persisté dans localStorage (clé 'althea-theme') pour survivre aux rechargements.
export function ThemeProvider({ children }) {
  // isDark : true = thème sombre, false = thème clair.
  // Initialisé depuis localStorage pour restaurer le choix de l'utilisateur au démarrage.
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('althea-theme') === 'dark',
  );

  // Applique le thème sur <html data-theme="dark|light"> dès que isDark change.
  // Les règles CSS utilisent [data-theme="dark"] pour switcher les variables CSS.
  // La sauvegarde localStorage garantit la persistance entre les sessions.
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('althea-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // value mémoïsé : ne se recrée que si isDark change, pour ne pas
  // forcer le re-rendu de tous les consommateurs à chaque rendu parent.
  const value = useMemo(() => ({
    isDark,                                // true si le thème sombre est actif
    toggleTheme: () => setIsDark((d) => !d), // Bascule entre clair et sombre
  }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour accéder au thème depuis n'importe quel composant enfant.
// Retourne :
//   { isDark: boolean, toggleTheme: () => void }
export function useTheme() {
  return useContext(ThemeContext);
}
