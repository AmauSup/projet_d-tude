import React from 'react';
import './Pagination.css';

// Composant de pagination avec ellipses intelligentes.
// Affiche toujours la première et la dernière page, avec les pages proches de la page courante.
// Des "…" sont insérés quand il y a un saut dans la numérotation.
// Paramètres :
//   page         (number)   — numéro de la page actuellement affichée (commence à 1)
//   totalPages   (number)   — nombre total de pages
//   onPageChange (function) — appelé avec le nouveau numéro de page quand l'utilisateur clique
export default function Pagination({ page, totalPages, onPageChange }) {
  // Pas de pagination si une seule page ou aucune
  if (totalPages <= 1) return null;

  // pages : tableau des éléments à afficher (numéros de pages ou '…')
  const pages = [];
  const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante

  // Borne gauche et droite de la plage centrale (pages proches de `page`)
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  // Ajoute la première page et une ellipse si la plage ne commence pas à 1
  if (left > 1) {
    pages.push(1);
    if (left > 2) pages.push('…'); // "…" seulement s'il y a un vrai saut (page 2 serait adjacente)
  }

  // Ajoute toutes les pages de la plage centrale
  for (let i = left; i <= right; i++) pages.push(i);

  // Ajoute une ellipse et la dernière page si la plage ne termine pas à la fin
  if (right < totalPages) {
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      {/* Bouton "page précédente" — désactivé sur la première page */}
      <button
        type="button"
        className="pagination__btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Page précédente"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          // eslint-disable-next-line react/no-array-index-key
          <span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pagination__btn ${p === page ? 'is-active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined} // Indique la page active aux lecteurs d'écran
          >
            {p}
          </button>
        ),
      )}

      {/* Bouton "page suivante" — désactivé sur la dernière page */}
      <button
        type="button"
        className="pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Page suivante"
      >
        ›
      </button>
    </nav>
  );
}
