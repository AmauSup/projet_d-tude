import React from 'react';

export default function EmptyState({ title = 'Aucun résultat', message = 'Aucune donnée pour le moment.' }) {
  return (
    <div className="notice notice--warning" role="status">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
