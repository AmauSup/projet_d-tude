import React, { useState } from 'react';

// Composant image avec état de chargement et gestion d'erreur.
// Affiche un spinner pendant le chargement, puis l'image une fois prête.
// En cas d'erreur de chargement (URL invalide, 404), cache l'image silencieusement.
// Paramètres :
//   src       (string) — URL de l'image à charger
//   alt       (string) — texte alternatif pour l'accessibilité (défaut : '')
//   className (string) — classe CSS supplémentaire pour le conteneur
//   style     (object) — styles inline pour le conteneur (ex: { height: '200px' })
export default function ImageWithLoader({ src, alt = '', className = '', style }) {
  const [loaded, setLoaded] = useState(false); // true une fois que onLoad est déclenché
  const [error, setError] = useState(false);   // true si l'image n'a pas pu se charger

  // hasImage : on affiche le bloc image seulement si une URL est fournie et qu'il n'y a pas d'erreur
  const hasImage = src && !error;

  return (
    <div className={`img-loader-wrap${className ? ` ${className}` : ''}`} style={style}>
      {hasImage && (
        <>
          {/* Spinner visible tant que l'image n'est pas chargée (loaded=false) */}
          {!loaded && <span className="img-loader__spinner" aria-hidden="true" />}
          <img
            src={src}
            alt={alt}
            // La classe is-loaded déclenche l'animation d'apparition CSS (opacity 0→1)
            className={`img-loader__img${loaded ? ' is-loaded' : ''}`}
            onLoad={() => setLoaded(true)}   // Cache le spinner et affiche l'image
            onError={() => setError(true)}   // Cache tout le bloc image si erreur
          />
        </>
      )}
    </div>
  );
}
