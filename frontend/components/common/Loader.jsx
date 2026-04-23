import React from 'react';

export default function Loader({ label = 'Chargement…' }) {
  return (
    <div className="notice notice--info" role="status" aria-live="polite">
      {label}
    </div>
  );
}
