import React from 'react';

// Composant d'alerte inline — affiche un message coloré selon le type.
// Utilise les classes CSS globales .notice et .notice--{type} définies dans global.css.
// Paramètres :
//   type     (string)   — variante visuelle : 'info' (défaut), 'success', 'error', 'warning'
//   children (ReactNode) — contenu du message (texte ou JSX)
export default function AlertMessage({ type = 'info', children }) {
  // cssClass détermine la couleur et l'icône via la convention BEM .notice--{type}
  const cssClass = `notice notice--${type}`;
  // role="alert" : signale le message aux technologies d'assistance (lecteurs d'écran)
  return <div className={cssClass} role="alert">{children}</div>;
}
