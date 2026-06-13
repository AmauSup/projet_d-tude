import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Toast from '../components/Toast/Toast.jsx';

// Contexte qui expose showToast() à tous les composants enfants.
// null avant le montage de ToastProvider.
const ToastContext = createContext(null);

ToastProvider.propTypes = { children: PropTypes.node.isRequired };

// Fournisseur de notifications toast — à placer au-dessus de l'application.
// Maintient une liste de toasts actifs et les passe au composant Toast pour l'affichage.
// Chaque toast disparaît automatiquement après 5 secondes, ou immédiatement si dismiss() est appelé.
export function ToastProvider({ children }) {
  // toasts : tableau des notifications visibles.
  // Chaque entrée : { id: number, message: string, type: 'info'|'success'|'error'|'warning' }
  const [toasts, setToasts] = useState([]);

  // Supprime un toast par son id (utilisé en interne après timeout ET par le bouton de fermeture).
  // Paramètres :
  //   id (number) — identifiant du toast à retirer du tableau
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Affiche une nouvelle notification.
  // Crée un id unique via Date.now() et programme sa suppression automatique après 5000ms.
  // Paramètres :
  //   message (string) — texte affiché dans le toast
  //   type    (string) — variante visuelle : 'info' (défaut), 'success', 'error', 'warning'
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now(); // identifiant unique basé sur l'horodatage
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(removeToast, 5000, id); // évite d'imbriquer une fonction dans setTimeout
  }, [removeToast]);

  // value mémoïsé pour éviter un re-rendu de tous les consommateurs à chaque rendu du provider.
  // showToast est stable grâce à useCallback, donc value ne change jamais après le premier montage.
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast est rendu en dehors de children pour être au-dessus de tout le contenu */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook pour déclencher un toast depuis n'importe quel composant.
// Lance une erreur si utilisé hors de ToastProvider.
// Retourne :
//   { showToast: (message: string, type?: string) => void }
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
