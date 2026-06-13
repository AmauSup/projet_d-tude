import React from 'react';
import './Toast.css';

// Composant d'affichage des notifications temporaires (toasts).
// Rendu par ToastContext.jsx, positionné en overlay par-dessus tout le contenu.
// Paramètres :
//   toasts    (array)    — liste des toasts actifs, chacun = { id, message, type }
//     toasts[].id      (number) — identifiant unique (Date.now())
//     toasts[].message (string) — texte affiché
//     toasts[].type    (string) — 'info' | 'success' | 'error' | 'warning' (détermine la couleur CSS)
//   onDismiss (function) — appelé avec l'id du toast à fermer (clic sur ✕)
export default function Toast({ toasts, onDismiss }) {
  // Si aucun toast, on ne rend rien (évite le conteneur vide dans le DOM)
  if (!toasts.length) return null;

  return (
    // aria-live="polite" : les lecteurs d'écran annoncent les nouveaux toasts
    // sans interrompre le contenu courant (contrairement à "assertive")
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        // La classe toast--${type} applique la couleur correspondante (vert, rouge, etc.)
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <span className="toast__msg">{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(t.id)}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
