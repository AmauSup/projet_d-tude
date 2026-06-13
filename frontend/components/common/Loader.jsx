import React from 'react';

// Composant indicateur de chargement — affiché pendant les requêtes réseau.
// Utilise le style .notice--info pour s'intégrer visuellement sans spinner custom.
// Paramètres :
//   label (string) — message affiché (défaut : 'Chargement…')
export default function Loader({ label = 'Chargement…' }) {
  return (
    // role="status" + aria-live="polite" : annoncé par les lecteurs d'écran sans interrompre
    <div className="notice notice--info" role="status" aria-live="polite">
      {label}
    </div>
  );
}
