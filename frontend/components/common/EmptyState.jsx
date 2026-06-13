import React from 'react';

// Composant état vide — affiché quand une liste est vide (aucun produit, aucune commande, etc.)
// Paramètres :
//   title   (string) — titre de l'état vide (défaut : 'Aucun résultat')
//   message (string) — message explicatif (défaut : 'Aucune donnée pour le moment.')
export default function EmptyState({ title = 'Aucun résultat', message = 'Aucune donnée pour le moment.' }) {
  return (
    // role="status" : informe les lecteurs d'écran que le contenu a changé (moins urgent qu'alert)
    <div className="notice notice--warning" role="status">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
